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
		// #60: comments can contain an unbalanced quote (e.g. editMCPServer's pre-existing
		// "// Don't allow name changes when editing") that would otherwise be misread as a
		// string start, desyncing the brace count for everything after it and pulling in
		// unrelated trailing functions (found via editMCPServer, which no earlier suite ever
		// extracted). Skip comment contents entirely, same as a real JS tokenizer would.
		if (ch === '/' && source[i + 1] === '/') {
			const nl = source.indexOf('\n', i);
			i = nl === -1 ? source.length : nl;
			continue;
		}
		if (ch === '/' && source[i + 1] === '*') {
			const end = source.indexOf('*/', i + 2);
			i = end === -1 ? source.length : end + 1;
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

// ─────────────────────────────────────────────────────────────────────────
// #60 PoC: displayMCPServers() built the Edit/Delete buttons' onclick handlers by
// interpolating the raw server name (and, for Edit, JSON.stringify(config)) directly into a
// JS string literal inside an HTML attribute -- with NO escaping at all (not even the #57-era
// escapeHtml() mistake). A server name of x'); alert(1); (' from a workspace's own .mcp.json
// (loaded with _scope: 'project', see extension.ts) broke straight out of
// editMCPServer('...', ...) and ran arbitrary JS in a CSP of default-src * 'unsafe-inline'
// 'unsafe-eval'. Fix: name (and scope, for Delete) move into data-* (escapeAttr) +
// this.dataset.*, same pattern as #57/#58. The config object itself can never be
// escapeAttr()'d sanely as a JS-object-literal attribute value, so it no longer touches an
// attribute at all -- it's kept in a webview-scope map (mcpServerConfigsByName) and
// editMCPServer looks it up by name.
// ─────────────────────────────────────────────────────────────────────────

// Extracts a top-level "let NAME = ...;" declaration's exact source text (used for
// mcpServerConfigsByName/editingServerName, which extractFunction() can't grab -- they're not
// function declarations).
function extractDeclaration(source: string, name: string): string {
	const match = new RegExp('let\\s+' + name + '\\s*=\\s*[^;]+;').exec(source);
	if (!match) {
		throw new Error('declaration for ' + name + ' not found in emitted script');
	}
	return match[0];
}

// Concatenates the direct #text children of the first element carrying cssClass (document
// order); throws if no such element exists. If escaping were missing, a payload like
// '<img src=x onerror=alert(1)>' would parse as a real <img> element instead of literal text,
// so those characters would be MISSING from this concatenation -- the full raw payload
// round-tripping back as text is what proves the escaping worked.
function textOn(html: string, cssClass: string): string {
	const frag = parse5.parseFragment(html);
	let result: string | undefined;
	let elementFound = false;
	(function walk(node: parse5.DefaultTreeAdapterMap['node']): void {
		if (elementFound) { return; }
		const el = node as parse5.DefaultTreeAdapterMap['element'];
		if (el.attrs) {
			const classAttr = el.attrs.find(x => x.name === 'class');
			if (classAttr && classAttr.value.split(/\s+/).includes(cssClass)) {
				elementFound = true;
				const parent = node as parse5.DefaultTreeAdapterMap['parentNode'];
				result = (parent.childNodes || [])
					.filter(n => n.nodeName === '#text')
					.map(n => (n as parse5.DefaultTreeAdapterMap['textNode']).value)
					.join('');
				return;
			}
		}
		const parent = node as parse5.DefaultTreeAdapterMap['parentNode'];
		if (parent.childNodes) { parent.childNodes.forEach(walk); }
	})(frag);
	if (!elementFound) {
		throw new Error('no element with class "' + cssClass + '" found in: ' + html);
	}
	return result || '';
}

// Minimal DOM stand-in for displayMCPServers/editMCPServer/updateServerForm. All three only
// ever call getElementById(id).{value,disabled,textContent,style.display,innerHTML,className},
// document.createElement('div'), element.appendChild(child), element.insertAdjacentHTML(...)
// (cosmetic only -- edit-form h5 title, never security-relevant), and document.querySelector(
// ...) (also only cosmetic lookups in editMCPServer). A single auto-vivifying registry keyed
// by id lets assertions read back e.g. elements populated by editMCPServer after the call.
class FakeElement {
	className = '';
	value = '';
	disabled = false;
	style: Record<string, unknown> = {};
	children: FakeElement[] = [];
	private _innerHTML = '';
	// Mirrors FakeDiv above (escapeHtml()'s only external dependency): setting textContent
	// replaces the content with an HTML-escaped text serialization, exactly what escapeHtml()
	// reads back via innerHTML -- without this, escapeHtml() (used for .server-name/.server-type
	// text) silently returns '' for every input inside this sandbox. displayMCPServers/
	// editMCPServer, by contrast, only ever WRITE innerHTML directly (a full template string)
	// and never read it back through textContent, so a plain passthrough setter is enough there.
	set textContent(v: string) {
		this._innerHTML = String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}
	get innerHTML(): string { return this._innerHTML; }
	set innerHTML(v: string) { this._innerHTML = v; }
	appendChild(child: FakeElement): FakeElement { this.children.push(child); return child; }
	insertAdjacentHTML(): void { /* cosmetic only */ }
}

class FakeDocument {
	elementsById = new Map<string, FakeElement>();
	getElementById(id: string): FakeElement {
		let el = this.elementsById.get(id);
		if (!el) { el = new FakeElement(); this.elementsById.set(id, el); }
		return el;
	}
	createElement(tag: string): FakeElement {
		if (tag !== 'div') { throw new Error('unexpected document.createElement(' + tag + ')'); }
		return new FakeElement();
	}
	querySelector(): FakeElement {
		return new FakeElement();
	}
}

interface McpSandbox {
	displayMCPServers(servers: Record<string, unknown>): void;
	editMCPServer(name: string): void;
	// Test-only inspection shim -- top-level "let" bindings (editingServerName,
	// mcpServerConfigsByName) live in the vm Script's lexical scope, not as properties on the
	// sandbox/global object, so they aren't readable from outside via plain property access
	// (only top-level function/var declarations become global-object properties -- see
	// loadSandbox() above, which already relies on that half of the same rule). __testState is
	// never part of the real script.ts output; it only exists to expose those two "let"s here.
	__testState(): { editingServerName: string | null; configsByName: Record<string, unknown> };
}

function loadMcpSandbox(): { sandbox: McpSandbox; document: FakeDocument } {
	const body = getEmittedScriptBody();
	const document = new FakeDocument();
	const src = [
		extractDeclaration(body, 'editingServerName'),
		extractDeclaration(body, 'mcpServerConfigsByName'),
		extractFunction(body, 'escapeHtml'),
		extractFunction(body, 'escapeAttr'),
		extractFunction(body, 'updateServerForm'),
		extractFunction(body, 'displayMCPServers'),
		extractFunction(body, 'editMCPServer'),
		'function __testState() { return { editingServerName: editingServerName, configsByName: mcpServerConfigsByName }; }',
	].join('\n');
	const sandbox: Record<string, unknown> = { document };
	vm.createContext(sandbox);
	new vm.Script(src).runInContext(sandbox);
	return { sandbox: sandbox as unknown as McpSandbox, document };
}

// Renders `servers` and returns the .mcp-server-item div's innerHTML for the given server name
// plus the sandbox/document for further assertions (mcpServerConfigsByName via __testState(),
// or calling editMCPServer(...) next).
function renderServerItem(servers: Record<string, unknown>, name: string): { html: string; sandbox: McpSandbox; document: FakeDocument } {
	const { sandbox, document } = loadMcpSandbox();
	sandbox.displayMCPServers(servers);
	const serversList = document.getElementById('mcpServersList');
	const index = Object.keys(servers).indexOf(name);
	const item = serversList.children[index];
	if (!item) {
		throw new Error('displayMCPServers did not append an item for "' + name + '"; got ' + serversList.children.length + ' item(s)');
	}
	return { html: item.innerHTML, sandbox, document };
}

suite('webview attribute escaping: displayMCPServers / editMCPServer (#60 PoC)', () => {

	test('an attribute-breakout server name (x\'); alert(1); (\') cannot inject extra JS statements -- the onclick text is always the fixed, name-independent dataset call', () => {
		const payload = 'x\'); alert(1); (\'';
		const { html } = renderServerItem({ [payload]: { type: 'stdio', command: 'echo' } }, payload);
		const onclicks = [...html.matchAll(/onclick="([^"]*)"/g)].map(m => m[1]);
		assert.ok(onclicks.length > 0, 'expected at least one onclick attribute; got: ' + html);
		for (const oc of onclicks) {
			assert.ok(
				oc === 'editMCPServer(this.dataset.serverName)' || oc === 'deleteMCPServer(this.dataset.serverName, this.dataset.serverScope)',
				'onclick handler must be exactly the fixed dataset-based call, got: ' + oc
			);
		}
	});

	test('a server name with a double quote (x" onmouseover=...) stays contained -- no extra attribute breaks out', () => {
		const payload = 'x" onmouseover="alert(1)" y="';
		const { html } = renderServerItem({ [payload]: { type: 'stdio', command: 'echo' } }, payload);
		assert.ok(!findAttr(html, 'onmouseover'), 'must not contain an onmouseover attribute; got: ' + html);
	});

	test('the Edit button\'s onclick is exactly editMCPServer(this.dataset.serverName), independent of the name', () => {
		const payload = 'x\'); alert(1); (\'';
		const { html } = renderServerItem({ [payload]: { type: 'stdio', command: 'echo' } }, payload);
		const onclick = findAttrOn(html, 'server-edit-btn', 'onclick');
		assert.ok(onclick, 'expected an onclick attribute on .server-edit-btn; got: ' + html);
		assert.strictEqual(onclick!.value, 'editMCPServer(this.dataset.serverName)');
	});

	test('the Delete button\'s onclick is exactly deleteMCPServer(this.dataset.serverName, this.dataset.serverScope), independent of the name', () => {
		const payload = 'x\'); alert(1); (\'';
		const { html } = renderServerItem({ [payload]: { type: 'stdio', command: 'echo' } }, payload);
		const onclick = findAttrOn(html, 'server-delete-btn', 'onclick');
		assert.ok(onclick, 'expected an onclick attribute on .server-delete-btn; got: ' + html);
		assert.strictEqual(onclick!.value, 'deleteMCPServer(this.dataset.serverName, this.dataset.serverScope)');
	});

	test('data-server-name on both buttons round-trips the exact raw payload', () => {
		const payload = 'x\'); alert(1); (\'';
		const { html } = renderServerItem({ [payload]: { type: 'stdio', command: 'echo' } }, payload);
		const editName = findAttrOn(html, 'server-edit-btn', 'data-server-name');
		const deleteName = findAttrOn(html, 'server-delete-btn', 'data-server-name');
		assert.strictEqual(editName && editName.value, payload);
		assert.strictEqual(deleteName && deleteName.value, payload);
	});

	test('mcpServerConfigsByName holds the exact original config object after rendering (replaces the old JSON.stringify-in-attribute round-trip)', () => {
		const payload = 'x\'); alert(1); (\'';
		const config = { type: 'stdio', command: 'echo', args: ['a', 'b'] };
		const { sandbox } = renderServerItem({ [payload]: config }, payload);
		assert.strictEqual(sandbox.__testState().configsByName[payload], config);
	});

	test('editMCPServer(name), called with the exact string the rendered data-server-name attribute decodes to, looks up the right config and does not throw', () => {
		const payload = 'x\'); alert(1); (\'';
		const config = { type: 'http', url: 'https://example.com/mcp' };
		const { html, sandbox, document } = renderServerItem({ [payload]: config }, payload);
		const editName = findAttrOn(html, 'server-edit-btn', 'data-server-name');
		assert.strictEqual(editName && editName.value, payload);
		assert.doesNotThrow(() => sandbox.editMCPServer(editName!.value));
		assert.strictEqual(sandbox.__testState().editingServerName, payload);
		assert.strictEqual(document.getElementById('serverType').value, 'http');
		assert.strictEqual(document.getElementById('serverUrl').value, 'https://example.com/mcp');
	});

	test('a malicious config.type (<img src=x onerror=alert(1)>) renders as inert text in .server-type, not a live element', () => {
		const payload = '<img src=x onerror=alert(1)>';
		const { html } = renderServerItem({ srv: { type: payload } }, 'srv');
		assert.ok(!findAttr(html, 'onerror'), 'must not contain an onerror attribute; got: ' + html);
		assert.strictEqual(textOn(html, 'server-type'), payload.toUpperCase());
	});

	test('a plain server name/config with no special characters still renders visibly (no functional regression)', () => {
		const { html, sandbox } = renderServerItem({ 'my-server': { type: 'stdio', command: 'node' } }, 'my-server');
		assert.ok(html.includes('my-server'), 'expected the server name to appear in the rendered output; got: ' + html);
		assert.strictEqual(textOn(html, 'server-type'), 'STDIO');
		const editName = findAttrOn(html, 'server-edit-btn', 'data-server-name');
		assert.strictEqual(editName && editName.value, 'my-server');
		assert.strictEqual((sandbox.__testState().configsByName['my-server'] as { command: string }).command, 'node');
	});
});
