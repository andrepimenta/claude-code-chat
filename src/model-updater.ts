interface ApiModel {
	id: string;
	name?: string;
	/** Unix seconds. Present on ~all catalogue entries; used by the staleness policy. */
	released?: number;
	description?: string;
	pricing?: { prompt: number; completion: number; currency?: string; unit?: string };
	/**
	 * The gateway returns `context_window` / `max_tokens`. The older
	 * `context_length` / `max_output_tokens` names are kept as fallbacks because
	 * the bundled catalogue and some callers still use them; reading only the old
	 * names meant live metadata was silently never applied.
	 */
	context_window?: number;
	max_tokens?: number;
	context_length?: number;
	max_output_tokens?: number;
	[key: string]: any;
}

interface BundledModel {
	id: string;
	name: string;
	description?: string;
	provider: string;
	quickLabel?: string;
	context_length?: number;
	max_output_tokens?: number;
	tierModels?: TierModels;
	[key: string]: any;
}

// The tier vocabulary, in capability order: fable is the most capable tier,
// then opus, then sonnet, then haiku. Everything that names a tier — the bundled
// catalogue, the resolver, the env vars, the router config — derives from this
// one list so the set and remove paths can never drift apart.
export const TIER_NAMES = ['fable', 'opus', 'sonnet', 'haiku'] as const;
export type TierName = typeof TIER_NAMES[number];
export type TierModels = Record<TierName, string>;
export const TIER_ENV_KEYS: string[] =
	TIER_NAMES.map(t => `ANTHROPIC_DEFAULT_${t.toUpperCase()}_MODEL`);

// Staleness policy. A flagship this many days older than the provider's OWN fast
// tier is no longer the better model: the provider has shipped its fast line
// repeatedly while its capable line stood still. Past the threshold we stop
// preferring the flagship. Keep in sync with build/check-models.js.
export const STALE_FLAGSHIP_DAYS = 100;

interface ProviderResolver {
	main: RegExp;
	opus?: RegExp;
	haiku?: RegExp;
	fable?: RegExp;
}

function parseVersion(ver: string): number[] {
	return ver.split('.').map(Number);
}

function compareVersions(a: string, b: string): number {
	const va = parseVersion(a);
	const vb = parseVersion(b);
	for (let i = 0; i < Math.max(va.length, vb.length); i++) {
		const na = va[i] || 0;
		const nb = vb[i] || 0;
		if (na !== nb) { return na - nb; }
	}
	return 0;
}

function findHighestMatch(apiModels: ApiModel[], regex: RegExp): ApiModel | null {
	let best: ApiModel | null = null;
	let bestVer: string | null = null;
	for (const m of apiModels) {
		const match = regex.exec(m.id);
		if (!match) { continue; }
		const ver = match[1] || '0';
		if (!best || !bestVer) { bestVer = ver; best = m; continue; }
		const cmp = compareVersions(ver, bestVer);
		if (cmp > 0) { bestVer = ver; best = m; continue; }
		if (cmp < 0) { continue; }
		// Same captured version, different ids — e.g. `gemini-4-pro` alongside
		// `gemini-4-pro-preview` while a flagship graduates. Without an explicit
		// rule the winner is whichever the gateway happened to serialise first,
		// so the same code could resolve differently between fetches. Prefer the
		// newer release; failing that the shorter id (the stable build, not the
		// -preview/-thinking spin); failing that lexicographic, so the result is
		// always deterministic.
		const a = m.released || 0, b = best.released || 0;
		if (a !== b) { if (a > b) { bestVer = ver; best = m; } continue; }
		if (m.id.length !== best.id.length) {
			if (m.id.length < best.id.length) { bestVer = ver; best = m; }
			continue;
		}
		if (m.id < best.id) { bestVer = ver; best = m; }
	}
	return best;
}

/**
 * Exported for tests: a bundled tier id that no resolver of its own provider can
 * produce is unreachable, and the entry will silently stop tracking releases.
 */
export const providerResolvers: Record<string, ProviderResolver> = {
	'zai/glm-': {
		main: /^zai\/glm-(\d+(?:\.\d+)?)$/,
		haiku: /^zai\/GLM-([\d.]+)-(?:Air|Flash)$/i
	},
	'openai/gpt-': {
		// GPT now ships named tiers instead of a plain/-mini split. Every one of
		// these ids has a `-fast` sibling in the catalogue, so each pattern is
		// anchored with `$` to exclude it. `fable` deliberately tracks a DIFFERENT
		// version line (gpt-6-astra) from the other three (gpt-5.6-*); the version
		// captured per tier is only ever compared against ids of that same tier.
		main: /^openai\/gpt-([\d.]+)-terra$/,
		opus: /^openai\/gpt-([\d.]+)-sol$/,
		haiku: /^openai\/gpt-([\d.]+)-luna$/,
		fable: /^openai\/gpt-([\d.]+)-astra$/
	},
	'google/gemini-': {
		// Match a bare `-pro` as well as `-pro-preview`: Google ships both
		// conventions (gemini-2.5-pro is stable, gemini-3.1-pro-preview is not),
		// so requiring `-preview` would silently pin us to a stale preview the day
		// a flagship graduates or a new `-pro` lands. `$` still excludes
		// -pro-image and the -pro-preview-thinking opus variant.
		main: /^(?:google\/)?gemini-([\d.]+)-pro(?:-preview)?$/,
		opus: /^(?:google\/)?gemini-([\d.]+)-pro-preview-thinking$/,
		haiku: /^(?:google\/)?gemini-([\d.]+)-flash(?:-preview)?$/
	},
	'deepseek/deepseek-': {
		main: /^deepseek\/deepseek-v([\d.]+)-pro$/,
		haiku: /^deepseek\/deepseek-v([\d.]+)-flash$/
	},
	'minimax/minimax-': {
		main: /^minimax\/minimax-m([\d.]+)$/
	},
	'moonshotai/kimi-': {
		// Plain line (kimi-k3, kimi-k3.1, …) drives main/sonnet/opus/fable. The `$`
		// excludes kimi-k3-fast and the -thinking / -turbo variants.
		main: /^moonshotai\/kimi-k([\d.]+)$/,
		// The fast/cheap tier tracks the -code line. The `$` excludes
		// kimi-k2.7-code-highspeed.
		haiku: /^moonshotai\/kimi-k([\d.]+)-code$/
	}
};

export function resolveLatestModels(apiModels: ApiModel[], bundledModels: BundledModel[]): BundledModel[] {
	// One index for the whole pass: the per-entry lookups below are exact-id, and
	// scanning the full catalogue for each of them is wasted work on the activation path.
	const byId = new Map(apiModels.map(m => [m.id, m]));
	return bundledModels.map(bundled => {
		const b: BundledModel = JSON.parse(JSON.stringify(bundled));

		let resolver: ProviderResolver | null = null;
		for (const prefix of Object.keys(providerResolvers)) {
			if (b.id.toLowerCase().startsWith(prefix)) {
				resolver = providerResolvers[prefix];
				break;
			}
		}
		if (!resolver) { return b; }

		// Tiers that may declare their own resolver, resolved in this order so that
		// each can fall back to the next-best tier already settled above it.
		// Capability order is fable > opus > sonnet(main) > haiku, so a missing
		// fable degrades to opus rather than dropping two rungs to sonnet.
		// A tier falls back when the provider declares no resolver for it, OR
		// declares one whose target is not in the catalogue yet — shipping an id
		// the gateway does not serve breaks that tier outright, silently.
		const RESOLVED_TIERS: Array<'opus' | 'haiku' | 'fable'> = ['opus', 'haiku', 'fable'];

		// Resolve main (sonnet-tier) model
		const mainMatch = findHighestMatch(apiModels, resolver.main);
		if (mainMatch) {
			b.id = mainMatch.id;
			b.name = mainMatch.name || b.name;
			b.description = mainMatch.description || b.description;
			// `||` not `??` on purpose: the catalogue carries 0 for non-text models,
			// and 0 must fall through to the bundled value rather than be adopted.
			b.context_length = mainMatch.context_window || mainMatch.context_length || b.context_length;
			b.max_output_tokens = mainMatch.max_tokens || mainMatch.max_output_tokens || b.max_output_tokens;
			if (b.tierModels) {
				b.tierModels.sonnet = mainMatch.id;
			}
		}

		// Resolve the remaining tiers.
		if (b.tierModels) {
			for (const tier of RESOLVED_TIERS) {
				const tierRegex = resolver[tier];
				const tierMatch = tierRegex ? findHighestMatch(apiModels, tierRegex) : null;
				if (tierMatch) {
					b.tierModels[tier] = tierMatch.id;
					continue;
				}
				// Only degrade once the provider actually resolved — otherwise an
				// unmatched catalogue would rewrite bundled values it must leave alone.
				if (!mainMatch) { continue; }

				// Degradation must always move DOWN the capability order, never up.
				if (tier === 'fable' && b.tierModels.opus) {
					// fable outranks opus, so it drops one rung rather than two.
					b.tierModels.fable = b.tierModels.opus;
				} else if (tier === 'haiku' && tierRegex && byId.has(b.tierModels.haiku)) {
					// haiku is the CHEAPEST tier and nothing sits below it, so falling back
					// to main would PROMOTE the flagship into the slot Claude Code uses for
					// its background traffic — titles, summaries, compaction (Kimi: 1.5 ->
					// 5.6 credits per call). The provider's fast resolver matched nothing,
					// meaning its fast line moved, but the bundled fast id is still served
					// by the gateway — so keep it and avoid the needless cost.
					//
					// If that id is ALSO gone we deliberately fall through to main below:
					// a working-but-pricier tier beats a 404, because these calls include
					// compaction and losing them degrades the product, not just the bill.
					continue;
				} else {
					b.tierModels[tier] = mainMatch.id;
				}
			}
		}

		// Staleness policy — see STALE_FLAGSHIP_DAYS. If the fast (haiku) model is
		// far newer than the flagship, promote it into every tier that was still
		// following the stale flagship. Tiers with their own fresh resolution (e.g.
		// a distinct opus/fable model) are left alone. Skipped when either release
		// date is missing, so absent metadata never silently retargets a provider.
		if (b.tierModels && mainMatch) {
			const fast = byId.get((b.tierModels as TierModels).haiku);
			const flagshipAt = mainMatch.released;
			const fastAt = fast && fast.released;
			if (fast && flagshipAt && fastAt &&
				(fastAt - flagshipAt) > STALE_FLAGSHIP_DAYS * 86400) {
				for (const tier of ['sonnet', 'opus', 'fable'] as const) {
					if (b.tierModels[tier] === mainMatch.id) {
						b.tierModels[tier] = fast.id;
					}
				}
				// b.id must stay equal to the sonnet tier — the webview uses it as the
				// canonical identity of the selection.
				if (b.tierModels.sonnet === fast.id) {
					b.id = fast.id;
					b.name = fast.name || b.name;
					b.description = fast.description || b.description;
					b.context_length = fast.context_window || fast.context_length || b.context_length;
					b.max_output_tokens = fast.max_tokens || fast.max_output_tokens || b.max_output_tokens;
				}
			}
		}

		// The card is LABELLED after the opus tier — the model users identify the
		// family by — while b.id stays the sonnet/main id. That split is deliberate:
		// the webview treats b.id as the canonical identity of the selection and
		// matches it against ANTHROPIC_DEFAULT_SONNET_MODEL (script.ts:5227), so
		// b.id must keep tracking sonnet even though the visible name does not.
		// Runs last so it reflects any staleness promotion above.
		if (b.tierModels && b.tierModels.opus) {
			const opusModel = byId.get((b.tierModels as TierModels).opus);
			if (opusModel) {
				b.name = opusModel.name || b.name;
				b.description = opusModel.description || b.description;
			}
		}

		return b;
	});
}

export async function fetchAndResolveModels(bundledModels: BundledModel[], apiBaseUrl: string = 'https://ccc.api.opencredits.ai'): Promise<BundledModel[] | null> {
	try {
		const response = await fetch(apiBaseUrl + '/v1/models');
		const data: any = await response.json();
		const apiModels: ApiModel[] = data.data || data;
		if (!Array.isArray(apiModels) || apiModels.length === 0) {
			return null;
		}
		return resolveLatestModels(apiModels, bundledModels);
	} catch (e) {
		console.log('Auto-update models failed:', e);
		return null;
	}
}
