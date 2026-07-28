// Unit tests for the code-block restore loop (restoreCodeBlockPlaceholders), the
// __CODEBLOCK_N__ half of parseSimpleMarkdown's placeholder dance. Pure (no vscode, no
// network, no DOM), so these run under plain mocha against the compiled out/ output --
// same pattern as the math-segments unit tests. A review found that the loop used
// html.replace(placeholder, str), a plain STRING as the 2nd argument -- String.replace
// treats "$&"/"$`"/"$'"/"$$" in a string replacement as substitution patterns, so a code
// block whose (already-escaped) content happens to contain one of those sequences tears
// the surrounding HTML apart instead of being reinserted unchanged. restoreMathSegments
// (math-script.ts) already used function-replacement for exactly this reason when the
// LaTeX-rendering feature introduced it; this fixes the code-block loop to match. The
// first suite covers ordinary multi-placeholder restores, the second is the regression
// suite for each substitution pattern individually plus one combined case, and the third
// is the splice-sandbox test that proves the function still works with zero module
// context -- exactly how script.ts's .toString() splice runs it in the webview. Run with
// `npm run test:markdown-restore`.

import * as assert from 'assert';
import { restoreCodeBlockPlaceholders } from '../markdown-restore';

suite('markdown-restore: restoreCodeBlockPlaceholders (basic)', () => {

	test('a single placeholder is replaced by its code block value', () => {
		const result = restoreCodeBlockPlaceholders('before __CODEBLOCK_0__ after', ['<pre>x</pre>']);
		assert.strictEqual(result, 'before <pre>x</pre> after');
	});

	test('multiple placeholders are each restored to their own value, in order', () => {
		const html = '__CODEBLOCK_0__ mid __CODEBLOCK_1__ mid __CODEBLOCK_2__';
		const result = restoreCodeBlockPlaceholders(html, ['<pre>a</pre>', '<pre>b</pre>', '<pre>c</pre>']);
		assert.strictEqual(result, '<pre>a</pre> mid <pre>b</pre> mid <pre>c</pre>');
	});

	test('an empty placeholders array leaves html unchanged', () => {
		assert.strictEqual(restoreCodeBlockPlaceholders('<p>no code blocks here</p>', []), '<p>no code blocks here</p>');
	});
});

suite('markdown-restore: restoreCodeBlockPlaceholders ($ substitution patterns)', () => {

	test('"$&" (matched-substring pattern) in the code block value survives unchanged, not the matched placeholder', () => {
		const codeHtml = '<pre class="code-block"><code>echo $&amp; run in background</code></pre>';
		const html = '<p>before</p>__CODEBLOCK_0__<p>after</p>';
		const result = restoreCodeBlockPlaceholders(html, [codeHtml]);
		assert.strictEqual(result, '<p>before</p>' + codeHtml + '<p>after</p>');
	});

	test('"$`" (pre-match pattern) in the code block value survives unchanged, not a copy of the preceding HTML', () => {
		const codeHtml = '<pre class="code-block"><code>VAR=$`date`</code></pre>';
		const html = '<p>before</p>__CODEBLOCK_0__<p>after</p>';
		const result = restoreCodeBlockPlaceholders(html, [codeHtml]);
		assert.strictEqual(result, '<p>before</p>' + codeHtml + '<p>after</p>');
	});

	test('"$\'" (post-match pattern) in the code block value survives unchanged, not a copy of the following HTML', () => {
		const codeHtml = '<pre class="code-block"><code>MSG=$\'it worked\'</code></pre>';
		const html = '<p>before</p>__CODEBLOCK_0__<p>after</p>';
		const result = restoreCodeBlockPlaceholders(html, [codeHtml]);
		assert.strictEqual(result, '<p>before</p>' + codeHtml + '<p>after</p>');
	});

	test('"$$" (escaped-dollar pattern) in the code block value does not collapse to a single "$"', () => {
		const codeHtml = '<pre class="code-block"><code>echo $$ # current PID</code></pre>';
		const html = '<p>before</p>__CODEBLOCK_0__<p>after</p>';
		const result = restoreCodeBlockPlaceholders(html, [codeHtml]);
		assert.strictEqual(result, '<p>before</p>' + codeHtml + '<p>after</p>');
	});

	test('a code block combining "$&", "$`", "$\'" and "$$" survives the restore byte-for-byte', () => {
		const dollarPatterns = 'a$&b a$`b a$\'b a$$b';
		const codeHtml = '<pre class="code-block"><code>' + dollarPatterns + '</code></pre>';
		const html = '<p>before</p>__CODEBLOCK_0__<p>after</p>';
		const result = restoreCodeBlockPlaceholders(html, [codeHtml]);
		assert.strictEqual(result, '<p>before</p>' + codeHtml + '<p>after</p>');
	});
});

suite('markdown-restore: toString() splice sandbox', () => {

	test('restoreCodeBlockPlaceholders still works when spliced into a Function body with zero module context, matching the real call', () => {
		const spliced = new Function(
			restoreCodeBlockPlaceholders.toString() +
			'\nreturn restoreCodeBlockPlaceholders(arguments[0], arguments[1]);');
		const html = '<p>before</p>__CODEBLOCK_0__<p>after</p>';
		const placeholders = ['<pre>a$&b a$`b a$\'b</pre>'];
		assert.deepStrictEqual(spliced(html, placeholders), restoreCodeBlockPlaceholders(html, placeholders));
	});
});
