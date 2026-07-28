// Unit tests for the LaTeX-rendering scanner (findMathSegments). Pure (no vscode, no
// network, no filesystem access), so these run under plain mocha against the compiled
// out/ output -- same pattern as diff-utils/shell-utils/auto-model-switch. The first 13
// cases cover the core price-vs-math / delimiter-matching behaviour; the next 3 cover
// additional edge cases (\$ alone, an empty $$$$ pair, an unbalanced $); the next 5 guard
// against a __CODEBLOCK_N__ placeholder ending up inside a math body, a "PID trap" (a
// shell/regex aside like "the PID is in $$" swallowing a real formula further down) and a
// backslash immediately followed by a real line break; the last 7 guard against a
// backtick (code span) inside a math body, a rejected numeric/placeholder $$...$$ pair
// swallowing a real pair further down, a blank line inside a \(...\) body, and an empty
// \[...\] body. Run with `npm run test:math-segments`.

import * as assert from 'assert';
import { findMathSegments } from '../math-segments';

suite('math-segments: findMathSegments (core delimiter matching)', () => {

	test('does not match adjacent price mentions ("$5 and $10")', () => {
		assert.strictEqual(findMathSegments('This costs $5 and $10 together.').length, 0);
	});

	test('does not match shell-style variables ($PATH, $HOME)', () => {
		assert.strictEqual(findMathSegments('Reset $PATH and $HOME.').length, 0);
	});

	test('matches inline math ($E = mc^2$) and reports the right offsets', () => {
		const text = 'The formula $E = mc^2$ is famous.';
		const segs = findMathSegments(text);
		assert.strictEqual(segs.length, 1);
		assert.strictEqual(segs[0].tex, 'E = mc^2');
		assert.strictEqual(segs[0].display, false);
		assert.strictEqual(segs[0].start, 12);
		assert.strictEqual(segs[0].end, 22);
		assert.strictEqual(text.slice(segs[0].start, segs[0].end), '$E = mc^2$');
	});

	test('matches display math ($$...$$)', () => {
		const segs = findMathSegments('$$\\int_0^1 x dx$$');
		assert.strictEqual(segs.length, 1);
		assert.strictEqual(segs[0].tex, '\\int_0^1 x dx');
		assert.strictEqual(segs[0].display, true);
	});

	test('matches \\(...\\) and \\[...\\] in the same line', () => {
		const segs = findMathSegments('Inline \\(a_1 + b_2\\) and Block \\[x^2\\]');
		assert.strictEqual(segs.length, 2);
		assert.strictEqual(segs[0].tex, 'a_1 + b_2');
		assert.strictEqual(segs[0].display, false);
		assert.strictEqual(segs[1].tex, 'x^2');
		assert.strictEqual(segs[1].display, true);
	});

	test('leaves inline code untouched (`$x$` stays raw)', () => {
		assert.strictEqual(findMathSegments('Code `$x$` stays raw.').length, 0);
	});

	test('skips over a __CODEBLOCK_N__ placeholder instead of matching across it', () => {
		const segs = findMathSegments('__CODEBLOCK_0__ and $a+b$');
		assert.strictEqual(segs.length, 1);
		assert.strictEqual(segs[0].tex, 'a+b');
	});

	test('treats \\$ as a literal escaped dollar, not a delimiter', () => {
		const segs = findMathSegments('Escaped \\$5 is text, $y=x$ is math.');
		assert.strictEqual(segs.length, 1);
		assert.strictEqual(segs[0].tex, 'y=x');
	});

	test('rejects a "$" followed by whitespace (not treated as an opener)', () => {
		assert.strictEqual(findMathSegments('a $ b $ c').length, 0);
	});

	test('rejects a decimal price ($9.99$, purely numeric body)', () => {
		assert.strictEqual(findMathSegments('Price $9.99$ discount').length, 0);
	});

	test('matches a display block containing "&" (aligned environment)', () => {
		const segs = findMathSegments('$$\\begin{aligned} a &= b \\\\ c &= d \\end{aligned}$$');
		assert.strictEqual(segs.length, 1);
		assert.strictEqual(segs[0].tex, '\\begin{aligned} a &= b \\\\ c &= d \\end{aligned}');
	});

	test('does not match inline "$...$" across a line break', () => {
		assert.strictEqual(findMathSegments('Multi-line $a\nb$ not matched.').length, 0);
	});

	test('matches a multi-line display block ($$ on its own lines)', () => {
		const segs = findMathSegments('$$\n x^2 + y^2 = z^2 \n$$');
		assert.strictEqual(segs.length, 1);
		assert.strictEqual(segs[0].tex.trim(), 'x^2 + y^2 = z^2');
		assert.strictEqual(segs[0].display, true);
	});
});

suite('math-segments: findMathSegments (additional edge cases)', () => {

	test('a lone escaped \\$ with no other dollar is not a segment', () => {
		assert.strictEqual(findMathSegments('Just \\$ as text, no math.').length, 0);
	});

	test('an empty $$$$ pair does not match (no content between the delimiters)', () => {
		assert.strictEqual(findMathSegments('$$$$').length, 0);
	});

	test('an unbalanced single "$" with no closer does not match and does not hang', () => {
		assert.strictEqual(findMathSegments('Text with an unclosed $formula and no end.').length, 0);
	});
});

suite('math-segments: findMathSegments (delimiter edge cases: embedded placeholders, blank-line guards, backslash-newline)', () => {

	test('rejects a $...$ candidate whose body contains a __CODEBLOCK_N__ placeholder between the delimiters', () => {
		// The pre-existing "skips over a __CODEBLOCK_N__ placeholder" test above only
		// has the placeholder BEFORE the math, so it never actually exercised the "closer
		// search walks across a placeholder" bug this covers.
		assert.strictEqual(findMathSegments('$a __CODEBLOCK_0__ b$').length, 0);
	});

	test('rejects a $$ pair spanning prose up to a blank line, then still matches the real pair after it (PID trap)', () => {
		const segs = findMathSegments('The Bash PID is in $$. The formula reads:\n\n$$E = mc^2$$');
		assert.strictEqual(segs.length, 1);
		assert.strictEqual(segs[0].tex, 'E = mc^2');
		assert.strictEqual(segs[0].display, true);
	});

	test('rejects a $$ pair whose body contains a blank line, with no valid pair afterward', () => {
		assert.strictEqual(findMathSegments('$$Text before the blank line\n\nafter$$').length, 0);
	});

	test('rejects a \\[...\\] pair whose body contains a blank line', () => {
		assert.strictEqual(findMathSegments('\\[Text before the blank line\n\nafter\\]').length, 0);
	});

	test('a backslash immediately followed by a real line break ends an inline $...$ candidate', () => {
		assert.strictEqual(findMathSegments('Line $x\\\ny$ no match.').length, 0);
	});
});

suite('math-segments: findMathSegments (backtick guards, numeric-pair resync, blank-line and empty-body guards)', () => {

	test('rejects an inline $...$ candidate whose body contains a backtick (`` `$HOME` `` code span)', () => {
		assert.strictEqual(findMathSegments('Cost: $20 per month. Set `$HOME` correctly.').length, 0);
	});

	test('rejects a $$...$$ candidate whose body contains a backtick-fenced span with its own "$$" inside', () => {
		assert.strictEqual(findMathSegments('$$ paragraph with `code $$ inside` end $$').length, 0);
	});

	test('a rejected numeric $$...$$ pair does not swallow the real pair further down ("$$100$$ Euro ... $$E=mc^2$$")', () => {
		const segs = findMathSegments('The price is $$100$$ Euro, the formula is $$E=mc^2$$');
		assert.strictEqual(segs.length, 1);
		assert.strictEqual(segs[0].tex, 'E=mc^2');
	});

	test('two rejected numeric $$...$$ pairs in a row still let the real pair after them match', () => {
		const segs = findMathSegments('Price $$5.00$$ and $$9,99$$ and $$E=mc^2$$');
		assert.strictEqual(segs.length, 1);
		assert.strictEqual(segs[0].tex, 'E=mc^2');
	});

	test('a rejected $$...$$ pair containing a __CODEBLOCK_N__ placeholder does not swallow the real pair further down', () => {
		const segs = findMathSegments('$$ __CODEBLOCK_0__ $$ Text $$E=mc^2$$');
		assert.strictEqual(segs.length, 1);
		assert.strictEqual(segs[0].tex, 'E=mc^2');
	});

	test('\\(...\\) rejects a body spanning a blank line, then still matches the real pair after it', () => {
		const segs = findMathSegments('Write \\( for inline math.\n\nExample: \\(x^2\\)');
		assert.strictEqual(segs.length, 1);
		assert.strictEqual(segs[0].tex, 'x^2');
		assert.strictEqual(segs[0].display, false);
	});

	test('\\[...\\] rejects an empty body', () => {
		assert.strictEqual(findMathSegments('Empty \\[\\] end').length, 0);
	});
});
