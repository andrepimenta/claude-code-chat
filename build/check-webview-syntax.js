#!/usr/bin/env node
'use strict';

// Committed version of a check the team already ran by hand before #47 (Gitea #47,
// A7): script.ts/ui.ts are giant TypeScript template literals producing the webview's
// HTML/JS as plain strings, so tsc happily compiles a typo like a stray unescaped
// backtick or "${" -- it only breaks once that string reaches an actual browser. This
// script proves the emitted <script> content still parses, and that ui.ts actually
// references the vendored KaTeX assets. Node builtins only, run via
// `npm run test:webview-syntax` (which compiles first).

const path = require('path');

function fail(message) {
	console.error('FAIL: ' + message);
	process.exit(1);
}

let getScript;
let getHtml;
try {
	getScript = require(path.join('..', 'out', 'script.js')).default;
	getHtml = require(path.join('..', 'out', 'ui.js')).default;
} catch (e) {
	fail('could not load out/script.js / out/ui.js (did npm run compile run first?): ' + e.message);
}

if (typeof getScript !== 'function') {
	fail('out/script.js has no default export function (getScript)');
}
if (typeof getHtml !== 'function') {
	fail('out/ui.js has no default export function (getHtml)');
}

// ── 1) out/script.js: syntax-proof the <script> content getScript() returns ──
const scriptHtml = getScript(false);

const scriptBlockRe = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g;
const scriptBlocks = [...scriptHtml.matchAll(scriptBlockRe)];
if (scriptBlocks.length === 0) {
	fail('getScript(false) did not contain a <script>...</script> block to check');
}
for (let i = 0; i < scriptBlocks.length; i++) {
	const body = scriptBlocks[i][1];
	try {
		// Parses (doesn't execute) -- a syntax proof only, same as the "new Function"
		// smoke test this used to be run as a manual step. Browser globals (document,
		// window, vscode, katex, ...) aren't defined here and don't need to be: we're
		// not calling the resulting function, just confirming it compiles.
		new Function(body);
	} catch (e) {
		fail('<script> block ' + (i + 1) + '/' + scriptBlocks.length + ' failed to parse: ' + e.message);
	}
}

// ── 2) out/ui.js: getHtml() must actually reference the vendored KaTeX assets ──
const html = getHtml(false, undefined, undefined, undefined, 'check-webview-syntax', '0.0.0', 'vscode-resource://check/out/katex');
if (!html.includes('katex.min.css')) {
	fail('getHtml(...) output does not reference katex.min.css');
}
if (!html.includes('katex.min.js')) {
	fail('getHtml(...) output does not reference katex.min.js');
}

// -- 3) #55: die Codeblock-Restore-Schleife in parseSimpleMarkdown muss ueber die
// gespleisste restoreCodeBlockPlaceholders(html, codeBlockPlaceholders) laufen, nie mehr
// ueber ein direktes html.replace(placeholder, str) -- String.replace interpretiert
// "$&"/"$`"/"$'"/"$$" im Ersatzstring als Substitutionsmuster und zerlegt dadurch jeden
// Code-Block, der eine dieser Sequenzen enthaelt --
if (!scriptHtml.includes('function restoreCodeBlockPlaceholders')) {
	fail('getScript(...) output does not contain the spliced restoreCodeBlockPlaceholders (markdown-restore.ts, #55)');
}
// Diskriminierende Nadel: "restoreCodeBlockPlaceholders(html, codeBlockPlaceholders)" allein
// waere eine Tautologie -- der String steckt schon im gespleissten Funktionskopf
// ("function restoreCodeBlockPlaceholders(html, codeBlockPlaceholders) {") und wuerde damit
// auch dann PASSen, wenn die Aufrufstelle in parseSimpleMarkdown entfernt wird. "html = " davor
// kommt im Emit nur an der echten Aufrufstelle vor.
if (!scriptHtml.includes('html = restoreCodeBlockPlaceholders(')) {
	fail('getScript(...) output does not call restoreCodeBlockPlaceholders(...) from the code-block restore loop (#55)');
}
if (/html\.replace\(placeholder,\s*codeBlockPlaceholders\[i\]\)/.test(scriptHtml)) {
	fail('getScript(...) output still contains the unsafe html.replace(placeholder, codeBlockPlaceholders[i]) string-replacement (#55 regression)');
}

console.log('PASS: getScript() <script> content parses (' + scriptBlocks.length + ' block(s), ' + scriptHtml.length + ' chars), getHtml() references katex.min.css + katex.min.js, and the #55 restoreCodeBlockPlaceholders splice is present and the code-block restore loop is safe');
process.exit(0);
