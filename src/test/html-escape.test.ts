// Unit tests for the fork-issue-49 attribute escaper (escapeAttr). Pure (no vscode, no network, no
// DOM), so these run under plain mocha against the compiled out/ output -- same pattern as
// diff-utils/shell-utils/auto-model-switch/math-segments/collapse-rules. escapeHtml() in
// script.ts serialises through textContent->innerHTML and therefore leaves " and ' untouched,
// which is fine for element content but not for title="..."/data-*="..." attribute values --
// escapeAttr() is the dedicated fix for that sink. The first suite covers plain character
// escaping (including the "&" -must-come-first ordering), the second covers edge cases
// (attribute breakout, empty/null/undefined/number input), and the third proves both that the
// escaping is information-preserving (roundtrip against a browser-style attribute decoder) and
// that the function still works with zero module context -- exactly how script.ts's
// .toString() splice runs it in the webview. Run with `npm run test:html-escape`.

import * as assert from 'assert';
import { escapeAttr } from '../html-escape';

suite('html-escape: escapeAttr (character escaping)', () => {

	test('" is escaped to &quot; (the case escapeHtml does not cover)', () => {
		assert.strictEqual(escapeAttr('"'), '&quot;');
	});

	test("' is escaped to &#39;", () => {
		assert.strictEqual(escapeAttr('\''), '&#39;');
	});

	test('<b>hi is escaped to &lt;b&gt;hi', () => {
		assert.strictEqual(escapeAttr('<b>hi'), '&lt;b&gt;hi');
	});

	test('& is escaped to &amp;', () => {
		assert.strictEqual(escapeAttr('&'), '&amp;');
	});

	test('&amp; is escaped to &amp;amp; (entity text survives, no information loss)', () => {
		assert.strictEqual(escapeAttr('&amp;'), '&amp;amp;');
	});

	test('&&<<"" is escaped to &amp;&amp;&lt;&lt;&quot;&quot; (proves "&" runs first)', () => {
		assert.strictEqual(escapeAttr('&&<<""'), '&amp;&amp;&lt;&lt;&quot;&quot;');
	});
});

suite('html-escape: escapeAttr (edge cases)', () => {

	test('an attribute-breakout attempt (" onmouseover="alert(1)) leaves no raw " in the result', () => {
		const result = escapeAttr('" onmouseover="alert(1)');
		assert.ok(!result.includes('"'), 'result must not contain a raw "; got: ' + result);
	});

	test('an empty string stays an empty string', () => {
		assert.strictEqual(escapeAttr(''), '');
	});

	test('null and undefined both become an empty string', () => {
		assert.strictEqual(escapeAttr(null), '');
		assert.strictEqual(escapeAttr(undefined), '');
	});

	test('a number is stringified (42 -> "42")', () => {
		assert.strictEqual(escapeAttr(42), '42');
	});
});

suite('html-escape: escapeAttr (roundtrip / splice sandbox)', () => {

	test('roundtrip: decoding escapeAttr(x) the way a browser decodes an attribute value returns x unchanged', () => {
		// &amp; deliberately decoded LAST -- exactly the order a browser's attribute
		// parser uses, and the mirror image of escapeAttr() encoding "&" FIRST.
		function decodeAttr(s: string): string {
			return s
				.replace(/&lt;/g, '<')
				.replace(/&gt;/g, '>')
				.replace(/&quot;/g, '"')
				.replace(/&#39;/g, '\'')
				.replace(/&amp;/g, '&');
		}
		const x = 'echo "<b>&amp;</b>"';
		assert.strictEqual(decodeAttr(escapeAttr(x)), x);
	});

	test('escapeAttr still works when spliced into a Function body with zero module context, matching the real call', () => {
		const spliced = new Function(escapeAttr.toString() + '\nreturn escapeAttr(arguments[0]);');
		assert.strictEqual(spliced('a"<b>&'), escapeAttr('a"<b>&'));
	});
});
