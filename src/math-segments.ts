// Pure scanner for the LaTeX-rendering feature (upstream #171): finds $…$ / $$…$$ /
// \(…\) / \[…\] math segments in the raw text parseSimpleMarkdown works on, before
// escapeHtml or any markdown rule touches it. No vscode import, so this runs under plain
// mocha like diff-utils/shell-utils/auto-model-switch/model-updater.
//
// findMathSegments is never called directly by the webview's copy of this file -- it has
// none. Instead math-script.ts injects this function's own compiled source via
// findMathSegments.toString() into the page (see math-script.ts for why). That means
// EVERY helper this function needs must be declared INSIDE its body: .toString() only
// ever returns the function's own text, not the rest of this module, so a module-level
// const or helper referenced from inside the function would be undefined in the browser.

export interface MathSegment {
	// Offsets into the original text (start inclusive, end exclusive) covering the full
	// match INCLUDING its delimiters, e.g. text.slice(start, end) === '$E = mc^2$'.
	start: number;
	end: number;
	tex: string;
	display: boolean;
}

export function findMathSegments(text: string): MathSegment[] {
	// Hard cap so a pathological response with hundreds of "$" characters can't turn one
	// render pass into hundreds of synchronous KaTeX calls.
	const MATH_SEGMENT_CAP = 200;

	const segments: { start: number; end: number; tex: string; display: boolean }[] = [];
	const isSpace = (c: string) => c === ' ' || c === '\t' || c === '\n' || c === '\r';
	const isDigit = (c: string) => c >= '0' && c <= '9';
	// $9.99$ price-trap guard: reject a body that's only digits/./,/. whitespace -- real
	// math almost always has a letter, operator or backslash command in it.
	const isNumericOnly = (s: string) => /^[0-9.,\s]+$/.test(s);
	// Review fix (W2a): a blind indexOf to the closing delimiter can walk straight over a
	// __CODEBLOCK_N__ placeholder without ever landing on it (the top-level placeholder
	// skip below only protects the scan *position*, not a body a closer search reaches
	// across it) -- reject any candidate whose body contains one instead of rendering the
	// placeholder text itself as "math".
	const containsCodeBlockPlaceholder = (s: string) => s.indexOf('__CODEBLOCK_') !== -1;
	// Review fix (W2b, "PID trap"): a shell/regex aside like "the PID is in $$. The
	// formula is:\n\n$$E=mc^2$$" must not have its first "$$...$$" swallow the prose up to
	// the real formula. A blank line ends math mode in real LaTeX too, so reject a display
	// body that contains one (checked for $$, \[...\] and, since the round-2 review's N1
	// fix, \(...\) too -- see the call sites below).
	const hasBlankLine = (s: string) => /\n\s*\n/.test(s);
	// Review fix (round 2, P1): a candidate whose body contains a raw ` must be rejected --
	// an inline code span like `$HOME` puts its own "$" inside backticks, and letting that
	// "$" close a math candidate here would corrupt the eventual <code> replacement around
	// what should have stayed a plain, unrendered code span.
	const containsBacktick = (s: string) => s.indexOf('`') !== -1;

	let i = 0;
	while (i < text.length) {
		if (segments.length >= MATH_SEGMENT_CAP) {
			break;
		}

		const c = text[i];
		const next = text[i + 1];

		// `\$` / `\\` -- an escaped dollar or an escaped backslash: skip both characters
		// so a real "$" right after isn't mistaken for a delimiter.
		if (c === '\\' && (next === '$' || next === '\\')) {
			i += 2;
			continue;
		}

		// Inline code span `` `...` `` -- still raw here (parseSimpleMarkdown's
		// single-backtick-to-<code> conversion runs after this hook), so a "$" inside one
		// must not be read as math.
		if (c === '`') {
			const closeTick = text.indexOf('`', i + 1);
			i = closeTick === -1 ? text.length : closeTick + 1;
			continue;
		}

		// __CODEBLOCK_N__ placeholder from the extraction step right before this hook --
		// must never end up inside (or split across) a math segment.
		if (text.startsWith('__CODEBLOCK_', i)) {
			const marker = '__CODEBLOCK_';
			const closePh = text.indexOf('__', i + marker.length);
			i = closePh === -1 ? text.length : closePh + 2;
			continue;
		}

		// Display math $$...$$ -- checked before single-$ so a pair isn't read as two
		// empty inline segments. Resync on a rejected candidate depends on WHY it failed
		// (round-2 review's P2 fix): an empty/numeric/placeholder/backtick body means the
		// failed closer was a real "$$" delimiter that simply didn't belong to OUR opener,
		// so we resync past IT -- otherwise "$$100$$ Euro ... $$E=mc^2$$" would have its
		// first, numeric-only pair's closer misread as the next candidate's opener and
		// never reach the real formula. A blank-line reject is the one exception: there
		// the failed closer is prose swallowed by a runaway search (the PID trap below),
		// so that case still only advances past the OPENER, letting a real "$$...$$" pair
		// further along the text get found on a later pass through this same branch.
		if (c === '$' && next === '$') {
			const close = text.indexOf('$$', i + 2);
			if (close !== -1) {
				const body = text.slice(i + 2, close);
				if (body.trim() && !isNumericOnly(body) && !containsCodeBlockPlaceholder(body) && !containsBacktick(body) && !hasBlankLine(body)) {
					segments.push({ start: i, end: close + 2, tex: body, display: true });
					i = close + 2;
					continue;
				}
				if (!hasBlankLine(body)) {
					i = close + 2;
					continue;
				}
			}
			i += 2;
			continue;
		}

		// Display math \[...\] -- same resync rule as $$...$$ above: past the failed
		// CLOSER on an empty/placeholder/backtick reject (P2), past the OPENER only on a
		// blank-line reject (unchanged, same PID-trap-style reasoning).
		if (c === '\\' && next === '[') {
			const close = text.indexOf('\\]', i + 2);
			if (close !== -1) {
				const body = text.slice(i + 2, close);
				if (body.trim() && !containsCodeBlockPlaceholder(body) && !containsBacktick(body) && !hasBlankLine(body)) {
					segments.push({ start: i, end: close + 2, tex: body, display: true });
					i = close + 2;
					continue;
				}
				if (!hasBlankLine(body)) {
					i = close + 2;
					continue;
				}
			}
			i += 2;
			continue;
		}

		// Inline math \(...\) -- same body guards as \[...\] above, added by the round-2
		// review's N1/N2 fixes: this form used to skip the blank-line and empty-body
		// checks, which let a prose-spanning "\(...\)" swallow a real pair further down
		// the text the same way the PID trap did for $$ (see hasBlankLine above). Resync
		// on reject still just advances past this OPENER, unlike the two display forms --
		// this delimiter isn't in scope for the P2 closer-end resync fix, and the simpler
		// behaviour is exactly what the N1 blank-line fix itself relies on.
		if (c === '\\' && next === '(') {
			const close = text.indexOf('\\)', i + 2);
			if (close !== -1) {
				const body = text.slice(i + 2, close);
				if (body.trim() && !containsCodeBlockPlaceholder(body) && !containsBacktick(body) && !hasBlankLine(body)) {
					segments.push({ start: i, end: close + 2, tex: body, display: false });
					i = close + 2;
					continue;
				}
			}
			i += 2;
			continue;
		}

		// Inline math $...$, with the price-vs-math guard rules from the plan: no
		// whitespace right after the opener or right before the closer, no digit right
		// after the closer (adjacent "$5$10" style money), single line, body not purely
		// numeric, and (round-2 review's P1 fix) not containing a backtick -- an inline
		// code span's own "$" must not be read as this delimiter's closer.
		if (c === '$') {
			if (next === undefined || isSpace(next)) {
				i++;
				continue;
			}
			let j = i + 1;
			let close = -1;
			while (j < text.length) {
				if (text[j] === '\\') {
					// Review fix (N2): "\" followed by a real line break must end the
					// candidate like a bare "\n" would -- blindly jumping 2 chars here
					// let a backslash-newline pair smuggle a multi-line body past the
					// single-line rule below.
					if (text[j + 1] === '\n') {
						break;
					}
					j += 2;
					continue;
				}
				if (text[j] === '\n') {
					break;
				}
				if (text[j] === '$') {
					if (!isSpace(text[j - 1]) && !isDigit(text[j + 1] || '')) {
						close = j;
					}
					break;
				}
				j++;
			}
			if (close !== -1) {
				const body = text.slice(i + 1, close);
				if (body.trim() && !isNumericOnly(body) && !containsCodeBlockPlaceholder(body) && !containsBacktick(body)) {
					segments.push({ start: i, end: close + 1, tex: body, display: false });
					i = close + 1;
					continue;
				}
			}
			i++;
			continue;
		}

		i++;
	}

	return segments;
}
