import { browser, expect, $, $$ } from '@wdio/globals';
import { openChat, ask, assertNotAnError, textsOf } from './helpers';
import recommended from '../src/recommended-models.json';

/**
 * OPENCREDITS MODE — THIS SPENDS REAL MONEY.
 *
 * One message per recommended model, which is what a real user actually does:
 * pick a card, type, send. Each send also drags a background haiku-tier call, so
 * the true cost per model is its sonnet rate plus its haiku rate.
 *
 *   E2E_MODE=opencredits E2E_BUDGET_OK=1 OPENCREDITS_KEY=oc_sk_… npm run test:e2e
 *
 * Budgeted at ~18.7 sticker credits for all six. Each model runs in its own
 * `it`, so a failure part-way through still reports what was already proven and
 * what was already spent.
 */
const MODELS = recommended as Array<{
	id: string; name: string; provider: string; credits_per_request: number;
	tierModels: Record<string, string>;
}>;

const spent: Array<{ name: string; sticker: number }> = [];

describe('every recommended model answers through OpenCredits', () => {

	before(function () {
		if (process.env.E2E_MODE !== 'opencredits') {
			throw new Error('models.e2e.ts only runs with E2E_MODE=opencredits');
		}
		if (!process.env.OPENCREDITS_KEY) {
			throw new Error('OPENCREDITS_KEY is not set — this suite makes real, billed requests');
		}
		// A deliberate second gate. The key alone is not consent to spend.
		if (process.env.E2E_BUDGET_OK !== '1') {
			throw new Error(
				'refusing to bill without E2E_BUDGET_OK=1. Estimated spend for this suite: ~'
				+ MODELS.reduce((n, m) => n + m.credits_per_request, 0).toFixed(2)
				+ ' sticker credits, plus background haiku traffic.');
		}
	});

	after(function () {
		const total = spent.reduce((n, s) => n + s.sticker, 0);
		console.log('\n[e2e] ── billed run summary ──');
		for (const s of spent) { console.log(`[e2e]   ${s.name.padEnd(22)} ~${s.sticker}`); }
		console.log(`[e2e]   ${'TOTAL (sticker)'.padEnd(22)} ~${total.toFixed(3)} credits`);
	});

	for (const model of MODELS) {
		it(`${model.name} (${model.provider}) replies`, async function () {
			const webview = await openChat();
			try {
	
				// The quick buttons only render once /v1/features and the catalogue
				// have resolved. Before that the UI shows a plain dropdown instead,
				// so this — not the iframe — is the real gateway-ready signal.
				await browser.waitUntil(async () => (await $$('.model-quick-btn')).length > 0,
					{ timeout: 60000, timeoutMsg: 'quick buttons never rendered — OpenCredits did not initialise' });

				await (await $('#modelSelector')).click();
				await browser.waitUntil(
					async () => (await $$('#opencreditsModelCards .model-card')).length > 0,
					{ timeout: 30000, timeoutMsg: 'model cards never rendered' });

				const card = await $(`#opencreditsModelCards .model-card[data-provider="${model.provider}"]`);
				await card.waitForExist({ timeout: 10000 });
				const chosenId = await card.getAttribute('data-model-id');

				// Guard the wallet: clicking a card overwrites all four tier env vars
				// with THAT card's map (extension.ts:3666). If the card we clicked is
				// not the card we budgeted for, stop before sending.
				expect(chosenId).toBe(model.id);
				console.log(`[e2e] ${model.name}: selected ${chosenId} (~${model.credits_per_request} + haiku)`);
				await card.click();

				await browser.waitUntil(async () => !(await $('#modelModal').isDisplayed()),
					{ timeout: 20000, timeoutMsg: 'model modal did not close after selection' });

				const replies = await ask('Reply with exactly: OK');
				spent.push({ name: model.name, sticker: model.credits_per_request });

				console.log(`[e2e] ${model.name} reply:`, JSON.stringify(replies).slice(0, 160));
				assertNotAnError(replies);
			} finally {
				await webview.close();
			}
		});
	}
});
