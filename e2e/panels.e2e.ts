import { browser, expect, $, $$ } from '@wdio/globals';
import * as fs from 'fs';
import * as path from 'path';
import { openChat, openConnectPanel, selectOption, callUi, workspaceDir, textsOf } from './helpers';

/**
 * Skills, MCP servers, plugins, permissions and prompt snippets. All FREE — no
 * model is ever invoked here.
 *
 * SCOPE IS A SAFETY CONSTRAINT, NOT A DETAIL. Skills at scope `personal` write to
 * the user's real ~/.claude/skills, and MCP servers at scope `global` rewrite the
 * real ~/.claude.json that Claude Code itself owns. Every test below stays at
 * `project` scope so writes land in the throwaway workspace.
 */
describe('side panels', () => {

	it('lists skills and creates then deletes a project skill', async () => {
		const webview = await openChat();
		try {
			await openConnectPanel('Skills');
			await (await $('#skillsModal')).waitForDisplayed({ timeout: 15000 });
			// The form is hidden until "+ Create skill" is pressed, and that button
			// is rendered dynamically into the list.
			await callUi('showSkillAddForm');
			await (await $('#skillAddForm')).waitForDisplayed({ timeout: 10000 });

			const name = 'e2e-probe-skill';
			await (await $('#skillName')).setValue(name);
			await (await $('#skillDescription')).setValue('created by the e2e suite');
			await (await $('#skillContent')).setValue('Say PROBE when asked about the probe.');
			await selectOption('skillScope', 'project');
			await (await $('#skillAddForm button[onclick*="saveSkill"]')).click();

			// Assert the real effect, not the rendered text: saveSkill hides the
			// list while the form is up, so a DOM check here would be testing the
			// wrong thing. The file is the contract.
			const onDisk = path.join(workspaceDir(), '.claude', 'skills', name, 'SKILL.md');
			await browser.waitUntil(async () => fs.existsSync(onDisk),
				{ timeout: 15000, timeoutMsg: 'skill file was never written to ' + onDisk });
			expect(fs.readFileSync(onDisk, 'utf8')).toContain('PROBE');
			console.log('[e2e] skill written to', onDisk);

			// Delete it again — the test is not done until the workspace is back to
			// how it started, and this is also the only coverage of _deleteSkill,
			// which does a recursive delete on a webview-supplied name.
			await callUi('deleteSkill', name, 'project');
			await browser.waitUntil(async () => !fs.existsSync(path.dirname(onDisk)),
				{ timeout: 15000, timeoutMsg: 'skill directory was never removed' });
			console.log('[e2e] skill deleted, workspace restored');
		} finally {
			await webview.close();
		}
	});

	it('lists MCP servers and saves then reads back a project server', async () => {
		const webview = await openChat();
		try {
			await openConnectPanel('MCP Servers');
			await (await $('#mcpModal')).waitForDisplayed({ timeout: 15000 });
			await callUi('showAddServerForm');
			await (await $('#addServerForm')).waitForDisplayed({ timeout: 10000 });

			const name = 'e2e-probe-server';
			await (await $('#serverName')).setValue(name);
			await selectOption('serverScope', 'project');
			await selectOption('serverType', 'stdio');
			await (await $('#serverCommand')).setValue('echo');
			await (await $('#mcpModal button[onclick*="saveMCPServer"]')).click();

			const mcpFile = path.join(workspaceDir(), '.mcp.json');
			await browser.waitUntil(
				async () => fs.existsSync(mcpFile) && fs.readFileSync(mcpFile, 'utf8').includes(name),
				{ timeout: 15000, timeoutMsg: 'server was never written to ' + mcpFile });
			console.log('[e2e] mcp server written to', mcpFile);

			await callUi('deleteMCPServer', name, 'project');
			await browser.waitUntil(
				async () => !fs.readFileSync(mcpFile, 'utf8').includes(name),
				{ timeout: 15000, timeoutMsg: 'server was never removed from ' + mcpFile });
			console.log('[e2e] mcp server deleted, config restored');
		} finally {
			await webview.close();
		}
	});

	it('lists plugins', async () => {
		const webview = await openChat();
		try {
			await openConnectPanel('Plugins');
			await (await $('#pluginsModal')).waitForDisplayed({ timeout: 15000 });
			await browser.waitUntil(async () => (await $$('#pluginsList *, #pluginsGrid *')).length > 0,
				{ timeout: 20000, timeoutMsg: 'plugins panel rendered nothing at all' });
		} finally {
			await webview.close();
		}
	});

	it('adds and removes a permission', async () => {
		const webview = await openChat();
		try {
			await (await $('#settingsBtn')).click();
			await (await $('#settingsModal')).waitForDisplayed({ timeout: 15000 });

			await callUi('showAddPermissionForm');
			await (await $('#addPermissionForm')).waitForDisplayed({ timeout: 10000 });
			// A <select>, not a text input — setValue here is an invalid element
			// state. Its onchange is also what un-hides the command field.
			await selectOption('addPermissionTool', 'Bash');
			await (await $('#addPermissionCommand')).waitForDisplayed({ timeout: 10000 });
			await (await $('#addPermissionCommand')).setValue('echo e2e-probe');
			await (await $('#addPermissionBtn')).click();

			await browser.waitUntil(
				async () => (await textsOf('#permissionsList')).join().includes('echo e2e-probe'),
				{ timeout: 15000, timeoutMsg: 'permission never appeared in the list' });
			console.log('[e2e] permission added');
		} finally {
			await webview.close();
		}
	});

	it('creates a custom prompt snippet', async () => {
		const webview = await openChat();
		try {
			// Prompt snippets live in the SLASH COMMANDS modal, not Settings:
			// #addSnippetForm is a child of #promptSnippetsList inside
			// .slash-commands-section (ui.ts:807-823).
			await callUi('showSlashCommandsModal');
			await (await $('#slashCommandsModal')).waitForDisplayed({ timeout: 15000 });

			await callUi('showAddSnippetForm');
			// The form sits well below the fold of the settings modal; without
			// scrolling it into view the driver reports it as not displayed.
			const form = await $('#addSnippetForm');
			await form.waitForExist({ timeout: 10000 });
			await form.scrollIntoView();
			await form.waitForDisplayed({ timeout: 10000 });
			await (await $('#snippetName')).setValue('E2E Probe');
			await (await $('#snippetPrompt')).setValue('probe prompt body');
			await (await $('#addSnippetForm button[onclick*="saveCustomSnippet"]')).click();

			await browser.waitUntil(
				async () => (await textsOf('#promptSnippetsList')).join().includes('E2E Probe'),
				{ timeout: 15000, timeoutMsg: 'snippet never appeared in the list' });
			console.log('[e2e] snippet created');
		} finally {
			await webview.close();
		}
	});
});
