// Replay of the stream-json parser: _processJsonStreamData, extension.ts:1383-1738.
//
// This is the code that turns everything the Claude CLI emits into rendered UI,
// and it had ZERO coverage. Every branch here is reachable from a fixture — no
// process spawn, no network, no credits — which also makes it the only practical
// way to test states you cannot produce on demand: auth failure, a compact
// boundary, a truncated turn, a tool error.
//
// The provider is driven directly with a fake webview that records what would
// have been posted to the UI.

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

const EXT_ID = 'AndrePimenta.claude-code-chat';

let provider: any;
let sent: any[];
let restore: Array<() => void>;

async function harness(): Promise<void> {
	const ext = vscode.extensions.getExtension(EXT_ID);
	const api: any = await ext!.activate();
	provider = api.provider;

	sent = [];
	restore = [];
	provider._webview = { postMessage: (m: any) => { sent.push(m); return Promise.resolve(true); } };

	// Deterministic starting point: these accumulate across a session.
	provider._totalTokensInput = 0;
	provider._totalTokensOutput = 0;
	provider._totalCost = 0;
	provider._requestCount = 0;
	provider._isProcessing = true;
	provider._loginPromptShown = false;
	provider._currentSessionId = undefined;
}

/** Replace a method for one test, restoring it afterwards. */
function stub(name: string, impl: any): void {
	const original = provider[name];
	provider[name] = impl;
	restore.push(() => { provider[name] = original; });
}

function typesSent(): string[] { return sent.map(m => m.type); }
function firstOf(type: string): any { return sent.find(m => m.type === type); }

suite('stream: system events', () => {
	setup(async () => harness());
	teardown(() => restore.forEach(f => f()));

	test('init captures the session id and reports tools and mcp servers', async () => {
		await provider._processJsonStreamData({
			type: 'system', subtype: 'init', session_id: 'sess-abc',
			tools: ['Bash', 'Read'], mcp_servers: [{ name: 'probe', status: 'connected' }]
		});
		assert.strictEqual(provider._currentSessionId, 'sess-abc');
		const info = firstOf('sessionInfo');
		assert.ok(info, `no sessionInfo in ${typesSent()}`);
		assert.deepStrictEqual(info.data.tools, ['Bash', 'Read']);
		assert.strictEqual(info.data.mcpServers[0].name, 'probe');
	});

	test('init with no tools or servers does not produce undefined', async () => {
		await provider._processJsonStreamData({ type: 'system', subtype: 'init', session_id: 's' });
		const info = firstOf('sessionInfo');
		assert.deepStrictEqual(info.data.tools, []);
		assert.deepStrictEqual(info.data.mcpServers, []);
	});

	test('status compacting turns the indicator on, null turns it off', async () => {
		await provider._processJsonStreamData({ type: 'system', subtype: 'status', status: 'compacting' });
		assert.strictEqual(firstOf('compacting').data.isCompacting, true);

		sent = [];
		await provider._processJsonStreamData({ type: 'system', subtype: 'status', status: null });
		assert.strictEqual(firstOf('compacting').data.isCompacting, false);
	});

	test('compact_boundary RESETS the token counters', async () => {
		provider._totalTokensInput = 5000;
		provider._totalTokensOutput = 900;
		await provider._processJsonStreamData({
			type: 'system', subtype: 'compact_boundary',
			compact_metadata: { trigger: 'auto', pre_tokens: 5900 }
		});
		assert.strictEqual(provider._totalTokensInput, 0, 'input tokens survived the compaction');
		assert.strictEqual(provider._totalTokensOutput, 0, 'output tokens survived the compaction');
		const b = firstOf('compactBoundary');
		assert.strictEqual(b.data.trigger, 'auto');
		assert.strictEqual(b.data.preTokens, 5900);
	});

	test('an unknown system subtype is ignored rather than throwing', async () => {
		await provider._processJsonStreamData({ type: 'system', subtype: 'something_new' });
		assert.deepStrictEqual(sent, []);
	});
});

suite('stream: assistant events', () => {
	setup(async () => harness());
	teardown(() => restore.forEach(f => f()));

	test('usage accumulates and reports cache tokens', async () => {
		await provider._processJsonStreamData({
			type: 'assistant',
			message: {
				usage: {
					input_tokens: 100, output_tokens: 20,
					cache_creation_input_tokens: 7, cache_read_input_tokens: 3
				},
				content: []
			}
		});
		const t = firstOf('updateTokens');
		assert.strictEqual(t.data.currentInputTokens, 100);
		assert.strictEqual(t.data.cacheCreationTokens, 7);
		assert.strictEqual(t.data.cacheReadTokens, 3);

		sent = [];
		await provider._processJsonStreamData({
			type: 'assistant',
			message: { usage: { input_tokens: 50, output_tokens: 5 }, content: [] }
		});
		assert.strictEqual(firstOf('updateTokens').data.totalTokensInput, 150, 'totals did not accumulate');
	});

	test('text content is rendered, whitespace-only text is not', async () => {
		await provider._processJsonStreamData({
			type: 'assistant', message: { content: [{ type: 'text', text: '  hello  ' }] }
		});
		assert.strictEqual(firstOf('output').data, 'hello');

		sent = [];
		await provider._processJsonStreamData({
			type: 'assistant', message: { content: [{ type: 'text', text: '   \n  ' }] }
		});
		assert.ok(!typesSent().includes('output'), 'blank text produced an empty bubble');
	});

	test('thinking content is rendered on its own channel', async () => {
		await provider._processJsonStreamData({
			type: 'assistant', message: { content: [{ type: 'thinking', thinking: 'let me consider' }] }
		});
		assert.strictEqual(firstOf('thinking').data, 'let me consider');
	});

	test('tool_use is reported with its name and input', async () => {
		await provider._processJsonStreamData({
			type: 'assistant',
			message: { content: [{ type: 'tool_use', id: 't1', name: 'Bash', input: { command: 'ls' } }] }
		});
		const u = firstOf('toolUse');
		assert.strictEqual(u.data.toolName, 'Bash');
		assert.strictEqual(u.data.rawInput.command, 'ls');
	});

	test('an Edit captures the file contents BEFORE the edit', async () => {
		// The diff view depends on this snapshot; once the tool runs, the original
		// is gone from disk and cannot be recovered.
		const ws = vscode.workspace.workspaceFolders![0].uri.fsPath;
		const target = path.join(ws, 'stream-edit-probe.txt');
		fs.writeFileSync(target, 'line one\nline two\nline three\n');
		try {
			await provider._processJsonStreamData({
				type: 'assistant',
				message: {
					content: [{
						type: 'tool_use', id: 't2', name: 'Edit',
						input: { file_path: target, old_string: 'line two', new_string: 'LINE TWO' }
					}]
				}
			});
			const u = firstOf('toolUse');
			assert.ok(u.data.fileContentBefore?.includes('line two'),
				'the pre-edit snapshot was not captured');
			assert.strictEqual(u.data.startLine, 2, 'wrong start line for the edit');
		} finally {
			fs.rmSync(target, { force: true });
		}
	});

	test('a MultiEdit reports a start line per edit', async () => {
		const ws = vscode.workspace.workspaceFolders![0].uri.fsPath;
		const target = path.join(ws, 'stream-multiedit-probe.txt');
		fs.writeFileSync(target, 'alpha\nbravo\ncharlie\ndelta\n');
		try {
			await provider._processJsonStreamData({
				type: 'assistant',
				message: {
					content: [{
						type: 'tool_use', id: 't3', name: 'MultiEdit',
						input: {
							file_path: target,
							edits: [
								{ old_string: 'bravo', new_string: 'BRAVO' },
								{ old_string: 'delta', new_string: 'DELTA' }
							]
						}
					}]
				}
			});
			const u = firstOf('toolUse');
			assert.deepStrictEqual(u.data.startLines, [2, 4]);
		} finally {
			fs.rmSync(target, { force: true });
		}
	});

	test('an auth-failure assistant event triggers the login flow exactly once', async () => {
		// _openLoginTerminal spawns `claude /login`, which opens a browser. Stub it.
		let terminals = 0;
		stub('_openLoginTerminal', () => { terminals++; });
		stub('_checkFeatureFlags', async () => false);

		const evt = { type: 'assistant', error: 'authentication_failed', message: { content: [] } };
		await provider._processJsonStreamData(evt);
		await provider._processJsonStreamData(evt);   // same turn, second event

		assert.strictEqual(terminals, 1, 'the login prompt fired more than once for one turn');
		assert.strictEqual(provider._isProcessing, false, 'the spinner was left running');
		assert.ok(typesSent().includes('loginRequired'), `no loginRequired in ${typesSent()}`);
	});

	test('with OpenCredits available the login flow offers options instead of a terminal', async () => {
		let terminals = 0;
		stub('_openLoginTerminal', () => { terminals++; });
		stub('_checkFeatureFlags', async () => true);

		await provider._processJsonStreamData({
			type: 'assistant', error: 'authentication_failed', message: { content: [] }
		});
		assert.strictEqual(terminals, 0, 'opened a login terminal despite OpenCredits being available');
		assert.ok(typesSent().includes('showLoginOptions'));
	});
});

suite('stream: user (tool result) events', () => {
	setup(async () => harness());
	teardown(() => restore.forEach(f => f()));

	test('a tool result is rendered', async () => {
		await provider._processJsonStreamData({
			type: 'user',
			message: { content: [{ type: 'tool_result', tool_use_id: 't1', content: 'file1\nfile2' }] }
		});
		const r = firstOf('toolResult');
		assert.ok(r, `no toolResult in ${typesSent()}`);
		assert.ok(String(r.data.content).includes('file1'));
		assert.strictEqual(r.data.isError, false);
	});

	test('an errored tool result is flagged as an error', async () => {
		await provider._processJsonStreamData({
			type: 'user',
			message: {
				content: [{
					type: 'tool_result', tool_use_id: 't1',
					content: 'No such file or directory', is_error: true
				}]
			}
		});
		assert.strictEqual(firstOf('toolResult').data.isError, true);
	});

	test('a structured (non-string) tool result is stringified, not dropped', async () => {
		await provider._processJsonStreamData({
			type: 'user',
			message: {
				content: [{
					type: 'tool_result', tool_use_id: 't1',
					content: [{ type: 'text', text: 'nested payload' }]
				}]
			}
		});
		const r = firstOf('toolResult');
		assert.ok(r && String(r.data.content).includes('nested payload'),
			'structured tool output never reached the UI');
	});
});

suite('stream: result events', () => {
	setup(async () => harness());
	teardown(() => restore.forEach(f => f()));

	test('a successful result counts the request and clears processing', async () => {
		await provider._processJsonStreamData({
			type: 'result', subtype: 'success', session_id: 's1',
			is_error: false, total_cost_usd: 0.0123
		});
		assert.strictEqual(provider._requestCount, 1);
		assert.ok(Math.abs(provider._totalCost - 0.0123) < 1e-9);
		assert.strictEqual(provider._isProcessing, false);

		const totals = firstOf('updateTotals');
		assert.strictEqual(totals.data.requestCount, 1);
	});

	test('an errored result does NOT count toward the request total', async () => {
		await provider._processJsonStreamData({
			type: 'result', subtype: 'success', session_id: 's1',
			is_error: true, result: 'rate limit exceeded'
		});
		assert.strictEqual(provider._requestCount, 0,
			'a failed turn was counted as a successful request');
		const err = firstOf('error');
		assert.ok(err && String(err.data).includes('rate limit'),
			`the error text never reached the UI: ${typesSent()}`);
	});

	test('a non-success subtype clears the spinner — the 881874a fix', async () => {
		// error_during_execution / error_max_turns hit no other branch. Without
		// this the turn ends silently: _isProcessing stays true, the composer stays
		// disabled, and only a window reload recovers.
		for (const subtype of ['error_max_turns', 'error_during_execution']) {
			sent = [];
			provider._isProcessing = true;
			await provider._processJsonStreamData({
				type: 'result', subtype, result: `stopped: ${subtype}`
			});
			assert.strictEqual(provider._isProcessing, false,
				`${subtype} left the spinner running`);
			const sp = sent.filter(m => m.type === 'setProcessing');
			assert.ok(sp.length > 0 && sp[sp.length - 1].data.isProcessing === false,
				`${subtype} never told the webview to stop processing`);
			assert.ok(sent.some(m => m.type === 'error' && String(m.data).includes(subtype)),
				`${subtype} produced no explanation for the user`);
		}
	});

	test('a 401 result is caught by the auth backstop', async () => {
		let terminals = 0;
		stub('_openLoginTerminal', () => { terminals++; });
		stub('_checkFeatureFlags', async () => false);

		await provider._processJsonStreamData({
			type: 'result', subtype: 'error_during_execution',
			is_error: true, api_error_status: 401, result: 'unauthorized'
		});
		assert.strictEqual(terminals, 1, 'a 401 did not trigger the login flow');
	});

	test('a malformed or unknown event does not throw', async () => {
		for (const bad of [{}, { type: 'nope' }, { type: 'assistant' },
			{ type: 'user' }, { type: 'result' }, { type: 'assistant', message: {} }]) {
			await provider._processJsonStreamData(bad);
		}
		assert.ok(true, 'parser survived malformed input');
	});
});
