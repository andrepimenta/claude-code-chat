// Unit tests for the fork-issue-69 mcp-config-path extraction (getMCPConfigPathForScope). Pure (no
// vscode, no filesystem access), so these run under plain mocha against the compiled out/
// output -- same pattern as settings-batch/quote-win-shell-args. The
// central regression this suite exists for is fork-issue-67's catch-all fix: an unknown/empty scope
// must resolve to undefined, never fall through to the extension's own config path. Run
// with `npm run test:mcp-config-path`.

import * as assert from 'assert';
import * as path from 'path';
import { getMCPConfigPathForScope } from '../mcp-config-path';

const FULL_ENV = {
	homeDir: '/home/dev',
	workspaceFolder: '/home/dev/proj',
	extensionStoragePath: '/home/dev/.vscode/storage'
};

suite('mcp-config-path: getMCPConfigPathForScope (all four scopes, env fully populated)', () => {

	test("'global' resolves to <home>/.claude.json", () => {
		assert.strictEqual(
			getMCPConfigPathForScope('global', FULL_ENV),
			path.join(FULL_ENV.homeDir, '.claude.json')
		);
	});

	test("'project' resolves to <workspace>/.mcp.json", () => {
		assert.strictEqual(
			getMCPConfigPathForScope('project', FULL_ENV),
			path.join(FULL_ENV.workspaceFolder, '.mcp.json')
		);
	});

	test("'extension' resolves to <storage>/mcp/mcp-servers.json", () => {
		assert.strictEqual(
			getMCPConfigPathForScope('extension', FULL_ENV),
			path.join(FULL_ENV.extensionStoragePath, 'mcp', 'mcp-servers.json')
		);
	});

	// 'local' (fork-issue-39) is owned by the CLI (~/.claude.json -> projects); the extension
	// never writes it, so this must be undefined even though every env value above is
	// present and would otherwise be enough to build a path for any other scope. This is
	// its own test (not folded into the missing-env suite below) because the reason it's
	// undefined is a deliberate ownership boundary, not a missing input.
	test("'local' always resolves to undefined -- CLI-owned, the extension never writes it, even with a full env", () => {
		assert.strictEqual(getMCPConfigPathForScope('local', FULL_ENV), undefined);
	});
});

suite('mcp-config-path: getMCPConfigPathForScope (missing env value per scope)', () => {

	test("'global' with no home dir (empty string, e.g. neither HOME nor USERPROFILE set) resolves to undefined, not a broken path", () => {
		assert.strictEqual(
			getMCPConfigPathForScope('global', { ...FULL_ENV, homeDir: '' }),
			undefined
		);
	});

	test("'global' with homeDir omitted entirely resolves to undefined", () => {
		assert.strictEqual(
			getMCPConfigPathForScope('global', { workspaceFolder: FULL_ENV.workspaceFolder, extensionStoragePath: FULL_ENV.extensionStoragePath }),
			undefined
		);
	});

	test("'project' with no workspace folder open resolves to undefined, not a broken path", () => {
		assert.strictEqual(
			getMCPConfigPathForScope('project', { ...FULL_ENV, workspaceFolder: undefined }),
			undefined
		);
	});

	test("'extension' with no extension storage path resolves to undefined, not a broken path", () => {
		assert.strictEqual(
			getMCPConfigPathForScope('extension', { ...FULL_ENV, extensionStoragePath: undefined }),
			undefined
		);
	});

	test('an entirely empty env resolves every real scope to undefined', () => {
		assert.strictEqual(getMCPConfigPathForScope('global', {}), undefined);
		assert.strictEqual(getMCPConfigPathForScope('project', {}), undefined);
		assert.strictEqual(getMCPConfigPathForScope('extension', {}), undefined);
		assert.strictEqual(getMCPConfigPathForScope('local', {}), undefined);
	});
});

// fork-issue-67: the catch-all this suite guards against. Before fork-issue-67, an unknown/empty scope fell
// through to the extension's own config path (the old `default:`/final `return
// this._getExtensionMCPConfigPath();` branch) -- a stray write into the extension's own
// mcp-servers.json for a scope nobody asked for. These tests use an env where
// extensionStoragePath IS present, so a reintroduced catch-all would produce a real path
// here, not just skip past an already-undefined branch.
suite("mcp-config-path: getMCPConfigPathForScope (fork-issue-67 catch-all -- unknown/empty scope must be undefined, never the extension's own config)", () => {

	test('an unknown scope string resolves to undefined, not the extension config path', () => {
		assert.strictEqual(getMCPConfigPathForScope('bogus', FULL_ENV), undefined);
	});

	test('an empty string scope resolves to undefined', () => {
		assert.strictEqual(getMCPConfigPathForScope('', FULL_ENV), undefined);
	});

	// Case sensitivity is deliberate, not an oversight: the four real scopes are compared
	// with strict ===, so anything that isn't exactly 'global'/'project'/'extension'/'local'
	// -- including a differently-cased variant a caller might pass by mistake -- takes the
	// same fail-loud undefined path as a wholly unknown scope. Confirmed against the
	// pre-extraction extension.ts method: it used the same plain === checks, so this is
	// carried-over behaviour, not new.
	test("'Global' (capitalized) is not 'global' and resolves to undefined, not the global config path", () => {
		assert.strictEqual(getMCPConfigPathForScope('Global', FULL_ENV), undefined);
	});

	test('values a caller could accidentally pass instead of a string (undefined, null, a number, an object) never throw, and always resolve to undefined', () => {
		assert.doesNotThrow(() => getMCPConfigPathForScope(undefined as any, FULL_ENV));
		assert.doesNotThrow(() => getMCPConfigPathForScope(null as any, FULL_ENV));
		assert.doesNotThrow(() => getMCPConfigPathForScope(42 as any, FULL_ENV));
		assert.doesNotThrow(() => getMCPConfigPathForScope({} as any, FULL_ENV));
		assert.strictEqual(getMCPConfigPathForScope(undefined as any, FULL_ENV), undefined);
		assert.strictEqual(getMCPConfigPathForScope(null as any, FULL_ENV), undefined);
		assert.strictEqual(getMCPConfigPathForScope(42 as any, FULL_ENV), undefined);
		assert.strictEqual(getMCPConfigPathForScope({} as any, FULL_ENV), undefined);
	});
});
