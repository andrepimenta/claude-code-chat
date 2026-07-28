// Pure helpers for the fork-issue-38 turn-diff feature (real vscode.diff view comparing the
// pre-turn checkpoint against the live file). No vscode import, so these run under
// plain mocha like model-updater -- extension.ts owns all the side effects (git exec,
// workspace lookup, vscode.Uri/vscode.diff) and just feeds paths/buffers through
// these functions.

// Maps a WSL-reported path (e.g. /mnt/c/Users/example/foo.ts, as seen in tool_use
// rawInput.file_path when claudeCodeChat.wsl.enabled is on) back to the real Windows
// path VS Code and git need. Only rewrites an actual /mnt/<drive>/... path; anything
// else (already a Windows path, or a Linux path outside /mnt) is returned unchanged.
export function mapWslPathToWindows(filePath: string): string {
	const match = filePath.match(/^\/mnt\/([a-zA-Z])\/(.*)$/);
	if (!match) {
		return filePath;
	}
	const drive = match[1].toUpperCase();
	const rest = match[2].replace(/\//g, '\\');
	return `${drive}:\\${rest}`;
}

// Resolves an absolute file path to a path relative to the workspace root, using '/'
// separators so the result can be passed straight to `git show <sha>:<relPath>`
// (git's tree-ish path syntax always uses '/', regardless of OS). Comparison is
// case-insensitive on Windows, where the filesystem is case-insensitive but tool
// input paths and the workspace folder path aren't guaranteed to agree on casing.
// Returns undefined when filePath isn't inside workspaceRoot ("not mappable"), which
// also covers filePath being the workspace root itself (a
// directory has no checkpointed blob to diff against, so treat it the same as
// "outside the workspace" instead of handing callers a '' relPath).
export function toWorkspaceRelativePath(filePath: string, workspaceRoot: string): string | undefined {
	const normalize = (p: string) => p.replace(/\\/g, '/').replace(/\/+$/, '');
	const normFile = normalize(filePath);
	const normRoot = normalize(workspaceRoot);
	if (!normFile || !normRoot) {
		return undefined;
	}

	const caseInsensitive = process.platform === 'win32';
	const fileKey = caseInsensitive ? normFile.toLowerCase() : normFile;
	const rootKey = caseInsensitive ? normRoot.toLowerCase() : normRoot;

	if (fileKey === rootKey) {
		return undefined;
	}
	if (fileKey.startsWith(rootKey + '/')) {
		return normFile.slice(normRoot.length + 1);
	}
	return undefined;
}

// Binary heuristic used to keep obviously-binary content out of the diff virtual
// document: a NUL byte within the first 8 KB, the same window common tools (git,
// grep) use. Not exact binary detection -- just a "should we even try to diff this"
// guard before handing content to a text-based diff view.
const BINARY_CHECK_WINDOW_BYTES = 8192;

export function isBinaryContent(content: Buffer): boolean {
	const len = Math.min(content.length, BINARY_CHECK_WINDOW_BYTES);
	for (let i = 0; i < len; i++) {
		if (content[i] === 0) {
			return true;
		}
	}
	return false;
}

// Scheme of the existing read-only diff content provider (registered once in
// extension.ts, reused here instead of adding a second provider).
export const TURN_DIFF_URI_SCHEME = 'claude-diff';

export interface TurnDiffUriParts {
	scheme: string;
	path: string;
	query: string;
}

// Builds the (scheme, path, query) a stable baseline URI is made of: deterministic
// per (sha, relPath), so vscode.Uri.from(parts) always produces the identical URI
// for the same turn+file and VS Code dedupes the tab instead of stacking a new one
// per click. relPath keeps its real extension in `path` (git's basename) so the
// virtual document still gets the right syntax highlighting; `sha` goes in the query
// so two turns diffing the same file don't collide on the same URI/cache entry.
export function buildTurnDiffUriParts(sha: string, relPath: string): TurnDiffUriParts {
	return {
		scheme: TURN_DIFF_URI_SCHEME,
		path: '/' + relPath.replace(/^\/+/, ''),
		query: `sha=${sha}`
	};
}

// Inverse of buildTurnDiffUriParts: recovers (sha, relPath) from
// a claude-diff URI's own (path, query), so DiffContentProvider can resolve a cache
// miss -- a tab restored via "Reopen Closed Editor" or a VS Code restart, after the
// in-memory diffContentStore is gone -- without needing any other state. vscode.Uri
// hands back path/query already decoded, matching what buildTurnDiffUriParts wrote,
// so this is a plain string split, not URI-decoding. Returns undefined when query
// doesn't look like a URI this feature built (defensive; shouldn't happen for a URI
// on the claude-diff scheme).
export function parseTurnDiffUriParts(parts: { path: string; query: string }): { sha: string; relPath: string } | undefined {
	const match = parts.query.match(/^sha=(.*)$/);
	if (!match) {
		return undefined;
	}
	return {
		sha: match[1],
		relPath: parts.path.replace(/^\/+/, '')
	};
}

// Cache key for the content-provider's Map, derived identically on the writer (host,
// right before vscode.diff) and reader (provideTextDocumentContent) side so a
// (sha, relPath) pair never collides with a different turn's baseline for the same
// file (see buildTurnDiffUriParts).
export function turnDiffCacheKey(parts: { path: string; query: string }): string {
	return `${parts.path}?${parts.query}`;
}
