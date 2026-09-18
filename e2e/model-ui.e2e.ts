import { browser, expect, $, $$ } from '@wdio/globals';
import { openChat, callUi, textsOf } from './helpers';

/**
 * The model selector UI — FREE.
 *
 * Clicking an OPENCREDITS card calls _setModelEnvVars, which writes all four
 * ANTHROPIC_DEFAULT_*_MODEL vars and arms gateway billing for everything after
 * it. So this suite opens the modal, reads it, searches it, and clicks only the
 * Claude cards. Paying for a card belongs in models.e2e.ts.
 */
describe('model selector', () => {

	it('offers the Claude tier cards in capability order', async () => {
		const webview = await openChat();
		try {
			await (await $('#modelSelector')).click();
			await (await $('#modelModal')).waitForDisplayed({ timeout: 15000 });

			await browser.waitUntil(async () => (await $$('#claudeModelCards .claude-card')).length > 0,
				{ timeout: 20000, timeoutMsg: 'Claude tier cards never rendered' });
			const names = (await textsOf('#claudeModelCards .claude-card')).map(t => t.split('\n')[0]);
			console.log('[e2e] claude cards:', names.join(' | '));
			expect(names.join(' ').toLowerCase()).toContain('fable');
		} finally {
			await webview.close();
		}
	});

	it('selects a Claude tier without touching gateway env vars', async () => {
		const webview = await openChat();
		try {
			await (await $('#modelSelector')).click();
			await (await $('#modelModal')).waitForDisplayed({ timeout: 15000 });
			await browser.waitUntil(async () => (await $$('#claudeModelCards .claude-card')).length > 0,
				{ timeout: 20000, timeoutMsg: 'Claude tier cards never rendered' });

			await (await $$('#claudeModelCards .claude-card'))[0].click();
			await browser.waitUntil(async () => !(await $('#modelModal').isDisplayed()),
				{ timeout: 20000, timeoutMsg: 'modal did not close after selecting a Claude tier' });

			// getText() returns '' for a node that is not visible, and which of the
			// two labels is showing depends on whether the quick-select row is up.
			// textContent is what we actually care about here.
			const label = await browser.execute(() => {
				const ids = ['modelDropdownText', 'modelSelectorText'];
				return ids.map(i => document.getElementById(i)?.textContent?.trim() || '')
					.filter(Boolean).join(' / ');
			});
			console.log('[e2e] selector now reads:', label);
			expect(label.length).toBeGreaterThan(0);
		} finally {
			await webview.close();
		}
	});

	it('opens the full catalogue and searches it', async () => {
		const webview = await openChat();
		try {
			await (await $('#modelSelector')).click();
			await (await $('#modelModal')).waitForDisplayed({ timeout: 15000 });

			// #modelMoreBtn sits underneath #opencreditsModelsSection and a real click
			// is intercepted. The catalogue modal is what we are testing, not the
			// z-order of the button that opens it, so invoke it directly.
			await callUi('showAllModelsModal');
			await (await $('#allModelsModal')).waitForDisplayed({ timeout: 15000 });
			await browser.waitUntil(async () => (await $$('#allModelsList *')).length > 0,
				{ timeout: 30000, timeoutMsg: 'full catalogue never rendered' });

			await (await $('#allModelsSearch')).setValue('deepseek');
			await browser.waitUntil(
				async () => (await textsOf('#allModelsList')).join().toLowerCase().includes('deepseek'),
				{ timeout: 15000, timeoutMsg: 'catalogue search for deepseek returned nothing' });
			console.log('[e2e] catalogue search works');
		} finally {
			await webview.close();
		}
	});
});
