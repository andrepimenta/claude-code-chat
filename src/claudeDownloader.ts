// Self-contained downloader for the Claude Code native binary.
// Tries the npm registry tarball first (smaller over the wire thanks to gzip),
// falls back to Anthropic's CDN (downloads.claude.ai) on any npm failure.
//
// Replaces the previous shell-based install flows (curl|bash, irm|iex, npm -g)
// so users never see execution-policy, EACCES, missing-bash, or Node-version
// failure modes. Everything runs in-process using Node built-ins only.

import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as zlib from 'zlib';
import * as os from 'os';
import * as cp from 'child_process';
import { URL } from 'url';

const DEFAULT_NPM_REGISTRY = 'https://registry.npmjs.org';
const DEFAULT_CDN_BASE = 'https://downloads.claude.ai/claude-code-releases';
const NPM_PACKAGE_PREFIX = '@anthropic-ai/claude-code-';
const META_TIMEOUT_MS = 30_000;
const PROGRESS_THROTTLE_MS = 250;

export type DownloaderErrorCode =
	| 'UNSUPPORTED_PLATFORM'
	| 'NETWORK'
	| 'INTEGRITY'
	| 'WRITE'
	| 'CANCELLED'
	| 'AGGREGATE';

export interface PlatformKey {
	key: string;           // 'darwin-arm64' | 'linux-x64-musl' | 'win32-x64' | ...
	binaryName: string;    // 'claude' | 'claude.exe'
	tarEntry: string;      // 'package/claude' | 'package/claude.exe'
}

export interface DownloadProgress {
	phase: 'resolving' | 'downloading' | 'verifying' | 'installing' | 'fallback';
	source?: 'npm' | 'cdn';
	loaded?: number;
	total?: number;
	message?: string;
}

export interface DownloadOptions {
	destDir: string;
	onProgress?: (p: DownloadProgress) => void;
	signal?: AbortSignal;
	/** @internal — override the npm registry base (for tests). */
	npmRegistry?: string;
	/** @internal — override the Anthropic CDN base (for tests). */
	cdnBase?: string;
}

export interface DownloadResult {
	binaryPath: string;
	version: string;
	source: 'npm' | 'cdn';
	bytesDownloaded: number;
}

export class DownloaderError extends Error {
	public readonly code: DownloaderErrorCode;
	public readonly details?: Record<string, string | number>;
	public readonly cause?: unknown;

	constructor(code: DownloaderErrorCode, message: string, details?: Record<string, string | number>, cause?: unknown) {
		super(message);
		this.name = 'DownloaderError';
		this.code = code;
		this.details = details;
		this.cause = cause;
	}
}

// Extract the OS-level error code (EACCES/EBUSY/ENOSPC/ENOTFOUND/etc.) from an
// arbitrary error, falling back to a short constant. We never inline err.message
// into DownloaderError.message because Node's fs errors interpolate the offending
// path — e.g. "EACCES: permission denied, open '/Users/<name>/Library/...'" —
// which would exfiltrate the user's home directory in analytics.
function _errCode(err: unknown, fallback: string): string {
	if (err && typeof err === 'object') {
		const c = (err as { code?: unknown }).code;
		if (typeof c === 'string' && c) {return c;}
	}
	return fallback;
}

// Invoke the caller's onProgress callback without letting a user throw crash
// the download stream. Throws inside a stream 'data' handler otherwise surface
// as uncaughtException on the extension host.
function _safeProgress(cb: ((p: DownloadProgress) => void) | undefined, p: DownloadProgress): void {
	if (!cb) {return;}
	try {
		cb(p);
	} catch {
		// swallow — progress reporting is best-effort
	}
}

// ------------- Platform detection -------------

export function detectPlatform(): PlatformKey | null {
	const platform = process.platform;
	let arch = os.arch();

	if (platform === 'darwin') {
		// Rosetta 2: x64 Node on Apple Silicon should use the arm64 binary —
		// the x64 build needs AVX which Rosetta doesn't emulate.
		if (arch === 'x64') {
			try {
				const r = cp.spawnSync('sysctl', ['-n', 'sysctl.proc_translated'], { encoding: 'utf8' });
				if (r.stdout && r.stdout.trim() === '1') {
					arch = 'arm64';
				}
			} catch {
				// sysctl missing — treat as non-Rosetta
			}
		}
		if (arch !== 'x64' && arch !== 'arm64') {return null;}
		return { key: `darwin-${arch}`, binaryName: 'claude', tarEntry: 'package/claude' };
	}

	if (platform === 'linux') {
		if (arch !== 'x64' && arch !== 'arm64') {return null;}
		const musl = _detectMusl();
		const key = `linux-${arch}${musl ? '-musl' : ''}`;
		return { key, binaryName: 'claude', tarEntry: 'package/claude' };
	}

	if (platform === 'win32') {
		if (arch !== 'x64' && arch !== 'arm64') {return null;}
		return { key: `win32-${arch}`, binaryName: 'claude.exe', tarEntry: 'package/claude.exe' };
	}

	return null;
}

function _detectMusl(): boolean {
	try {
		const report = (process as unknown as { report?: { getReport?: () => { header?: { glibcVersionRuntime?: string } } } }).report;
		if (report && typeof report.getReport === 'function') {
			const r = report.getReport();
			return !r.header?.glibcVersionRuntime;
		}
	} catch {
		// fall through to file-presence check
	}
	try {
		if (fs.existsSync('/lib/libc.musl-x86_64.so.1') || fs.existsSync('/lib/libc.musl-aarch64.so.1')) {
			return true;
		}
	} catch {
		// fall through
	}
	return false;
}

// ------------- HTTP helpers -------------

function _checkAborted(signal: AbortSignal | undefined): void {
	if (signal?.aborted) {
		throw new DownloaderError('CANCELLED', 'Cancelled');
	}
}

function _httpGet(urlStr: string, signal?: AbortSignal, redirectsRemaining = 5): Promise<http.IncomingMessage> {
	return new Promise((resolve, reject) => {
		_checkAborted(signal);
		const parsed = new URL(urlStr);
		// Pick http or https by scheme so tests can target a local http server.
		const getter = parsed.protocol === 'http:' ? http.get : https.get;
		const req = getter(urlStr, { headers: { 'user-agent': 'claude-code-chat-vscode' } }, (res) => {
			const status = res.statusCode ?? 0;
			if ([301, 302, 303, 307, 308].includes(status) && res.headers.location) {
				res.resume();
				if (redirectsRemaining <= 0) {
					reject(new DownloaderError('NETWORK', 'Too many redirects', { host: parsed.host }));
					return;
				}
				const next = new URL(res.headers.location, urlStr).toString();
				_httpGet(next, signal, redirectsRemaining - 1).then(resolve, reject);
				return;
			}
			if (status < 200 || status >= 300) {
				res.resume();
				reject(new DownloaderError('NETWORK', `HTTP ${status} from ${parsed.host}`, { status, host: parsed.host }));
				return;
			}
			resolve(res);
		});
		req.on('error', (err) => {
			const code = _errCode(err, 'NETERR');
			reject(new DownloaderError('NETWORK', `Network error (${code}) from ${parsed.host}`, { host: parsed.host, code }, err));
		});
		const onAbort = () => {
			req.destroy();
			reject(new DownloaderError('CANCELLED', 'Cancelled'));
		};
		signal?.addEventListener('abort', onAbort, { once: true });
	});
}

async function _fetchBuffer(urlStr: string, signal?: AbortSignal): Promise<Buffer> {
	const res = await _httpGet(urlStr, signal);
	return new Promise<Buffer>((resolve, reject) => {
		const chunks: Buffer[] = [];
		const timer = setTimeout(() => {
			res.destroy();
			reject(new DownloaderError('NETWORK', 'Metadata request timed out'));
		}, META_TIMEOUT_MS);
		res.on('data', (c: Buffer) => chunks.push(c));
		res.on('end', () => { clearTimeout(timer); resolve(Buffer.concat(chunks)); });
		res.on('error', (err) => { clearTimeout(timer); reject(new DownloaderError('NETWORK', `Response error (${_errCode(err, 'NETERR')})`, { code: _errCode(err, 'NETERR') }, err)); });
	});
}

async function _fetchText(url: string, signal?: AbortSignal): Promise<string> {
	return (await _fetchBuffer(url, signal)).toString('utf8');
}

async function _fetchJson<T = unknown>(url: string, signal?: AbortSignal): Promise<T> {
	const body = await _fetchText(url, signal);
	try {
		return JSON.parse(body) as T;
	} catch (err) {
		throw new DownloaderError('NETWORK', 'Invalid JSON in response', undefined, err);
	}
}

// ------------- Tar extraction (minimal, ustar-only) -------------
//
// Extracts a single file by name from a gunzipped tar stream. Npm-published
// tarballs use plain ustar with short filenames, so we don't handle GNU long-
// link extensions, PAX headers, or sparse files. If the target entry isn't
// found by end of stream, we throw INTEGRITY — the tarball shape is wrong.

function _parseOctal(buf: Buffer): number {
	// Octal ASCII, null/space terminated.
	let end = 0;
	while (end < buf.length && buf[end] !== 0 && buf[end] !== 0x20) {end++;}
	const s = buf.subarray(0, end).toString('ascii').trim();
	return s.length ? parseInt(s, 8) : 0;
}

function _readTarHeader(block: Buffer): { name: string; size: number; isRegularFile: boolean } {
	const name = block.subarray(0, 100).toString('utf8').replace(/\0+$/, '');
	const prefix = block.subarray(345, 500).toString('utf8').replace(/\0+$/, '');
	const rawSize = _parseOctal(block.subarray(124, 136));
	// Defensive: guard against NaN / negative / non-finite sizes from malformed
	// tarballs before they poison our skip-byte arithmetic downstream.
	const size = Number.isFinite(rawSize) && rawSize >= 0 ? rawSize : -1;
	const typeFlag = String.fromCharCode(block[156] || 0);
	const isRegularFile = typeFlag === '0' || typeFlag === '\0';
	const fullName = prefix ? `${prefix}/${name}` : name;
	return { name: fullName, size, isRegularFile };
}

interface TarExtractState {
	found: boolean;
	bytesWritten: number;
	buffer: Buffer;
	// When >0, we are in the middle of the target file's data, and this many
	// bytes still need to be written to out.
	remainingFileBytes: number;
	// When >0, we are skipping past a non-target file's data+padding.
	remainingSkipBytes: number;
}

function _processTarChunk(state: TarExtractState, chunk: Buffer, entryName: string, out: fs.WriteStream): void {
	state.buffer = state.buffer.length ? Buffer.concat([state.buffer, chunk]) : chunk;

	while (true) {
		if (state.remainingFileBytes > 0) {
			const take = Math.min(state.remainingFileBytes, state.buffer.length);
			if (take === 0) {return;}
			out.write(state.buffer.subarray(0, take));
			state.bytesWritten += take;
			state.remainingFileBytes -= take;
			state.buffer = state.buffer.subarray(take);
			if (state.remainingFileBytes === 0) {
				// After the file data, skip the 512-byte padding tail.
				const padLen = (512 - (state.bytesWritten % 512)) % 512;
				state.remainingSkipBytes = padLen;
			}
			continue;
		}

		if (state.remainingSkipBytes > 0) {
			const skip = Math.min(state.remainingSkipBytes, state.buffer.length);
			if (skip === 0) {return;}
			state.remainingSkipBytes -= skip;
			state.buffer = state.buffer.subarray(skip);
			continue;
		}

		if (state.buffer.length < 512) {return;}

		const header = state.buffer.subarray(0, 512);
		// End-of-archive is two consecutive zero-blocks. A single zero-block
		// also terminates our scan safely.
		if (header[0] === 0) {return;}

		const { name, size, isRegularFile } = _readTarHeader(header);
		state.buffer = state.buffer.subarray(512);

		// Size < 0 means the header was malformed (NaN / negative octal). Bail so
		// we don't poison the skip arithmetic — the outer INTEGRITY check will fire.
		if (size < 0) {throw new DownloaderError('INTEGRITY', 'Malformed tar header (invalid size)');}

		if (name === entryName && isRegularFile) {
			state.found = true;
			state.remainingFileBytes = size;
			state.bytesWritten = 0;
		} else {
			// Skip this file's data + padding.
			const padded = Math.ceil(size / 512) * 512;
			state.remainingSkipBytes = padded;
		}
	}
}

// ------------- npm source -------------

interface NpmPackageMetadata {
	'dist-tags': { latest: string; [tag: string]: string };
	versions: Record<string, { dist: { tarball: string; integrity: string } }>;
}

async function _downloadFromNpm(platform: PlatformKey, opts: DownloadOptions): Promise<DownloadResult> {
	const onProgress = opts.onProgress;
	const registry = opts.npmRegistry || DEFAULT_NPM_REGISTRY;
	_safeProgress(onProgress, { phase: 'resolving', source: 'npm', message: 'Looking up latest version' });

	const metaUrl = `${registry}/${NPM_PACKAGE_PREFIX}${platform.key}`;
	const meta = await _fetchJson<NpmPackageMetadata>(metaUrl, opts.signal);
	const version = meta['dist-tags']?.latest;
	if (!version) {throw new DownloaderError('NETWORK', 'npm metadata missing dist-tags.latest');}
	const versionMeta = meta.versions?.[version];
	if (!versionMeta?.dist?.tarball || !versionMeta.dist.integrity) {
		throw new DownloaderError('NETWORK', 'npm metadata missing tarball or integrity');
	}
	const tarballUrl = versionMeta.dist.tarball;
	const integrity = versionMeta.dist.integrity;
	const dashIdx = integrity.indexOf('-');
	if (dashIdx < 0) {throw new DownloaderError('INTEGRITY', 'Unrecognized integrity format');}
	const algo = integrity.slice(0, dashIdx);
	const expectedB64 = integrity.slice(dashIdx + 1);
	if (!['sha256', 'sha384', 'sha512'].includes(algo)) {
		throw new DownloaderError('INTEGRITY', `Unsupported hash algorithm: ${algo}`, { algo });
	}

	const tempPath = path.join(opts.destDir, `.claude.download.${process.pid}.${Date.now()}`);
	const writeStream = fs.createWriteStream(tempPath);
	const hash = crypto.createHash(algo);
	const gunzip = zlib.createGunzip();

	const state: TarExtractState = {
		found: false,
		bytesWritten: 0,
		buffer: Buffer.alloc(0),
		remainingFileBytes: 0,
		remainingSkipBytes: 0,
	};

	_safeProgress(onProgress, { phase: 'downloading', source: 'npm', loaded: 0 });

	let res: http.IncomingMessage;
	try {
		res = await _httpGet(tarballUrl, opts.signal);
	} catch (err) {
		writeStream.destroy();
		await _safeUnlink(tempPath);
		throw err;
	}

	const total = Number(res.headers['content-length']) || undefined;
	let bytesDownloaded = 0;
	let lastProgressAt = 0;

	const extractPromise = new Promise<void>((resolve, reject) => {
		gunzip.on('data', (chunk: Buffer) => {
			try {
				_processTarChunk(state, chunk, platform.tarEntry, writeStream);
			} catch (err) {
				reject(err);
			}
		});
		gunzip.on('end', () => resolve());
		gunzip.on('error', (err) => reject(new DownloaderError('INTEGRITY', 'Tarball decompression failed', undefined, err)));
	});

	res.on('data', (chunk: Buffer) => {
		bytesDownloaded += chunk.length;
		hash.update(chunk);
		const now = Date.now();
		if (now - lastProgressAt > PROGRESS_THROTTLE_MS) {
			lastProgressAt = now;
			_safeProgress(onProgress, { phase: 'downloading', source: 'npm', loaded: bytesDownloaded, total });
		}
	});

	const responseDone = new Promise<void>((resolve, reject) => {
		res.on('end', () => resolve());
		res.on('error', (err) => reject(new DownloaderError('NETWORK', `Response stream error (${_errCode(err, 'NETERR')})`, { code: _errCode(err, 'NETERR') }, err)));
	});

	const writeDone = new Promise<void>((resolve, reject) => {
		writeStream.on('close', () => resolve());
		writeStream.on('error', (err) => reject(new DownloaderError('WRITE', `Write failed (${_errCode(err, 'WRITEERR')})`, { code: _errCode(err, 'WRITEERR') }, err)));
	});

	const onAbort = () => {
		res.destroy();
		gunzip.destroy();
		writeStream.destroy();
	};
	opts.signal?.addEventListener('abort', onAbort, { once: true });

	res.pipe(gunzip);

	try {
		await Promise.all([responseDone, extractPromise]);
		writeStream.end();
		await writeDone;
	} catch (err) {
		// Tear down both ends explicitly — leaving res piping after an extract
		// failure would leak bandwidth and memory.
		res.destroy();
		gunzip.destroy();
		writeStream.destroy();
		await _safeUnlink(tempPath);
		if (opts.signal?.aborted) {throw new DownloaderError('CANCELLED', 'Cancelled');}
		throw err;
	}

	_safeProgress(onProgress, { phase: 'verifying', source: 'npm', loaded: bytesDownloaded, total });

	if (!state.found) {
		await _safeUnlink(tempPath);
		throw new DownloaderError('INTEGRITY', `Tarball missing expected entry ${platform.tarEntry}`, { platformKey: platform.key });
	}

	const computed = hash.digest('base64');
	if (computed !== expectedB64) {
		await _safeUnlink(tempPath);
		throw new DownloaderError('INTEGRITY', 'npm tarball hash mismatch', { algo });
	}

	_safeProgress(onProgress, { phase: 'installing', source: 'npm' });
	const finalPath = await _finalize(tempPath, path.join(opts.destDir, platform.binaryName));
	return { binaryPath: finalPath, version, source: 'npm', bytesDownloaded };
}

// ------------- CDN source -------------

interface CdnManifest {
	platforms: Record<string, { checksum: string }>;
}

async function _downloadFromCdn(platform: PlatformKey, opts: DownloadOptions): Promise<DownloadResult> {
	const onProgress = opts.onProgress;
	const base = opts.cdnBase || DEFAULT_CDN_BASE;
	_safeProgress(onProgress, { phase: 'resolving', source: 'cdn', message: 'Looking up latest version' });

	const versionRaw = (await _fetchText(`${base}/latest`, opts.signal)).trim();
	if (!/^\d+\.\d+\.\d+(-[\w.-]+)?$/.test(versionRaw)) {
		throw new DownloaderError('NETWORK', 'CDN returned invalid version string');
	}
	const version = versionRaw;

	const manifest = await _fetchJson<CdnManifest>(`${base}/${version}/manifest.json`, opts.signal);
	const expectedHex = manifest.platforms?.[platform.key]?.checksum;
	if (!expectedHex || !/^[a-f0-9]{64}$/i.test(expectedHex)) {
		throw new DownloaderError('INTEGRITY', `CDN manifest missing checksum for ${platform.key}`, { platformKey: platform.key });
	}

	const binName = process.platform === 'win32' ? 'claude.exe' : 'claude';
	const binUrl = `${base}/${version}/${platform.key}/${binName}`;
	const tempPath = path.join(opts.destDir, `.claude.download.${process.pid}.${Date.now()}`);
	const writeStream = fs.createWriteStream(tempPath);
	const hash = crypto.createHash('sha256');

	_safeProgress(onProgress, { phase: 'downloading', source: 'cdn', loaded: 0 });

	let res: http.IncomingMessage;
	try {
		res = await _httpGet(binUrl, opts.signal);
	} catch (err) {
		writeStream.destroy();
		await _safeUnlink(tempPath);
		throw err;
	}

	const total = Number(res.headers['content-length']) || undefined;
	let bytesDownloaded = 0;
	let lastProgressAt = 0;

	const onAbort = () => {
		res.destroy();
		writeStream.destroy();
	};
	opts.signal?.addEventListener('abort', onAbort, { once: true });

	const responseDone = new Promise<void>((resolve, reject) => {
		res.on('data', (chunk: Buffer) => {
			bytesDownloaded += chunk.length;
			hash.update(chunk);
			const now = Date.now();
			if (now - lastProgressAt > PROGRESS_THROTTLE_MS) {
				lastProgressAt = now;
				_safeProgress(onProgress, { phase: 'downloading', source: 'cdn', loaded: bytesDownloaded, total });
			}
		});
		res.on('end', () => resolve());
		res.on('error', (err) => reject(new DownloaderError('NETWORK', `Response stream error (${_errCode(err, 'NETERR')})`, { code: _errCode(err, 'NETERR') }, err)));
	});

	// Wait for 'close' (fd released), not just 'finish' (data flushed). Matters on
	// Windows — rename() fails with EBUSY if the underlying handle is still open.
	const writeDone = new Promise<void>((resolve, reject) => {
		writeStream.on('close', () => resolve());
		writeStream.on('error', (err) => reject(new DownloaderError('WRITE', `Write failed (${_errCode(err, 'WRITEERR')})`, { code: _errCode(err, 'WRITEERR') }, err)));
	});

	res.pipe(writeStream);

	try {
		await responseDone;
		writeStream.end();
		await writeDone;
	} catch (err) {
		res.destroy();
		writeStream.destroy();
		await _safeUnlink(tempPath);
		if (opts.signal?.aborted) {throw new DownloaderError('CANCELLED', 'Cancelled');}
		throw err;
	}

	_safeProgress(onProgress, { phase: 'verifying', source: 'cdn', loaded: bytesDownloaded, total });

	const computedHex = hash.digest('hex');
	if (computedHex.toLowerCase() !== expectedHex.toLowerCase()) {
		await _safeUnlink(tempPath);
		throw new DownloaderError('INTEGRITY', 'CDN binary hash mismatch');
	}

	_safeProgress(onProgress, { phase: 'installing', source: 'cdn' });
	const finalPath = await _finalize(tempPath, path.join(opts.destDir, platform.binaryName));
	return { binaryPath: finalPath, version, source: 'cdn', bytesDownloaded };
}

// ------------- Finalize (chmod + atomic rename) -------------

async function _finalize(tempPath: string, finalPath: string): Promise<string> {
	if (process.platform !== 'win32') {
		try {
			fs.chmodSync(tempPath, 0o755);
		} catch (err) {
			await _safeUnlink(tempPath);
			const code = _errCode(err, 'CHMODERR');
			throw new DownloaderError('WRITE', `chmod failed (${code})`, { code }, err);
		}
	}

	try {
		fs.renameSync(tempPath, finalPath);
	} catch (err) {
		const code = _errCode(err, 'RENAMEERR');
		// EXDEV means temp and final are on different filesystems (shouldn't happen,
		// but defensive).
		if (code === 'EXDEV') {
			try {
				fs.copyFileSync(tempPath, finalPath);
				await _safeUnlink(tempPath);
				return finalPath;
			} catch (copyErr) {
				await _safeUnlink(tempPath);
				const ccode = _errCode(copyErr, 'COPYERR');
				throw new DownloaderError('WRITE', `Copy to final path failed (${ccode})`, { code: ccode }, copyErr);
			}
		}
		await _safeUnlink(tempPath);
		// EBUSY/EPERM on Windows means the target is currently running — we can't replace it.
		if (code === 'EBUSY' || code === 'EPERM') {
			throw new DownloaderError('WRITE', 'Target binary is in use. Close any running claude sessions and try again.', { code }, err);
		}
		throw new DownloaderError('WRITE', `Rename failed (${code})`, { code }, err);
	}
	return finalPath;
}

async function _safeUnlink(p: string): Promise<void> {
	try {
		await fs.promises.unlink(p);
	} catch {
		// ignore — cleanup best-effort
	}
}

// ------------- Public orchestrator -------------

export async function downloadClaude(opts: DownloadOptions): Promise<DownloadResult> {
	const platform = detectPlatform();
	if (!platform) {
		throw new DownloaderError('UNSUPPORTED_PLATFORM', `Unsupported platform: ${process.platform}/${os.arch()}`, {
			platform: process.platform,
			arch: os.arch(),
		});
	}

	try {
		fs.mkdirSync(opts.destDir, { recursive: true });
	} catch (err) {
		const code = _errCode(err, 'MKDIRERR');
		// Never include the path — destDir is under the user's home directory and
		// would leak the username if posted to analytics.
		throw new DownloaderError('WRITE', `Could not create download directory (${code})`, { code }, err);
	}

	let npmErr: unknown;
	try {
		return await _downloadFromNpm(platform, opts);
	} catch (err) {
		if (err instanceof DownloaderError && err.code === 'CANCELLED') {throw err;}
		npmErr = err;
		_safeProgress(opts.onProgress, { phase: 'fallback', source: 'cdn', message: 'npm source failed — retrying via CDN' });
	}

	try {
		return await _downloadFromCdn(platform, opts);
	} catch (cdnErr) {
		if (cdnErr instanceof DownloaderError && cdnErr.code === 'CANCELLED') {throw cdnErr;}
		const npmCode = npmErr instanceof DownloaderError ? npmErr.code : 'NETWORK';
		const cdnCode = cdnErr instanceof DownloaderError ? cdnErr.code : 'NETWORK';
		throw new DownloaderError(
			'AGGREGATE',
			`Both sources failed (npm: ${npmCode}, cdn: ${cdnCode}).`,
			{ npmCode, cdnCode },
			[npmErr, cdnErr],
		);
	}
}

// ------------- Internal exports for tests -------------
// These are NOT part of the public API — consumers should use downloadClaude
// and detectPlatform. They're exported here so the test suite can unit-test the
// tar parser, octal parsing, and error-code helpers without network I/O.

/** @internal */
export const __test__ = {
	parseOctal: _parseOctal,
	readTarHeader: _readTarHeader,
	processTarChunk: _processTarChunk,
	errCode: _errCode,
	safeProgress: _safeProgress,
};

/** @internal */
export type __TarExtractState__ = TarExtractState;
