// Pure threshold/line-count logic for the #48 collapsible-code-blocks feature (upstream
// #151): decides whether a fenced code block parseSimpleMarkdown is about to render should
// start collapsed, based on its line count and the configured threshold. No vscode import,
// so this runs under plain mocha like diff-utils/shell-utils/auto-model-switch/math-segments.
//
// Neither function is ever called directly by the webview's copy of this file -- it has
// none. Instead collapse-script.ts injects each function's own compiled source via
// .toString() into the page (see collapse-script.ts for why). That means EVERY
// default/helper these functions need must be declared INSIDE their bodies: .toString()
// only ever returns the function's own text, not the rest of this module, so a
// module-level const referenced from inside a function would be undefined in the browser.

export interface CodeBlockCollapseInfo { lineCount: number; collapse: boolean; maxLines: number; }

export function normalizeCollapseThreshold(value: unknown): number {
	// Defaults/Grenzen MUESSEN im Funktionskoerper stehen: .toString() liefert nur den
	// Text dieser Funktion, kein Modul-Level-Symbol.
	const DEFAULT_LINES = 20; // in sync mit claudeCodeChat.ui.collapseCodeBlockLines (package.json)
	const MIN_LINES = 5;
	const MAX_LINES = 500;
	const n = typeof value === 'number' ? value : Number(value);
	if (!Number.isFinite(n) || n <= 0) { return DEFAULT_LINES; }
	const floored = Math.floor(n);
	if (floored < MIN_LINES) { return MIN_LINES; }
	if (floored > MAX_LINES) { return MAX_LINES; }
	return floored;
}

export function evaluateCodeBlockCollapse(code: string, configuredMaxLines: unknown): CodeBlockCollapseInfo {
	const maxLines = normalizeCollapseThreshold(configuredMaxLines);
	const text = typeof code === 'string' ? code : '';
	// Die Fence-Regex in parseSimpleMarkdown faengt das Newline VOR der schliessenden
	// Fence mit: "a\nb\nc\n" sind 3 Zeilen, nicht 4. CRLF vorher normalisieren.
	const normalized = text.replace(/\r\n/g, '\n').replace(/\n$/, '');
	const lineCount = normalized === '' ? 0 : normalized.split('\n').length;
	return { lineCount: lineCount, collapse: lineCount > maxLines, maxLines: maxLines };
}
