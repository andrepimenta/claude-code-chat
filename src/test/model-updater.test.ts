// Unit tests for the model auto-updater resolver.
//
// resolveLatestModels() is pure (no network, no vscode), so these run under
// plain mocha against the compiled out/ output — same pattern as the
// downloader unit tests. Run with `npm run test:models`.

import * as assert from 'assert';
import { resolveLatestModels, providerResolvers } from '../model-updater';
import recommendedModels from '../recommended-models.json';

// Minimal shape the resolver reads off each API model.
function apiModel(id: string, extra: Record<string, any> = {}) {
	return { id, name: id.split('/').pop(), description: 'desc for ' + id, ...extra };
}

// A representative live-API catalogue: each provider has several versions plus
// some near-miss ids (wrong suffix, older version) that must NOT be selected.
function fullApiCatalogue() {
	return [
		// OpenAI — named tiers: terra/sol/luna on the 5.6 line, astra on the 6 line.
		// Every one has a -fast sibling that must never be selected; the old
		// plain/-mini/-codex ids are negative controls that must never win now.
		apiModel('openai/gpt-5.6-terra'),
		apiModel('openai/gpt-5.6-sol'),
		apiModel('openai/gpt-5.6-luna'),
		apiModel('openai/gpt-6-astra'),
		apiModel('openai/gpt-5.6-terra-fast'),
		apiModel('openai/gpt-5.6-sol-fast'),
		apiModel('openai/gpt-5.6-luna-fast'),
		apiModel('openai/gpt-6-astra-fast'),
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

		// Kimi — main tracks the plain line, haiku tracks -code;
		// -fast/-thinking/-turbo/-code-highspeed all ignored
		apiModel('moonshotai/kimi-k2.6'),
		apiModel('moonshotai/kimi-k3'),
		apiModel('moonshotai/kimi-k3-fast'),
		apiModel('moonshotai/kimi-k2-turbo'),
		apiModel('moonshotai/kimi-k2-thinking'),
		apiModel('moonshotai/kimi-k2.7-code'),
		apiModel('moonshotai/kimi-k2.7-code-highspeed'),
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

		assert.strictEqual(byLabel(out, 'GPT').id, 'openai/gpt-5.6-terra');
		assert.strictEqual(byLabel(out, 'Gemini').id, 'google/gemini-3.1-pro-preview');
		assert.strictEqual(byLabel(out, 'MiniMax').id, 'minimax/minimax-m3');
		assert.strictEqual(byLabel(out, 'GLM').id, 'zai/glm-5.2');
		assert.strictEqual(byLabel(out, 'DeepSeek').id, 'deepseek/deepseek-v4-pro');
		assert.strictEqual(byLabel(out, 'Kimi').id, 'moonshotai/kimi-k3');
	});

	test('Kimi: plain line drives sonnet/opus/fable, -code drives haiku', () => {
		const api = fullApiCatalogue();
		const kimi = byLabel(resolveLatestModels(api, recommendedModels as any[]), 'Kimi');

		// Highest plain wins (3 > 2.6) and excludes kimi-k3-fast; haiku takes the
		// highest bare -code id, excluding -code-highspeed.
		assert.strictEqual(kimi.id, 'moonshotai/kimi-k3');
		assert.deepStrictEqual(kimi.tierModels, {
			sonnet: 'moonshotai/kimi-k3',
			opus: 'moonshotai/kimi-k3',
			haiku: 'moonshotai/kimi-k2.7-code',
			fable: 'moonshotai/kimi-k3',
		});
	});

	test('Kimi suffixed variants are never selected', () => {
		// Only suffixed variants exist — the main regex requires the bare
		// kimi-kN id, so nothing matches and the bundled entry is left intact.
		const api = [
			apiModel('moonshotai/kimi-k3.1-code'),
			apiModel('moonshotai/kimi-k3.1-code-highspeed'),
			apiModel('moonshotai/kimi-k3.1-thinking'),
		];
		const kimi = byLabel(resolveLatestModels(api, recommendedModels as any[]), 'Kimi');
		assert.strictEqual(kimi.id, 'moonshotai/kimi-k3'); // unchanged bundled value
		// main matched nothing, so sonnet/opus/fable keep their bundled values —
		// but the haiku resolver runs independently and still finds the -code id.
		assert.deepStrictEqual(kimi.tierModels, {
			sonnet: 'moonshotai/kimi-k3',
			opus: 'moonshotai/kimi-k3',
			haiku: 'moonshotai/kimi-k3.1-code',
			fable: 'moonshotai/kimi-k3',
		});
	});

	test('Kimi transition catalogue: plain drives main, -code drives haiku', () => {
		// The two lines are tracked independently: a newer -code release becomes
		// the haiku tier without dragging main off the plain line.
		const api = [
			apiModel('moonshotai/kimi-k2.6'),
			apiModel('moonshotai/kimi-k2.8-code'),
		];
		const kimi = byLabel(resolveLatestModels(api, recommendedModels as any[]), 'Kimi');
		assert.strictEqual(kimi.id, 'moonshotai/kimi-k2.6');
		assert.deepStrictEqual(kimi.tierModels, {
			sonnet: 'moonshotai/kimi-k2.6',
			opus: 'moonshotai/kimi-k2.6',
			haiku: 'moonshotai/kimi-k2.8-code',
			fable: 'moonshotai/kimi-k2.6',
		});
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

	test('GPT resolves per-tier named models and never a -fast sibling', () => {
		const api = fullApiCatalogue();
		const gpt = byLabel(resolveLatestModels(api, recommendedModels as any[]), 'GPT');
		assert.strictEqual(gpt.id, 'openai/gpt-5.6-terra');
		assert.deepStrictEqual(gpt.tierModels, {
			sonnet: 'openai/gpt-5.6-terra',
			opus: 'openai/gpt-5.6-sol',
			haiku: 'openai/gpt-5.6-luna',
			fable: 'openai/gpt-6-astra',
		});
		for (const id of Object.values(gpt.tierModels as Record<string, string>)) {
			assert.ok(!id.endsWith('-fast'), id + ' must not be a -fast sibling');
			assert.ok(!id.endsWith('-mini'), id + ' must not be a retired -mini id');
		}
	});

	test('GPT fable tracks the gpt-6 astra line without leaking into main', () => {
		// astra sits on a HIGHER version line (6) than the other three (5.6).
		// Versions are only ever compared within a tier, so neither leaks.
		const api = fullApiCatalogue();
		const gpt = byLabel(resolveLatestModels(api, recommendedModels as any[]), 'GPT');
		assert.strictEqual(gpt.tierModels.fable, 'openai/gpt-6-astra');
		assert.strictEqual(gpt.tierModels.sonnet, 'openai/gpt-5.6-terra');
	});

	test('GPT fable degrades to OPUS (not main) when no astra id exists', () => {
		// Capability order is fable > opus > sonnet > haiku, so a missing fable
		// drops one rung to opus rather than two rungs to the main/sonnet id.
		const api = [
			apiModel('openai/gpt-5.6-terra'),
			apiModel('openai/gpt-5.6-sol'),
			apiModel('openai/gpt-5.6-luna'),
		];
		const gpt = byLabel(resolveLatestModels(api, recommendedModels as any[]), 'GPT');
		assert.strictEqual(gpt.tierModels.opus, 'openai/gpt-5.6-sol');
		assert.strictEqual(gpt.tierModels.fable, 'openai/gpt-5.6-sol');
		assert.notStrictEqual(gpt.tierModels.fable, 'openai/gpt-5.6-terra');
	});

	test('a declared tier resolver that matches nothing falls back to main', () => {
		// Guard for the live catalogue as it stands: gemini-*-pro-preview-thinking
		// does not exist, so opus must follow main rather than keep a dead id.
		const api = [
			apiModel('google/gemini-3.1-pro-preview'),
			apiModel('google/gemini-3.8-flash'),
		];
		const gem = byLabel(resolveLatestModels(api, recommendedModels as any[]), 'Gemini');
		assert.strictEqual(gem.tierModels.opus, 'google/gemini-3.1-pro-preview');
		assert.strictEqual(gem.tierModels.haiku, 'google/gemini-3.8-flash');
	});

	test('fable follows opus for every provider with no fable resolver', () => {
		const api = fullApiCatalogue();
		const out = resolveLatestModels(api, recommendedModels as any[]);
		for (const label of ['Gemini', 'MiniMax', 'Kimi', 'GLM', 'DeepSeek']) {
			const m = byLabel(out, label);
			assert.strictEqual(m.tierModels.fable, m.tierModels.opus,
				label + ' fable must degrade to opus');
		}
	});

	test('Gemini fable degrades to the -thinking opus id, not to main', () => {
		// Gemini is the one bundled provider with a distinct opus model, so it is
		// the only place the fable -> opus -> main chain is observable end to end.
		const api = fullApiCatalogue();
		const gem = byLabel(resolveLatestModels(api, recommendedModels as any[]), 'Gemini');
		assert.strictEqual(gem.tierModels.opus, 'google/gemini-3.1-pro-preview-thinking');
		assert.strictEqual(gem.tierModels.fable, 'google/gemini-3.1-pro-preview-thinking');
		assert.strictEqual(gem.tierModels.sonnet, 'google/gemini-3.1-pro-preview');
	});

	test('every bundled entry declares all four tiers as non-empty strings', () => {
		for (const m of recommendedModels as any[]) {
			assert.ok(m.tierModels, m.quickLabel + ' must declare tierModels');
			assert.deepStrictEqual(Object.keys(m.tierModels).sort(),
				['fable', 'haiku', 'opus', 'sonnet'], m.quickLabel + ' tier keys');
			for (const [tier, id] of Object.entries(m.tierModels)) {
				assert.ok(typeof id === 'string' && id.length > 0,
					m.quickLabel + '.' + tier + ' must be a non-empty string');
			}
		}
	});

	test('Gemini main matches a bare -pro id, not just -pro-preview', () => {
		// Google ships both conventions. Requiring -preview would leave us pinned
		// to a stale preview the day a flagship graduates out of it.
		const api = [
			apiModel('google/gemini-3.1-pro-preview'),
			apiModel('google/gemini-4-pro'),
			apiModel('google/gemini-4-pro-image'),   // must never be selected
			apiModel('google/gemini-3.8-flash'),
		];
		const gem = byLabel(resolveLatestModels(api, recommendedModels as any[]), 'Gemini');
		assert.strictEqual(gem.id, 'google/gemini-4-pro');
		assert.strictEqual(gem.tierModels.sonnet, 'google/gemini-4-pro');
		assert.strictEqual(gem.tierModels.haiku, 'google/gemini-3.8-flash');
	});

	test('a flagship >100d older than its own fast tier is replaced by it', () => {
		// Staleness policy: the provider shipped its fast line repeatedly while the
		// capable line stood still, so the "flagship" is no longer the better model.
		const DAY = 86400, now = Math.floor(Date.now() / 1000);
		const api = [
			{ ...apiModel('google/gemini-3.1-pro-preview'), released: now - 210 * DAY },
			{ ...apiModel('google/gemini-3.8-flash'), released: now - 15 * DAY },
		];
		const gem = byLabel(resolveLatestModels(api, recommendedModels as any[]), 'Gemini');
		assert.strictEqual(gem.tierModels.sonnet, 'google/gemini-3.8-flash');
		assert.strictEqual(gem.tierModels.opus, 'google/gemini-3.8-flash');
		assert.strictEqual(gem.tierModels.fable, 'google/gemini-3.8-flash');
		// b.id must track sonnet or the webview can never mark the card selected.
		assert.strictEqual(gem.id, 'google/gemini-3.8-flash');
	});

	test('a flagship within the threshold keeps the flagship', () => {
		const DAY = 86400, now = Math.floor(Date.now() / 1000);
		const api = [
			{ ...apiModel('google/gemini-3.1-pro-preview'), released: now - 99 * DAY },
			{ ...apiModel('google/gemini-3.8-flash'), released: now - 10 * DAY },
		];
		const gem = byLabel(resolveLatestModels(api, recommendedModels as any[]), 'Gemini');
		assert.strictEqual(gem.tierModels.sonnet, 'google/gemini-3.1-pro-preview');
		assert.strictEqual(gem.tierModels.haiku, 'google/gemini-3.8-flash');
	});

	test('missing release dates never trigger a promotion', () => {
		// Absent metadata must not silently retarget a provider.
		const api = [
			apiModel('google/gemini-3.1-pro-preview'),
			apiModel('google/gemini-3.8-flash'),
		];
		const gem = byLabel(resolveLatestModels(api, recommendedModels as any[]), 'Gemini');
		assert.strictEqual(gem.tierModels.sonnet, 'google/gemini-3.1-pro-preview');
	});

	test('promotion leaves a tier that has its own fresh model alone', () => {
		// GPT fable resolves astra independently; a stale-flagship promotion must
		// not clobber a tier that did not follow the flagship.
		const DAY = 86400, now = Math.floor(Date.now() / 1000);
		const api = [
			{ ...apiModel('openai/gpt-5.6-terra'), released: now - 300 * DAY },
			{ ...apiModel('openai/gpt-5.6-luna'), released: now - 5 * DAY },
			{ ...apiModel('openai/gpt-6-astra'), released: now - 2 * DAY },
		];
		const gpt = byLabel(resolveLatestModels(api, recommendedModels as any[]), 'GPT');
		assert.strictEqual(gpt.tierModels.sonnet, 'openai/gpt-5.6-luna'); // promoted
		assert.strictEqual(gpt.tierModels.fable, 'openai/gpt-6-astra');   // untouched
	});

	test('the card is labelled from opus while id keeps tracking sonnet', () => {
		// Display and identity are deliberately decoupled: the webview matches
		// b.id against ANTHROPIC_DEFAULT_SONNET_MODEL, so b.id must stay on the
		// sonnet tier even though the visible name comes from opus.
		const api = fullApiCatalogue();
		const gpt = byLabel(resolveLatestModels(api, recommendedModels as any[]), 'GPT');
		assert.strictEqual(gpt.id, gpt.tierModels.sonnet, 'id must equal the sonnet tier');
		assert.strictEqual(gpt.id, 'openai/gpt-5.6-terra');
		assert.strictEqual(gpt.name, 'gpt-5.6-sol', 'name must come from the opus tier');
	});

	test('every provider keeps id === sonnet after all rewrites', () => {
		// Guards the invariant against the staleness promotion and the opus
		// relabel, both of which mutate the entry after the main resolve.
		const api = fullApiCatalogue();
		for (const m of resolveLatestModels(api, recommendedModels as any[]) as any[]) {
			assert.strictEqual(m.id, m.tierModels.sonnet,
				m.quickLabel + ': id must equal its sonnet tier');
		}
	});

	test('equal versions tie-break on release date, not gateway array order', () => {
		// A graduating preview puts two ids on the same captured version. Without
		// a tie-break the winner is whichever the gateway serialised first.
		const DAY = 86400, now = Math.floor(Date.now() / 1000);
		const stable = { ...apiModel('google/gemini-4-pro'), released: now - 5 * DAY };
		const preview = { ...apiModel('google/gemini-4-pro-preview'), released: now - 90 * DAY };
		const a = byLabel(resolveLatestModels([preview, stable], recommendedModels as any[]), 'Gemini');
		const b = byLabel(resolveLatestModels([stable, preview], recommendedModels as any[]), 'Gemini');
		assert.strictEqual(a.id, 'google/gemini-4-pro');
		assert.strictEqual(b.id, 'google/gemini-4-pro', 'must not depend on array order');
	});

	test('equal versions with no dates tie-break on the shorter id', () => {
		// No release metadata: prefer the bare id over a -preview/-thinking spin,
		// and stay deterministic in either ordering.
		const stable = apiModel('google/gemini-4-pro');
		const preview = apiModel('google/gemini-4-pro-preview');
		const a = byLabel(resolveLatestModels([preview, stable], recommendedModels as any[]), 'Gemini');
		const b = byLabel(resolveLatestModels([stable, preview], recommendedModels as any[]), 'Gemini');
		assert.strictEqual(a.id, 'google/gemini-4-pro');
		assert.strictEqual(b.id, 'google/gemini-4-pro');
	});

	test('live metadata is read from context_window / max_tokens', () => {
		// The gateway uses these names; reading only the legacy ones meant the
		// bundled numbers were all users ever saw.
		const api = [{ ...apiModel('zai/glm-9'), context_window: 777000, max_tokens: 88000 }];
		const glm = byLabel(resolveLatestModels(api, recommendedModels as any[]), 'GLM');
		assert.strictEqual(glm.id, 'zai/glm-9');
		assert.strictEqual(glm.context_length, 777000);
		assert.strictEqual(glm.max_output_tokens, 88000);
	});

	test('a zero context_window falls back to the bundled value', () => {
		// Non-text catalogue entries carry 0; adopting it would render "0 tokens".
		const bundledGlm = (recommendedModels as any[]).find(m => m.quickLabel === 'GLM');
		const api = [{ ...apiModel('zai/glm-9'), context_window: 0, max_tokens: 0 }];
		const glm = byLabel(resolveLatestModels(api, recommendedModels as any[]), 'GLM');
		assert.strictEqual(glm.context_length, bundledGlm.context_length);
		assert.strictEqual(glm.max_output_tokens, bundledGlm.max_output_tokens);
	});

	test('haiku keeps its cheap id when the fast resolver misses but the id is live', () => {
		// The fast line moved (regex matches nothing) but the bundled cheap model is
		// still served. Falling back to main here would promote the flagship into the
		// background-traffic slot for no reason — Kimi 1.5 -> 5.6 credits per call.
		const api = [
			apiModel('moonshotai/kimi-k3'),
			apiModel('moonshotai/kimi-k2.7-code')  // still in the catalogue, just unmatched
		];
		const kimi = byLabel(resolveLatestModels(api, recommendedModels as any[]), 'Kimi');
		assert.strictEqual(kimi.tierModels.sonnet, 'moonshotai/kimi-k3');
		assert.strictEqual(kimi.tierModels.haiku, 'moonshotai/kimi-k2.7-code');
		assert.notStrictEqual(kimi.tierModels.haiku, kimi.tierModels.sonnet);
	});

	test('haiku falls back to main when its cheap id is genuinely dead', () => {
		// Working beats cheap: these calls include compaction, so a 404 degrades the
		// product itself. A pricier tier that works is the better failure.
		const api = [apiModel('moonshotai/kimi-k3')];   // -code line gone entirely
		const kimi = byLabel(resolveLatestModels(api, recommendedModels as any[]), 'Kimi');
		assert.strictEqual(kimi.tierModels.haiku, 'moonshotai/kimi-k3',
			'a dead cheap id must fall back to a working model');
	});

	test('a provider with NO haiku resolver still follows main', () => {
		// The counterpart: MiniMax declares no fast tier, so main IS its cheap tier.
		// The fix above must not break this.
		const api = [apiModel('minimax/minimax-m9')];
		const mm = byLabel(resolveLatestModels(api, recommendedModels as any[]), 'MiniMax');
		assert.strictEqual(mm.tierModels.sonnet, 'minimax/minimax-m9');
		assert.strictEqual(mm.tierModels.haiku, 'minimax/minimax-m9');
	});

	test('every bundled tier id is reachable by one of its provider resolvers', () => {
		// An id no resolver can produce is a dead pin: the entry keeps it forever and
		// silently stops tracking new releases, with no signal anywhere.
		for (const m of recommendedModels as any[]) {
			const prefix = Object.keys(providerResolvers)
				.find(p => m.id.toLowerCase().startsWith(p));
			assert.ok(prefix, m.quickLabel + ': no resolver prefix matches ' + m.id);
			const r = (providerResolvers as any)[prefix as string];
			const patterns = [r.main, r.opus, r.haiku, r.fable].filter(Boolean) as RegExp[];
			for (const [tier, id] of Object.entries(m.tierModels as Record<string, string>)) {
				assert.ok(patterns.some(p => p.test(id)),
					`${m.quickLabel}.${tier} = ${id} is matched by no resolver of ${prefix}`);
			}
		}
	});

	test('Gemini and DeepSeek flagships come from promotion, not from main', () => {
		// Documents a real coupling rather than leaving it implicit: both are bundled
		// on their FLASH line, which their own `main` regex (-pro) cannot produce.
		// Online they reach it via the staleness promotion; offline the bundled value
		// stands. If their -pro line ever disappears entirely, mainMatch goes null and
		// these three tiers stop advancing — they keep a live id, but a frozen one.
		for (const label of ['Gemini', 'DeepSeek']) {
			const m = (recommendedModels as any[]).find(x => x.quickLabel === label);
			const prefix = Object.keys(providerResolvers)
				.find(p => m.id.toLowerCase().startsWith(p)) as string;
			const r = (providerResolvers as any)[prefix];
			assert.strictEqual(r.main.test(m.tierModels.sonnet), false,
				label + ': sonnet is deliberately NOT on the main line');
			assert.strictEqual(r.haiku.test(m.tierModels.sonnet), true,
				label + ': sonnet sits on the fast line it was promoted to');
		}
	});

	test('the $ anchors are load-bearing: a HIGHER-versioned variant never wins', () => {
		// Falsifiability guard. Earlier anchor tests used same-version siblings
		// (gpt-5.6-terra vs gpt-5.6-terra-fast), so the shorter-id tie-break picked
		// the right one even with the anchors stripped — the assertions could not
		// fail. These variants carry a HIGHER version, so without `$` each one wins
		// outright and the corresponding assertion breaks.
		const api = [
			apiModel('openai/gpt-5.6-terra'), apiModel('openai/gpt-9-terra-fast'),
			apiModel('openai/gpt-5.6-sol'), apiModel('openai/gpt-9-sol-fast'),
			apiModel('openai/gpt-5.6-luna'), apiModel('openai/gpt-9-luna-fast'),
			apiModel('openai/gpt-6-astra'), apiModel('openai/gpt-9-astra-fast'),
			apiModel('moonshotai/kimi-k3'), apiModel('moonshotai/kimi-k9-fast'),
			apiModel('moonshotai/kimi-k2.7-code'), apiModel('moonshotai/kimi-k9-code-highspeed'),
			apiModel('zai/glm-5.3'), apiModel('zai/glm-9-turbo'),
			apiModel('zai/glm-5.3-flash'), apiModel('zai/GLM-9-Flash-preview'),
			apiModel('google/gemini-4-pro'), apiModel('google/gemini-9-pro-image'),
			apiModel('google/gemini-3.8-flash'), apiModel('google/gemini-9-flash-lite'),
			apiModel('deepseek/deepseek-v4-pro'), apiModel('deepseek/deepseek-v9-pro-0813'),
			apiModel('deepseek/deepseek-v4.1-flash'), apiModel('deepseek/deepseek-v9-flash-vision-exp'),
			apiModel('minimax/minimax-m3'), apiModel('minimax/minimax-m9-highspeed'),
		];
		const out = resolveLatestModels(api, recommendedModels as any[]) as any[];
		const t = (label: string) => byLabel(out, label).tierModels;

		assert.strictEqual(t('GPT').sonnet, 'openai/gpt-5.6-terra');
		assert.strictEqual(t('GPT').opus, 'openai/gpt-5.6-sol');
		assert.strictEqual(t('GPT').haiku, 'openai/gpt-5.6-luna');
		assert.strictEqual(t('GPT').fable, 'openai/gpt-6-astra');
		assert.strictEqual(t('Kimi').sonnet, 'moonshotai/kimi-k3');
		assert.strictEqual(t('Kimi').haiku, 'moonshotai/kimi-k2.7-code');
		assert.strictEqual(t('GLM').sonnet, 'zai/glm-5.3');
		assert.strictEqual(t('GLM').haiku, 'zai/glm-5.3-flash');
		assert.strictEqual(t('Gemini').sonnet, 'google/gemini-4-pro');
		assert.strictEqual(t('Gemini').haiku, 'google/gemini-3.8-flash');
		assert.strictEqual(t('DeepSeek').sonnet, 'deepseek/deepseek-v4-pro');
		assert.strictEqual(t('DeepSeek').haiku, 'deepseek/deepseek-v4.1-flash');
		assert.strictEqual(t('MiniMax').sonnet, 'minimax/minimax-m3');

		// Nothing resolved anywhere may be a version-9 decoy.
		for (const m of out) {
			for (const id of Object.values(m.tierModels as Record<string, string>)) {
				assert.ok(!/-9|v9|k9|m9|GLM-9/i.test(id), m.quickLabel + ' selected a decoy: ' + id);
			}
		}
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
