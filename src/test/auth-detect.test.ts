// Auth-failure detection, pinned to a REAL captured stream-json failure.
//
// auth-detect.ts imports nothing from vscode, so this runs under plain mocha
// against the compiled out/ output, same as the model-updater suite.

import * as assert from 'assert';
import { isAuthFailureAssistantEvent, isAuthFailureResult } from '../auth-detect';

// Verbatim from `claude -p --output-format stream-json --verbose hello` while
// logged out. Trimmed to the fields the detector reads; nothing else altered.
const REAL_ASSISTANT_EVENT = {
	type: 'assistant',
	message: {
		model: '<synthetic>',
		role: 'assistant',
		content: [{ type: 'text', text: 'Not logged in · Please run /login' }]
	},
	error: 'authentication_failed',
	is_api_error_message: true
};

const REAL_RESULT_EVENT = {
	type: 'result',
	subtype: 'success',      // note: 'success' even though is_error is true
	is_error: true,
	api_error_status: null,  // NOT 401 — a 401-only test would never fire
	terminal_reason: 'api_error',
	result: 'Not logged in · Please run /login'
};

// Second real capture: a valid login whose OAuth session has expired. Different
// wording, same structural marker — this is the case the old text patterns
// missed entirely (no '/login', no 'Not logged in', and the phrasing differs
// from the exact string the old full-match looked for).
const REAL_EXPIRED_SESSION_EVENT = {
	type: 'assistant',
	message: {
		model: '<synthetic>',
		role: 'assistant',
		content: [{ type: 'text', text: 'Failed to authenticate: OAuth session expired and could not be refreshed' }]
	},
	error: 'authentication_failed',
	is_api_error_message: true
};

const REAL_EXPIRED_SESSION_RESULT = {
	type: 'result',
	subtype: 'success',
	is_error: true,
	api_error_status: null,
	terminal_reason: 'api_error',
	result: 'Failed to authenticate: OAuth session expired and could notbe refreshed'
};

suite('auth-detect: structural login detection', () => {

	test('detects the real logged-out assistant event', () => {
		assert.strictEqual(isAuthFailureAssistantEvent(REAL_ASSISTANT_EVENT), true);
	});

	test('detects the real EXPIRED SESSION assistant event', () => {
		assert.strictEqual(isAuthFailureAssistantEvent(REAL_EXPIRED_SESSION_EVENT), true);
	});

	test('both real failure modes share one structural marker', () => {
		// Wording differs between them; the field does not. That is precisely why
		// detection keys off the field and not the text.
		for (const evt of [REAL_ASSISTANT_EVENT, REAL_EXPIRED_SESSION_EVENT]) {
			assert.strictEqual(evt.error, 'authentication_failed');
			assert.strictEqual(isAuthFailureAssistantEvent(evt), true);
		}
		assert.notStrictEqual(
			REAL_ASSISTANT_EVENT.message.content[0].text,
			REAL_EXPIRED_SESSION_EVENT.message.content[0].text);
	});

	test('expired-session result also reports api_error_status null', () => {
		assert.strictEqual(REAL_EXPIRED_SESSION_RESULT.api_error_status, null);
		assert.strictEqual(isAuthFailureResult(REAL_EXPIRED_SESSION_RESULT), false);
	});

	test('the real result event is NOT a 401 — assistant event is the detector', () => {
		// Documents why the assistant event must stay: the result carries
		// api_error_status null, so the backstop cannot fire for a logged-out CLI.
		assert.strictEqual(REAL_RESULT_EVENT.api_error_status, null);
		assert.strictEqual(isAuthFailureResult(REAL_RESULT_EVENT), false);
	});

	test('a genuine HTTP 401 result is still caught by the backstop', () => {
		assert.strictEqual(isAuthFailureResult({
			type: 'result', subtype: 'success', is_error: true, api_error_status: 401
		}), true);
	});

	test('file paths containing /login never trigger a login prompt', () => {
		// The regression this replaced: '/login' was matched as a bare substring,
		// so ordinary build errors threw an auth modal at the user.
		const paths = [
			"ENOENT: no such file or directory, open 'src/login/index.ts'",
			'TypeError in app/routes/login.ts',
			'Cannot resolve module "./auth/login"',
			'Build failed: pages/login/page.tsx has a syntax error'
		];
		for (const text of paths) {
			assert.strictEqual(isAuthFailureResult(
				{ type: 'result', is_error: true, api_error_status: null, result: text }), false, text);
			assert.strictEqual(isAuthFailureAssistantEvent(
				{ type: 'assistant', message: { content: [{ type: 'text', text }] } }), false, text);
		}
	});

	test('other API errors do not trigger the login flow', () => {
		// is_api_error_message marks ANY api error, so it must not be an auth
		// signal on its own — rate limits and 5xx would open the login modal.
		assert.strictEqual(isAuthFailureAssistantEvent({
			type: 'assistant', error: 'rate_limit_error', is_api_error_message: true
		}), false);
		assert.strictEqual(isAuthFailureResult({
			type: 'result', is_error: true, api_error_status: 500
		}), false);
	});

	test('successful turns are never auth failures', () => {
		assert.strictEqual(isAuthFailureResult({
			type: 'result', subtype: 'success', is_error: false, api_error_status: null,
			result: 'Hi! What can I help you with today?'
		}), false);
		assert.strictEqual(isAuthFailureAssistantEvent({
			type: 'assistant', message: { content: [{ type: 'text', text: 'done' }] }
		}), false);
	});

	test('malformed or empty events are handled safely', () => {
		for (const bad of [null, undefined, {}, { type: 'system' }, { type: 'result' }]) {
			assert.strictEqual(isAuthFailureAssistantEvent(bad), false);
			assert.strictEqual(isAuthFailureResult(bad), false);
		}
	});
});
