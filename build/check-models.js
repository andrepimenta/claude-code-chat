#!/usr/bin/env node
/**
 * Catalogue health check for src/recommended-models.json.
 *
 * Answers three questions the resolver itself cannot:
 *   1. DEAD    — does every bundled/resolved id still exist in the catalogue?
 *                (v2.1.0 shipped moonshotai/kimi-k2-turbo as Kimi's haiku tier;
 *                 it was later withdrawn and nothing noticed for months.)
 *   2. STALE   — is a provider's flagship far older than its own cheap tier?
 *                A big gap means the provider shipped fast-line releases we
 *                followed while its capable line stood still.
 *   3. MISSED  — is there a newer language model in that provider's namespace
 *                that none of our regexes select? Usually fine (image/lite/
 *                preview variants), but it is how a renamed flagship hides.
 *
 * Usage:  node build/check-models.js [--days N] [--strict] [--json]
 *   --days N   staleness threshold in days (default 100)
 *   --strict   exit non-zero on warnings too, not just dead ids
 *   --json     machine-readable output
 */
const path = require('path');

/**
 * Loaded lazily, not at module scope: `out/` only exists after a compile, and a
 * top-level require would make this file unloadable on a fresh clone — including
 * for `require('./build/check-models.js')` to unit-test `analyse()`, which needs
 * no compiled output at all.
 */
function loadResolver() {
	try {
		// Same module the resolver ships in, so the threshold cannot drift from the
		// policy it is meant to police.
		return require(path.join(__dirname, '..', 'out', 'model-updater.js'));
	} catch (e) {
		console.error('Could not load out/model-updater.js — run `npm run compile` first.');
		console.error(`  (${e && e.message})`);
		process.exit(3);
	}
}

const API = process.env.MODELS_API || 'https://ccc.api.opencredits.ai';
const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(n); return i === -1 ? d : argv[i + 1]; };
// null means "no --days given" — the default comes from the resolver's own
// constant, which is only available once the compiled module is loaded.
const daysFlag = flag('--days', null);
const STRICT = argv.includes('--strict');
const JSON_OUT = argv.includes('--json');

// Known non-flagship variants. A newer one of these is expected and uninteresting:
// they are speed, size or modality spins of a line we already track. Excluding
// them keeps the "newer available" signal to things that could be a renamed
// flagship — the failure mode that actually hides a stale pin.
const VARIANT = /-(fast|highspeed|lightning|turbo|lite|mini|nano|flash[a-z]*|image|live|preview|thinking|transcribe|embedding|codex|vision[\w-]*|exp|\d{4})(-[\w.]+)?$/i;

const DAY = 86400;
const ageDays = (rel, now) => (rel ? Math.round((now - rel) / DAY) : null);
const iso = rel => (rel ? new Date(rel * 1000).toISOString().slice(0, 10) : '?');

/** Pure: given resolved entries + a catalogue index, produce findings. */
function analyse(resolved, index, now, thresholdDays) {
	const dead = [], stale = [], missed = [], rows = [];
	for (const m of resolved) {
		const tiers = m.tierModels || { sonnet: m.id };
		const ages = [];
		for (const [tier, id] of Object.entries(tiers)) {
			const api = index.byId[id];
			if (!api) { dead.push({ provider: m.quickLabel, tier, id }); continue; }
			const a = ageDays(api.released, now);
			rows.push({ provider: m.quickLabel, tier, id, released: iso(api.released), age: a });
			if (a !== null) { ages.push({ tier, id, a }); }
		}
		// Directional, mirroring the resolver's policy: only the FLAGSHIP lagging its
		// own fast tier is staleness. The reverse — a deliberately older cheap model,
		// which is exactly how Kimi is configured — is normal and must not be flagged.
		const flagship = ages.find(x => x.tier === 'sonnet');
		const fast = ages.find(x => x.tier === 'haiku');
		if (flagship && fast && flagship.id !== fast.id) {
			const gap = flagship.a - fast.a;
			if (gap > thresholdDays) {
				stale.push({ provider: m.quickLabel, gap, flagship, fast });
			}
		}
		// Newest language model in this provider's namespace that we do not use.
		const ns = m.id.split('/')[0] + '/';
		const used = new Set(Object.values(tiers));
		const cand = index.all
			.filter(x => x.id.startsWith(ns) && !used.has(x.id) && x.released &&
				(x.type ? x.type === 'language' : true) && !VARIANT.test(x.id))
			.sort((a, b) => b.released - a.released)[0];
		const ourNewest = ages.length ? Math.min(...ages.map(x => x.a)) : null;
		if (cand && ourNewest !== null && ageDays(cand.released, now) < ourNewest) {
			missed.push({ provider: m.quickLabel, id: cand.id, released: iso(cand.released),
				age: ageDays(cand.released, now), ourNewest });
		}
	}
	return { dead, stale, missed, rows };
}

async function main() {
	const { resolveLatestModels, STALE_FLAGSHIP_DAYS } = loadResolver();
	// `--days` with a missing or non-numeric value used to yield NaN, and every
	// `gap > NaN` is false — silently disabling the check instead of failing.
	const DAYS = daysFlag === null ? STALE_FLAGSHIP_DAYS : Number(daysFlag);
	if (!Number.isFinite(DAYS) || DAYS < 0) {
		console.error(`--days needs a non-negative number (got ${JSON.stringify(daysFlag)})`);
		process.exit(3);
	}

	const bundled = require(path.join(__dirname, '..', 'src', 'recommended-models.json'));

	const res = await fetch(API + '/v1/models');
	if (!res.ok) { console.error(`fetch failed: HTTP ${res.status}`); process.exit(3); }
	const body = await res.json();
	const all = body.data || body;
	if (!Array.isArray(all) || !all.length) { console.error('empty catalogue'); process.exit(3); }

	const index = { all, byId: Object.fromEntries(all.map(m => [m.id, m])) };
	const now = Date.now() / 1000;
	const resolved = resolveLatestModels(all, bundled);
	const out = analyse(resolved, index, now, DAYS);

	if (JSON_OUT) {
		console.log(JSON.stringify({ api: API, models: all.length, thresholdDays: DAYS, ...out }, null, 2));
	} else {
		console.log(`\nCatalogue health — ${all.length} models from ${API}`);
		console.log(`Staleness threshold: ${DAYS} days\n`);
		console.log('  provider   tier     model                          released      age');
		console.log('  ' + '-'.repeat(74));
		for (const r of out.rows) {
			console.log(`  ${(r.provider || '').padEnd(10)} ${r.tier.padEnd(8)} ${r.id.padEnd(30)} ${r.released.padEnd(13)} ${r.age === null ? '?' : r.age + 'd'}`);
		}
		console.log();
		if (out.dead.length) {
			console.log('DEAD IDS — these are not in the catalogue and will fail at runtime:');
			for (const d of out.dead) { console.log(`  x ${d.provider}.${d.tier} -> ${d.id}`); }
			console.log();
		}
		if (out.stale.length) {
			console.log(`STALE — flagship lags its own cheap tier by more than ${DAYS} days:`);
			for (const s of out.stale) {
				console.log(`  ! ${s.provider}: ${s.gap}d — flagship ${s.flagship.id} (${s.flagship.a}d) vs fast ${s.fast.id} (${s.fast.a}d)`);
			}
			console.log();
		}
		if (out.missed.length) {
			console.log('NEWER AVAILABLE — a newer model exists in that namespace that we do not select:');
			for (const x of out.missed) {
				console.log(`  ? ${x.provider}: ${x.id} (${x.age}d) is newer than anything we use (${x.ourNewest}d)`);
			}
			console.log();
		}
		if (!out.dead.length && !out.stale.length && !out.missed.length) { console.log('All clear.\n'); }
	}

	if (out.dead.length) { process.exit(1); }
	if (STRICT && (out.stale.length || out.missed.length)) { process.exit(2); }
}

if (require.main === module) { main().catch(e => { console.error(e); process.exit(3); }); }
module.exports = { analyse };
