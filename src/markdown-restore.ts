// Placeholder back-substitution for code blocks in parseSimpleMarkdown (found during
// review). String.replace(placeholder, value) interprets "$&"/"$`"/"$'"/"$$" in the
// replacement string as substitution patterns -- a code block whose (already-escaped)
// content happens to contain such a sequence (e.g. shell code with "$'...'") corrupts
// the surrounding HTML instead of appearing unchanged. restoreMathSegments
// (math-script.ts) has had this fix from the start -- this function brings the code-block
// restore loop up to the same standard (function replacement instead of string
// replacement). script.ts splices only the compiled function text into the page via
// .toString() (same pattern as restoreMathSegments in math-script.ts) -- that's why this
// function must stay self-contained: no module-level symbol, no import, no helper
// function outside the body.
export function restoreCodeBlockPlaceholders(html: string, codeBlockPlaceholders: string[]): string {
	for (let i = 0; i < codeBlockPlaceholders.length; i++) {
		const placeholder = '__CODEBLOCK_' + i + '__';
		const value = codeBlockPlaceholders[i];
		// Function replacement, NEVER a string directly as the 2nd argument (see comment above).
		html = html.replace(placeholder, function () { return value; });
	}
	return html;
}
