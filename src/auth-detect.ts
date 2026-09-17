/**
 * Auth-failure detection for Claude Code's stream-json stream.
 *
 * Structural, not textual, and deliberately so. Verified against a real
 * captured failure (`claude -p --output-format stream-json`, logged out):
 *
 *   {"type":"assistant","message":{"model":"<synthetic>",
 *     "content":[{"type":"text","text":"Not logged in · Please run /login"}]},
 *    "error":"authentication_failed","is_api_error_message":true}
 *
 *   {"type":"result","subtype":"success","is_error":true,
 *    "api_error_status":null,"terminal_reason":"api_error",
 *    "result":"Not logged in · Please run /login"}
 *
 * Three things that capture settles:
 *  - `error: "authentication_failed"` on the ASSISTANT event is the reliable
 *    marker, and it arrives first.
 *  - `api_error_status` is null here, not 401 — so a 401 test alone never fires
 *    for a logged-out user. It is kept only as a backstop for endpoints that do
 *    return a real HTTP 401.
 *  - The previous text matching was both dead (it looked for a different
 *    string than the CLI actually emits) and dangerous: the `/login` substring
 *    matched ordinary file paths such as `src/login/index.ts`, throwing a login
 *    modal at users who were merely editing a login page.
 *
 * `is_api_error_message` is intentionally NOT treated as an auth signal: it
 * marks any API error message, so rate limits and 5xx would trigger the login
 * flow too.
 */

/** True when an assistant event reports an authentication failure. */
export function isAuthFailureAssistantEvent(evt: any): boolean {
	return !!evt && evt.type === 'assistant' && evt.error === 'authentication_failed';
}

/**
 * True when a result event carries a genuine HTTP 401. A logged-out CLI does
 * NOT hit this path (api_error_status is null); it exists for endpoints that
 * surface a real 401, and is safe to keep because callers dedupe.
 */
export function isAuthFailureResult(evt: any): boolean {
	return !!evt && evt.type === 'result' && evt.is_error === true && evt.api_error_status === 401;
}
