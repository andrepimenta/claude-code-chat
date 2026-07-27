// Unit tests for the #56 settings-batch fix (applySettingsBatch). Pure (no vscode, no
// network, no filesystem access), so these run under plain mocha against the compiled
// out/ output -- same pattern as restore-commit-utils/perm-log-redact/markdown-restore.
// The first two suites are the actual regression coverage for the bug: a key that
// throws must not abort the keys after it, unlike the pre-#56 single try/catch loop
// (extension.ts's old _updateSettings, which broke out of the whole batch on the first
// config.update() rejection and only ever recorded that one failure). Run with
// `npm run test:settings-batch`.

import * as assert from 'assert';
import { applySettingsBatch } from '../settings-batch';

suite('settings-batch: applySettingsBatch (all keys succeed)', () => {

	test('every key is applied in order, with an empty failures list', async () => {
		const seen: Array<[string, any]> = [];
		const result = await applySettingsBatch(
			{ 'ui.compactMode': true, 'ui.fontSize': 14, 'wsl.distro': 'Ubuntu' },
			async (key, value) => { seen.push([key, value]); }
		);
		assert.deepStrictEqual(result.applied, ['ui.compactMode', 'ui.fontSize', 'wsl.distro']);
		assert.deepStrictEqual(result.failures, []);
		assert.deepStrictEqual(seen, [['ui.compactMode', true], ['ui.fontSize', 14], ['wsl.distro', 'Ubuntu']],
			'updateSetting must still be called with the original key/value pairs');
	});
});

suite('settings-batch: applySettingsBatch (#56 -- a failing key must not abort the rest)', () => {

	test('a key that throws is recorded as a failure, and every key after it is still applied', async () => {
		const result = await applySettingsBatch(
			{ 'ui.renderMath': true, 'ui.fontFamily': 'monospace', 'ui.fontSize': 14, 'diff.autoOpen': true },
			async (key) => {
				if (key === 'ui.renderMath') {
					throw new Error('config not registered');
				}
			}
		);
		assert.deepStrictEqual(result.applied, ['ui.fontFamily', 'ui.fontSize', 'diff.autoOpen'],
			'keys after the failing one must still be applied, not silently dropped (the real #56 scenario)');
		assert.deepStrictEqual(result.failures, [{ key: 'ui.renderMath', message: 'config not registered' }]);
	});

	test('a failing key in the middle of the batch still lets both earlier and later keys succeed', async () => {
		const result = await applySettingsBatch(
			{ first: 1, second: 2, third: 3 },
			async (key) => {
				if (key === 'second') {
					throw new Error('boom');
				}
			}
		);
		assert.deepStrictEqual(result.applied, ['first', 'third']);
		assert.deepStrictEqual(result.failures, [{ key: 'second', message: 'boom' }]);
	});
});

suite('settings-batch: applySettingsBatch (multiple failing keys)', () => {

	test('all failures are collected, in the order they were attempted, applied keys unaffected', async () => {
		const result = await applySettingsBatch(
			{ a: 1, b: 2, c: 3, d: 4 },
			async (key) => {
				if (key === 'a' || key === 'c') {
					throw new Error(`bad key ${key}`);
				}
			}
		);
		assert.deepStrictEqual(result.applied, ['b', 'd']);
		assert.deepStrictEqual(result.failures, [
			{ key: 'a', message: 'bad key a' },
			{ key: 'c', message: 'bad key c' }
		]);
	});
});

suite('settings-batch: applySettingsBatch (empty batch)', () => {

	test('an empty settings object resolves with empty applied/failures and never calls updateSetting', async () => {
		let calls = 0;
		const result = await applySettingsBatch({}, async () => { calls++; });
		assert.deepStrictEqual(result, { applied: [], failures: [] });
		assert.strictEqual(calls, 0);
	});
});

suite('settings-batch: applySettingsBatch (error normalization)', () => {

	test('an Error instance uses its .message', async () => {
		const result = await applySettingsBatch({ k: 1 }, async () => { throw new Error('boom'); });
		assert.strictEqual(result.failures[0].message, 'boom');
	});

	test('a thrown plain string is used as the message as-is', async () => {
		// Promise.reject(...), not a "throw" statement, so a rejection with a
		// non-Error value (deliberate here, to exercise toErrorMessage's
		// non-Error branch) doesn't trip the no-throw-literal lint rule.
		const result = await applySettingsBatch({ k: 1 }, () => Promise.reject('plain string error'));
		assert.strictEqual(result.failures[0].message, 'plain string error');
	});

	test('a thrown undefined is converted to the text "undefined", never left as an actual undefined value', async () => {
		const result = await applySettingsBatch({ k: 1 }, () => Promise.reject(undefined));
		assert.strictEqual(result.failures[0].message, 'undefined');
		assert.strictEqual(typeof result.failures[0].message, 'string');
	});

	test('a rejected plain object without a .message property still yields a string, not a throw', async () => {
		const result = await applySettingsBatch({ k: 1 }, () => Promise.reject({ code: 'EFAIL' }));
		assert.strictEqual(typeof result.failures[0].message, 'string');
	});
});

suite('settings-batch: applySettingsBatch (onSettled hook, opus-review point 1 -- per-key perm-log chronology)', () => {

	test('onSettled fires once per key, right after it settles, in attempt order, with no error argument on success', async () => {
		const events: Array<[string, unknown, unknown]> = [];
		await applySettingsBatch(
			{ a: 1, b: 2 },
			async () => { /* always succeeds */ },
			(key, value, error) => { events.push([key, value, error]); }
		);
		assert.deepStrictEqual(events, [['a', 1, undefined], ['b', 2, undefined]]);
	});

	test('onSettled receives the exact normalized message failures[] carries for a failing key, interleaved with the surrounding successes', async () => {
		const events: Array<[string, unknown, unknown]> = [];
		const result = await applySettingsBatch(
			{ a: 1, b: 2, c: 3 },
			async (key) => {
				if (key === 'b') {
					throw new Error('boom');
				}
			},
			(key, value, error) => { events.push([key, value, error]); }
		);
		assert.deepStrictEqual(events, [['a', 1, undefined], ['b', 2, 'boom'], ['c', 3, undefined]]);
		assert.strictEqual(result.failures[0].message, 'boom');
	});
});

suite('settings-batch: applySettingsBatch (malformed input -- the outer safety-net catch in extension.ts)', () => {

	test("a nullish settings object rejects instead of resolving silently -- the only way out of this module into a caller's outer try/catch (extension.ts's key=<batch> marker)", async () => {
		await assert.rejects(
			() => applySettingsBatch(undefined as any, async () => { /* never reached */ }),
			/Cannot convert undefined or null to object/
		);
	});
});
