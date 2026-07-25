// Unit tests for the #38 turn-diff helpers (WSL path mapping, workspace-relative
// path resolution, binary detection, baseline URI construction). All pure (no
// vscode, no network, no filesystem access), so these run under plain mocha against
// the compiled out/ output -- same pattern as the shell-utils/auto-model-switch unit
// tests. Run with `npm run test:diff-utils`.

import * as assert from 'assert';
import {
	mapWslPathToWindows,
	toWorkspaceRelativePath,
	isBinaryContent,
	buildTurnDiffUriParts,
	parseTurnDiffUriParts,
	turnDiffCacheKey,
	TURN_DIFF_URI_SCHEME
} from '../diff-utils';

suite('diff-utils: mapWslPathToWindows', () => {

	test('maps /mnt/c/... to C:\\...', () => {
		assert.strictEqual(mapWslPathToWindows('/mnt/c/Users/Roman/foo.ts'), 'C:\\Users\\Roman\\foo.ts');
	});

	test('maps other drive letters too (e.g. /mnt/d)', () => {
		assert.strictEqual(mapWslPathToWindows('/mnt/d/projects/bar.ts'), 'D:\\projects\\bar.ts');
	});

	test('is case-insensitive on the drive letter and normalizes it to uppercase', () => {
		assert.strictEqual(mapWslPathToWindows('/mnt/C/Users/Roman/foo.ts'), 'C:\\Users\\Roman\\foo.ts');
	});

	test('leaves an already-Windows path unchanged', () => {
		assert.strictEqual(mapWslPathToWindows('C:\\Users\\Roman\\foo.ts'), 'C:\\Users\\Roman\\foo.ts');
	});

	test('leaves a non-/mnt Linux path unchanged (not a WSL-mapped drive)', () => {
		assert.strictEqual(mapWslPathToWindows('/home/roman/foo.ts'), '/home/roman/foo.ts');
	});
});

suite('diff-utils: toWorkspaceRelativePath', () => {

	test('resolves an exact match under the workspace root', () => {
		assert.strictEqual(toWorkspaceRelativePath('C:\\proj\\src\\a.ts', 'C:\\proj'), 'src/a.ts');
	});

	test('is case-insensitive (Windows paths)', () => {
		assert.strictEqual(toWorkspaceRelativePath('c:\\PROJ\\src\\a.ts', 'C:\\proj'), 'src/a.ts');
	});

	test('normalizes mixed \\ and / separators', () => {
		assert.strictEqual(toWorkspaceRelativePath('C:/proj\\src/a.ts', 'C:\\proj'), 'src/a.ts');
	});

	test('returns undefined for a file outside the workspace', () => {
		assert.strictEqual(toWorkspaceRelativePath('C:\\other\\a.ts', 'C:\\proj'), undefined);
	});

	test('returns undefined when the path is the workspace root itself', () => {
		assert.strictEqual(toWorkspaceRelativePath('C:\\proj', 'C:\\proj'), undefined);
	});
});

suite('diff-utils: isBinaryContent', () => {

	test('plain text is not binary', () => {
		assert.strictEqual(isBinaryContent(Buffer.from('hello world\nline two\n', 'utf8')), false);
	});

	test('a NUL byte within the first 8 KB is detected as binary', () => {
		const buf = Buffer.concat([Buffer.from('abc'), Buffer.from([0]), Buffer.from('def')]);
		assert.strictEqual(isBinaryContent(buf), true);
	});

	test('a NUL byte after the first 8 KB is not detected (window limit)', () => {
		const buf = Buffer.concat([Buffer.alloc(8200, 'a'), Buffer.from([0])]);
		assert.strictEqual(isBinaryContent(buf), false);
	});

	test('an empty buffer is not binary', () => {
		assert.strictEqual(isBinaryContent(Buffer.alloc(0)), false);
	});
});

suite('diff-utils: buildTurnDiffUriParts / turnDiffCacheKey', () => {

	test('is deterministic for the same (sha, relPath)', () => {
		const a = buildTurnDiffUriParts('abc123', 'src/a.ts');
		const b = buildTurnDiffUriParts('abc123', 'src/a.ts');
		assert.deepStrictEqual(a, b);
		assert.strictEqual(turnDiffCacheKey(a), turnDiffCacheKey(b));
	});

	test('differs by sha for the same relPath', () => {
		const a = buildTurnDiffUriParts('abc123', 'src/a.ts');
		const b = buildTurnDiffUriParts('def456', 'src/a.ts');
		assert.notStrictEqual(turnDiffCacheKey(a), turnDiffCacheKey(b));
	});

	test('differs by relPath for the same sha', () => {
		const a = buildTurnDiffUriParts('abc123', 'src/a.ts');
		const b = buildTurnDiffUriParts('abc123', 'src/b.ts');
		assert.notStrictEqual(turnDiffCacheKey(a), turnDiffCacheKey(b));
	});

	test('uses the existing claude-diff scheme and keeps the real basename in the path', () => {
		const parts = buildTurnDiffUriParts('abc123', 'src/a.ts');
		assert.strictEqual(parts.scheme, TURN_DIFF_URI_SCHEME);
		assert.strictEqual(parts.scheme, 'claude-diff');
		assert.strictEqual(parts.path, '/src/a.ts');
	});
});

suite('diff-utils: parseTurnDiffUriParts', () => {

	test('is the exact inverse of buildTurnDiffUriParts', () => {
		const built = buildTurnDiffUriParts('abc123', 'src/a.ts');
		assert.deepStrictEqual(parseTurnDiffUriParts(built), { sha: 'abc123', relPath: 'src/a.ts' });
	});

	test('round-trips a nested relPath', () => {
		const built = buildTurnDiffUriParts('def456', 'src/sub/dir/file.tsx');
		assert.deepStrictEqual(parseTurnDiffUriParts(built), { sha: 'def456', relPath: 'src/sub/dir/file.tsx' });
	});

	test('returns undefined when query has no sha= prefix (not a URI this feature built)', () => {
		assert.strictEqual(parseTurnDiffUriParts({ path: '/src/a.ts', query: 'other=x' }), undefined);
	});
});
