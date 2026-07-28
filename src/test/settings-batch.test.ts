// Unit tests for the fork-issue-59 updateWithWorkspaceThenGlobalFallback fix. Pure (no vscode, no
// network, no filesystem access), so these run under plain mocha against the compiled
// out/ output. Run with `npm run test:settings-batch`.
//
// Note: upstream (fork) also has applySettingsBatch tests in this file for a separate,
// unrelated fix (fork-issue-56, whole-settings-batch loop resilience) that is not part of this
// security-hardening branch and is intentionally not included here.

import * as assert from 'assert';
import { updateWithWorkspaceThenGlobalFallback } from '../settings-batch';

// fork-issue-59: updateWithWorkspaceThenGlobalFallback -- the pure decision logic behind
// permissions.yoloMode's workspace-then-global fallback, shared by _enableYoloMode and
// _updateSettings. Before fork-issue-59, _enableYoloMode had no fallback at all (a Workspace-scope
// write failing, e.g. no workspace folder open, meant the setting was silently never
// persisted while the webview still showed "YOLO Mode enabled!"); these tests pin the
// three outcomes a caller needs to distinguish: workspace succeeds, workspace fails but
// global saves it, and both fail (the case that must never be reported as success).
suite('settings-batch: updateWithWorkspaceThenGlobalFallback (workspace succeeds)', () => {

	test('the workspace callback is used and global is never attempted', async () => {
		let globalCalls = 0;
		const result = await updateWithWorkspaceThenGlobalFallback(
			async () => { /* succeeds */ },
			async () => { globalCalls++; }
		);
		assert.deepStrictEqual(result, { succeeded: true, scope: 'workspace' });
		assert.strictEqual(globalCalls, 0, 'global must not be attempted when workspace already succeeded');
	});
});

suite('settings-batch: updateWithWorkspaceThenGlobalFallback (workspace throws, global fallback saves it)', () => {

	test('a workspace failure -- e.g. no workspace folder open -- falls back to global and still reports success', async () => {
		const result = await updateWithWorkspaceThenGlobalFallback(
			() => Promise.reject(new Error('Unable to write to Workspace Settings because no workspace is opened')),
			async () => { /* global succeeds */ }
		);
		assert.strictEqual(result.succeeded, true, 'fork-issue-59: this is exactly the case the old _enableYoloMode (no fallback at all) silently lost');
		assert.strictEqual(result.scope, 'global');
		assert.strictEqual(result.workspaceError, 'Unable to write to Workspace Settings because no workspace is opened');
	});
});

suite('settings-batch: updateWithWorkspaceThenGlobalFallback (both attempts throw)', () => {

	test('a double failure is reported as NOT succeeded, with both error messages preserved -- never treated as success', async () => {
		const result = await updateWithWorkspaceThenGlobalFallback(
			() => Promise.reject(new Error('workspace boom')),
			() => Promise.reject(new Error('global boom'))
		);
		assert.strictEqual(result.succeeded, false, 'fork-issue-59: a caller (e.g. the webview YOLO Mode enabled! message) must never treat this as success');
		assert.strictEqual(result.scope, 'global');
		assert.strictEqual(result.workspaceError, 'workspace boom');
		assert.strictEqual(result.globalError, 'global boom');
	});

	test('non-Error rejections are still normalized to strings on both sides', async () => {
		const result = await updateWithWorkspaceThenGlobalFallback(
			() => Promise.reject('plain workspace error'),
			() => Promise.reject(undefined)
		);
		assert.strictEqual(result.succeeded, false);
		assert.strictEqual(result.workspaceError, 'plain workspace error');
		assert.strictEqual(result.globalError, 'undefined');
	});
});
