// Tier 1 integration tests: these run INSIDE a real VS Code extension host via
// @vscode/test-electron, so `vscode` is the genuine API — real activation, real
// command registry, real settings storage. That is the point: everything here
// asserts against behaviour the unit suites can only simulate.
//
// NOTE ON SAFETY: the extension writes its env vars to ConfigurationTarget.Global,
// i.e. the developer's own settings.json. Every test that writes snapshots the
// prior value and restores it in a finally block.

import * as assert from 'assert';
import * as vscode from 'vscode';
import { TIER_NAMES, TIER_ENV_KEYS } from '../model-updater';

const EXT_ID = 'AndrePimenta.claude-code-chat';
const SECTION = 'claudeCodeChat';
const ENV_KEY = 'environment.variables';

/** Run `fn` with the env-var setting restored afterwards, whatever happens. */
async function withRestoredEnvVars(fn: () => Promise<void>): Promise<void> {
	const config = () => vscode.workspace.getConfiguration(SECTION);
	const before = config().get<Record<string, string>>(ENV_KEY, {});
	try {
		await fn();
	} finally {
		await config().update(ENV_KEY, before, vscode.ConfigurationTarget.Global);
	}
}

suite('extension: activation and contributions', () => {

	test('the extension is present and activates', async () => {
		const ext = vscode.extensions.getExtension(EXT_ID);
		assert.ok(ext, `extension ${EXT_ID} not found`);
		await ext!.activate();
		assert.strictEqual(ext!.isActive, true);
	});

	test('both commands are registered, not just the declared one', async () => {
		const ext = vscode.extensions.getExtension(EXT_ID);
		await ext!.activate();
		const commands = await vscode.commands.getCommands(true);
		// openChat is declared in package.json; loadConversation is registered in
		// code only (invoked programmatically, deliberately absent from the palette).
		for (const id of ['claude-code-chat.openChat', 'claude-code-chat.loadConversation']) {
			assert.ok(commands.includes(id), id + ' is not registered');
		}
	});

	test('every declared setting is readable with its manifest default', async () => {
		// Catches a default drifting between package.json and the code that reads it.
		const ext = vscode.extensions.getExtension(EXT_ID);
		const declared = ext!.packageJSON.contributes.configuration.properties as
			Record<string, { default: unknown }>;
		const config = vscode.workspace.getConfiguration();
		for (const [key, schema] of Object.entries(declared)) {
			const inspected = config.inspect(key);
			assert.ok(inspected, key + ' is not a known setting');
			assert.deepStrictEqual(inspected!.defaultValue, schema.default,
				key + ': manifest default and effective default disagree');
		}
	});
});

suite('extension: tier env vars against real settings storage', () => {

	test('updating an object setting REPLACES it — the removal path depends on this', async () => {
		// _removeModelEnvVars builds a filtered copy and writes it whole. If VS Code
		// merged objects instead of replacing them, removal would silently no-op and
		// a stale tier var would outlive its selection. Nothing has ever verified it.
		await withRestoredEnvVars(async () => {
			const config = () => vscode.workspace.getConfiguration(SECTION);
			await config().update(ENV_KEY,
				{ A: '1', B: '2' }, vscode.ConfigurationTarget.Global);
			assert.deepStrictEqual(config().get(ENV_KEY), { A: '1', B: '2' });

			await config().update(ENV_KEY, { A: '1' }, vscode.ConfigurationTarget.Global);
			assert.deepStrictEqual(config().get(ENV_KEY), { A: '1' },
				'B survived — settings merge rather than replace, so removal cannot work');
		});
	});

	test('the TIER_ENV_KEYS filter clears every tier var and nothing else', async () => {
		// The exact filter from _removeModelEnvVars, run against real storage.
		await withRestoredEnvVars(async () => {
			const config = () => vscode.workspace.getConfiguration(SECTION);
			const seeded: Record<string, string> = {
				ANTHROPIC_BASE_URL: 'https://example.invalid',
				MY_OWN_VAR: 'keep me'
			};
			for (const key of TIER_ENV_KEYS) { seeded[key] = 'some/model'; }
			await config().update(ENV_KEY, seeded, vscode.ConfigurationTarget.Global);

			const stored = config().get<Record<string, string>>(ENV_KEY, {});
			const filtered: Record<string, string> = {};
			for (const [k, v] of Object.entries(stored)) {
				if (!TIER_ENV_KEYS.includes(k)) { filtered[k] = v; }
			}
			await config().update(ENV_KEY, filtered, vscode.ConfigurationTarget.Global);

			const after = config().get<Record<string, string>>(ENV_KEY, {});
			for (const key of TIER_ENV_KEYS) {
				assert.ok(!(key in after), key + ' survived removal');
			}
			assert.strictEqual(after.ANTHROPIC_BASE_URL, 'https://example.invalid');
			assert.strictEqual(after.MY_OWN_VAR, 'keep me');
		});
	});

	test('TIER_ENV_KEYS covers one key per tier, in capability order', async () => {
		assert.strictEqual(TIER_ENV_KEYS.length, TIER_NAMES.length);
		assert.deepStrictEqual(TIER_ENV_KEYS, [
			'ANTHROPIC_DEFAULT_FABLE_MODEL',
			'ANTHROPIC_DEFAULT_OPUS_MODEL',
			'ANTHROPIC_DEFAULT_SONNET_MODEL',
			'ANTHROPIC_DEFAULT_HAIKU_MODEL'
		]);
	});
});
