// Unit tests for the #48 collapsible-code-blocks logic (normalizeCollapseThreshold /
// evaluateCodeBlockCollapse). Pure (no vscode, no network, no filesystem access), so these
// run under plain mocha against the compiled out/ output -- same pattern as
// diff-utils/shell-utils/auto-model-switch/math-segments. The first suite covers
// evaluateCodeBlockCollapse's line-counting edge cases (trailing newline, CRLF, empty
// input, a single very long line), the second covers normalizeCollapseThreshold's
// default/clamp behaviour, and the third is the splice-sandbox test that proves both
// functions still work with zero module context -- exactly how collapse-script.ts's
// .toString() splice runs them in the webview. Run with `npm run test:collapse-rules`.

import * as assert from 'assert';
import { evaluateCodeBlockCollapse, normalizeCollapseThreshold } from '../collapse-rules';

suite('collapse-rules: evaluateCodeBlockCollapse (line counting)', () => {

	test('3 lines at a threshold of 20 stay uncollapsed', () => {
		const info = evaluateCodeBlockCollapse('a\nb\nc\n', 20);
		assert.strictEqual(info.lineCount, 3);
		assert.strictEqual(info.collapse, false);
	});

	test('exactly 20 lines at a threshold of 20 stay uncollapsed (strictly-greater-than collapses)', () => {
		const twentyLines = new Array(20).fill('x').join('\n') + '\n';
		const info = evaluateCodeBlockCollapse(twentyLines, 20);
		assert.strictEqual(info.lineCount, 20);
		assert.strictEqual(info.collapse, false);
	});

	test('21 lines at a threshold of 20 collapses', () => {
		const twentyOneLines = new Array(21).fill('x').join('\n') + '\n';
		const info = evaluateCodeBlockCollapse(twentyOneLines, 20);
		assert.strictEqual(info.lineCount, 21);
		assert.strictEqual(info.collapse, true);
	});

	test('a trailing newline does not count as an extra line ("a\\nb\\n" is 2 lines, not 3)', () => {
		assert.strictEqual(evaluateCodeBlockCollapse('a\nb\n', 20).lineCount, 2);
	});

	test('CRLF line endings are normalized before counting ("a\\r\\nb\\r\\nc" is 3 lines)', () => {
		assert.strictEqual(evaluateCodeBlockCollapse('a\r\nb\r\nc', 20).lineCount, 3);
	});

	test('an empty code block has lineCount 0 and never collapses', () => {
		const info = evaluateCodeBlockCollapse('', 20);
		assert.strictEqual(info.lineCount, 0);
		assert.strictEqual(info.collapse, false);
	});

	test('a single very long line (5000 chars) does not collapse -- line-based only, not char-based', () => {
		const info = evaluateCodeBlockCollapse('x'.repeat(5000), 20);
		assert.strictEqual(info.lineCount, 1);
		assert.strictEqual(info.collapse, false);
	});
});

suite('collapse-rules: normalizeCollapseThreshold (defaults/clamping)', () => {

	test('undefined falls back to the default of 20', () => {
		assert.strictEqual(normalizeCollapseThreshold(undefined), 20);
	});

	test('null falls back to the default of 20', () => {
		assert.strictEqual(normalizeCollapseThreshold(null), 20);
	});

	test('NaN falls back to the default of 20', () => {
		assert.strictEqual(normalizeCollapseThreshold(NaN), 20);
	});

	test('a non-numeric string falls back to the default of 20', () => {
		assert.strictEqual(normalizeCollapseThreshold('abc'), 20);
	});

	test('0 falls back to the default of 20', () => {
		assert.strictEqual(normalizeCollapseThreshold(0), 20);
	});

	test('a negative number falls back to the default of 20', () => {
		assert.strictEqual(normalizeCollapseThreshold(-5), 20);
	});

	test('a value below the minimum clamps up to 5', () => {
		assert.strictEqual(normalizeCollapseThreshold(3), 5);
	});

	test('a value inside the valid range passes through unchanged', () => {
		assert.strictEqual(normalizeCollapseThreshold(7), 7);
	});

	test('a decimal value inside the valid range is floored', () => {
		assert.strictEqual(normalizeCollapseThreshold(12.7), 12);
	});

	test('a value above the maximum clamps down to 500', () => {
		assert.strictEqual(normalizeCollapseThreshold(9999), 500);
	});
});

suite('collapse-rules: toString() splice sandbox', () => {

	test('both functions still work when spliced into a Function body with zero module context, matching the real call', () => {
		const spliced = new Function(
			normalizeCollapseThreshold.toString() + '\n' + evaluateCodeBlockCollapse.toString() +
			'\nreturn evaluateCodeBlockCollapse(arguments[0], arguments[1]);');
		assert.deepStrictEqual(spliced('a\nb\nc\nd', 2), evaluateCodeBlockCollapse('a\nb\nc\nd', 2));
	});
});
