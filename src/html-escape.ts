// Attribute escaping for the webview (fork-issue-49). script.ts' escapeHtml() serializes via
// textContent->innerHTML and therefore leaves " and ' UNTOUCHED -- for title="..."/data-*="..."
// that isn't enough (attribute breakout). This function is NOT called here: script.ts
// splices only its own compiled text into the page via .toString() (same pattern as
// collapse-rules.ts/markdown-restore.ts). So it MUST stay self-contained -- no
// module-level symbol, no import, no helper function outside the body.
export function escapeAttr(value: unknown): string {
	const s = value === null || value === undefined ? '' : String(value);
	// '&' must come first, otherwise the entities we just produced get re-decoded afterwards.
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

// fork-issue-61: escapeAttr() makes href=/src= breakout-safe but doesn't check the scheme -- a
// javascript:-link from third-party data (an MCP registry entry) stays clickable/live.
// safeHttpUrl() only lets http:/https: through, otherwise an empty string (the caller then
// omits the attribute/link entirely instead of rendering a dead attribute). The cleanup before
// the scheme check mirrors the first steps of the WHATWG URL parser: tab/newline/CR are
// stripped everywhere in the string (catches "java\tscript:"), leading/trailing C0 control
// characters and spaces are trimmed -- both are tricks browsers would otherwise let bypass a
// scheme check done via plain string comparison. Same self-containment rule as escapeAttr:
// no module-level symbol, no import, no helper function outside the body.
// NOTE: this is deliberately fail-closed even for relative ("/icons/x.png",
// "icon.png") and protocol-relative ("//cdn.example/i.png") URLs, which resolve to '' -- a
// scheme is a hard requirement here, no special case for those. Should a data source ever
// start supplying relative/protocol-relative icon URLs, the icon will silently fall back to
// the placeholder instead of loading -- not a bug, but a behavior change worth remembering.
export function safeHttpUrl(value: unknown): string {
	let s = value === null || value === undefined ? '' : String(value);
	s = s.replace(/[\t\n\r]/g, '');
	s = s.replace(/^[\x00-\x20]+/, '').replace(/[\x00-\x20]+$/, '');
	const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+\-.]*):/.exec(s);
	if (!schemeMatch) { return ''; }
	const scheme = schemeMatch[1].toLowerCase();
	if (scheme !== 'http' && scheme !== 'https') { return ''; }
	return s;
}
