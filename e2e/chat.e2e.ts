import { browser, expect, $, $$ } from '@wdio/globals';
import { openChat, ask, assertNotAnError, textsOf } from './helpers';

/**
 * SUBSCRIPTION MODE — costs ZERO OpenCredits credits.
 *
 * wdio.conf.ts sends no gateway env vars in this mode, so _isOpenCredits() is
 * false and the extension spawns the `claude` CLI against the user's own
 * Anthropic account. Everything here is free and unlimited.
 *
 * DELIBERATELY NOT TESTED HERE: clicking a model card. _setModelEnvVars writes
 * all four ANTHROPIC_DEFAULT_*_MODEL vars from the card's tier map, which ARMS
 * gateway billing for every subsequent send. Model selection belongs in
 * models.e2e.ts, where the spend is intentional and budgeted.
 */
describe('chat on the Claude Code subscription', () => {

	before(function () {
		if (process.env.E2E_MODE === 'opencredits') {
			throw new Error('chat.e2e.ts is the free suite; it must not run in opencredits mode');
		}
	});

	/**
	 * Regression for the webviewReady handshake. _postMessage has no queue, so
	 * anything the extension sent before the webview attached its listeners was
	 * silently dropped and the UI came up inert. That race does not reproduce on
	 * demand — a single clean open proves nothing, so this reopens repeatedly.
	 */
	it('renders a working UI on every open, not just the lucky ones', async () => {
		const ROUNDS = 8;
		for (let i = 1; i <= ROUNDS; i++) {
			let webview: any;
			try {
				// openChat waits for the composer, so it throws on its own if the
				// handshake never landed. Inside the try so the round number survives.
				webview = await openChat();
				const selectors = await $$('#modelSelector');
				expect(selectors.length).toBeGreaterThan(0);
			} catch (err) {
				throw new Error(`open #${i}/${ROUNDS} came up inert: ${(err as Error).message}`);
			} finally {
				if (webview) { await webview.close(); }
			}
		}
		console.log(`[e2e] handshake survived ${ROUNDS} consecutive opens`);
	});

	it('sends a message and renders the reply', async () => {
		const webview = await openChat();
		try {
			const replies = await ask('Reply with exactly: OK');
			console.log('[e2e] reply:', JSON.stringify(replies).slice(0, 200));
			assertNotAnError(replies);
		} finally {
			await webview.close();
		}
	});

	it('starts a new session and clears the transcript', async () => {
		const webview = await openChat();
		try {
			await ask('Reply with exactly: OK');

			const before = (await $$('.message.claude, .message.user')).length;
			expect(before).toBeGreaterThan(0);

			await (await $('#newSessionBtn')).click();
			await browser.waitUntil(
				async () => (await $$('.message.claude, .message.user')).length === 0,
				{ timeout: 20000, timeoutMsg: 'transcript did not clear after New Session' });
			console.log(`[e2e] cleared ${before} rendered messages`);
		} finally {
			await webview.close();
		}
	});

	it('lists the finished conversation in history', async () => {
		const webview = await openChat();
		try {
			await (await $('#historyBtn')).click();
			await browser.waitUntil(
				async () => (await $$('#conversationList .conversation-item')).length > 0,
				{ timeout: 20000, timeoutMsg: 'history panel listed no conversations' });
			const titles = await textsOf('#conversationList .conversation-item');
			console.log('[e2e] history:', titles.slice(0, 3).join(' | '));
		} finally {
			await webview.close();
		}
	});
});
