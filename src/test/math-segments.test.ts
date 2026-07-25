// Unit tests for the #47 LaTeX-rendering scanner (findMathSegments). Pure (no vscode, no
// network, no filesystem access), so these run under plain mocha against the compiled
// out/ output -- same pattern as diff-utils/shell-utils/auto-model-switch. 13 cases match
// the plan's validated prototype 1:1 (13/13 green); the next 3 cover the additional edge
// cases the plan calls out by name (\$ alone, an empty $$$$ pair, an unbalanced $); the
// next 5 are regressions from the opus review round (W2 "__CODEBLOCK_N__-in-body" +
// "PID trap" blank-line guard, N2 backslash-then-linebreak); the last 7 are regressions
// from the round-2 review (P1 backtick-in-body guard, P2 rejected-closer-becomes-opener
// resync fix, N1 blank-line guard for \(...\), N2 empty-body guard for \[...\]). Run with
// `npm run test:math-segments`.

import * as assert from 'assert';
import { findMathSegments } from '../math-segments';

suite('math-segments: findMathSegments (plan prototype cases)', () => {

	test('does not match adjacent price mentions ("$5 und $10")', () => {
		assert.strictEqual(findMathSegments('Das kostet $5 und $10 zusammen.').length, 0);
	});

	test('does not match shell-style variables ($PATH, $HOME)', () => {
		assert.strictEqual(findMathSegments('Setze $PATH und $HOME neu.').length, 0);
	});

	test('matches inline math ($E = mc^2$) and reports the right offsets', () => {
		const text = 'Die Formel $E = mc^2$ ist beruehmt.';
		const segs = findMathSegments(text);
		assert.strictEqual(segs.length, 1);
		assert.strictEqual(segs[0].tex, 'E = mc^2');
		assert.strictEqual(segs[0].display, false);
		assert.strictEqual(segs[0].start, 11);
		assert.strictEqual(segs[0].end, 21);
		assert.strictEqual(text.slice(segs[0].start, segs[0].end), '$E = mc^2$');
	});

	test('matches display math ($$...$$)', () => {
		const segs = findMathSegments('$$\\int_0^1 x dx$$');
		assert.strictEqual(segs.length, 1);
		assert.strictEqual(segs[0].tex, '\\int_0^1 x dx');
		assert.strictEqual(segs[0].display, true);
	});

	test('matches \\(...\\) and \\[...\\] in the same line', () => {
		const segs = findMathSegments('Inline \\(a_1 + b_2\\) und Block \\[x^2\\]');
		assert.strictEqual(segs.length, 2);
		assert.strictEqual(segs[0].tex, 'a_1 + b_2');
		assert.strictEqual(segs[0].display, false);
		assert.strictEqual(segs[1].tex, 'x^2');
		assert.strictEqual(segs[1].display, true);
	});

	test('leaves inline code untouched (`$x$` stays raw)', () => {
		assert.strictEqual(findMathSegments('Code `$x$` bleibt roh.').length, 0);
	});

	test('skips over a __CODEBLOCK_N__ placeholder instead of matching across it', () => {
		const segs = findMathSegments('__CODEBLOCK_0__ und $a+b$');
		assert.strictEqual(segs.length, 1);
		assert.strictEqual(segs[0].tex, 'a+b');
	});

	test('treats \\$ as a literal escaped dollar, not a delimiter', () => {
		const segs = findMathSegments('Escaped \\$5 ist Text, $y=x$ ist Mathe.');
		assert.strictEqual(segs.length, 1);
		assert.strictEqual(segs[0].tex, 'y=x');
	});

	test('rejects a "$" followed by whitespace (not treated as an opener)', () => {
		assert.strictEqual(findMathSegments('a $ b $ c').length, 0);
	});

	test('rejects a decimal price ($9.99$, purely numeric body)', () => {
		assert.strictEqual(findMathSegments('Preis $9.99$ Rabatt').length, 0);
	});

	test('matches a display block containing "&" (aligned environment)', () => {
		const segs = findMathSegments('$$\\begin{aligned} a &= b \\\\ c &= d \\end{aligned}$$');
		assert.strictEqual(segs.length, 1);
		assert.strictEqual(segs[0].tex, '\\begin{aligned} a &= b \\\\ c &= d \\end{aligned}');
	});

	test('does not match inline "$...$" across a line break', () => {
		assert.strictEqual(findMathSegments('Mehrzeilig $a\nb$ nicht.').length, 0);
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
		assert.strictEqual(findMathSegments('Nur \\$ als Text, kein Mathe.').length, 0);
	});

	test('an empty $$$$ pair does not match (no content between the delimiters)', () => {
		assert.strictEqual(findMathSegments('$$$$').length, 0);
	});

	test('an unbalanced single "$" with no closer does not match and does not hang', () => {
		assert.strictEqual(findMathSegments('Text mit einem unclosed $formel ohne Ende.').length, 0);
	});
});

suite('math-segments: findMathSegments (opus review fixes W2/N2)', () => {

	test('W2a: rejects a $...$ candidate whose body contains a __CODEBLOCK_N__ placeholder between the delimiters', () => {
		// The pre-existing "skips over a __CODEBLOCK_N__ placeholder" test above only
		// has the placeholder BEFORE the math, so it never actually exercised the "closer
		// search walks across a placeholder" bug this covers.
		assert.strictEqual(findMathSegments('$a __CODEBLOCK_0__ b$').length, 0);
	});

	test('W2b: rejects a $$ pair spanning prose up to a blank line, then still matches the real pair after it (PID trap)', () => {
		const segs = findMathSegments('Die Bash-PID steht in $$. Die Formel lautet:\n\n$$E = mc^2$$');
		assert.strictEqual(segs.length, 1);
		assert.strictEqual(segs[0].tex, 'E = mc^2');
		assert.strictEqual(segs[0].display, true);
	});

	test('W2b: rejects a $$ pair whose body contains a blank line, with no valid pair afterward', () => {
		assert.strictEqual(findMathSegments('$$Text vor der Leerzeile\n\ndanach$$').length, 0);
	});

	test('W2b: rejects a \\[...\\] pair whose body contains a blank line', () => {
		assert.strictEqual(findMathSegments('\\[Text vor der Leerzeile\n\ndanach\\]').length, 0);
	});

	test('N2: a backslash immediately followed by a real line break ends an inline $...$ candidate', () => {
		assert.strictEqual(findMathSegments('Zeile $x\\\ny$ nicht.').length, 0);
	});
});

suite('math-segments: findMathSegments (round 2 review fixes P1/P2/N1/N2)', () => {

	test('P1: rejects an inline $...$ candidate whose body contains a backtick (`` `$HOME` `` code span)', () => {
		assert.strictEqual(findMathSegments('Kosten: $20 pro Monat. Setze `$HOME` korrekt.').length, 0);
	});

	test('P1: rejects a $$...$$ candidate whose body contains a backtick-fenced span with its own "$$" inside', () => {
		assert.strictEqual(findMathSegments('$$ Absatz mit `code $$ drin` Ende $$').length, 0);
	});

	test('P2: a rejected numeric $$...$$ pair does not swallow the real pair further down ("$$100$$ Euro ... $$E=mc^2$$")', () => {
		const segs = findMathSegments('Der Preis liegt bei $$100$$ Euro, die Formel ist $$E=mc^2$$');
		assert.strictEqual(segs.length, 1);
		assert.strictEqual(segs[0].tex, 'E=mc^2');
	});

	test('P2: two rejected numeric $$...$$ pairs in a row still let the real pair after them match', () => {
		const segs = findMathSegments('Preis $$5.00$$ und $$9,99$$ und $$E=mc^2$$');
		assert.strictEqual(segs.length, 1);
		assert.strictEqual(segs[0].tex, 'E=mc^2');
	});

	test('P2: a rejected $$...$$ pair containing a __CODEBLOCK_N__ placeholder does not swallow the real pair further down', () => {
		const segs = findMathSegments('$$ __CODEBLOCK_0__ $$ Text $$E=mc^2$$');
		assert.strictEqual(segs.length, 1);
		assert.strictEqual(segs[0].tex, 'E=mc^2');
	});

	test('N1: \\(...\\) rejects a body spanning a blank line, then still matches the real pair after it', () => {
		const segs = findMathSegments('Schreibe \\( fuer Inline-Mathe.\n\nBeispiel: \\(x^2\\)');
		assert.strictEqual(segs.length, 1);
		assert.strictEqual(segs[0].tex, 'x^2');
		assert.strictEqual(segs[0].display, false);
	});

	test('N2: \\[...\\] rejects an empty body', () => {
		assert.strictEqual(findMathSegments('Leer \\[\\] Ende').length, 0);
	});
});
