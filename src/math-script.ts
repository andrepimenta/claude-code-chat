import { findMathSegments } from './math-segments';

// Webview-side LaTeX rendering for #47 (upstream #171), injected into script.ts's
// getScript() template the same way getSkillsScript()/getPluginsScript() are (see
// plugins-script.ts). Two different things happen below and they must not be confused:
//
// 1. findMathSegments.toString() is a REAL, host-side template interpolation (like
//    getSkillsScript()/getPluginsScript() themselves): it runs in Node when getMathScript()
//    is called, and splices that function's own *compiled* source into the returned
//    string. math-segments.ts must stay fully self-contained for exactly this reason --
//    only its own text crosses into the browser, not the rest of that module.
// 2. Everything else below (renderMathHtml, extractMathSegments, restoreMathSegments) is
//    plain webview source written directly in this template literal. None of it happens to
//    need a client-side "${...}" or a backtick, so nothing here needs the "\${"/"\`"
//    escaping script.ts's own template literal requires elsewhere -- but if you add code
//    that does, escape it the same way (see script.ts's parseSimpleMarkdown for examples).
const getMathScript = () => `
		// ─── Math (KaTeX, #47) ───
		${findMathSegments.toString()}

		// Fallback text for renderMathHtml: wraps the escaped source in $ / $$ (display
		// uses the doubled form) so the message still shows it used to be a formula,
		// instead of silently dropping to bare text indistinguishable from surrounding
		// prose. Note this normalizes to $/$$ regardless of which delimiter the original
		// segment used -- a \(...\) or \[...\] segment falls back to $ / $$ too, not its
		// own backslash delimiters.
		function mathFallbackText(tex, display) {
			var delim = display ? '$$' : '$';
			return delim + escapeHtml(tex) + delim;
		}

		// katex.min.js (loaded via a synchronous <script> before this one, see ui.ts)
		// exposes window.katex. Falls back to mathFallbackText instead of dropping the
		// message if the library is missing (e.g. out/katex/ didn't survive a deploy) or
		// throws something throwOnError:false doesn't already catch.
		function renderMathHtml(tex, display) {
			if (typeof katex === 'undefined' || !katex || typeof katex.renderToString !== 'function') {
				return mathFallbackText(tex, display);
			}
			try {
				return katex.renderToString(tex, {
					displayMode: display,
					throwOnError: false,
					trust: false,
					strict: 'ignore'
				});
			} catch (e) {
				return mathFallbackText(tex, display);
			}
		}

		// Extraction half of the parseSimpleMarkdown hook: cuts every math segment out of
		// the raw text and replaces it with a nonce-scoped placeholder, mirroring the
		// __CODEBLOCK_N__ placeholders already used for fenced code. Walking segments
		// back-to-front keeps earlier (start, end) offsets valid while later ones are
		// spliced out of the string.
		function extractMathSegments(text) {
			var nonce = Math.random().toString(36).slice(2);
			var segments = findMathSegments(text);
			var placeholders = [];
			for (var i = segments.length - 1; i >= 0; i--) {
				var seg = segments[i];
				var placeholder = '__CCCMATH_' + nonce + '_' + i + '__';
				placeholders.push({ placeholder: placeholder, html: renderMathHtml(seg.tex, seg.display) });
				text = text.slice(0, seg.start) + placeholder + text.slice(seg.end);
			}
			return { text: text, placeholders: placeholders };
		}

		// Restore half: uses function-replacement, never a plain string as the 2nd
		// argument -- String.replace treats "$&"/"$\`"/"$'" in a string replacement as
		// substitution patterns, and KaTeX's own HTML output can easily contain a "$"
		// right before such a character.
		function restoreMathSegments(html, placeholders) {
			for (var i = 0; i < placeholders.length; i++) {
				var mathHtml = placeholders[i].html;
				html = html.replace(placeholders[i].placeholder, function() { return mathHtml; });
			}
			return html;
		}
`;

export default getMathScript;
