import { browser, expect, $, $$ } from '@wdio/globals';
import * as fs from 'fs';
import * as path from 'path';
import { openChat, openConnectPanel, selectOption, callUi, ask, clearTranscript,
	assertNotAnError, workspaceDir } from './helpers';

/**
 * RUNTIME integration: not "does the panel write a file", but "does the thing the
 * panel wrote actually reach Claude". Both tests spend a real CLI turn on the
 * subscription — FREE, no credits.
 *
 * The distinction matters. panels.e2e.ts proves .mcp.json gains a server and
 * SKILL.md lands on disk. Neither proves the CLI ever loads them, which is the
 * only reason a user adds either one.
 */
describe('runtime: what the panels write actually reaches Claude', () => {

	before(function () {
		if (process.env.E2E_MODE === 'opencredits') {
			throw new Error('runtime.e2e.ts is the free suite; it must not run in opencredits mode');
		}
	});

	it('an MCP server added in the UI is connected by the CLI', async () => {
		const ws = workspaceDir();
		const serverPath = path.resolve(__dirname, 'fixtures', 'mcp-probe-server.js');
		expect(fs.existsSync(serverPath)).toBe(true);

		const webview = await openChat();
		try {
			// Add it the way a user does, through the form.
			await openConnectPanel('MCP Servers');
			await (await $('#mcpModal')).waitForDisplayed({ timeout: 15000 });
			await callUi('showAddServerForm');
			await (await $('#addServerForm')).waitForDisplayed({ timeout: 10000 });

			await (await $('#serverName')).setValue('ccc-e2e-probe');
			await selectOption('serverScope', 'project');
			await selectOption('serverType', 'stdio');
			await (await $('#serverCommand')).setValue(process.execPath);
			await (await $('#serverArgs')).setValue(serverPath);
			await (await $('#mcpModal button[onclick*="saveMCPServer"]')).click();

			const mcpFile = path.join(ws, '.mcp.json');
			await browser.waitUntil(
				async () => fs.existsSync(mcpFile) && fs.readFileSync(mcpFile, 'utf8').includes('ccc-e2e-probe'),
				{ timeout: 15000, timeoutMsg: 'the server never reached .mcp.json' });
			console.log('[e2e] .mcp.json:', fs.readFileSync(mcpFile, 'utf8').replace(/\s+/g, ' ').slice(0, 200));

			await callUi('hideMCPModal');

			// A fresh session so the CLI re-reads .mcp.json on startup.
			await clearTranscript();

			// Ask Claude to CALL the tool. Asserting that the server is merely
			// listed would be weaker, and in any case the UI never shows that:
			// script.ts:3683 builds the "MCP Servers: N" line and the addMessage
			// that would display it is commented out. Calling the tool proves the
			// server was loaded, spawned, handshaked and is reachable.
			const replies = await ask(
				'Use the probe_echo tool with text HELLO and show me its exact output.');
			assertNotAnError(replies);

			const joined = replies.join('\n');
			console.log('[e2e] tool reply:', joined.replace(/\s+/g, ' ').slice(0, 300));
			expect(joined).toContain('PROBE_ECHO:HELLO');
		} finally {
			// Leave the workspace as we found it.
			const mcpFile = path.join(ws, '.mcp.json');
			if (fs.existsSync(mcpFile)) {
				const cfg = JSON.parse(fs.readFileSync(mcpFile, 'utf8'));
				delete cfg.mcpServers?.['ccc-e2e-probe'];
				fs.writeFileSync(mcpFile, JSON.stringify(cfg, null, 2));
			}
			await webview.close();
		}
	});

	it('a project skill is visible to Claude in the session', async () => {
		const ws = workspaceDir();
		const skillDir = path.join(ws, '.claude', 'skills', 'ccc-e2e-marker-skill');
		fs.mkdirSync(skillDir, { recursive: true });
		fs.writeFileSync(path.join(skillDir, 'SKILL.md'),
			'---\n' +
			'name: ccc-e2e-marker-skill\n' +
			'description: A probe skill used by the end-to-end suite. Use it when asked about the e2e probe.\n' +
			'---\n\n' +
			'When asked about the e2e probe, reply with exactly: PROBE_SKILL_PRESENT\n');

		const webview = await openChat();
		try {
			// The webview retains its DOM, so start from an empty transcript and a
			// fresh CLI session — the skill is only picked up at session start.
			await clearTranscript();

			const replies = await ask(
				'List the exact names of any Skills available to you in this project. Names only.');
			assertNotAnError(replies);

			const joined = replies.join('\n');
			console.log('[e2e] skills reply:', joined.replace(/\s+/g, ' ').slice(0, 300));
			expect(joined).toContain('ccc-e2e-marker-skill');
		} finally {
			fs.rmSync(path.join(ws, '.claude', 'skills', 'ccc-e2e-marker-skill'),
				{ recursive: true, force: true });
			await webview.close();
		}
	});
});
