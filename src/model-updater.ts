interface ApiModel {
	id: string;
	name?: string;
	description?: string;
	pricing?: { prompt: number; completion: number; currency?: string; unit?: string };
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
	tierModels?: { sonnet: string; opus: string; haiku: string };
	[key: string]: any;
}

interface ProviderResolver {
	main: RegExp;
	opus?: RegExp;
	haiku?: RegExp;
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
		if (match) {
			const ver = match[1] || '0';
			if (!bestVer || compareVersions(ver, bestVer) > 0) {
				bestVer = ver;
				best = m;
			}
		}
	}
	return best;
}

const providerResolvers: Record<string, ProviderResolver> = {
	'zai/glm-': {
		main: /^zai\/glm-(\d+(?:\.\d+)?)$/,
		haiku: /^zai\/GLM-([\d.]+)-(?:Air|Flash)$/i
	},
	'openai/gpt-': {
		main: /^openai\/gpt-([\d.]+)-codex$/,
		haiku: /^openai\/gpt-([\d.]+)-codex-mini$/
	},
	'gemini-': {
		main: /^(?:google\/)?gemini-([\d.]+)-pro-preview$/,
		opus: /^(?:google\/)?gemini-([\d.]+)-pro-preview-thinking$/,
		haiku: /^(?:google\/)?gemini-([\d.]+)-flash(?:-preview)?$/
	},
	'deepseek/deepseek-': {
		main: /^deepseek\/deepseek-v([\d.]+)[-:]thinking$/
	},
	'minimax/minimax-': {
		main: /^minimax\/minimax-m([\d.]+)$/
	},
	'moonshotai/kimi-': {
		main: /^moonshotai\/kimi-k([\d.]+)$/,
		haiku: /^moonshotai\/kimi-k([\d.]+)-turbo$/
	}
};

export function resolveLatestModels(apiModels: ApiModel[], bundledModels: BundledModel[]): BundledModel[] {
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

		// Resolve main (sonnet-tier) model
		const mainMatch = findHighestMatch(apiModels, resolver.main);
		if (mainMatch) {
			b.id = mainMatch.id;
			b.name = mainMatch.name || b.name;
			b.description = mainMatch.description || b.description;
			b.context_length = mainMatch.context_length || b.context_length;
			b.max_output_tokens = mainMatch.max_output_tokens || b.max_output_tokens;
			if (b.tierModels) {
				b.tierModels.sonnet = mainMatch.id;
				if (!resolver.opus) {
					b.tierModels.opus = mainMatch.id;
				}
			}
		}

		// Resolve opus-tier model (e.g. Gemini thinking variant)
		if (resolver.opus && b.tierModels) {
			const opusMatch = findHighestMatch(apiModels, resolver.opus);
			if (opusMatch) {
				b.tierModels.opus = opusMatch.id;
			}
		}

		// Resolve haiku-tier model
		if (resolver.haiku && b.tierModels) {
			const haikuMatch = findHighestMatch(apiModels, resolver.haiku);
			if (haikuMatch) {
				b.tierModels.haiku = haikuMatch.id;
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
