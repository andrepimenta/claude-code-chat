// PoC/regression tests for #57 (HTML attribute / inline-handler injection via escapeHtml()
// used in attribute contexts). #49's escapeHtml() serialises through
// textContent->innerHTML and therefore leaves " and ' untouched -- fine for element text
// content, but not for attribute values (title="...", data-*="...", src="...", href="...",
// value="...") or for a value embedded as a JS string argument inside an inline
// onclick="fn('...')" handler. escapeAttr() (also escapes " and ') plus the
// data-*/this.dataset.* pattern (see #58's renderPermissions) is the fix for both sinks.
//
// formatFilePath/formatToolInputUI only exist inline inside script.ts's giant getScript()
// template literal -- never as an importable module, unlike escapeAttr/
// evaluateCodeBlockCollapse/restoreCodeBlockPlaceholders -- so this suite extracts their exact
// source text from the ACTUAL getScript() output (out/script.js, i.e. the real emitted webview
// code, not a hand-copied version of the TS source) via brace-matching, runs it in a vm
// sandbox with the one stub escapeHtml() needs (document.createElement), and parses the
// resulting HTML string with parse5 -- the same HTML5-spec parser class real browsers use --
// to assert no attribute-breakout / inline-handler-breakage survives. Run with
// `npm run test:webview-attr-escape`.

import * as assert from 'assert';
import * as vm from 'vm';
import * as parse5 from 'parse5';
import getScript from '../script';

function getEmittedScriptBody(): string {
	const html = getScript(false);
	const match = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/.exec(html);
	if (!match) {
		throw new Error('getScript(false) did not contain a <script>...</script> block');
	}
	return match[1];
}

// Extracts one top-level "function NAME(...) { ... }" declaration's exact source text from
// the emitted script body via quote-aware brace matching, so formatFilePath/formatToolInputUI
// run exactly as emitted, never hand-copied from the TS source.
function extractFunction(source: string, name: string): string {
	const sigMatch = new RegExp('function\\s+' + name + '\\s*\\(').exec(source);
	if (!sigMatch) {
		throw new Error('function ' + name + ' not found in emitted script');
	}
	const braceStart = source.indexOf('{', sigMatch.index);
	if (braceStart === -1) {
		throw new Error('no opening brace found for function ' + name);
	}
	let depth = 0;
	let inString: string | null = null;
	for (let i = braceStart; i < source.length; i++) {
		const ch = source[i];
		if (inString) {
			if (ch === '\\') { i++; continue; }
			if (ch === inString) { inString = null; }
			continue;
		}
		if (ch === '\'' || ch === '"' || ch === '`') { inString = ch; continue; }
		else if (ch === '{') { depth++; }
		else if (ch === '}') {
			depth--;
			if (depth === 0) { return source.slice(sigMatch.index, i + 1); }
		}
	}
	throw new Error('unbalanced braces while extracting function ' + name);
}

// escapeHtml()'s only external dependency is document.createElement('div') (textContent set,
// innerHTML read). Per the HTML fragment serialisation spec, a Text node's innerHTML escapes
// only & < > (not " or ') -- real browsers behave the same; this is a faithful minimal stub.
class FakeDiv {
	private _text = '';
	set textContent(v: string) { this._text = String(v); }
	get innerHTML(): string {
		return this._text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}
}

interface Sandbox {
	formatFilePath(filePath: string): string;
	formatToolInputUI(input: unknown): string;
}

function loadSandbox(): Sandbox {
	const body = getEmittedScriptBody();
	const src = ['escapeHtml', 'escapeAttr', 'formatFilePath', 'formatToolInputUI']
		.map(name => extractFunction(body, name))
		.join('\n');
	const sandbox: Record<string, unknown> = {
		document: {
			createElement(tag: string) {
				if (tag !== 'div') { throw new Error('unexpected document.createElement(' + tag + ')'); }
				return new FakeDiv();
			}
		}
	};
	vm.createContext(sandbox);
	new vm.Script(src).runInContext(sandbox);
	return sandbox as unknown as Sandbox;
}

// First DFS match wins (document order) -- formatToolInputUI's output nests a
// span.file-path-truncated (from formatFilePath) inside a div.diff-file-path, and both
// currently carry a data-file-path attribute with the same value, so a "last match wins"
// walk would silently return the inner span's copy instead of the outer div's -- the one
// the div's own onclick="openFileInEditor(this.dataset.filePath)" actually reads. That would
// let a regression that drops data-file-path from the div alone (while leaving the span's
// copy intact) pass unnoticed. Use findAttrOn() below when a specific element matters.
function findAttr(html: string, attrName: string): { name: string; value: string } | undefined {
	const frag = parse5.parseFragment(html);
	let found: { name: string; value: string } | undefined;
	(function walk(node: parse5.DefaultTreeAdapterMap['node']): void {
		if (found) { return; }
		const el = node as parse5.DefaultTreeAdapterMap['element'];
		if (el.attrs) {
			const a = el.attrs.find(x => x.name === attrName);
			if (a) { found = a; return; }
		}
		const parent = node as parse5.DefaultTreeAdapterMap['parentNode'];
		if (parent.childNodes) { parent.childNodes.forEach(walk); }
	})(frag);
	return found;
}

// Scoped lookup: finds the first element carrying cssClass (document order) and returns
// attrName's value from THAT element specifically (undefined if the element lacks it) --
// unlike findAttr(), this doesn't get confused by a same-named attribute on a nested element.
function findAttrOn(html: string, cssClass: string, attrName: string): { name: string; value: string } | undefined {
	const frag = parse5.parseFragment(html);
	let result: { name: string; value: string } | undefined;
	let elementFound = false;
	(function walk(node: parse5.DefaultTreeAdapterMap['node']): void {
		if (elementFound) { return; }
		const el = node as parse5.DefaultTreeAdapterMap['element'];
		if (el.attrs) {
			const classAttr = el.attrs.find(x => x.name === 'class');
			if (classAttr && classAttr.value.split(/\s+/).includes(cssClass)) {
				elementFound = true;
				result = el.attrs.find(x => x.name === attrName);
				return;
			}
		}
		const parent = node as parse5.DefaultTreeAdapterMap['parentNode'];
		if (parent.childNodes) { parent.childNodes.forEach(walk); }
	})(frag);
	if (!elementFound) {
		throw new Error('no element with class "' + cssClass + '" found in: ' + html);
	}
	return result;
}

suite('webview attribute escaping: formatFilePath / formatToolInputUI (#57 PoC)', () => {

	test('an attribute-breakout file_path (a" onmouseover="alert(1)" zz=") produces no onmouseover attribute anywhere in the emitted element', () => {
		const sandbox = loadSandbox();
		const payload = 'a" onmouseover="alert(1)" zz="';
		const html = sandbox.formatToolInputUI({ file_path: payload });
		assert.ok(!findAttr(html, 'onmouseover'), 'emitted HTML must not contain an onmouseover attribute; got: ' + html);
	});

	test('the same payload also stays contained when passed straight through formatFilePath (the #57 reference sink)', () => {
		const sandbox = loadSandbox();
		const payload = 'a" onmouseover="alert(1)" zz="';
		const html = sandbox.formatFilePath(payload);
		assert.ok(!findAttr(html, 'onmouseover'), 'emitted HTML must not contain an onmouseover attribute; got: ' + html);
	});

	test('the title and data-file-path attributes decode back to the exact raw payload (properly escaped, not mangled)', () => {
		const sandbox = loadSandbox();
		const payload = 'a" onmouseover="alert(1)" zz="';
		const html = sandbox.formatFilePath(payload);
		const title = findAttr(html, 'title');
		const dataFilePath = findAttr(html, 'data-file-path');
		assert.strictEqual(title && title.value, payload);
		assert.strictEqual(dataFilePath && dataFilePath.value, payload);
	});

	test('a file path with an apostrophe (C:\\tmp\\it\'s\\a.txt) keeps the openFileInEditor handler syntactically intact', () => {
		const sandbox = loadSandbox();
		const filePath = 'C:\\tmp\\it\'s\\a.txt';
		const html = sandbox.formatToolInputUI({ file_path: filePath });
		const onclick = findAttr(html, 'onclick');
		assert.ok(onclick, 'expected an onclick attribute on the emitted element; got: ' + html);
		// The path is never embedded as a JS string literal in the handler (which an
		// apostrophe would break) -- it's read from the element's own dataset instead, so the
		// handler text itself is a fixed, path-independent string.
		assert.strictEqual(onclick!.value, 'openFileInEditor(this.dataset.filePath)');
	});

	test('data-file-path round-trips the exact original apostrophe path on the div that actually owns the onclick handler (matching how el.dataset.filePath reads it)', () => {
		const sandbox = loadSandbox();
		const filePath = 'C:\\tmp\\it\'s\\a.txt';
		const html = sandbox.formatToolInputUI({ file_path: filePath });
		// findAttrOn, not findAttr: formatFilePath's inner span also carries a data-file-path
		// copy, but this.dataset.filePath in the onclick handler reads it from the outer
		// div.diff-file-path specifically -- that's the element that must be checked.
		const dataFilePath = findAttrOn(html, 'diff-file-path', 'data-file-path');
		assert.ok(dataFilePath, 'expected a data-file-path attribute on div.diff-file-path; got: ' + html);
		assert.strictEqual(dataFilePath!.value, filePath);
	});

	test('a plain file path with no special characters still renders visibly (no functional regression)', () => {
		const sandbox = loadSandbox();
		const html = sandbox.formatToolInputUI({ file_path: '/home/user/project/index.ts' });
		assert.ok(html.includes('index.ts'), 'expected the file name to appear in the rendered output; got: ' + html);
		const dataFilePath = findAttrOn(html, 'diff-file-path', 'data-file-path');
		assert.strictEqual(dataFilePath && dataFilePath.value, '/home/user/project/index.ts');
	});
});
