import { browser, $, $$ } from '@wdio/globals';

describe('diagnostic', () => {
	it('reports what VS Code is actually showing', async () => {
		const workbench = await browser.getWorkbench();
		console.log('[diag] title:', await browser.getTitle());
		console.log('[diag] url  :', (await browser.getUrl()).slice(0, 120));

		const notifs = await workbench.getNotifications();
		for (const n of notifs) {
			console.log('[diag] NOTIFICATION:', (await n.getMessage()).slice(0, 160));
		}
		console.log('[diag] notification count:', notifs.length);

		for (const sel of ['.monaco-workbench', '.quick-input-widget', '.activitybar',
			'.monaco-dialog-box', '.dialog-shadow', 'iframe.webview']) {
			const els = await $$(sel);
			let displayed = false;
			if (els.length) { displayed = await els[0].isDisplayed().catch(() => false); }
			console.log(`[diag] ${sel.padEnd(22)} count=${els.length} displayed=${displayed}`);
		}

		// Can we reach the extension's view control without the command palette?
		try {
			const ctrl = await workbench.getActivityBar().getViewControl('Claude Code Chat');
			console.log('[diag] activity bar control found:', !!ctrl);
		} catch (e) {
			console.log('[diag] activity bar lookup failed:', (e as Error).message.slice(0, 120));
		}

		const titles = await workbench.getActivityBar().getViewControls();
		const names: string[] = [];
		for (const t of titles) { names.push(await t.getTitle().catch(() => '?')); }
		console.log('[diag] activity bar items:', names.join(' | '));

		await browser.saveScreenshot('/tmp/ccc-diag.png');
		console.log('[diag] screenshot -> /tmp/ccc-diag.png');
	});
});
