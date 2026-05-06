import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { detectPlatform, DownloaderError, __test__ } from '../claudeDownloader';

const { parseOctal, readTarHeader, processTarChunk, errCode, safeProgress } = __test__;

// ---- Tar fixture builder -----------------------------------------------
// Build a ustar header block + aligned data. We only populate the fields our
// parser reads: name (0..100), size (124..136), typeflag (156), prefix (345..500).

function makeHeader(name: string, size: number, opts: { typeFlag?: string; prefix?: string } = {}): Buffer {
	const block = Buffer.alloc(512, 0);
	block.write(name, 0, 100, 'utf8');
	// Size: octal ASCII, null-terminated, 11 digits + NUL.
	const oct = size.toString(8).padStart(11, '0');
	block.write(oct, 124, 11, 'ascii');
	block[135] = 0;
	block[156] = (opts.typeFlag || '0').charCodeAt(0);
	if (opts.prefix) {block.write(opts.prefix, 345, 155, 'utf8');}
	return block;
}

function makeMalformedSizeHeader(name: string): Buffer {
	// Non-octal junk in the size field.
	const block = Buffer.alloc(512, 0);
	block.write(name, 0, 100, 'utf8');
	block.write('ZZZ', 124, 3, 'ascii');
	block[156] = '0'.charCodeAt(0);
	return block;
}

function paddedData(size: number, fill = 0x41 /* 'A' */): Buffer {
	const padded = Math.ceil(size / 512) * 512;
	const buf = Buffer.alloc(padded, 0);
	for (let i = 0; i < size; i++) {buf[i] = fill;}
	return buf;
}

function buildTarball(entries: Array<{ name: string; data: Buffer; typeFlag?: string; prefix?: string }>): Buffer {
	const parts: Buffer[] = [];
	for (const e of entries) {
		parts.push(makeHeader(e.name, e.data.length, { typeFlag: e.typeFlag, prefix: e.prefix }));
		const padded = Math.ceil(e.data.length / 512) * 512;
		const padBlock = Buffer.alloc(padded, 0);
		e.data.copy(padBlock, 0);
		parts.push(padBlock);
	}
	// End-of-archive: two zero-blocks.
	parts.push(Buffer.alloc(1024, 0));
	return Buffer.concat(parts);
}

function newWriteStream(): { stream: fs.WriteStream; path: string; read(): Buffer } {
	const tmp = path.join(os.tmpdir(), 'downloader-test-' + process.pid + '-' + Date.now() + '-' + Math.random().toString(36).slice(2));
	const stream = fs.createWriteStream(tmp);
	return {
		stream,
		path: tmp,
		read: () => fs.readFileSync(tmp),
	};
}

async function flushWriteStream(s: fs.WriteStream): Promise<void> {
	return new Promise((resolve, reject) => {
		s.end(() => resolve());
		s.on('error', reject);
	});
}

suite('claudeDownloader: detectPlatform', () => {
	test('returns a supported platform shape on the current host', () => {
		const p = detectPlatform();
		if (!p) {
			// Test suite only runs on supported hosts — skip if we land somewhere weird.
			return;
		}
		assert.strictEqual(typeof p.key, 'string');
		assert.ok(p.key.length > 0);
		assert.ok(
			/^(darwin|linux|win32)-(x64|arm64)(-musl)?$/.test(p.key),
			'unexpected platform key: ' + p.key,
		);
		assert.ok(p.binaryName === 'claude' || p.binaryName === 'claude.exe');
		assert.ok(p.tarEntry === 'package/claude' || p.tarEntry === 'package/claude.exe');
		// Windows → .exe, others → no extension
		if (process.platform === 'win32') {
			assert.strictEqual(p.binaryName, 'claude.exe');
			assert.strictEqual(p.tarEntry, 'package/claude.exe');
		} else {
			assert.strictEqual(p.binaryName, 'claude');
			assert.strictEqual(p.tarEntry, 'package/claude');
		}
	});
});

suite('claudeDownloader: DownloaderError', () => {
	test('exposes code, message, details, cause', () => {
		const cause = new Error('underlying');
		const e = new DownloaderError('NETWORK', 'something failed', { status: 503, host: 'example.com' }, cause);
		assert.strictEqual(e.code, 'NETWORK');
		assert.strictEqual(e.message, 'something failed');
		assert.deepStrictEqual(e.details, { status: 503, host: 'example.com' });
		assert.strictEqual(e.cause, cause);
		assert.strictEqual(e.name, 'DownloaderError');
		assert.ok(e instanceof Error);
	});

	test('details and cause are optional', () => {
		const e = new DownloaderError('CANCELLED', 'stop');
		assert.strictEqual(e.details, undefined);
		assert.strictEqual(e.cause, undefined);
	});
});

suite('claudeDownloader: parseOctal', () => {
	test('parses standard octal size', () => {
		const buf = Buffer.alloc(12, 0);
		buf.write('00000001024', 0, 'ascii'); // 1024 in octal
		assert.strictEqual(parseOctal(buf), 0o1024);
	});

	test('parses octal with trailing NUL terminator', () => {
		const buf = Buffer.alloc(12, 0);
		buf.write('0000100', 0, 'ascii');
		assert.strictEqual(parseOctal(buf), 0o100);
	});

	test('parses octal with trailing space terminator', () => {
		const buf = Buffer.from('0000100 \0\0\0\0\0');
		assert.strictEqual(parseOctal(buf), 0o100);
	});

	test('returns 0 for empty buffer', () => {
		assert.strictEqual(parseOctal(Buffer.alloc(12, 0)), 0);
	});

	test('returns NaN for non-octal garbage', () => {
		const buf = Buffer.from('ZZZ\0\0\0\0\0\0\0\0\0');
		const result = parseOctal(buf);
		assert.ok(Number.isNaN(result), 'expected NaN for non-octal input, got ' + result);
	});
});

suite('claudeDownloader: readTarHeader', () => {
	test('reads a well-formed header', () => {
		const hdr = makeHeader('package/claude', 1024);
		const parsed = readTarHeader(hdr);
		assert.strictEqual(parsed.name, 'package/claude');
		assert.strictEqual(parsed.size, 1024);
		assert.strictEqual(parsed.isRegularFile, true);
	});

	test('combines prefix + name for long paths', () => {
		const hdr = makeHeader('claude', 512, { prefix: 'package' });
		const parsed = readTarHeader(hdr);
		assert.strictEqual(parsed.name, 'package/claude');
	});

	test('flags non-regular entries (directory)', () => {
		const hdr = makeHeader('package/', 0, { typeFlag: '5' });
		const parsed = readTarHeader(hdr);
		assert.strictEqual(parsed.isRegularFile, false);
	});

	test('returns size=-1 when size field is garbage (NaN guard)', () => {
		const hdr = makeMalformedSizeHeader('package/claude');
		const parsed = readTarHeader(hdr);
		assert.strictEqual(parsed.size, -1, 'malformed size must be clamped to -1');
	});
});

suite('claudeDownloader: processTarChunk', () => {
	test('extracts a single matching entry', async () => {
		const data = paddedData(2000, 0x42 /* 'B' */);
		const binary = data.subarray(0, 2000);
		const tar = buildTarball([{ name: 'package/claude', data: binary }]);

		const ws = newWriteStream();
		const state = { found: false, bytesWritten: 0, buffer: Buffer.alloc(0), remainingFileBytes: 0, remainingSkipBytes: 0 };
		processTarChunk(state, tar, 'package/claude', ws.stream);
		await flushWriteStream(ws.stream);

		const out = ws.read();
		assert.strictEqual(state.found, true);
		assert.strictEqual(out.length, 2000);
		assert.deepStrictEqual(out, binary);
		fs.unlinkSync(ws.path);
	});

	test('skips non-matching entries and still extracts target', async () => {
		const decoy = Buffer.from('ignore me');
		const binary = paddedData(1500, 0x43 /* 'C' */).subarray(0, 1500);
		const tar = buildTarball([
			{ name: 'package/README.md', data: decoy },
			{ name: 'package/claude', data: binary },
			{ name: 'package/LICENSE', data: Buffer.from('also ignore') },
		]);

		const ws = newWriteStream();
		const state = { found: false, bytesWritten: 0, buffer: Buffer.alloc(0), remainingFileBytes: 0, remainingSkipBytes: 0 };
		processTarChunk(state, tar, 'package/claude', ws.stream);
		await flushWriteStream(ws.stream);

		assert.strictEqual(state.found, true);
		assert.deepStrictEqual(ws.read(), binary);
		fs.unlinkSync(ws.path);
	});

	test('handles headers split across multiple chunks', async () => {
		const binary = paddedData(3000, 0x44 /* 'D' */).subarray(0, 3000);
		const tar = buildTarball([
			{ name: 'package/README.md', data: Buffer.from('meh') },
			{ name: 'package/claude', data: binary },
		]);

		const ws = newWriteStream();
		const state = { found: false, bytesWritten: 0, buffer: Buffer.alloc(0), remainingFileBytes: 0, remainingSkipBytes: 0 };
		// Drip-feed 137-byte chunks — guaranteed to bisect every header + data block.
		const chunkSize = 137;
		for (let i = 0; i < tar.length; i += chunkSize) {
			processTarChunk(state, tar.subarray(i, Math.min(i + chunkSize, tar.length)), 'package/claude', ws.stream);
		}
		await flushWriteStream(ws.stream);

		assert.strictEqual(state.found, true);
		assert.deepStrictEqual(ws.read(), binary);
		fs.unlinkSync(ws.path);
	});

	test('sets found=false when target entry is absent', async () => {
		const tar = buildTarball([
			{ name: 'package/README.md', data: Buffer.from('nope') },
		]);

		const ws = newWriteStream();
		const state = { found: false, bytesWritten: 0, buffer: Buffer.alloc(0), remainingFileBytes: 0, remainingSkipBytes: 0 };
		processTarChunk(state, tar, 'package/claude', ws.stream);
		await flushWriteStream(ws.stream);

		assert.strictEqual(state.found, false);
		assert.strictEqual(ws.read().length, 0);
		fs.unlinkSync(ws.path);
	});

	test('throws INTEGRITY on malformed size in header', () => {
		const bad = makeMalformedSizeHeader('package/evil');
		const endBlocks = Buffer.alloc(1024, 0);
		const tar = Buffer.concat([bad, endBlocks]);

		const ws = newWriteStream();
		const state = { found: false, bytesWritten: 0, buffer: Buffer.alloc(0), remainingFileBytes: 0, remainingSkipBytes: 0 };
		assert.throws(
			() => processTarChunk(state, tar, 'package/claude', ws.stream),
			(err) => err instanceof DownloaderError && err.code === 'INTEGRITY',
		);
		ws.stream.destroy();
		try { fs.unlinkSync(ws.path); } catch { /* best effort */ }
	});

	test('stops cleanly at end-of-archive zero block', async () => {
		const binary = paddedData(800, 0x45 /* 'E' */).subarray(0, 800);
		const tar = buildTarball([{ name: 'package/claude', data: binary }]);

		const ws = newWriteStream();
		const state = { found: false, bytesWritten: 0, buffer: Buffer.alloc(0), remainingFileBytes: 0, remainingSkipBytes: 0 };
		processTarChunk(state, tar, 'package/claude', ws.stream);
		await flushWriteStream(ws.stream);

		assert.strictEqual(state.found, true);
		assert.deepStrictEqual(ws.read(), binary);
		fs.unlinkSync(ws.path);
	});
});

suite('claudeDownloader: errCode helper', () => {
	test('extracts .code when present', () => {
		const err = Object.assign(new Error('x'), { code: 'EACCES' });
		assert.strictEqual(errCode(err, 'FALLBACK'), 'EACCES');
	});

	test('returns fallback when code is absent', () => {
		assert.strictEqual(errCode(new Error('x'), 'FALLBACK'), 'FALLBACK');
		assert.strictEqual(errCode(null, 'FALLBACK'), 'FALLBACK');
		assert.strictEqual(errCode(undefined, 'FALLBACK'), 'FALLBACK');
		assert.strictEqual(errCode('just a string', 'FALLBACK'), 'FALLBACK');
	});

	test('returns fallback when code is a non-string', () => {
		assert.strictEqual(errCode({ code: 123 }, 'FALLBACK'), 'FALLBACK');
		assert.strictEqual(errCode({ code: '' }, 'FALLBACK'), 'FALLBACK');
	});
});

suite('claudeDownloader: safeProgress helper', () => {
	test('invokes the callback with the progress payload', () => {
		const calls: unknown[] = [];
		safeProgress((p) => calls.push(p), { phase: 'resolving' });
		assert.deepStrictEqual(calls, [{ phase: 'resolving' }]);
	});

	test('swallows callback throws without propagating', () => {
		assert.doesNotThrow(() => {
			safeProgress(() => { throw new Error('boom'); }, { phase: 'downloading' });
		});
	});

	test('handles undefined callback', () => {
		assert.doesNotThrow(() => safeProgress(undefined, { phase: 'verifying' }));
	});
});
