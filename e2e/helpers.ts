import { browser, $, $$ } from '@wdio/globals';

/** Read every element's text. $$ returns a wdio chainable, not a plain Array. */
export async function textsOf(selector: string): Promise<string[]> {
	const els = await $$(selector);
	const out: string[] = [];
	for (let i = 0; i < els.length; i++) { out.push(await els[i].getText()); }
	return out;
}

/** Open the chat panel and switch WebDriver into its iframe. Returns the webview handle. */
export async function openChat(): Promise<any> {
	const workbench = await browser.getWorkbench();

	// Toasts float above the editor and intercept clicks on the webview.
	for (const n of await workbench.getNotifications()) {
		await n.dismiss().catch(() => { /* already gone */ });
	}

	// Open via the activity bar, NOT workbench.executeCommand. executeCommand
	// drives the command palette with synthetic keystrokes, which never reach the
	// window under wdio here: .quick-input-widget is simply never created and every
	// test dies 15s later with a message that says nothing about the real cause.
	// The view control is a plain DOM click and is reliable.
	const control = await workbench.getActivityBar().getViewControl('Claude Code Chat');
	if (!control) { throw new Error('no "Claude Code Chat" control in the activity bar'); }
	await control.openView();

	await browser.waitUntil(async () => (await $$('iframe.webview')).length > 0,
		{ timeout: 30000, timeoutMsg: 'no webview appeared after opening the view' });

	const webview = await workbench.getWebviewByTitle('Claude Code Chat');
	await webview.open();
	await waitForReady();
	await resetUi();
	await settleTranscript();
	return webview;
}

/**
 * Wait until the transcript stops changing on its own.
 *
 * Reopening the view replays the saved conversation through _loadConversationHistory,
 * which renders on nested 100ms/50ms timers. The composer exists well before that
 * finishes, so anything that counts messages right after opening is racing a
 * transcript that is still growing — and the resulting failure blames whatever
 * ran next. Wait for quiet instead.
 */
export async function settleTranscript(timeout = 15000): Promise<void> {
	const SELECTOR = '.message.claude, .message.user, .message.error';
	let last = -1;
	let stable = 0;
	const deadline = Date.now() + timeout;
	while (Date.now() < deadline) {
		const n = (await $$(SELECTOR)).length;
		if (n === last) {
			if (++stable >= 3) { return; }   // ~750ms of no change
		} else {
			stable = 0;
			last = n;
		}
		await browser.pause(250);
	}
}

/**
 * Put the webview back to a neutral state.
 *
 * webview.close() only detaches WebDriver from the iframe — it does NOT reset the
 * DOM. The sidebar view is retained when hidden, so a modal left open by one test
 * is still on top in the next one, and every click after it fails with "element
 * click intercepted" naming a button that looks perfectly fine.
 */
export async function resetUi(): Promise<void> {
	await browser.execute(() => {
		const hides = ['hideSkillAddForm', 'hideAddServerForm', 'hideAddSnippetForm',
			'hideAddPermissionForm', 'hideConnectMenu', 'hideSkillsModal', 'hidePluginsModal',
			'hideMCPModal', 'hideSettingsModal', 'hideModelModal', 'hideAllModelsModal',
			'hideAdvancedModal', 'hideCustomProviderModal', 'hideInstallModal',
			'hideSupportModal', 'hideSlashCommandsModal', 'hideThinkingIntensityModal'];
		for (const name of hides) {
			try { (window as any)[name]?.(); } catch { /* not all exist in every state */ }
		}
		// Modals do not share one class: the file picker is .file-picker-modal and
		// the installer is .install-modal, so sweeping .tools-modal alone leaves
		// them on top and every later click gets intercepted.
		document.querySelectorAll('.tools-modal, .file-picker-modal, .install-modal, [id$="Modal"]')
			.forEach((m) => { (m as HTMLElement).style.display = 'none'; });
	});
}

/** Call a webview global directly. For flows whose entry button is rendered dynamically. */
export async function callUi(fn: string, ...args: any[]): Promise<void> {
	await browser.execute((name: string, a: any[]) => {
		const f = (window as any)[name];
		if (typeof f !== 'function') { throw new Error('no window.' + name); }
		f.apply(null, a);
	}, fn, args);
}

/** The sandbox workspace this run opened, so specs can assert real file effects. */
export function workspaceDir(): string {
	return process.env.E2E_WORKSPACE
		|| require('path').join(process.env.TMPDIR || '/tmp', 'ccc-e2e-ws');
}

/**
 * The real "ready" signal. The composer only exists once the webview has run its
 * init, and #modelSelector only renders after the extension has replied to the
 * `webviewReady` handshake. Waiting on the iframe alone races the handshake.
 */
export async function waitForReady(timeout = 60000): Promise<void> {
	await browser.waitUntil(async () => (await $$('#messageInput')).length > 0,
		{ timeout, timeoutMsg: 'composer never rendered — webview init did not complete' });
}

const REPLY_SELECTOR = '.message.claude, .message.error';

/**
 * Type into the composer and submit. Enter submits (script.ts: Enter && !shiftKey).
 *
 * Returns how many replies were ALREADY on screen. waitForReply needs that: the
 * webview retains its DOM across close/reopen, so a previous test's answer is
 * still rendered, and an absolute "is there a reply?" check passes instantly
 * against stale content. Always ask for MORE than there were, never for "any".
 */
export async function send(text: string): Promise<number> {
	const before = (await $$(REPLY_SELECTOR)).length;
	const echoesBefore = (await $$('.message.user')).length;

	const input = await $('#messageInput');
	await input.waitForExist({ timeout: 20000 });
	await input.click();
	await input.setValue(text);
	await browser.keys('Enter');

	// Confirm it actually went. script.ts ignores Enter while #sendBtn is
	// disabled, so a submit can silently no-op and the test then waits out its
	// full timeout before failing with something that blames the reply instead
	// of the send. Our own echo appearing is the proof it was accepted.
	await browser.waitUntil(async () => (await $$('.message.user')).length > echoesBefore,
		{ timeout: 15000, timeoutMsg: 'the message was never submitted (composer disabled?)' });

	return before;
}

/**
 * Wait for a reply that arrived AFTER `before`, returning only the new ones.
 * .message.user is our own echo, excluded deliberately: waiting on it would pass
 * without any response at all.
 */
export async function waitForReply(before = 0, timeout = 180000): Promise<string[]> {
	await browser.waitUntil(async () => (await $$(REPLY_SELECTOR)).length > before,
		{ timeout, timeoutMsg: `no NEW reply rendered within ${timeout}ms (already had ${before})` });
	const all = await textsOf(REPLY_SELECTOR);
	return all.slice(before);
}

/**
 * True if the extension is mid-turn. script.ts toggles #stopInlineBtn between
 * inline-flex and none from the setProcessing message, so it is the webview's
 * own record of whether the CLI is still working.
 */
async function isProcessing(): Promise<boolean> {
	const el = await $('#stopInlineBtn');
	if (!(await el.isExisting())) { return false; }
	return (await el.getCSSProperty('display')).value !== 'none';
}

/**
 * Wait for the whole turn to finish, not just for the first thing rendered.
 *
 * A tool-using turn emits intermediate text ("I'll call that tool...") before the
 * answer. Returning on the first new message hands back the preamble and lets the
 * real reply land during the NEXT test, which is exactly as confusing as it
 * sounds when you are reading the logs.
 */
export async function waitForTurnEnd(timeout = 180000): Promise<void> {
	// A short turn can finish before we first look, so a missed start is fine.
	await browser.waitUntil(isProcessing, { timeout: 20000 }).catch(() => { /* already done */ });
	await browser.waitUntil(async () => !(await isProcessing()),
		{ timeout, timeoutMsg: `the turn never finished within ${timeout}ms` });
}

/**
 * Send, wait for the COMPLETE turn, and return only the replies it produced.
 *
 * Throws if the turn rendered an error bubble. That check is STRUCTURAL — the
 * presence of a .message.error element — not a scan for known phrases. A list of
 * known phrases is how "API Error: 400 Upstream provider error" was reported as
 * a passing test: the model never answered and the suite went green.
 */
export async function ask(text: string, timeout = 180000): Promise<string[]> {
	const errorsBefore = (await $$('.message.error')).length;
	const before = await send(text);
	await waitForTurnEnd(timeout);

	const all = await textsOf(REPLY_SELECTOR);
	const fresh = all.slice(before);
	if (fresh.length === 0) { throw new Error('the turn ended without producing any reply'); }

	const errorEls = await $$('.message.error');
	if (errorEls.length > errorsBefore) {
		const texts: string[] = [];
		for (let i = errorsBefore; i < errorEls.length; i++) { texts.push(await errorEls[i].getText()); }
		throw new Error(`the turn rendered an error: ${texts.join(' | ').replace(/\s+/g, ' ').slice(0, 300)}`);
	}
	return fresh;
}

/** Clear the transcript so a test starts from a known-empty state. */
export async function clearTranscript(): Promise<void> {
	await (await $('#newSessionBtn')).click();
	await browser.waitUntil(async () => (await $$('.message.claude, .message.user')).length === 0,
		{ timeout: 20000, timeoutMsg: 'transcript did not clear' });
}

/**
 * Backstop for failures that render as an ordinary assistant bubble rather than
 * an error element. `ask` already rejects anything marked .message.error; this
 * catches the cases the gateway or CLI writes as normal text.
 *
 * Deliberately includes a generic /API Error: \d+/ rule. Enumerating known
 * phrases is what let a 400 through as a pass.
 */
export function assertNotAnError(replies: string[]): void {
	if (replies.length === 0) { throw new Error('no replies at all'); }
	const joined = replies.join('\n');
	for (const marker of ['Not logged in', 'Failed to authenticate', 'authentication_failed',
		'Invalid API key', 'Credit balance is too low', 'Upstream provider error']) {
		if (joined.includes(marker)) {
			throw new Error(`reply is an error, not an answer: ${marker}\n${joined.slice(0, 400)}`);
		}
	}
	const generic = /API Error:\s*\d{3}/.exec(joined);
	if (generic) {
		throw new Error(`reply is an error, not an answer: ${generic[0]}\n${joined.slice(0, 400)}`);
	}
}

/** Open one of the three panels behind the "+" connect menu. */
export async function openConnectPanel(label: 'Plugins' | 'Skills' | 'MCP Servers'): Promise<void> {
	await (await $('#connectBtn')).click();
	const menu = await $('#connectMenu');
	await menu.waitForDisplayed({ timeout: 10000 });
	const items = await $$('#connectMenu .connect-menu-item');
	for (let i = 0; i < items.length; i++) {
		if ((await items[i].getText()).trim() === label) { await items[i].click(); return; }
	}
	throw new Error(`connect menu has no "${label}" item`);
}

/** Set a <select> by value and fire the change event the UI listens for. */
export async function selectOption(id: string, value: string): Promise<void> {
	await browser.execute((elId: string, v: string) => {
		const el = document.getElementById(elId) as HTMLSelectElement | null;
		if (!el) { throw new Error('no element #' + elId); }
		el.value = v;
		el.dispatchEvent(new Event('change', { bubbles: true }));
	}, id, value);
}
