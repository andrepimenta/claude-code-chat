// Unit tests for the fork-issue-50 checkpoint-restore fix (isValidCommitSha,
// findRehydratedCommitInfo). Pure (no vscode, no network, no filesystem access), so
// these run under plain mocha against the compiled out/ output -- same pattern as
// diff-utils/model-updater. The actual "does this commit still exist"
// check (git cat-file -e against the shadow backup repo) stays in extension.ts,
// untested here, same as diff-utils' git-show baseline read. Run with
// `npm run test:restore-commit-utils`.

import * as assert from 'assert';
import { isValidCommitSha, findRehydratedCommitInfo } from '../restore-commit-utils';

suite('restore-commit-utils: isValidCommitSha', () => {

	test('a full 40-char SHA-1 (as produced by `git rev-parse HEAD`) is valid', () => {
		assert.strictEqual(isValidCommitSha('a'.repeat(40)), true);
	});

	test('a full 64-char SHA-256 is valid', () => {
		assert.strictEqual(isValidCommitSha('a'.repeat(64)), true);
	});

	test('is case-insensitive (uppercase hex is valid)', () => {
		assert.strictEqual(isValidCommitSha('ABCDEF0123456789abcdef0123456789abcdef01'), true);
	});

	test('a 7-char abbreviation is valid (shortest git itself would treat as unambiguous)', () => {
		assert.strictEqual(isValidCommitSha('abcdef1'), true);
	});

	test('shorter than 7 chars is rejected', () => {
		assert.strictEqual(isValidCommitSha('abcde'), false);
	});

	test('longer than 64 chars is rejected', () => {
		assert.strictEqual(isValidCommitSha('a'.repeat(65)), false);
	});

	test('empty string is rejected', () => {
		assert.strictEqual(isValidCommitSha(''), false);
	});

	test('a shell-metacharacter injection attempt is rejected', () => {
		assert.strictEqual(isValidCommitSha('deadbeef; rm -rf /'), false);
	});

	test('a sha with a trailing quote (attribute-breakout style) is rejected', () => {
		assert.strictEqual(isValidCommitSha('deadbeef"'), false);
	});
});

suite('restore-commit-utils: findRehydratedCommitInfo', () => {

	const sha = 'deadbeef00112233445566778899aabbccddeeff';

	test('rehydrates message/timestamp from the matching showRestoreOption entry', () => {
		const messages = [
			{ messageType: 'userInput', data: 'hi' },
			{ messageType: 'showRestoreOption', data: { id: 'commit-1', sha, message: 'Before: fix bug', timestamp: '2026-07-27T10:00:00.000Z' } }
		];
		assert.deepStrictEqual(findRehydratedCommitInfo(messages, sha), {
			id: 'commit-1',
			sha,
			message: 'Before: fix bug',
			timestamp: '2026-07-27T10:00:00.000Z'
		});
	});

	test('ignores a showRestoreOption entry for a different sha', () => {
		const messages = [
			{ messageType: 'showRestoreOption', data: { id: 'commit-1', sha: 'other'.padEnd(40, '0'), message: 'Before: other', timestamp: '2026-07-27T10:00:00.000Z' } }
		];
		const result = findRehydratedCommitInfo(messages, sha);
		assert.strictEqual(result.message, sha, 'must fall back to the placeholder, not the other entry');
	});

	test('ignores a non-showRestoreOption message whose data coincidentally has a matching sha field', () => {
		const messages = [
			{ messageType: 'toolResult', data: { sha, message: 'not a checkpoint' } }
		];
		const result = findRehydratedCommitInfo(messages, sha);
		assert.strictEqual(result.message, sha, 'must fall back to the placeholder, not the unrelated entry');
	});

	test('falls back to id `commit-<sha>` when the matched entry has no id field', () => {
		const messages = [
			{ messageType: 'showRestoreOption', data: { sha, message: 'Before: fix bug', timestamp: '2026-07-27T10:00:00.000Z' } }
		];
		const result = findRehydratedCommitInfo(messages, sha);
		assert.strictEqual(result.id, `commit-${sha}`);
		assert.strictEqual(result.message, 'Before: fix bug');
	});

	test('falls back to a sha-based placeholder when the matched entry has a non-string message (malformed data)', () => {
		const messages = [
			{ messageType: 'showRestoreOption', data: { sha, message: 42, timestamp: '2026-07-27T10:00:00.000Z' } }
		];
		const result = findRehydratedCommitInfo(messages, sha);
		assert.strictEqual(result.message, sha);
		assert.strictEqual(result.id, `commit-${sha}`);
	});

	test('falls back to a sha-based placeholder with a valid timestamp when no entry matches at all', () => {
		const result = findRehydratedCommitInfo([], sha);
		assert.deepStrictEqual(result, {
			id: `commit-${sha}`,
			sha,
			message: sha,
			timestamp: result.timestamp
		});
		assert.notStrictEqual(new Date(result.timestamp).toString(), 'Invalid Date');
	});
});
