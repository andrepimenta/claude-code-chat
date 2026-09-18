import { browser, expect, $, $$ } from '@wdio/globals';
import { openChat, callUi, textsOf } from './helpers';

/** Composer surfaces: slash commands, @-mentions, toggles, drafts. All FREE. */
describe('composer', () => {

	it('opens the slash-command palette and filters it', async () => {
		const webview = await openChat();
		try {
			await (await $('button[onclick*="showSlashCommandsModal"]')).click();
			await (await $('#slashCommandsModal')).waitForDisplayed({ timeout: 15000 });

			const all = await textsOf('#nativeCommandsList *');
			expect(all.length).toBeGreaterThan(0);

			await (await $('#slashCommandsSearch')).setValue('cost');
			await browser.waitUntil(async () => {
				const shown = (await textsOf('#nativeCommandsList')).join().toLowerCase();
				return shown.includes('cost');
			}, { timeout: 10000, timeoutMsg: 'filtering the command list produced no /cost entry' });
			console.log('[e2e] slash commands filtered to /cost');
		} finally {
			await webview.close();
		}
	});

	it('opens the @-mention file picker and lists workspace files', async () => {
		const webview = await openChat();
		try {
			await (await $('button[onclick*="showFilePicker"]')).click();
			await (await $('#filePickerModal')).waitForDisplayed({ timeout: 15000 });

			await browser.waitUntil(async () => (await $$('#fileList *')).length > 0,
				{ timeout: 20000, timeoutMsg: 'file picker listed no workspace files' });
			await (await $('#fileSearchInput')).setValue('greet');
			await browser.waitUntil(
				async () => (await textsOf('#fileList')).join().includes('greet'),
				{ timeout: 10000, timeoutMsg: 'searching for greet.js returned nothing' });
			console.log('[e2e] file picker found the sandbox fixture');
		} finally {
			await webview.close();
		}
	});

	it('cycles plan mode and opens the thinking-intensity modal', async () => {
		const webview = await openChat();
		try {
			const plan = await $('#planToggleBtn');
			const before = await plan.getAttribute('class');
			await plan.click();
			await browser.waitUntil(async () => (await plan.getAttribute('class')) !== before,
				{ timeout: 10000, timeoutMsg: 'plan toggle did not change state' });

			// #thinkToggleBtn calls toggleThinkingMode(), which only flips the flag
			// and the button's .active class — it does NOT open the intensity modal.
			// That is a separate entry point (showThinkingIntensityModal).
			const think = await $('#thinkToggleBtn');
			const thinkBefore = await think.getAttribute('class');
			await think.click();
			await browser.waitUntil(async () => (await think.getAttribute('class')) !== thinkBefore,
				{ timeout: 10000, timeoutMsg: 'thinking toggle did not change state' });

			await callUi('showThinkingIntensityModal');
			await (await $('#thinkingIntensityModal')).waitForDisplayed({ timeout: 15000 });
			expect(await (await $('#thinkingIntensitySlider')).isExisting()).toBe(true);
			console.log('[e2e] plan + thinking toggles respond');
		} finally {
			await webview.close();
		}
	});

	it('keeps an unsent draft across a reopen', async () => {
		const draft = 'unsent draft from the e2e suite';
		let webview = await openChat();
		try {
			const input = await $('#messageInput');
			await input.click();
			await input.setValue(draft);
			// saveInputText is debounced; give the extension a beat to persist it.
			await browser.pause(1500);
		} finally {
			await webview.close();
		}

		webview = await openChat();
		try {
			await browser.waitUntil(
				async () => (await (await $('#messageInput')).getValue()).includes(draft),
				{ timeout: 15000, timeoutMsg: 'draft was not restored after reopening' });
			console.log('[e2e] draft survived a reopen');
		} finally {
			await webview.close();
		}
	});
});
