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
// evaluateCodeBlockCollapse -- so this suite extracts their exact
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
	// #61: renderAllModels()/renderDropdown() wire click handlers via
	// listContainer.querySelectorAll(...).forEach(...) -- an empty array is enough here since
	// none of these PoCs need the click wiring itself, only the innerHTML the sinks produce.
	querySelectorAll(): FakeElement[] { return []; }
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

// ─────────────────────────────────────────────────────────────────────────
// #61 Part A PoC: renderDropdown() (the model combo box built by initModelCombo()) and
// renderAllModels() (the "all models" modal) wrote model.id/model.name/model.owned_by
// straight into data-id=/data-model-id= attributes and innerHTML text -- with NO escaping at
// all (not even the #57-era escapeHtml()-in-attribute-context mistake). The models come from
// fetch(OPENCREDITS_API_URL + '/v1/models'), a third-party HTTP endpoint outside our control.
// Fix: escapeAttr() for the data-id/data-model-id attribute values, escapeHtml() for the
// name/id/owned_by text nodes -- same split as #57's fix.
// ─────────────────────────────────────────────────────────────────────────

interface DropdownSandbox {
	renderDropdown(query: string): void;
}

function loadDropdownSandbox(models: unknown[]): { sandbox: DropdownSandbox; dropdown: FakeElement } {
	const body = getEmittedScriptBody();
	const dropdown = new FakeElement();
	// #64 (known infra gap, not fixed here): extractFunction('escapeAttr') also drags in
	// safeHttpUrl/openFileInEditor/formatFilePath/toggleDiffExpansion/toggleResultExpansion --
	// escapeAttr's own /'/g regex literal desyncs the brace-matcher's naive quote tracking (see
	// extractFunction's own comment above). Checked via a standalone extraction dump before
	// relying on it here: harmless, those extra functions are only declared, never called.
	const src = [
		extractFunction(body, 'escapeHtml'),
		extractFunction(body, 'escapeAttr'),
		extractFunction(body, 'renderDropdown'),
	].join('\n');
	// renderDropdown is a nested function (closure over initModelCombo's dropdown/input/combo
	// locals) -- allModelsCache and dropdown are set directly as sandbox globals instead of
	// being declared inside the vm script, which resolves the same way a free variable would.
	// dropdown.querySelectorAll(...) returning [] means the mousedown-listener closure (which
	// references input/combo) is created but never invoked, so those two stay undefined-but-
	// unused without throwing. document.createElement('div') is escapeHtml()'s own stub (FakeDiv).
	const sandbox: Record<string, unknown> = {
		allModelsCache: models,
		dropdown,
		document: {
			createElement(tag: string) {
				if (tag !== 'div') { throw new Error('unexpected document.createElement(' + tag + ')'); }
				return new FakeDiv();
			}
		}
	};
	vm.createContext(sandbox);
	new vm.Script(src).runInContext(sandbox);
	return { sandbox: sandbox as unknown as DropdownSandbox, dropdown };
}

suite('webview attribute escaping: renderDropdown model combo box (#61 Part A PoC)', () => {

	test('an attribute-breakout model id stays contained -- no onmouseover attribute survives, and data-id round-trips the exact raw payload', () => {
		const payload = 'x" onmouseover="alert(1)" y="';
		const { sandbox, dropdown } = loadDropdownSandbox([{ id: payload, name: 'Model' }]);
		sandbox.renderDropdown('');
		assert.ok(!findAttr(dropdown.innerHTML, 'onmouseover'), 'must not contain an onmouseover attribute; got: ' + dropdown.innerHTML);
		const dataId = findAttrOn(dropdown.innerHTML, 'model-combo-option', 'data-id');
		assert.strictEqual(dataId && dataId.value, payload);
	});

	test('an <img onerror> payload in the model name renders as inert text, not a live element', () => {
		const payload = '<img src=x onerror=alert(1)>';
		const { sandbox, dropdown } = loadDropdownSandbox([{ id: 'm1', name: payload }]);
		sandbox.renderDropdown('');
		assert.ok(!findAttr(dropdown.innerHTML, 'onerror'), 'must not contain an onerror attribute; got: ' + dropdown.innerHTML);
		assert.strictEqual(textOn(dropdown.innerHTML, 'model-combo-option-name'), payload);
	});

	test('an attribute-breakout search query also stays contained in the "use as custom model" row', () => {
		const payload = 'x" onmouseover="alert(1)" y="';
		const { sandbox, dropdown } = loadDropdownSandbox([]);
		sandbox.renderDropdown(payload);
		assert.ok(!findAttr(dropdown.innerHTML, 'onmouseover'), 'must not contain an onmouseover attribute; got: ' + dropdown.innerHTML);
		const dataId = findAttrOn(dropdown.innerHTML, 'model-combo-custom', 'data-id');
		assert.strictEqual(dataId && dataId.value, payload);
	});

	test('a plain model with no special characters still renders visibly (no functional regression)', () => {
		const { sandbox, dropdown } = loadDropdownSandbox([{ id: 'gpt-4', name: 'GPT-4' }]);
		sandbox.renderDropdown('');
		assert.ok(dropdown.innerHTML.includes('GPT-4'), 'expected the model name to appear; got: ' + dropdown.innerHTML);
		const dataId = findAttrOn(dropdown.innerHTML, 'model-combo-option', 'data-id');
		assert.strictEqual(dataId && dataId.value, 'gpt-4');
	});
});

interface AllModelsSandbox {
	renderAllModels(models: unknown[]): void;
}

function loadAllModelsSandbox(): { sandbox: AllModelsSandbox; document: FakeDocument } {
	const body = getEmittedScriptBody();
	const document = new FakeDocument();
	const src = [
		extractFunction(body, 'escapeHtml'),
		extractFunction(body, 'escapeAttr'),
		extractFunction(body, 'renderAllModels'),
	].join('\n');
	const sandbox: Record<string, unknown> = { document, currentModel: 'opus' };
	vm.createContext(sandbox);
	new vm.Script(src).runInContext(sandbox);
	return { sandbox: sandbox as unknown as AllModelsSandbox, document };
}

suite('webview attribute escaping: renderAllModels "all models" modal (#61 Part A PoC)', () => {

	test('an attribute-breakout model id stays contained -- no onmouseover attribute survives, and data-model-id round-trips the exact raw payload', () => {
		const payload = 'x" onmouseover="alert(1)" y="';
		const { sandbox, document } = loadAllModelsSandbox();
		sandbox.renderAllModels([{ id: payload, name: 'Model' }]);
		const html = document.getElementById('allModelsList').innerHTML;
		assert.ok(!findAttr(html, 'onmouseover'), 'must not contain an onmouseover attribute; got: ' + html);
		const dataModelId = findAttrOn(html, 'all-models-item', 'data-model-id');
		assert.strictEqual(dataModelId && dataModelId.value, payload);
	});

	test('an <img onerror> payload in the model name renders as inert text', () => {
		const payload = '<img src=x onerror=alert(1)>';
		const { sandbox, document } = loadAllModelsSandbox();
		sandbox.renderAllModels([{ id: 'm1', name: payload }]);
		const html = document.getElementById('allModelsList').innerHTML;
		assert.ok(!findAttr(html, 'onerror'), 'must not contain an onerror attribute; got: ' + html);
		assert.strictEqual(textOn(html, 'all-models-item-name'), payload);
	});

	test('an <img onerror> payload in owned_by renders as inert text', () => {
		const payload = '<img src=x onerror=alert(1)>';
		const { sandbox, document } = loadAllModelsSandbox();
		sandbox.renderAllModels([{ id: 'm1', name: 'Model', owned_by: payload }]);
		const html = document.getElementById('allModelsList').innerHTML;
		assert.ok(!findAttr(html, 'onerror'), 'must not contain an onerror attribute; got: ' + html);
		assert.strictEqual(textOn(html, 'all-models-item-provider'), payload);
	});

	test('a plain model with no special characters still renders visibly (no functional regression)', () => {
		const { sandbox, document } = loadAllModelsSandbox();
		sandbox.renderAllModels([{ id: 'gpt-4', name: 'GPT-4', owned_by: 'openai' }]);
		const html = document.getElementById('allModelsList').innerHTML;
		assert.ok(html.includes('GPT-4'), 'expected the model name to appear; got: ' + html);
		const dataModelId = findAttrOn(html, 'all-models-item', 'data-model-id');
		assert.strictEqual(dataModelId && dataModelId.value, 'gpt-4');
	});
});

// ─────────────────────────────────────────────────────────────────────────
// #61 Part A follow-up (opus-Review): openCreditsModels is overwritten wholesale by
// resolveLatestModels() (model-updater.ts) from fetch(apiBaseUrl + '/v1/models') -- the SAME
// third-party endpoint as renderDropdown/renderAllModels above, just reached indirectly via
// extension.ts's 'updateRecommendedModels' postMessage -- and renderOpenCreditsModelCards()
// (the model-card grid shown by default whenever OpenCredits is enabled) runs unconditionally
// on that update, with no user interaction gating it. It wrote model.id/model.provider/
// model.name straight into data-model-id=/data-provider=/innerHTML with NO escaping.
// ─────────────────────────────────────────────────────────────────────────

interface ModelCardsSandbox {
	renderOpenCreditsModelCards(): void;
}

function loadModelCardsSandbox(openCreditsModels: unknown[]): { sandbox: ModelCardsSandbox; document: FakeDocument } {
	const body = getEmittedScriptBody();
	const document = new FakeDocument();
	const src = [
		extractFunction(body, 'escapeHtml'),
		extractFunction(body, 'escapeAttr'),
		extractFunction(body, 'isModelMatch'),
		extractFunction(body, 'getCreditsPricing'),
		extractFunction(body, 'renderOpenCreditsModelCards'),
	].join('\n');
	const sandbox: Record<string, unknown> = {
		document,
		openCreditsModels,
		currentModel: 'opus',
		pendingModelSelection: null,
		hasOpenCreditsKey: false,
		creditsPricingData: null,
	};
	vm.createContext(sandbox);
	new vm.Script(src).runInContext(sandbox);
	return { sandbox: sandbox as unknown as ModelCardsSandbox, document };
}

suite('webview attribute escaping: renderOpenCreditsModelCards model-card grid (#61 Part A follow-up PoC)', () => {

	test('an <img onerror> payload in model.name renders as inert text, not a live element (the opus-Review finding)', () => {
		const payload = '<img src=x onerror="alert(document.domain)">';
		const { sandbox, document } = loadModelCardsSandbox([{ id: 'openai/gpt-9.9', name: payload, provider: 'openai' }]);
		sandbox.renderOpenCreditsModelCards();
		const html = document.getElementById('opencreditsModelCards').innerHTML;
		assert.ok(!findAttr(html, 'onerror'), 'must not contain a live onerror attribute; got: ' + html);
		assert.strictEqual(textOn(html, 'model-card-name'), payload);
	});

	test('an attribute-breakout model id/provider stays contained -- no onmouseover attribute survives, and data-model-id/data-provider round-trip the exact raw payloads', () => {
		const idPayload = 'x" onmouseover="alert(1)" y="';
		const providerPayload = 'z" onmouseover="alert(2)" w="';
		const { sandbox, document } = loadModelCardsSandbox([{ id: idPayload, name: 'Model', provider: providerPayload }]);
		sandbox.renderOpenCreditsModelCards();
		const html = document.getElementById('opencreditsModelCards').innerHTML;
		assert.ok(!findAttr(html, 'onmouseover'), 'must not contain an onmouseover attribute; got: ' + html);
		const dataModelId = findAttrOn(html, 'model-card', 'data-model-id');
		const dataProvider = findAttrOn(html, 'model-card', 'data-provider');
		assert.strictEqual(dataModelId && dataModelId.value, idPayload);
		assert.strictEqual(dataProvider && dataProvider.value, providerPayload);
	});

	test('an <img onerror> payload in model.provider renders as inert text in .model-card-provider', () => {
		const payload = '<img src=x onerror=alert(1)>';
		const { sandbox, document } = loadModelCardsSandbox([{ id: 'm1', name: 'Model', provider: payload }]);
		sandbox.renderOpenCreditsModelCards();
		const html = document.getElementById('opencreditsModelCards').innerHTML;
		assert.ok(!findAttr(html, 'onerror'), 'must not contain an onerror attribute; got: ' + html);
		assert.strictEqual(textOn(html, 'model-card-provider'), payload);
	});

	test('a plain model with no special characters still renders visibly (no functional regression)', () => {
		const { sandbox, document } = loadModelCardsSandbox([{ id: 'openai/gpt-4', name: 'GPT-4', provider: 'openai' }]);
		sandbox.renderOpenCreditsModelCards();
		const html = document.getElementById('opencreditsModelCards').innerHTML;
		assert.ok(html.includes('GPT-4'), 'expected the model name to appear; got: ' + html);
		const dataModelId = findAttrOn(html, 'model-card', 'data-model-id');
		assert.strictEqual(dataModelId && dataModelId.value, 'openai/gpt-4');
	});
});

// ─────────────────────────────────────────────────────────────────────────
// #61 Part B PoC: renderMarketplace() and showMarketplaceDetail() already ran the MCP
// registry's icon/url values through escapeAttr() (post-#57), making src=/href= itself
// ausbruchsicher -- but neither ever checked the URL SCHEME, so a "javascript:" (or oddly-cased
// / whitespace-obfuscated) src=/href= still rendered and would execute on click/load. The data
// comes from registry.modelcontextprotocol.io / mcp.agent-tooling.dev, publishable by anyone.
// Fix: safeHttpUrl() only lets http:/https: through; the caller then omits the attribute/link
// entirely (icon placeholder / no GitHub link) instead of rendering a dead attribute.
// ─────────────────────────────────────────────────────────────────────────

function tagExists(html: string, tagName: string): boolean {
	const frag = parse5.parseFragment(html);
	let found = false;
	(function walk(node: parse5.DefaultTreeAdapterMap['node']): void {
		if (found) { return; }
		const el = node as parse5.DefaultTreeAdapterMap['element'];
		if (el.tagName === tagName) { found = true; return; }
		const parent = node as parse5.DefaultTreeAdapterMap['parentNode'];
		if (parent.childNodes) { parent.childNodes.forEach(walk); }
	})(frag);
	return found;
}

function classExists(html: string, cssClass: string): boolean {
	const frag = parse5.parseFragment(html);
	let found = false;
	(function walk(node: parse5.DefaultTreeAdapterMap['node']): void {
		if (found) { return; }
		const el = node as parse5.DefaultTreeAdapterMap['element'];
		if (el.attrs) {
			const classAttr = el.attrs.find(x => x.name === 'class');
			if (classAttr && classAttr.value.split(/\s+/).includes(cssClass)) { found = true; return; }
		}
		const parent = node as parse5.DefaultTreeAdapterMap['parentNode'];
		if (parent.childNodes) { parent.childNodes.forEach(walk); }
	})(frag);
	return found;
}

interface MarketplaceSandbox {
	renderMarketplace(servers: unknown[], isLoading?: boolean): void;
	showMarketplaceDetail(serverId: string): void;
}

// marketplaceDisplayed/marketplaceCache/lastSearchQuery are plain "var" module-level state in
// script.ts, read as free variables by renderMarketplace/showMarketplaceDetail -- passed in as
// sandbox globals here (never declared inside the vm script itself), same technique as
// allModelsCache/currentModel/dropdown above.
function loadMarketplaceSandbox(marketplaceDisplayed: unknown[]): { sandbox: MarketplaceSandbox; document: FakeDocument } {
	const body = getEmittedScriptBody();
	const document = new FakeDocument();
	const src = [
		extractFunction(body, 'escapeHtml'),
		extractFunction(body, 'escapeAttr'),
		extractFunction(body, 'safeHttpUrl'),
		extractFunction(body, 'renderMarketplace'),
		extractFunction(body, 'showMarketplaceDetail'),
	].join('\n');
	const sandbox: Record<string, unknown> = {
		document,
		marketplaceDisplayed,
		marketplaceCache: null,
		lastSearchQuery: ''
	};
	vm.createContext(sandbox);
	new vm.Script(src).runInContext(sandbox);
	return { sandbox: sandbox as unknown as MarketplaceSandbox, document };
}

suite('webview attribute escaping: MCP marketplace icon/link schema guard (#61 Part B PoC)', () => {

	test('renderMarketplace: a "javascript:" icon URL is dropped -- no <img> element, placeholder rendered instead', () => {
		const { sandbox, document } = loadMarketplaceSandbox([]);
		sandbox.renderMarketplace([{ id: 's1', name: 'Srv', icon: 'javascript:alert(1)' }]);
		const html = document.getElementById('marketplaceGrid').innerHTML;
		assert.ok(!tagExists(html, 'img'), 'must not render an <img> element for a javascript: icon URL; got: ' + html);
		assert.ok(classExists(html, 'marketplace-item-icon-placeholder'), 'expected the placeholder fallback instead; got: ' + html);
	});

	test('renderMarketplace: a plain https icon URL still renders normally (no functional regression)', () => {
		const { sandbox, document } = loadMarketplaceSandbox([]);
		sandbox.renderMarketplace([{ id: 's1', name: 'Srv', icon: 'https://example.com/icon.png' }]);
		const html = document.getElementById('marketplaceGrid').innerHTML;
		const src = findAttrOn(html, 'marketplace-item-icon', 'src');
		assert.strictEqual(src && src.value, 'https://example.com/icon.png');
	});

	test('showMarketplaceDetail: a "javascript:" icon URL is dropped -- no <img> element, placeholder rendered instead', () => {
		const server = { id: 's1', name: 'Srv', icon: 'javascript:alert(1)', description: 'desc' };
		const { sandbox, document } = loadMarketplaceSandbox([server]);
		sandbox.showMarketplaceDetail('s1');
		const html = document.getElementById('marketplaceGrid').innerHTML;
		assert.ok(!tagExists(html, 'img'), 'must not render an <img> element for a javascript: icon URL; got: ' + html);
		assert.ok(classExists(html, 'marketplace-item-icon-placeholder'), 'expected the placeholder fallback instead; got: ' + html);
	});

	test('showMarketplaceDetail: a "javascript:" repository URL produces no GitHub link at all', () => {
		const server = { id: 's1', name: 'Srv', url: 'javascript:alert(1)', description: 'desc' };
		const { sandbox, document } = loadMarketplaceSandbox([server]);
		sandbox.showMarketplaceDetail('s1');
		const html = document.getElementById('marketplaceGrid').innerHTML;
		assert.ok(!classExists(html, 'marketplace-detail-link'), 'must not render a GitHub link for a javascript: url; got: ' + html);
		assert.ok(!findAttr(html, 'href'), 'must not contain an href attribute anywhere; got: ' + html);
	});

	test('showMarketplaceDetail: a mixed-case/whitespace-obfuscated "javascript:" repository URL is also blocked', () => {
		const server = { id: 's1', name: 'Srv', url: 'Java\tScRiPt:alert(1)', description: 'desc' };
		const { sandbox, document } = loadMarketplaceSandbox([server]);
		sandbox.showMarketplaceDetail('s1');
		const html = document.getElementById('marketplaceGrid').innerHTML;
		assert.ok(!classExists(html, 'marketplace-detail-link'), 'must not render a GitHub link for an obfuscated javascript: url; got: ' + html);
		assert.ok(!findAttr(html, 'href'), 'must not contain an href attribute anywhere; got: ' + html);
	});

	test('showMarketplaceDetail: a plain https repository URL still renders the GitHub link normally (no functional regression)', () => {
		const server = { id: 's1', name: 'Srv', url: 'https://github.com/foo/bar', description: 'desc' };
		const { sandbox, document } = loadMarketplaceSandbox([server]);
		sandbox.showMarketplaceDetail('s1');
		const html = document.getElementById('marketplaceGrid').innerHTML;
		const href = findAttrOn(html, 'marketplace-detail-link', 'href');
		assert.strictEqual(href && href.value, 'https://github.com/foo/bar');
	});
});

// ─────────────────────────────────────────────────────────────────────────
// #61 Part C PoC: addEnvVariableRow() wrote key/value straight into value="..." with NO
// escaping at all. Self-XSS only (the values come from the user's own extension settings), but
// a '"' in a saved value truncates the rendered field instead of round-tripping. Fix:
// escapeAttr(), same pattern as the other #57-era value="..." sinks.
// ─────────────────────────────────────────────────────────────────────────

interface EnvRowSandbox {
	addEnvVariableRow(key: string, value: string): void;
}

function loadEnvRowSandbox(): { sandbox: EnvRowSandbox; document: FakeDocument } {
	const body = getEmittedScriptBody();
	const document = new FakeDocument();
	const src = [
		extractFunction(body, 'escapeHtml'),
		extractFunction(body, 'escapeAttr'),
		extractFunction(body, 'addEnvVariableRow'),
	].join('\n');
	const sandbox: Record<string, unknown> = { document };
	vm.createContext(sandbox);
	new vm.Script(src).runInContext(sandbox);
	return { sandbox: sandbox as unknown as EnvRowSandbox, document };
}

suite('webview attribute escaping: addEnvVariableRow (#61 Part C PoC)', () => {

	test('an attribute-breakout key stays contained -- no onmouseover attribute survives, and value="..." round-trips the exact raw payload', () => {
		const payload = 'x" onmouseover="alert(1)" y="';
		const { sandbox, document } = loadEnvRowSandbox();
		sandbox.addEnvVariableRow(payload, 'plain');
		const container = document.getElementById('env-variables-list');
		const html = container.children[0].innerHTML;
		assert.ok(!findAttr(html, 'onmouseover'), 'must not contain an onmouseover attribute; got: ' + html);
		const keyValue = findAttrOn(html, 'env-key', 'value');
		assert.strictEqual(keyValue && keyValue.value, payload);
	});

	test('a value containing a double quote no longer truncates the rendered field -- value="..." round-trips it exactly', () => {
		const payload = 'sk-abc"123';
		const { sandbox, document } = loadEnvRowSandbox();
		sandbox.addEnvVariableRow('API_KEY', payload);
		const container = document.getElementById('env-variables-list');
		const html = container.children[0].innerHTML;
		const value = findAttrOn(html, 'env-value', 'value');
		assert.strictEqual(value && value.value, payload);
	});

	test('a plain key/value with no special characters still renders visibly (no functional regression)', () => {
		const { sandbox, document } = loadEnvRowSandbox();
		sandbox.addEnvVariableRow('API_KEY', 'sk-abc123');
		const container = document.getElementById('env-variables-list');
		const html = container.children[0].innerHTML;
		const keyValue = findAttrOn(html, 'env-key', 'value');
		const value = findAttrOn(html, 'env-value', 'value');
		assert.strictEqual(keyValue && keyValue.value, 'API_KEY');
		assert.strictEqual(value && value.value, 'sk-abc123');
	});
});

// ─────────────────────────────────────────────────────────────────────────
// #62 Part A PoC: copyCodeBlock() read data-raw-code via getAttribute() -- which the browser
// already entity-decodes during HTML parsing, since data-raw-code is built via escapeAttr(code)
// in parseSimpleMarkdown's codeBodyHtml assembly -- and then ran a SECOND, manual decode pass
// (.replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&')) on
// top of the already-decoded value. That second pass is a no-op for ordinary special characters
// (a lone decoded '&'/'<'/'>'/'"'/''' doesn't spell out an entity reference), but corrupts any
// code block whose content literally contains one of the four entity texts (&quot; / &amp; /
// &lt; / &gt;) -- e.g. a snippet that itself demonstrates HTML-entity syntax. Fix: drop the
// second decode; getAttribute()'s result is already the exact original code.
//
// This suite calls the REAL, extracted parseSimpleMarkdown (not a hand-copied reconstruction of
// its codeBodyHtml assembly) to produce the data-raw-code attribute, reads it back through
// parse5 (which entity-decodes attribute values exactly like a real browser's getAttribute()
// would), and then runs the REAL, extracted copyCodeBlock against that value, asserting on what
// it hands to navigator.clipboard.writeText(...). What these tests establish is that the
// clipboard text is always exactly what getAttribute('data-raw-code') returns -- copyCodeBlock
// no longer transforms it at all. getAttribute()'s own value is not always byte-identical to the
// markdown input: the HTML parser normalises CR/CRLF to LF and NUL to U+FFFD while parsing the
// attribute (pre-existing browser/parse5 behaviour, unrelated to this fix, not exercised by the
// inputs below since none contain CR or NUL), and the fence regex in parseSimpleMarkdown
// captures the newline immediately before the closing ``` fence (see collapse-rules.ts's own
// comment on this) -- so for the plain inputs used here, getAttribute() returns `input + '\n'`.
// ─────────────────────────────────────────────────────────────────────────

interface CodeBlockSandbox {
	parseSimpleMarkdown(markdown: string): string;
}

// renderMathEnabled: false -- these PoCs never need KaTeX (no "$"/"\(" in the test inputs), and
// skipping math extraction entirely (rather than stubbing extractMathSegments/restoreMathSegments
// and their katex dependency) keeps the sandbox to exactly the functions the data-raw-code path
// actually needs: escapeHtml, escapeAttr, normalizeCollapseThreshold, evaluateCodeBlockCollapse,
// extractCodeBlocks, parseSimpleMarkdown. extractCodeBlocks (#63): parseSimpleMarkdown's
// fenced-code-block extraction moved into its own shared function (also used by
// renderUserMessageContent, see user-message-rawtext.test.ts) -- parseSimpleMarkdown now
// calls it instead of building the placeholder/collapse/copy-button HTML inline.
function loadCodeBlockSandbox(): CodeBlockSandbox {
	const body = getEmittedScriptBody();
	const src = ['escapeHtml', 'escapeAttr', 'normalizeCollapseThreshold', 'evaluateCodeBlockCollapse', 'extractCodeBlocks', 'parseSimpleMarkdown']
		.map(name => extractFunction(body, name))
		.join('\n');
	const sandbox: Record<string, unknown> = {
		renderMathEnabled: false,
		collapseLongCodeBlocks: true,
		collapseCodeBlockLines: 20,
		document: {
			createElement(tag: string) {
				if (tag !== 'div') { throw new Error('unexpected document.createElement(' + tag + ')'); }
				return new FakeDiv();
			}
		}
	};
	vm.createContext(sandbox);
	new vm.Script(src).runInContext(sandbox);
	return sandbox as unknown as CodeBlockSandbox;
}

// Renders a single fenced ```text code block and returns the data-raw-code value parse5 reads
// off the <code class="language-text" ...> element -- the getAttribute('data-raw-code')
// equivalent (parse5 entity-decodes attribute values during parsing, exactly like a real
// browser). findAttrOn (element-scoped), not findAttr: the language-fixed "language-text" class
// pins this to the actual <code> element that carries data-raw-code, not any other element.
function renderCodeBlockRawAttr(code: string): string {
	const sandbox = loadCodeBlockSandbox();
	const markdown = '```text\n' + code + '\n```';
	const html = sandbox.parseSimpleMarkdown(markdown);
	const attr = findAttrOn(html, 'language-text', 'data-raw-code');
	if (!attr) { throw new Error('expected a data-raw-code attribute on the language-text code element; got: ' + html); }
	return attr.value;
}

// Extracts and runs the REAL copyCodeBlock() against a getAttribute('data-raw-code')-equivalent
// value, capturing what it hands to navigator.clipboard.writeText(...).
function runCopyCodeBlock(dataRawCode: string): string {
	const body = getEmittedScriptBody();
	// #64 (known infra gap, not fixed here): extractFunction can drag in trailing functions when
	// it misreads a regex literal as an unbalanced quote (see the renderDropdown suite's own #64
	// comment above). copyCodeBlock's decode chain has four /pattern/g regex literals, none of
	// which contain a brace or a "//"/quote that could desync the brace-matcher -- checked here
	// via length/start/end instead of assuming that's safe.
	const src = extractFunction(body, 'copyCodeBlock');
	assert.ok(src.startsWith('function copyCodeBlock(codeId) {'), 'extractFunction(copyCodeBlock) did not start where expected; got: ' + src.slice(0, 80));
	assert.ok(src.trimEnd().endsWith('}'), 'extractFunction(copyCodeBlock) did not end at a closing brace; got: ' + src.slice(-80));
	assert.ok(!/\n\s*function\s+\w+\s*\(/.test(src.slice('function copyCodeBlock(codeId) {'.length)), 'extractFunction(copyCodeBlock) appears to have dragged in a trailing function declaration (#64); got: ' + src);
	let clipboardText: string | undefined;
	const sandbox: Record<string, unknown> = {
		document: {
			getElementById(_id: string) {
				return {
					getAttribute(name: string) { return name === 'data-raw-code' ? dataRawCode : null; },
					closest() { return { querySelector() { return null; } }; }
				};
			}
		},
		navigator: {
			clipboard: {
				writeText(text: string) {
					clipboardText = text;
					return { then(cb: () => void) { cb(); return { catch() { /* noop */ } }; } };
				}
			}
		},
		console
	};
	vm.createContext(sandbox);
	new vm.Script(src + '\ncopyCodeBlock("x");').runInContext(sandbox);
	if (clipboardText === undefined) { throw new Error('copyCodeBlock never called navigator.clipboard.writeText'); }
	return clipboardText;
}

suite('webview attribute escaping: copyCodeBlock double-decode (#62 Part A PoC)', () => {

	test('a code block literally containing "&quot;" -- the clipboard text matches getAttribute() exactly, no longer double-decoded (the corruption case)', () => {
		const code = 'literal &quot; entity';
		const dataRawCode = renderCodeBlockRawAttr(code);
		assert.strictEqual(dataRawCode, code + '\n', 'getAttribute() equivalent must already be the exact original code');
		const clipboardText = runCopyCodeBlock(dataRawCode);
		assert.strictEqual(clipboardText, code + '\n');
	});

	test('a code block literally containing "&amp;" -- the clipboard text matches getAttribute() exactly (the <script>&amp;alert(1)</script> case)', () => {
		const code = '<script>&amp;alert(1)</script>';
		const dataRawCode = renderCodeBlockRawAttr(code);
		assert.strictEqual(dataRawCode, code + '\n');
		const clipboardText = runCopyCodeBlock(dataRawCode);
		assert.strictEqual(clipboardText, code + '\n');
	});

	test('a code block literally containing "&lt;" and "&gt;" -- the clipboard text matches getAttribute() exactly', () => {
		const code = 'a &lt;div&gt; tag as text';
		const dataRawCode = renderCodeBlockRawAttr(code);
		assert.strictEqual(dataRawCode, code + '\n');
		const clipboardText = runCopyCodeBlock(dataRawCode);
		assert.strictEqual(clipboardText, code + '\n');
	});

	test('ordinary special characters (&, <, >, ", \') that do not spell out an entity -- the clipboard text matches getAttribute() exactly (no functional regression)', () => {
		const code = 'const s = "a" + \'b\' & <c> && d;';
		const dataRawCode = renderCodeBlockRawAttr(code);
		assert.strictEqual(dataRawCode, code + '\n');
		const clipboardText = runCopyCodeBlock(dataRawCode);
		assert.strictEqual(clipboardText, code + '\n');
	});

	test('a multi-line code block mixing real special characters and literal entity text -- the clipboard text matches getAttribute() exactly', () => {
		const code = [
			'function f(a, b) {',
			'  // literal example: &quot;quoted&quot; and &amp;amp;',
			'  return a < b && b > a ? "yes" : \'no\';',
			'}'
		].join('\n');
		const dataRawCode = renderCodeBlockRawAttr(code);
		assert.strictEqual(dataRawCode, code + '\n');
		const clipboardText = runCopyCodeBlock(dataRawCode);
		assert.strictEqual(clipboardText, code + '\n');
	});
});
