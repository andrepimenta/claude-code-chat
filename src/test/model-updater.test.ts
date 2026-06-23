// Unit tests for the model auto-updater resolver.
//
// resolveLatestModels() is pure (no network, no vscode), so these run under
// plain mocha against the compiled out/ output — same pattern as the
// downloader unit tests. Run with `npm run test:models`.

import * as assert from 'assert';
import { resolveLatestModels } from '../model-updater';
import recommendedModels from '../recommended-models.json';

// Minimal shape the resolver reads off each API model.
function apiModel(id: string, extra: Record<string, any> = {}) {
	return { id, name: id.split('/').pop(), description: 'desc for ' + id, ...extra };
}

// A representative live-API catalogue: each provider has several versions plus
// some near-miss ids (wrong suffix, older version) that must NOT be selected.
function fullApiCatalogue() {
	return [
		// OpenAI — main: highest gpt-X, haiku: highest gpt-X-mini
		apiModel('openai/gpt-5.4'),
		apiModel('openai/gpt-5.5'),
		apiModel('openai/gpt-5.4-mini'),
		apiModel('openai/gpt-5.5-mini'),
		apiModel('openai/gpt-5.5-codex'), // must be ignored (codex suffix)

		// Gemini — main: pro-preview, opus: pro-preview-thinking, haiku: flash
		apiModel('google/gemini-3-pro-preview'),
		apiModel('google/gemini-3.1-pro-preview'),
		apiModel('google/gemini-3.1-pro-preview-thinking'),
		apiModel('google/gemini-3-flash'),
		apiModel('google/gemini-3.1-flash'),

		// DeepSeek — main: highest -pro, haiku: highest -flash
		apiModel('deepseek/deepseek-v3.2-pro'),
		apiModel('deepseek/deepseek-v4-pro'),
		apiModel('deepseek/deepseek-v4-flash'),
		apiModel('deepseek/deepseek-v4-thinking'), // ignored

		// MiniMax — main only
		apiModel('minimax/minimax-m2.7'),
		apiModel('minimax/minimax-m3'),

		// GLM — main: glm-N(.N), haiku: GLM-N-Air/Flash (case-insensitive)
		apiModel('zai/glm-5'),
		apiModel('zai/glm-5.2'),
		apiModel('zai/GLM-4.7-Flash'),

		// Kimi — main+haiku track the -code line; highspeed/plain/turbo ignored
		apiModel('moonshotai/kimi-k2.6'),
		apiModel('moonshotai/kimi-k2-turbo'),
		apiModel('moonshotai/kimi-k2.7-code'),
		apiModel('moonshotai/kimi-k2.7-code-highspeed'),
		apiModel('moonshotai/kimi-k2.8-code'),
	];
}

function byLabel(models: any[], quickLabel: string) {
	const m = models.find(x => x.quickLabel === quickLabel);
	assert.ok(m, 'expected a bundled model with quickLabel ' + quickLabel);
	return m;
}

suite('model-updater: resolveLatestModels', () => {

	test('resolves every bundled provider to its highest matching version', () => {
		const api = fullApiCatalogue();
		const out = resolveLatestModels(api, recommendedModels as any[]);

		assert.strictEqual(byLabel(out, 'GPT').id, 'openai/gpt-5.5');
		assert.strictEqual(byLabel(out, 'Gemini').id, 'google/gemini-3.1-pro-preview');
		assert.strictEqual(byLabel(out, 'MiniMax').id, 'minimax/minimax-m3');
		assert.strictEqual(byLabel(out, 'GLM').id, 'zai/glm-5.2');
		assert.strictEqual(byLabel(out, 'DeepSeek').id, 'deepseek/deepseek-v4-pro');
		assert.strictEqual(byLabel(out, 'Kimi').id, 'moonshotai/kimi-k2.8-code');
	});

	test('Kimi tracks the -code line across ALL tiers and ignores near-misses', () => {
		const api = fullApiCatalogue();
		const kimi = byLabel(resolveLatestModels(api, recommendedModels as any[]), 'Kimi');

		// Highest -code wins (2.8 > 2.7), not the plain, turbo, or highspeed ids.
		assert.strictEqual(kimi.id, 'moonshotai/kimi-k2.8-code');
		assert.deepStrictEqual(kimi.tierModels, {
			sonnet: 'moonshotai/kimi-k2.8-code',
			opus: 'moonshotai/kimi-k2.8-code',
			haiku: 'moonshotai/kimi-k2.8-code',
		});
	});

	test('Kimi -code-highspeed variant is never selected', () => {
		// Only the highspeed variant exists — main/haiku regex require a bare
		// -code suffix, so nothing matches and the bundled entry is left intact.
		const api = [apiModel('moonshotai/kimi-k2.9-code-highspeed')];
		const kimi = byLabel(resolveLatestModels(api, recommendedModels as any[]), 'Kimi');
		assert.ok(!kimi.id.includes('highspeed'), 'highspeed must not be selected');
		assert.strictEqual(kimi.id, 'moonshotai/kimi-k2.7-code'); // unchanged bundled value
	});

	test('Gemini opus tier uses the -thinking variant, sonnet/haiku do not', () => {
		const api = fullApiCatalogue();
		const gem = byLabel(resolveLatestModels(api, recommendedModels as any[]), 'Gemini');
		assert.strictEqual(gem.tierModels.sonnet, 'google/gemini-3.1-pro-preview');
		assert.strictEqual(gem.tierModels.opus, 'google/gemini-3.1-pro-preview-thinking');
		assert.strictEqual(gem.tierModels.haiku, 'google/gemini-3.1-flash');
	});

	test('opus falls back to main when the provider has no opus resolver (GLM)', () => {
		const api = fullApiCatalogue();
		const glm = byLabel(resolveLatestModels(api, recommendedModels as any[]), 'GLM');
		assert.strictEqual(glm.tierModels.sonnet, 'zai/glm-5.2');
		assert.strictEqual(glm.tierModels.opus, 'zai/glm-5.2');
		assert.strictEqual(glm.tierModels.haiku, 'zai/GLM-4.7-Flash');
	});

	test('DeepSeek resolves -pro for main and -flash for haiku, ignoring -thinking', () => {
		const api = fullApiCatalogue();
		const ds = byLabel(resolveLatestModels(api, recommendedModels as any[]), 'DeepSeek');
		assert.strictEqual(ds.id, 'deepseek/deepseek-v4-pro');
		assert.strictEqual(ds.tierModels.sonnet, 'deepseek/deepseek-v4-pro');
		assert.strictEqual(ds.tierModels.opus, 'deepseek/deepseek-v4-pro');
		assert.strictEqual(ds.tierModels.haiku, 'deepseek/deepseek-v4-flash');
	});

	test('GPT haiku tier resolves the highest -mini and ignores -codex', () => {
		const api = fullApiCatalogue();
		const gpt = byLabel(resolveLatestModels(api, recommendedModels as any[]), 'GPT');
		assert.strictEqual(gpt.id, 'openai/gpt-5.5');
		assert.strictEqual(gpt.tierModels.haiku, 'openai/gpt-5.5-mini');
	});

	test('an unmatched/empty catalogue leaves bundled models untouched', () => {
		const out = resolveLatestModels([], recommendedModels as any[]);
		for (let i = 0; i < recommendedModels.length; i++) {
			assert.deepStrictEqual(out[i], (recommendedModels as any[])[i]);
		}
	});

	test('does not mutate the input bundled array', () => {
		const before = JSON.stringify(recommendedModels);
		resolveLatestModels(fullApiCatalogue(), recommendedModels as any[]);
		assert.strictEqual(JSON.stringify(recommendedModels), before);
	});

	test('version comparison is numeric, not lexicographic (10 > 9)', () => {
		const api = [
			apiModel('minimax/minimax-m9'),
			apiModel('minimax/minimax-m10'),
		];
		const mm = byLabel(resolveLatestModels(api, recommendedModels as any[]), 'MiniMax');
		assert.strictEqual(mm.id, 'minimax/minimax-m10');
	});
});
