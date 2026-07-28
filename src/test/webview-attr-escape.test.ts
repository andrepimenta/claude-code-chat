// PoC/regression tests for fork-issue-57 (HTML attribute / inline-handler injection via escapeHtml()
// used in attribute contexts). fork-issue-49's escapeHtml() serialises through
// textContent->innerHTML and therefore leaves " and ' untouched -- fine for element text
// content, but not for attribute values (title="...", data-*="...", src="...", href="...",
// value="...") or for a value embedded as a JS string argument inside an inline
// onclick="fn('...')" handler. escapeAttr() (also escapes " and ') plus the
// data-*/this.dataset.* pattern (see fork-issue-58's renderPermissions) is the fix for both sinks.
//
// formatFilePath/formatToolInputUI only exist inline inside script.ts's giant getScript()
// template literal -- never as an importable module, unlike escapeAttr/
// evaluateCodeBlockCollapse -- so this suite extracts their exact
// source text from the ACTUAL getScript() output (out/script.js, i.e. the real emitted webview
// code, not a hand-copied version of the TS source) via extractFunction() (webview-dom-helpers.ts,
// parser-based since fork-issue-64), runs it in a vm sandbox with the one stub escapeHtml() needs
// (document.createElement), and parses the resulting HTML string with parse5 -- the same
// HTML5-spec parser class real browsers use -- to assert no attribute-breakout / inline-handler-
// breakage survives. Run with `npm run test:webview-attr-escape`.

import * as assert from 'assert';
import * as vm from 'vm';
import * as parse5 from 'parse5';
import getScript from '../script';
import getHtml from '../ui';
import { extractFunction, findAttr, findAttrOn, textOn, tagExists } from './webview-dom-helpers';

function getEmittedScriptBody(): string {
	const html = getScript(false);
	const match = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/.exec(html);
	if (!match) {
		throw new Error('getScript(false) did not contain a <script>...</script> block');
	}
	return match[1];
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

suite('webview attribute escaping: formatFilePath / formatToolInputUI (fork-issue-57 PoC)', () => {

	test('an attribute-breakout file_path (a" onmouseover="alert(1)" zz=") produces no onmouseover attribute anywhere in the emitted element', () => {
		const sandbox = loadSandbox();
		const payload = 'a" onmouseover="alert(1)" zz="';
		const html = sandbox.formatToolInputUI({ file_path: payload });
		assert.ok(!findAttr(html, 'onmouseover'), 'emitted HTML must not contain an onmouseover attribute; got: ' + html);
	});

	test('the same payload also stays contained when passed straight through formatFilePath (the fork-issue-57 reference sink)', () => {
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
// fork-issue-60 PoC: displayMCPServers() built the Edit/Delete buttons' onclick handlers by
// interpolating the raw server name (and, for Edit, JSON.stringify(config)) directly into a
// JS string literal inside an HTML attribute -- with NO escaping at all (not even the fork-issue-57-era
// escapeHtml() mistake). A server name of x'); alert(1); (' from a workspace's own .mcp.json
// (loaded with _scope: 'project', see extension.ts) broke straight out of
// editMCPServer('...', ...) and ran arbitrary JS in a CSP of default-src * 'unsafe-inline'
// 'unsafe-eval'. Fix: name (and scope, for Delete) move into data-* (escapeAttr) +
// this.dataset.*, same pattern as fork-issue-57/fork-issue-58. The config object itself can never be
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

// Minimal DOM stand-in for displayMCPServers/editMCPServer/updateServerForm. All three only
// ever call getElementById(id).{value,disabled,textContent,style.display,innerHTML,className},
// document.createElement('div'), element.appendChild(child), element.insertAdjacentHTML(...)
// (cosmetic only -- edit-form h5 title, never security-relevant), and document.querySelector(
// ...) (also only cosmetic lookups in editMCPServer). A single auto-vivifying registry keyed
// by id lets assertions read back e.g. elements populated by editMCPServer after the call.
class FakeElement {
	className = '';
	private _value = '';
	// fork-issue-67: elements tied to a fixed <option> list (currently only #serverScope, wired up in
	// FakeDocument.getElementById below) validate an assigned .value against it, mirroring a
	// real <select>'s behaviour: assigning a value with no matching <option> resets .value to ''
	// (a disabled <option> still counts as a match -- disabled only blocks the interactive
	// picker, not a script's own .value assignment; see MDN/HTML spec on HTMLSelectElement's
	// value IDL attribute). undefined (the default, every other element -- inputs/textareas/the
	// renderDropdown target) means no restriction, same plain passthrough as before.
	validValues?: Set<string>;
	get value(): string { return this._value; }
	set value(v: string) { this._value = (!this.validValues || this.validValues.has(v)) ? v : ''; }
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
	// fork-issue-65: hideAddServerForm()'s formTitle.remove() call (removing the "Edit MCP Server" <h5> on
	// reset) -- cosmetic only, same as insertAdjacentHTML above.
	remove(): void { /* cosmetic only */ }
	// fork-issue-61: renderAllModels()/renderDropdown() wire click handlers via
	// listContainer.querySelectorAll(...).forEach(...) -- an empty array is enough here since
	// none of these PoCs need the click wiring itself, only the innerHTML the sinks produce.
	querySelectorAll(): FakeElement[] { return []; }
	// fork-issue-67: installMarketplaceServer()'s final "scroll the form into view" call -- cosmetic only,
	// same as insertAdjacentHTML/remove above.
	scrollIntoView(): void { /* cosmetic only */ }
}

// fork-issue-65 (review): getElementById() used to auto-vivify an element for ANY id, including ids
// that don't exist anywhere in the real webview -- which made a null-deref (document.
// getElementById('addServerBtn').style.display = 'none', 'addServerBtn' having no matching
// id="..." in the emitted HTML at all) structurally invisible to this harness: it could never go
// red here, no matter what the real code did. realHtmlIds is parsed from the ACTUAL getHtml(...)
// output (not hand-maintained) so getElementById below can return null for anything a real
// browser would too, same as the id="..." set check-webview-syntax.js's own PASS proof runs
// getHtml(...) with.
const realHtmlIds: Set<string> = (() => {
	const html = getHtml(false, undefined, undefined, undefined, 'webview-attr-escape.test', '0.0.0');
	const ids = new Set<string>();
	const idAttrRe = /\bid="([^"]+)"/g;
	let m: RegExpExecArray | null;
	while ((m = idAttrRe.exec(html)) !== null) {
		ids.add(m[1]);
	}
	return ids;
})();

// fork-issue-67: same "derive from the ACTUAL getHtml(...) output" principle as realHtmlIds above, applied
// to #serverScope's own <option value="..."> list -- lets FakeElement's value setter (above)
// reproduce a real <select>'s "no matching <option> -> value reads back as ''" behaviour instead
// of accepting any string unconditionally.
const realServerScopeOptionValues: Set<string> = (() => {
	const html = getHtml(false, undefined, undefined, undefined, 'webview-attr-escape.test', '0.0.0');
	const selectMatch = /<select id="serverScope">([\s\S]*?)<\/select>/.exec(html);
	const values = new Set<string>();
	if (selectMatch) {
		const optionRe = /<option value="([^"]+)"/g;
		let m: RegExpExecArray | null;
		while ((m = optionRe.exec(selectMatch[1])) !== null) {
			values.add(m[1]);
		}
	}
	return values;
})();

class FakeDocument {
	elementsById = new Map<string, FakeElement>();
	getElementById(id: string): FakeElement | null {
		if (!realHtmlIds.has(id)) {
			return null;
		}
		let el = this.elementsById.get(id);
		if (!el) {
			el = new FakeElement();
			if (id === 'serverScope') { el.validValues = realServerScopeOptionValues; }
			this.elementsById.set(id, el);
		}
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
	// fork-issue-65: hideAddServerForm is the single reset point for both "Cancel" and a successful save
	// (see saveMCPServer's own hideAddServerForm() call) -- it's what has to undo editMCPServer's
	// #serverScope lock again for a subsequent "Add manually".
	hideAddServerForm(): void;
	// fork-issue-67: showAddServerForm is the entry point the "+ Add manually" buttons and
	// installMarketplaceServer() call directly (not hideAddServerForm()) -- it has to reset
	// editingServerName and unlock #serverScope on its own for the same reason.
	showAddServerForm(): void;
	// fork-issue-67: saveMCPServer posts the actual vscode message -- resolves the scope from
	// editingServerName's own config while editing (locked #serverScope is display-only), or
	// from the select for a fresh add.
	saveMCPServer(): void;
	// Test-only inspection shim -- top-level "let" bindings (editingServerName,
	// mcpServerConfigsByName) live in the vm Script's lexical scope, not as properties on the
	// sandbox/global object, so they aren't readable from outside via plain property access
	// (only top-level function/var declarations become global-object properties -- see
	// loadSandbox() above, which already relies on that half of the same rule). __testState is
	// never part of the real script.ts output; it only exists to expose those two "let"s here.
	__testState(): { editingServerName: string | null; configsByName: Record<string, unknown> };
}

function loadMcpSandbox(): { sandbox: McpSandbox; document: FakeDocument; posted: Record<string, unknown>[] } {
	const body = getEmittedScriptBody();
	const document = new FakeDocument();
	const posted: Record<string, unknown>[] = [];
	const src = [
		extractDeclaration(body, 'editingServerName'),
		extractDeclaration(body, 'mcpServerConfigsByName'),
		extractFunction(body, 'escapeHtml'),
		extractFunction(body, 'escapeAttr'),
		extractFunction(body, 'updateServerForm'),
		extractFunction(body, 'displayMCPServers'),
		extractFunction(body, 'editMCPServer'),
		// fork-issue-67 (review): resetAddServerFormFields() -- the field-reset helper hideAddServerForm()
		// and showAddServerForm() both call -- must be loaded too now that they no longer inline it.
		extractFunction(body, 'resetAddServerFormFields'),
		extractFunction(body, 'hideAddServerForm'),
		extractFunction(body, 'showAddServerForm'),
		extractFunction(body, 'saveMCPServer'),
		'function __testState() { return { editingServerName: editingServerName, configsByName: mcpServerConfigsByName }; }',
	].join('\n');
	// hideAddServerForm() (used only by the fork-issue-65 reset tests below) calls the real loadMCPServers(),
	// which posts a message to the (non-existent, in this sandbox) vscode API -- stubbed out here,
	// same technique as the free-variable globals (dropdown/allModelsCache/etc.) elsewhere in this
	// file, since re-fetching the server list isn't part of what these tests check. fork-issue-67:
	// saveMCPServer() also calls sendStats(...) and vscode.postMessage(...) -- sendStats is a
	// no-op stub (telemetry isn't what these tests check), vscode.postMessage records into
	// `posted` (a plain host-realm array; the sandbox's postMessage closure can freely reference
	// it even though it runs inside the vm, same as the loadMCPServers/document stubs).
	const sandbox: Record<string, unknown> = {
		document,
		loadMCPServers: () => { /* noop */ },
		sendStats: () => { /* noop */ },
		vscode: { postMessage: (msg: Record<string, unknown>) => { posted.push(msg); } },
	};
	vm.createContext(sandbox);
	new vm.Script(src).runInContext(sandbox);
	return { sandbox: sandbox as unknown as McpSandbox, document, posted };
}

interface McpSandbox2 extends McpSandbox {
	// fork-issue-67: the marketplace's own "Install" flow, the other real caller of showAddServerForm()
	// (~script.ts:2500) besides the plain "+ Add manually" buttons already covered by McpSandbox.
	installMarketplaceServer(serverId: string): void;
	// var marketplaceDisplayed -- a free variable in script.ts, passed in as a sandbox global
	// (mutable array reference) the same way loadMarketplaceSandbox() does it above.
	marketplaceDisplayed: { id: string; name?: string; installConfig: Record<string, unknown> }[];
}

// Separate loader (rather than folding installMarketplaceServer into loadMcpSandbox() above) --
// installMarketplaceServer needs the marketplaceDisplayed/marketplaceCache free variables that no
// other test in this suite cares about, same reasoning as loadMarketplaceSandbox() having its own
// loader instead of being merged into loadMcpSandbox().
function loadMcpSandbox2(): { sandbox: McpSandbox2; document: FakeDocument; posted: Record<string, unknown>[] } {
	const body = getEmittedScriptBody();
	const document = new FakeDocument();
	const posted: Record<string, unknown>[] = [];
	const src = [
		extractDeclaration(body, 'editingServerName'),
		extractDeclaration(body, 'mcpServerConfigsByName'),
		extractFunction(body, 'escapeHtml'),
		extractFunction(body, 'escapeAttr'),
		extractFunction(body, 'updateServerForm'),
		extractFunction(body, 'displayMCPServers'),
		extractFunction(body, 'editMCPServer'),
		// fork-issue-67 (review): resetAddServerFormFields() -- the field-reset helper hideAddServerForm()
		// and showAddServerForm() both call -- must be loaded too now that they no longer inline it.
		extractFunction(body, 'resetAddServerFormFields'),
		extractFunction(body, 'hideAddServerForm'),
		extractFunction(body, 'showAddServerForm'),
		extractFunction(body, 'saveMCPServer'),
		extractFunction(body, 'installMarketplaceServer'),
		'function __testState() { return { editingServerName: editingServerName, configsByName: mcpServerConfigsByName }; }',
	].join('\n');
	const marketplaceDisplayed: { id: string; name?: string; installConfig: Record<string, unknown> }[] = [];
	const sandbox: Record<string, unknown> = {
		document,
		loadMCPServers: () => { /* noop */ },
		sendStats: () => { /* noop */ },
		vscode: { postMessage: (msg: Record<string, unknown>) => { posted.push(msg); } },
		marketplaceDisplayed,
		marketplaceCache: null,
	};
	vm.createContext(sandbox);
	new vm.Script(src).runInContext(sandbox);
	return { sandbox: sandbox as unknown as McpSandbox2, document, posted };
}

// Renders `servers` and returns the .mcp-server-item div's innerHTML for the given server name
// plus the sandbox/document for further assertions (mcpServerConfigsByName via __testState(),
// or calling editMCPServer(...) next).
function renderServerItem(servers: Record<string, unknown>, name: string): { html: string; sandbox: McpSandbox; document: FakeDocument } {
	const { sandbox, document } = loadMcpSandbox();
	sandbox.displayMCPServers(servers);
	const serversList = document.getElementById('mcpServersList')!;
	const index = Object.keys(servers).indexOf(name);
	const item = serversList.children[index];
	if (!item) {
		throw new Error('displayMCPServers did not append an item for "' + name + '"; got ' + serversList.children.length + ' item(s)');
	}
	return { html: item.innerHTML, sandbox, document };
}

suite('webview attribute escaping: displayMCPServers / editMCPServer (fork-issue-60 PoC)', () => {

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
		assert.strictEqual(document.getElementById('serverType')!.value, 'http');
		assert.strictEqual(document.getElementById('serverUrl')!.value, 'https://example.com/mcp');
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
// fork-issue-61 Part A PoC: renderDropdown() (the model combo box built by initModelCombo()) and
// renderAllModels() (the "all models" modal) wrote model.id/model.name/model.owned_by
// straight into data-id=/data-model-id= attributes and innerHTML text -- with NO escaping at
// all (not even the fork-issue-57-era escapeHtml()-in-attribute-context mistake). The models come from
// fetch(OPENCREDITS_API_URL + '/v1/models'), a third-party HTTP endpoint outside our control.
// Fix: escapeAttr() for the data-id/data-model-id attribute values, escapeHtml() for the
// name/id/owned_by text nodes -- same split as fork-issue-57's fix.
// ─────────────────────────────────────────────────────────────────────────

interface DropdownSandbox {
	renderDropdown(query: string): void;
}

function loadDropdownSandbox(models: unknown[]): { sandbox: DropdownSandbox; dropdown: FakeElement } {
	const body = getEmittedScriptBody();
	const dropdown = new FakeElement();
	// fork-issue-64 (fixed): extractFunction('escapeAttr') used to also drag in
	// safeHttpUrl/openFileInEditor/formatFilePath/toggleDiffExpansion/toggleResultExpansion --
	// escapeAttr's own /'/g regex literal desynced the old brace-matcher's naive quote tracking.
	// extractFunction is now parser-based (webview-dom-helpers.ts) and returns exactly the
	// escapeAttr function, nothing more.
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

suite('webview attribute escaping: renderDropdown model combo box (fork-issue-61 Part A PoC)', () => {

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

suite('webview attribute escaping: renderAllModels "all models" modal (fork-issue-61 Part A PoC)', () => {

	test('an attribute-breakout model id stays contained -- no onmouseover attribute survives, and data-model-id round-trips the exact raw payload', () => {
		const payload = 'x" onmouseover="alert(1)" y="';
		const { sandbox, document } = loadAllModelsSandbox();
		sandbox.renderAllModels([{ id: payload, name: 'Model' }]);
		const html = document.getElementById('allModelsList')!.innerHTML;
		assert.ok(!findAttr(html, 'onmouseover'), 'must not contain an onmouseover attribute; got: ' + html);
		const dataModelId = findAttrOn(html, 'all-models-item', 'data-model-id');
		assert.strictEqual(dataModelId && dataModelId.value, payload);
	});

	test('an <img onerror> payload in the model name renders as inert text', () => {
		const payload = '<img src=x onerror=alert(1)>';
		const { sandbox, document } = loadAllModelsSandbox();
		sandbox.renderAllModels([{ id: 'm1', name: payload }]);
		const html = document.getElementById('allModelsList')!.innerHTML;
		assert.ok(!findAttr(html, 'onerror'), 'must not contain an onerror attribute; got: ' + html);
		assert.strictEqual(textOn(html, 'all-models-item-name'), payload);
	});

	test('an <img onerror> payload in owned_by renders as inert text', () => {
		const payload = '<img src=x onerror=alert(1)>';
		const { sandbox, document } = loadAllModelsSandbox();
		sandbox.renderAllModels([{ id: 'm1', name: 'Model', owned_by: payload }]);
		const html = document.getElementById('allModelsList')!.innerHTML;
		assert.ok(!findAttr(html, 'onerror'), 'must not contain an onerror attribute; got: ' + html);
		assert.strictEqual(textOn(html, 'all-models-item-provider'), payload);
	});

	test('a plain model with no special characters still renders visibly (no functional regression)', () => {
		const { sandbox, document } = loadAllModelsSandbox();
		sandbox.renderAllModels([{ id: 'gpt-4', name: 'GPT-4', owned_by: 'openai' }]);
		const html = document.getElementById('allModelsList')!.innerHTML;
		assert.ok(html.includes('GPT-4'), 'expected the model name to appear; got: ' + html);
		const dataModelId = findAttrOn(html, 'all-models-item', 'data-model-id');
		assert.strictEqual(dataModelId && dataModelId.value, 'gpt-4');
	});
});

// ─────────────────────────────────────────────────────────────────────────
// fork-issue-61 Part A follow-up: openCreditsModels is overwritten wholesale by
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

suite('webview attribute escaping: renderOpenCreditsModelCards model-card grid (fork-issue-61 Part A follow-up PoC)', () => {

	test('an <img onerror> payload in model.name renders as inert text, not a live element (the review finding)', () => {
		const payload = '<img src=x onerror="alert(document.domain)">';
		const { sandbox, document } = loadModelCardsSandbox([{ id: 'openai/gpt-9.9', name: payload, provider: 'openai' }]);
		sandbox.renderOpenCreditsModelCards();
		const html = document.getElementById('opencreditsModelCards')!.innerHTML;
		assert.ok(!findAttr(html, 'onerror'), 'must not contain a live onerror attribute; got: ' + html);
		assert.strictEqual(textOn(html, 'model-card-name'), payload);
	});

	test('an attribute-breakout model id/provider stays contained -- no onmouseover attribute survives, and data-model-id/data-provider round-trip the exact raw payloads', () => {
		const idPayload = 'x" onmouseover="alert(1)" y="';
		const providerPayload = 'z" onmouseover="alert(2)" w="';
		const { sandbox, document } = loadModelCardsSandbox([{ id: idPayload, name: 'Model', provider: providerPayload }]);
		sandbox.renderOpenCreditsModelCards();
		const html = document.getElementById('opencreditsModelCards')!.innerHTML;
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
		const html = document.getElementById('opencreditsModelCards')!.innerHTML;
		assert.ok(!findAttr(html, 'onerror'), 'must not contain an onerror attribute; got: ' + html);
		assert.strictEqual(textOn(html, 'model-card-provider'), payload);
	});

	test('a plain model with no special characters still renders visibly (no functional regression)', () => {
		const { sandbox, document } = loadModelCardsSandbox([{ id: 'openai/gpt-4', name: 'GPT-4', provider: 'openai' }]);
		sandbox.renderOpenCreditsModelCards();
		const html = document.getElementById('opencreditsModelCards')!.innerHTML;
		assert.ok(html.includes('GPT-4'), 'expected the model name to appear; got: ' + html);
		const dataModelId = findAttrOn(html, 'model-card', 'data-model-id');
		assert.strictEqual(dataModelId && dataModelId.value, 'openai/gpt-4');
	});
});

// ─────────────────────────────────────────────────────────────────────────
// fork-issue-61 Part B PoC: renderMarketplace() and showMarketplaceDetail() already ran the MCP
// registry's icon/url values through escapeAttr() (post-fork-issue-57), making src=/href= itself
// ausbruchsicher -- but neither ever checked the URL SCHEME, so a "javascript:" (or oddly-cased
// / whitespace-obfuscated) src=/href= still rendered and would execute on click/load. The data
// comes from registry.modelcontextprotocol.io / mcp.agent-tooling.dev, publishable by anyone.
// Fix: safeHttpUrl() only lets http:/https: through; the caller then omits the attribute/link
// entirely (icon placeholder / no GitHub link) instead of rendering a dead attribute.
// ─────────────────────────────────────────────────────────────────────────

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

suite('webview attribute escaping: MCP marketplace icon/link schema guard (fork-issue-61 Part B PoC)', () => {

	test('renderMarketplace: a "javascript:" icon URL is dropped -- no <img> element, placeholder rendered instead', () => {
		const { sandbox, document } = loadMarketplaceSandbox([]);
		sandbox.renderMarketplace([{ id: 's1', name: 'Srv', icon: 'javascript:alert(1)' }]);
		const html = document.getElementById('marketplaceGrid')!.innerHTML;
		assert.ok(!tagExists(html, 'img'), 'must not render an <img> element for a javascript: icon URL; got: ' + html);
		assert.ok(classExists(html, 'marketplace-item-icon-placeholder'), 'expected the placeholder fallback instead; got: ' + html);
	});

	test('renderMarketplace: a plain https icon URL still renders normally (no functional regression)', () => {
		const { sandbox, document } = loadMarketplaceSandbox([]);
		sandbox.renderMarketplace([{ id: 's1', name: 'Srv', icon: 'https://example.com/icon.png' }]);
		const html = document.getElementById('marketplaceGrid')!.innerHTML;
		const src = findAttrOn(html, 'marketplace-item-icon', 'src');
		assert.strictEqual(src && src.value, 'https://example.com/icon.png');
	});

	test('showMarketplaceDetail: a "javascript:" icon URL is dropped -- no <img> element, placeholder rendered instead', () => {
		const server = { id: 's1', name: 'Srv', icon: 'javascript:alert(1)', description: 'desc' };
		const { sandbox, document } = loadMarketplaceSandbox([server]);
		sandbox.showMarketplaceDetail('s1');
		const html = document.getElementById('marketplaceGrid')!.innerHTML;
		assert.ok(!tagExists(html, 'img'), 'must not render an <img> element for a javascript: icon URL; got: ' + html);
		assert.ok(classExists(html, 'marketplace-item-icon-placeholder'), 'expected the placeholder fallback instead; got: ' + html);
	});

	test('showMarketplaceDetail: a "javascript:" repository URL produces no GitHub link at all', () => {
		const server = { id: 's1', name: 'Srv', url: 'javascript:alert(1)', description: 'desc' };
		const { sandbox, document } = loadMarketplaceSandbox([server]);
		sandbox.showMarketplaceDetail('s1');
		const html = document.getElementById('marketplaceGrid')!.innerHTML;
		assert.ok(!classExists(html, 'marketplace-detail-link'), 'must not render a GitHub link for a javascript: url; got: ' + html);
		assert.ok(!findAttr(html, 'href'), 'must not contain an href attribute anywhere; got: ' + html);
	});

	test('showMarketplaceDetail: a mixed-case/whitespace-obfuscated "javascript:" repository URL is also blocked', () => {
		const server = { id: 's1', name: 'Srv', url: 'Java\tScRiPt:alert(1)', description: 'desc' };
		const { sandbox, document } = loadMarketplaceSandbox([server]);
		sandbox.showMarketplaceDetail('s1');
		const html = document.getElementById('marketplaceGrid')!.innerHTML;
		assert.ok(!classExists(html, 'marketplace-detail-link'), 'must not render a GitHub link for an obfuscated javascript: url; got: ' + html);
		assert.ok(!findAttr(html, 'href'), 'must not contain an href attribute anywhere; got: ' + html);
	});

	test('showMarketplaceDetail: a plain https repository URL still renders the GitHub link normally (no functional regression)', () => {
		const server = { id: 's1', name: 'Srv', url: 'https://github.com/foo/bar', description: 'desc' };
		const { sandbox, document } = loadMarketplaceSandbox([server]);
		sandbox.showMarketplaceDetail('s1');
		const html = document.getElementById('marketplaceGrid')!.innerHTML;
		const href = findAttrOn(html, 'marketplace-detail-link', 'href');
		assert.strictEqual(href && href.value, 'https://github.com/foo/bar');
	});
});

// ─────────────────────────────────────────────────────────────────────────
// fork-issue-61 Part C PoC: addEnvVariableRow() wrote key/value straight into value="..." with NO
// escaping at all. Self-XSS only (the values come from the user's own extension settings), but
// a '"' in a saved value truncates the rendered field instead of round-tripping. Fix:
// escapeAttr(), same pattern as the other fork-issue-57-era value="..." sinks.
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

suite('webview attribute escaping: addEnvVariableRow (fork-issue-61 Part C PoC)', () => {

	test('an attribute-breakout key stays contained -- no onmouseover attribute survives, and value="..." round-trips the exact raw payload', () => {
		const payload = 'x" onmouseover="alert(1)" y="';
		const { sandbox, document } = loadEnvRowSandbox();
		sandbox.addEnvVariableRow(payload, 'plain');
		const container = document.getElementById('env-variables-list')!;
		const html = container.children[0].innerHTML;
		assert.ok(!findAttr(html, 'onmouseover'), 'must not contain an onmouseover attribute; got: ' + html);
		const keyValue = findAttrOn(html, 'env-key', 'value');
		assert.strictEqual(keyValue && keyValue.value, payload);
	});

	test('a value containing a double quote no longer truncates the rendered field -- value="..." round-trips it exactly', () => {
		const payload = 'sk-abc"123';
		const { sandbox, document } = loadEnvRowSandbox();
		sandbox.addEnvVariableRow('API_KEY', payload);
		const container = document.getElementById('env-variables-list')!;
		const html = container.children[0].innerHTML;
		const value = findAttrOn(html, 'env-value', 'value');
		assert.strictEqual(value && value.value, payload);
	});

	test('a plain key/value with no special characters still renders visibly (no functional regression)', () => {
		const { sandbox, document } = loadEnvRowSandbox();
		sandbox.addEnvVariableRow('API_KEY', 'sk-abc123');
		const container = document.getElementById('env-variables-list')!;
		const html = container.children[0].innerHTML;
		const keyValue = findAttrOn(html, 'env-key', 'value');
		const value = findAttrOn(html, 'env-value', 'value');
		assert.strictEqual(keyValue && keyValue.value, 'API_KEY');
		assert.strictEqual(value && value.value, 'sk-abc123');
	});
});

// ─────────────────────────────────────────────────────────────────────────
// fork-issue-62 Part A PoC: copyCodeBlock() read data-raw-code via getAttribute() -- which the browser
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

// The sandbox is kept to exactly the functions the data-raw-code path actually needs:
// escapeHtml, escapeAttr, normalizeCollapseThreshold, evaluateCodeBlockCollapse,
// extractCodeBlocks, parseSimpleMarkdown. extractCodeBlocks (fork-issue-63): parseSimpleMarkdown's
// fenced-code-block extraction moved into its own shared function (also used by
// renderUserMessageContent, see user-message-rawtext.test.ts) -- parseSimpleMarkdown now
// calls it instead of building the placeholder/collapse/copy-button HTML inline.
function loadCodeBlockSandbox(): CodeBlockSandbox {
	const body = getEmittedScriptBody();
	// restoreCodeBlockPlaceholders (fork-issue-55): script.ts splices this in via
	// `${restoreCodeBlockPlaceholders.toString()}` (build-time, see markdown-restore.ts), so it
	// appears in the emitted body as an ordinary function declaration extractFunction can find,
	// same as the others below -- parseSimpleMarkdown calls it to restore __CODEBLOCK_N__.
	const src = ['escapeHtml', 'escapeAttr', 'normalizeCollapseThreshold', 'evaluateCodeBlockCollapse', 'restoreCodeBlockPlaceholders', 'extractCodeBlocks', 'parseSimpleMarkdown']
		.map(name => extractFunction(body, name))
		.join('\n');
	const sandbox: Record<string, unknown> = {
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
	// fork-issue-64 (fixed): extractFunction is now parser-based and can no longer drag in trailing
	// functions by misreading a regex literal as an unbalanced quote (copyCodeBlock's own decode
	// chain has four /pattern/g regex literals). Kept as an explicit start/end/no-trailing-
	// declaration check anyway, as a belt-and-suspenders regression guard for this one call site.
	const src = extractFunction(body, 'copyCodeBlock');
	assert.ok(src.startsWith('function copyCodeBlock(codeId) {'), 'extractFunction(copyCodeBlock) did not start where expected; got: ' + src.slice(0, 80));
	assert.ok(src.trimEnd().endsWith('}'), 'extractFunction(copyCodeBlock) did not end at a closing brace; got: ' + src.slice(-80));
	assert.ok(!/\n\s*function\s+\w+\s*\(/.test(src.slice('function copyCodeBlock(codeId) {'.length)), 'extractFunction(copyCodeBlock) appears to have dragged in a trailing function declaration (fork-issue-64); got: ' + src);
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

suite('webview attribute escaping: copyCodeBlock double-decode (fork-issue-62 Part A PoC)', () => {

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

// ─────────────────────────────────────────────────────────────────────────
// fork-issue-64: extractFunction() (webview-dom-helpers.ts) used to find a function's source text via
// hand-rolled, quote-aware brace matching, which knew about strings and comments but not about
// regex literals. escapeAttr's own `.replace(/'/g, '&#39;')` made the old scanner see `/` then
// `'` and misread the apostrophe as a string start, desyncing the brace count for everything
// after it -- pulling 2365 characters of unrelated trailing functions (safeHttpUrl,
// openFileInEditor, formatFilePath, toggleDiffExpansion, toggleResultExpansion) into the
// "escapeAttr" extraction, and duplicating formatFilePath into the vm sandbox. This was
// previously harmless only because escapeAttr sits at the front of that chunk and a later,
// correctly-extracted formatFilePath always overwrote the contaminated one -- reordering or
// editing toggleResultExpansion would have broken every test in this file. extractFunction is
// now parser-based (TypeScript's own parser) and structurally cannot have this failure mode;
// these tests pin that down for the exact case that triggered it.
// ─────────────────────────────────────────────────────────────────────────

suite('extractFunction: regex literals containing a quote no longer desync extraction (fork-issue-64)', () => {

	test('extracting escapeAttr returns exactly its own body -- no trailing functions dragged in', () => {
		const body = getEmittedScriptBody();
		const src = extractFunction(body, 'escapeAttr');
		assert.ok(src.startsWith('function escapeAttr('), 'expected the escapeAttr extraction to start with its own signature; got: ' + src.slice(0, 80));
		assert.ok(src.trimEnd().endsWith('}'), 'expected the escapeAttr extraction to end at a closing brace; got: ' + src.slice(-80));
		// The fork-issue-64 bug specifically dragged in these five trailing declarations (in this order) --
		// see the file header comment above.
		for (const trailingName of ['safeHttpUrl', 'openFileInEditor', 'formatFilePath', 'toggleDiffExpansion', 'toggleResultExpansion']) {
			assert.ok(
				!src.includes('function ' + trailingName + '('),
				'escapeAttr extraction must not contain a trailing function ' + trailingName + '(...) declaration (fork-issue-64 regression); got: ' + src
			);
		}
		// General form of the same check: no OTHER top-level "function NAME(" declaration may
		// appear anywhere inside the extracted text at all.
		assert.ok(
			!/\n\s*function\s+\w+\s*\(/.test(src.slice('function escapeAttr('.length)),
			'escapeAttr extraction appears to have dragged in a trailing function declaration (fork-issue-64 regression); got length ' + src.length
		);
		// escapeAttr's own regex literals must still be present verbatim -- proves the fix didn't
		// achieve a short extraction by truncating early instead of stopping at the right brace.
		assert.ok(src.includes("replace(/'/g, '&#39;')"), 'escapeAttr extraction is missing its own final .replace(/\'/g, \'&#39;\') call; got: ' + src);
	});

	test('extracting formatFilePath (declared after escapeAttr in the emitted script) still returns exactly its own body, not escapeAttr\'s', () => {
		const body = getEmittedScriptBody();
		const src = extractFunction(body, 'formatFilePath');
		assert.ok(src.startsWith('function formatFilePath('), 'expected the formatFilePath extraction to start with its own signature; got: ' + src.slice(0, 80));
		assert.ok(!src.includes('function escapeAttr('), 'formatFilePath extraction must not contain escapeAttr\'s declaration; got: ' + src);
		assert.ok(!src.includes('function toggleDiffExpansion('), 'formatFilePath extraction must not contain toggleDiffExpansion\'s declaration; got: ' + src);
	});

	test('a synthetic function with an apostrophe inside a regex literal in its body extracts correctly and does not swallow the next declaration', () => {
		const source = [
			'function withQuoteInRegex(s) {',
			"\treturn s.replace(/'/g, 'X');",
			'}',
			'',
			'function nextFn() {',
			'\treturn 1;',
			'}'
		].join('\n');
		const src = extractFunction(source, 'withQuoteInRegex');
		assert.strictEqual(src, [
			'function withQuoteInRegex(s) {',
			"\treturn s.replace(/'/g, 'X');",
			'}'
		].join('\n'));
	});
});

// ─────────────────────────────────────────────────────────────────────────
// fork-issue-65 (review): editMCPServer() unconditionally did
// document.getElementById('addServerBtn').style.display = 'none' as its very first DOM write --
// but no element anywhere in the real, emitted webview HTML carries id="addServerBtn" (the
// "+ Add manually" buttons have no id at all; pre-existing, predates fork-issue-65, traced to upstream
// deca7de). getElementById('addServerBtn') therefore returns null in a real browser, and
// null.style throws a TypeError -- BEFORE editMCPServer ever reaches the #serverScope lock the
// Part A suite below tests, making that fix a no-op in practice. The old FakeDocument
// auto-vivified an element for every id, including ids that don't exist in the real HTML, so this
// null-deref was structurally invisible to this harness -- it could never go red no matter what
// the real code did. FakeDocument.getElementById now returns null for any id not present in the
// real getHtml(...) output (see realHtmlIds above), same as a real browser.
// ─────────────────────────────────────────────────────────────────────────

suite('webview MCP server form: editMCPServer() does not throw on the (real, id-less) "+ Add manually" button (fork-issue-65 review PoC)', () => {

	test('editMCPServer() does not throw even though #addServerBtn does not exist in the real HTML, and actually shows the form', () => {
		const { sandbox, document } = loadMcpSandbox();
		sandbox.displayMCPServers({ srv: { type: 'stdio', command: 'echo', _scope: 'project' } });
		assert.doesNotThrow(() => sandbox.editMCPServer('srv'));
		assert.strictEqual(sandbox.__testState().editingServerName, 'srv', 'editMCPServer must have run past the addServerBtn line to reach editingServerName = name');
		assert.strictEqual(document.getElementById('addServerForm')!.style.display, 'block', 'the edit form itself must actually become visible');
		assert.strictEqual(document.getElementById('popularServers')!.style.display, 'none');
	});
});

// ─────────────────────────────────────────────────────────────────────────
// fork-issue-65 Part A PoC: editMCPServer() populated every form field from the server's own config
// EXCEPT #serverScope, which kept whatever the select happened to be showing (left over from a
// previous "Add manually"/edit, or its HTML default). saveMCPServer() then sends that stale value
// as the scope to write to. A scope mismatch (editing a "global" server while the select still
// shows "Project") doesn't move the server between .mcp.json and ~/.claude.json -- moving a server
// between scopes isn't implemented anywhere -- it writes a SECOND copy into the wrongly-selected
// scope's file, leaving the original in place: a silent duplicate. Fix: editMCPServer() sets
// #serverScope to config._scope and locks it (disabled), same as the #serverName field right above
// it (a scope change is a move between two config files, not an edit, and isn't implemented as one
// either) -- hideAddServerForm() (the single reset point for both Cancel and a successful save,
// already responsible for unlocking #serverName again) undoes the lock for a fresh "Add manually".
// ─────────────────────────────────────────────────────────────────────────

suite('webview MCP server form: #serverScope locked to the server\'s own scope while editing (fork-issue-65 Part A PoC)', () => {

	test('editing a "global"-scope server sets #serverScope to "global" and disables it', () => {
		const { sandbox, document } = loadMcpSandbox();
		sandbox.displayMCPServers({ srv: { type: 'stdio', command: 'echo', _scope: 'global' } });
		sandbox.editMCPServer('srv');
		const scopeEl = document.getElementById('serverScope')!;
		assert.strictEqual(scopeEl.value, 'global');
		assert.strictEqual(scopeEl.disabled, true);
	});

	test('editing a "project"-scope server sets #serverScope to "project" and disables it', () => {
		const { sandbox, document } = loadMcpSandbox();
		sandbox.displayMCPServers({ srv: { type: 'stdio', command: 'echo', _scope: 'project' } });
		sandbox.editMCPServer('srv');
		const scopeEl = document.getElementById('serverScope')!;
		assert.strictEqual(scopeEl.value, 'project');
		assert.strictEqual(scopeEl.disabled, true);
	});

	test('after editing, hideAddServerForm() (Cancel, or a successful Save) unlocks #serverScope again for the next "Add manually", and resets its value to "project" (review: heals the pre-existing "next add after editing a Global server defaults to Global, not Project" quirk too)', () => {
		const { sandbox, document } = loadMcpSandbox();
		sandbox.displayMCPServers({ srv: { type: 'stdio', command: 'echo', _scope: 'global' } });
		sandbox.editMCPServer('srv');
		const scopeEl = document.getElementById('serverScope')!;
		assert.strictEqual(scopeEl.disabled, true, 'sanity check: editMCPServer must have locked it first');
		sandbox.hideAddServerForm();
		assert.strictEqual(scopeEl.disabled, false, '#serverScope must be free to choose again after hideAddServerForm()');
		assert.strictEqual(scopeEl.value, 'project', 'review: unlocking alone is not enough -- the SELECTION (left at "global" by editMCPServer()) must also reset to the default, not silently carry over into the next "Add manually"');
	});
});

// ─────────────────────────────────────────────────────────────────────────
// fork-issue-65 Part B1 PoC: mcpServerConfigsByName (fork-issue-60) was a plain {} object. Looking a server name up
// in it (mcpServerConfigsByName[name]) walks the prototype chain for names that collide with an
// inherited Object.prototype property -- "toString", "constructor", "valueOf", etc. -- returning a
// function (truthy) instead of undefined, which slips straight past editMCPServer's
// "if (!config) return;" guard and proceeds to populate the edit form from that function as if it
// were a real server config. Fix: Object.create(null) instead of {}, both at the top-level
// declaration and at displayMCPServers()'s per-render reset -- a null-prototype object has no
// inherited properties to fall through to, so the lookup correctly returns undefined.
// ─────────────────────────────────────────────────────────────────────────

suite('webview MCP server form: editMCPServer() prototype-pollution guard (fork-issue-65 Part B1 PoC)', () => {

	test('editMCPServer("toString") does not resolve Object.prototype.toString as a config -- the form stays untouched', () => {
		const { sandbox, document } = loadMcpSandbox();
		// A render that does NOT include a server literally named "toString" -- same situation as
		// an unrelated stale/crafted call reaching editMCPServer with that name.
		sandbox.displayMCPServers({ 'other-server': { type: 'stdio', command: 'echo' } });
		sandbox.editMCPServer('toString');
		assert.strictEqual(sandbox.__testState().editingServerName, null, 'editingServerName must stay null -- editMCPServer must have returned early');
		assert.strictEqual(document.getElementById('serverName')!.value, '', '#serverName must not have been populated');
	});

	test('editMCPServer("constructor") does not resolve Object.prototype.constructor as a config -- the form stays untouched', () => {
		const { sandbox, document } = loadMcpSandbox();
		sandbox.displayMCPServers({ 'other-server': { type: 'stdio', command: 'echo' } });
		sandbox.editMCPServer('constructor');
		assert.strictEqual(sandbox.__testState().editingServerName, null, 'editingServerName must stay null -- editMCPServer must have returned early');
		assert.strictEqual(document.getElementById('serverName')!.value, '', '#serverName must not have been populated');
	});

	test('editMCPServer for a real, previously rendered server still works (no functional regression)', () => {
		const { sandbox, document } = loadMcpSandbox();
		sandbox.displayMCPServers({ srv: { type: 'stdio', command: 'echo' } });
		sandbox.editMCPServer('srv');
		assert.strictEqual(sandbox.__testState().editingServerName, 'srv');
		assert.strictEqual(document.getElementById('serverName')!.value, 'srv');
		assert.strictEqual(document.getElementById('serverCommand')!.value, 'echo');
	});
});

// ─────────────────────────────────────────────────────────────────────────
// fork-issue-65 Part B2 PoC: displayMCPServers() built .server-type's text via
// escapeHtml(serverType.toUpperCase()) -- .toUpperCase() throws a TypeError for any non-string,
// truthy config.type (e.g. a malformed .mcp.json with "type": 5 or "type": {}). That throw happens
// mid-way through the innerHTML string build for that one server, inside the "for...of" loop, with
// no try/catch anywhere in displayMCPServers() -- so it propagates straight out of the function,
// aborting the render: every server after the malformed one, AND the "+ Add manually"/"Authenticate"
// buttons appended after the loop, never get appended to the DOM. Fix: String(serverType) before
// .toUpperCase(), still passed through escapeHtml() as before (fork-issue-60).
// ─────────────────────────────────────────────────────────────────────────

suite('webview MCP server list: a non-string config.type no longer aborts the render (fork-issue-65 Part B2 PoC)', () => {

	test('a numeric type (5) on a server in the middle of the list does not throw, and every server plus the trailing buttons still get rendered', () => {
		const { sandbox, document } = loadMcpSandbox();
		const servers = {
			good1: { type: 'stdio', command: 'echo' },
			bad: { type: 5, command: 'echo' },
			good2: { type: 'stdio', command: 'echo' }
		};
		assert.doesNotThrow(() => sandbox.displayMCPServers(servers));
		const serversList = document.getElementById('mcpServersList')!;
		assert.strictEqual(serversList.children.length, 4, 'expected 3 server items + 1 trailing actions div; got ' + serversList.children.length);
		assert.strictEqual(serversList.children[3].className, 'mcp-add-server', 'the trailing "+ Add manually"/"Authenticate" actions div must be the last child');
		assert.ok(serversList.children[0].innerHTML.includes('good1'));
		assert.ok(serversList.children[1].innerHTML.includes('bad'));
		assert.ok(serversList.children[2].innerHTML.includes('good2'), 'good2 (rendered after the malformed server) must still appear (fork-issue-65 regression check)');
	});

	test('an object type ({}) does not throw either, and its .server-type text renders as the stringified value', () => {
		const { sandbox, document } = loadMcpSandbox();
		assert.doesNotThrow(() => sandbox.displayMCPServers({ srv: { type: {}, command: 'echo' } }));
		const serversList = document.getElementById('mcpServersList')!;
		assert.strictEqual(serversList.children.length, 2, 'expected 1 server item + 1 trailing actions div');
		assert.strictEqual(textOn(serversList.children[0].innerHTML, 'server-type'), '[OBJECT OBJECT]');
	});
});

// ─────────────────────────────────────────────────────────────────────────
// fork-issue-67: _getMCPConfigPathForScope('local' -> undefined; 'global'/'project' -> explicit paths;
// everything else, including '' and 'extension', fell through to a catch-all resolving to the
// extension's own config) exposed a real bug once combined with how the dispatch actually calls
// it: #serverScope has no <option value="extension"> (it only lists project/global), so while
// editMCPServer() (fork-issue-65) already locks the field to config._scope for every scope, an
// 'extension'-scope server leaves the select showing nothing a real <select> recognises -- its
// .value reads back as ''. saveMCPServer() then read the scope to POST straight off that same
// (locked, and for this one scope, blank) select, sending scope: ''. The message dispatch
// (extension.ts) turns that '' into 'project' via `message.scope || 'project'` BEFORE it ever
// reaches _getMCPConfigPathForScope (this predates fork-issue-67, kept as-is), so the real pre-fork-issue-67 symptom
// was a stray duplicate written into the WORKSPACE's own .mcp.json under scope: 'project' -- not,
// as _getMCPConfigPathForScope's own catch-all might suggest in isolation, into the extension's
// config.
//
// Fix, three parts:
//  - script.ts (Kern): saveMCPServer() now reads the scope from editingServerName's own config
//    (mcpServerConfigsByName[editingServerName]._scope) while editing -- the ground truth --
//    instead of the locked/display-only select; only a fresh "Add manually" (editingServerName
//    === null) still takes it from the select. showAddServerForm() (the entry point for a fresh
//    add that installMarketplaceServer() and the "+ Add manually" buttons call directly, not
//    hideAddServerForm()) now runs the exact same full field reset hideAddServerForm() does
//    (shared resetAddServerFormFields() helper) -- editingServerName, #serverScope's lock, AND
//    #serverName/command/args/env/etc. An earlier version of this fix reset only
//    editingServerName + #serverScope, which opened a DIFFERENT cross-scope duplicate
//    (review finding): #serverName stayed disabled and pre-filled with the OLD server's name
//    while #serverScope became pickable again, so "Edit a Global server srv" -> "+ Add manually"
//    -> pick Project -> Save wrote a second "srv" into .mcp.json under the newly-picked scope --
//    the exact class of cross-scope duplicate fork-issue-65 closed in the first place.
//  - ui.ts: #serverScope gets a disabled <option value="extension"> so the locked field shows a
//    readable label instead of blank while editing (conservative: not a real "Add manually"
//    choice, same as the CLI-owned 'local' scope is never offered here either).
//  - extension.ts: _getMCPConfigPathForScope's catch-all becomes an explicit 'extension' branch;
//    anything else now returns undefined, which the existing _saveMCPServer/_deleteMCPServer error
//    handling turns into a visible mcpServerError instead of a silent misfile -- defense-in-depth:
//    after the script.ts fix above, the webview can no longer actually send an empty/unknown
//    scope for any UI-reachable path.
// ─────────────────────────────────────────────────────────────────────────

suite('webview MCP server form: #serverScope has a readable "extension"-scope option, disabled (fork-issue-67)', () => {

	function getServerScopeSelectHtml(): string {
		const html = getHtml(false, undefined, undefined, undefined, 'webview-attr-escape.test', '0.0.0');
		const match = /<select id="serverScope">([\s\S]*?)<\/select>/.exec(html);
		if (!match) { throw new Error('getHtml(...) output does not contain a <select id="serverScope">...</select> block'); }
		return match[1];
	}

	test('the emitted HTML has an <option value="extension"> inside #serverScope, and it is disabled', () => {
		const selectHtml = getServerScopeSelectHtml();
		const optionMatch = /<option value="extension"([^>]*)>([^<]*)<\/option>/.exec(selectHtml);
		assert.ok(optionMatch, 'expected an <option value="extension">...</option> inside #serverScope; got: ' + selectHtml);
		assert.ok(/\bdisabled\b/.test(optionMatch![1]), 'the "extension" option must carry the disabled attribute -- it must not become a pickable choice for a fresh "Add manually" (conservative scope for fork-issue-67); got attrs: "' + optionMatch![1] + '"');
	});

	test('the "extension" option has a non-empty, readable label naming its actual storage location (not just blank/placeholder text)', () => {
		const selectHtml = getServerScopeSelectHtml();
		const optionMatch = /<option value="extension"[^>]*>([^<]*)<\/option>/.exec(selectHtml);
		assert.ok(optionMatch, 'expected an <option value="extension">...</option> inside #serverScope; got: ' + selectHtml);
		const label = optionMatch![1].trim();
		assert.ok(label.length > 0, 'the "extension" option must have a non-empty label; got: "' + label + '"');
		assert.ok(label.includes('mcp-servers.json'), 'the label should name the extension\'s actual storage file (mcp-servers.json), same style as the existing "Project (.mcp.json)"/"Global (~/.claude.json)" options; got: "' + label + '"');
	});

	test('the pre-existing "project" and "global" options are still present and unchanged (no functional regression)', () => {
		const selectHtml = getServerScopeSelectHtml();
		assert.ok(/<option value="project">[^<]*\(\.mcp\.json\)<\/option>/.test(selectHtml), 'expected the "project" option to still be present with its original label; got: ' + selectHtml);
		assert.ok(/<option value="global">[^<]*\(~\/\.claude\.json\)<\/option>/.test(selectHtml), 'expected the "global" option to still be present with its original label; got: ' + selectHtml);
	});

	// 'local' scope (fork-issue-39) is owned by the CLI and never offered here either -- see the next suite
	// for the evidence that a 'local'-scope server can never reach editMCPServer() in the first
	// place (displayMCPServers renders a read-only "via CLI" badge for it instead of Edit/Delete).
	test('no <option value="local"> exists -- local scope is never offered as a display or pick value here', () => {
		const selectHtml = getServerScopeSelectHtml();
		assert.ok(!/<option value="local"/.test(selectHtml), 'did not expect a "local" option inside #serverScope; got: ' + selectHtml);
	});
});

suite('webview MCP server list: a "local"-scope server never renders an Edit button, so it can never reach editMCPServer() (fork-issue-67 evidence for the ui.ts scope question)', () => {

	test('a "local"-scope server gets the read-only CLI badge, not Edit/Delete buttons', () => {
		const { html } = renderServerItem({ srv: { type: 'stdio', command: 'echo', _scope: 'local' } }, 'srv');
		const onclicks = [...html.matchAll(/onclick="([^"]*)"/g)].map(m => m[1]);
		assert.ok(!onclicks.some(oc => oc.startsWith('editMCPServer')), 'a "local"-scope server must not render an editMCPServer(...) onclick handler anywhere; got: ' + html);
		assert.ok(html.includes('via CLI'), 'expected the read-only CLI badge text instead; got: ' + html);
	});

	test('a "project"-scope server (for contrast) does get a real editMCPServer(...) Edit button', () => {
		const { html } = renderServerItem({ srv: { type: 'stdio', command: 'echo', _scope: 'project' } }, 'srv');
		const onclick = findAttrOn(html, 'server-edit-btn', 'onclick');
		assert.ok(onclick, 'expected an onclick attribute on .server-edit-btn; got: ' + html);
		assert.strictEqual(onclick!.value, 'editMCPServer(this.dataset.serverName)');
	});
});

suite('webview MCP server form: saveMCPServer() reads the scope from the edited server\'s own config, not the locked #serverScope select (fork-issue-67)', () => {

	test('editing an "extension"-scope server posts scope: "extension" even when #serverScope\'s own value is blank (the pre-fork-issue-67 real-browser symptom: no matching <option>, .value reads back as \'\')', () => {
		const { sandbox, document, posted } = loadMcpSandbox();
		sandbox.displayMCPServers({ srv: { type: 'stdio', command: 'echo', _scope: 'extension' } });
		sandbox.editMCPServer('srv');
		// Force the exact pre-fork-issue-67 symptom directly, independent of whether ui.ts's new <option>
		// (Teil B) happens to already prevent it: the locked field is display-only, and
		// saveMCPServer() must not depend on it holding the right value while editing.
		document.getElementById('serverScope')!.value = '';
		sandbox.saveMCPServer();
		assert.strictEqual(posted.length, 1, 'expected exactly one posted message; got: ' + JSON.stringify(posted));
		assert.strictEqual(posted[0].type, 'saveMCPServer');
		assert.strictEqual(posted[0].name, 'srv');
		assert.strictEqual(posted[0].scope, 'extension', 'must come from the server\'s own _scope, not the (blank) select');
	});

	test('editMCPServer() alone (Teil B) also already makes #serverScope read back a non-empty "extension" value, now that a matching <option> exists', () => {
		const { sandbox, document } = loadMcpSandbox();
		sandbox.displayMCPServers({ srv: { type: 'stdio', command: 'echo', _scope: 'extension' } });
		sandbox.editMCPServer('srv');
		const scopeEl = document.getElementById('serverScope')!;
		assert.strictEqual(scopeEl.value, 'extension', '#serverScope must not be blank for an extension-scope server now that ui.ts has a matching (disabled) <option> for it');
		assert.strictEqual(scopeEl.disabled, true, 'sanity check: still locked while editing (fork-issue-65)');
	});

	test('editing a "global"-scope server still posts scope: "global" (fork-issue-65 regression guard -- was already correct before fork-issue-67, must stay correct)', () => {
		const { sandbox, posted } = loadMcpSandbox();
		sandbox.displayMCPServers({ srv: { type: 'stdio', command: 'echo', _scope: 'global' } });
		sandbox.editMCPServer('srv');
		sandbox.saveMCPServer();
		assert.strictEqual(posted.length, 1, 'expected exactly one posted message; got: ' + JSON.stringify(posted));
		assert.strictEqual(posted[0].scope, 'global');
	});

	test('editing a "project"-scope server still posts scope: "project" (fork-issue-65 regression guard -- was already correct before fork-issue-67, must stay correct)', () => {
		const { sandbox, posted } = loadMcpSandbox();
		sandbox.displayMCPServers({ srv: { type: 'stdio', command: 'echo', _scope: 'project' } });
		sandbox.editMCPServer('srv');
		sandbox.saveMCPServer();
		assert.strictEqual(posted.length, 1, 'expected exactly one posted message; got: ' + JSON.stringify(posted));
		assert.strictEqual(posted[0].scope, 'project');
	});

	function prepareValidStdioSave(document: FakeDocument, name: string, command: string): void {
		document.getElementById('serverName')!.value = name;
		document.getElementById('serverType')!.value = 'stdio';
		document.getElementById('serverCommand')!.value = command;
	}

	test('a fresh "Add manually" (showAddServerForm()) started right after an abandoned edit (no Cancel/Save) takes its scope from the select, not from the previously-edited server, and #serverName is reset too', () => {
		const { sandbox, document, posted } = loadMcpSandbox();
		sandbox.displayMCPServers({ srv: { type: 'stdio', command: 'echo', _scope: 'extension' } });
		sandbox.editMCPServer('srv'); // user starts editing an extension-scope server...
		const nameElBefore = document.getElementById('serverName')!;
		assert.strictEqual(nameElBefore.value, 'srv');
		assert.strictEqual(nameElBefore.disabled, true, 'sanity check: editMCPServer must lock #serverName (fork-issue-65)');
		sandbox.showAddServerForm(); // ...then abandons it and clicks "+ Add manually" instead
		assert.strictEqual(sandbox.__testState().editingServerName, null, 'editingServerName must be reset by showAddServerForm(), the same way hideAddServerForm() already resets it');
		const scopeEl = document.getElementById('serverScope')!;
		assert.strictEqual(scopeEl.disabled, false, '#serverScope must be unlocked again for the new add, the same way hideAddServerForm() already unlocks it');
		assert.strictEqual(scopeEl.value, 'project', 'review: unlocking #serverScope is not enough while its SELECTION is still "extension" (now a real, matching -- if disabled -- <option>, see ui.ts) -- it must reset to "project" too, or a fresh add silently defaults to writing into the extension\'s own config');
		const nameElAfter = document.getElementById('serverName')!;
		assert.strictEqual(nameElAfter.value, '', 'review: #serverScope alone being unlocked is not enough -- #serverName must be cleared too, not still "srv"');
		assert.strictEqual(nameElAfter.disabled, false, 'review: #serverName must be unlocked again for the new add, not still disabled from editMCPServer()');
		scopeEl.value = 'global'; // user picks a scope for the genuinely new server
		prepareValidStdioSave(document, 'brand-new-server', 'node');
		sandbox.saveMCPServer();
		assert.strictEqual(posted.length, 1, 'expected exactly one posted message; got: ' + JSON.stringify(posted));
		assert.strictEqual(posted[0].name, 'brand-new-server');
		assert.strictEqual(posted[0].scope, 'global', 'must be the newly-selected scope, not "extension" inherited from the abandoned edit via a stale editingServerName');
	});

	// review (2nd round): unlocking #serverScope (disabled = false) is not the same as
	// resetting its SELECTION -- a disabled <option> only blocks the interactive picker, not the
	// field from still reading back whatever editMCPServer() last set it to. Once ui.ts has a
	// real (if disabled) <option value="extension"> (fork-issue-67 Teil B), that selection survives the
	// unlock -- via EITHER showAddServerForm() OR hideAddServerForm() -- unless explicitly reset.
	test('after editing an "extension"-scope server, showAddServerForm() resets #serverScope\'s value to "project", not left at "extension"', () => {
		const { sandbox, document } = loadMcpSandbox();
		sandbox.displayMCPServers({ srv: { type: 'stdio', command: 'echo', _scope: 'extension' } });
		sandbox.editMCPServer('srv');
		const scopeEl = document.getElementById('serverScope')!;
		assert.strictEqual(scopeEl.value, 'extension', 'sanity check: editMCPServer must have set it to the server\'s own scope first (fork-issue-65)');
		sandbox.showAddServerForm();
		assert.strictEqual(scopeEl.value, 'project', '#serverScope must reset to "project", not silently keep showing "extension" now that a real (disabled) <option> for it exists');
	});

	test('after editing an "extension"-scope server, hideAddServerForm() (Cancel) also resets #serverScope\'s value to "project", not left at "extension"', () => {
		const { sandbox, document } = loadMcpSandbox();
		sandbox.displayMCPServers({ srv: { type: 'stdio', command: 'echo', _scope: 'extension' } });
		sandbox.editMCPServer('srv');
		const scopeEl = document.getElementById('serverScope')!;
		assert.strictEqual(scopeEl.value, 'extension', 'sanity check: editMCPServer must have set it to the server\'s own scope first (fork-issue-65)');
		sandbox.hideAddServerForm();
		assert.strictEqual(scopeEl.value, 'project', '#serverScope must reset to "project", not silently keep showing "extension" now that a real (disabled) <option> for it exists');
	});

	// review (2nd round): the exact real-Chrome-reproduced click path for the SELECTION-not-
	// reset regression -- Cancel (not "+ Add manually") after editing an 'extension'-scope server,
	// then adding a genuinely new one without touching the scope field, silently wrote it into the
	// extension's own storage (globalStorage/mcp/mcp-servers.json) instead of the intended
	// default ('project', i.e. the workspace's .mcp.json) -- invisible and unversioned for the
	// user, and exactly the click path anyone verifying fork-issue-67 itself would take (edit the
	// 'extension'-scope server the fix is about).
	test('review click path: Edit an "extension"-scope server, click Cancel, type a new name + command, and Save -- must default to scope: "project", not silently inherit "extension"', () => {
		const { sandbox, document, posted } = loadMcpSandbox();
		sandbox.displayMCPServers({ srv: { type: 'stdio', command: 'echo', _scope: 'extension' } });
		sandbox.editMCPServer('srv'); // 1) Edit
		sandbox.hideAddServerForm(); // 2) Cancel
		// 3) user types a new name + command, leaves #serverScope untouched (exactly as shown --
		// "project" now, not the previous edit's "extension")
		prepareValidStdioSave(document, 'brand-new', 'node');
		sandbox.saveMCPServer(); // 4) Add Server
		assert.strictEqual(posted.length, 1, 'expected exactly one posted message; got: ' + JSON.stringify(posted));
		assert.strictEqual(posted[0].name, 'brand-new');
		assert.strictEqual(posted[0].scope, 'project', 'must default to "project" -- must never silently come out as "extension" here');
	});

	// review: the exact real-Chrome-reproduced click path that an earlier version of this
	// fix still allowed through -- resetting editingServerName + #serverScope alone was not
	// enough. #serverName (and the rest of the form: command/args/env/etc.) stayed locked and
	// pre-filled from the abandoned edit, so a user who didn't notice/retype the name field
	// silently wrote a SECOND copy of the ORIGINAL server into the newly-picked scope's config
	// file -- the exact cross-scope duplicate fork-issue-65 closed, reopened through a different field.
	test('review click path: Edit a "global"-scope server, click "+ Add manually" (not Cancel), pick a different scope, type a genuinely new name, and Save -- must not silently duplicate the original server under its old name', () => {
		const { sandbox, document, posted } = loadMcpSandbox();
		sandbox.displayMCPServers({ srv: { type: 'stdio', command: 'echo', args: ['a'], _scope: 'global' } });
		sandbox.editMCPServer('srv'); // 1) Edit
		sandbox.showAddServerForm(); // 2) "+ Add manually" instead of Cancel
		const nameEl = document.getElementById('serverName')!;
		assert.strictEqual(nameEl.value, '', '#serverName must not still read "srv" here -- that is exactly what let this duplicate happen');
		// 3)/4) user picks Project and types a genuinely new name (this is what makes it a real,
		// intentional new server -- the pre-fix bug was reachable even here, since #serverName
		// silently carried the old value if the user did not think to check/clear it themselves)
		nameEl.value = 'other-server';
		document.getElementById('serverScope')!.value = 'project';
		document.getElementById('serverType')!.value = 'stdio';
		document.getElementById('serverCommand')!.value = 'node';
		sandbox.saveMCPServer();
		assert.strictEqual(posted.length, 1, 'expected exactly one posted message; got: ' + JSON.stringify(posted));
		assert.strictEqual(posted[0].name, 'other-server', 'must be the newly-typed name -- must never be able to come out as "srv" (the original global server) here');
		assert.strictEqual(posted[0].scope, 'project');
	});

	test('installMarketplaceServer(), the other caller of showAddServerForm() (~script.ts:2500), also resets editingServerName -- a marketplace install right after an abandoned edit does not inherit the previously-edited server\'s scope or name either', () => {
		const { sandbox, document, posted } = loadMcpSandbox2();
		sandbox.displayMCPServers({ srv: { type: 'stdio', command: 'echo', _scope: 'extension' } });
		sandbox.editMCPServer('srv'); // abandoned edit, same as above
		// #mcpInstallScope is the marketplace detail view's own scope picker (built dynamically in
		// script.ts's showMarketplaceDetail(), not a static id in ui.ts) -- installMarketplaceServer()
		// reads its .value as the scope the user picked there. Set it explicitly (review: an
		// unset id="mcpInstallScope" auto-vivifies to a blank FakeElement in this harness --
		// realHtmlIds also picks up ids from the JS STRING LITERALS getScript() embeds, since
		// getHtml() embeds the full <script> block -- so scopeSelect.value would silently read back
		// '' instead of throwing/being null; a bare notStrictEqual(..., 'extension') can't tell that
		// apart from a genuine 'project'/'global', so this pins the value we actually expect).
		document.getElementById('mcpInstallScope')!.value = 'global';
		sandbox.marketplaceDisplayed.push({ id: 'mkt1', name: 'MktServer', installConfig: { type: 'stdio', command: 'npx', args: ['-y', 'mkt-server'] } });
		sandbox.installMarketplaceServer('mkt1');
		assert.strictEqual(sandbox.__testState().editingServerName, null, 'editingServerName must be reset by installMarketplaceServer() -> showAddServerForm()');
		// Ordering check (review): installMarketplaceServer() sets #serverName/#serverScope
		// itself right after calling showAddServerForm() -- confirm THOSE explicit sets are what
		// actually survive to the posted message, not showAddServerForm()'s own reset (which runs
		// first and must not be overwriting something installMarketplaceServer() sets afterward,
		// nor be overwritten in a way that resurrects the abandoned edit's values).
		assert.strictEqual(document.getElementById('serverName')!.value, 'MktServer', 'installMarketplaceServer() must have set #serverName to the marketplace server\'s own name, not left it blank (from the reset) or stale ("srv", from the abandoned edit)');
		sandbox.saveMCPServer();
		assert.strictEqual(posted.length, 1, 'expected exactly one posted message; got: ' + JSON.stringify(posted));
		assert.strictEqual(posted[0].name, 'MktServer');
		assert.strictEqual(posted[0].scope, 'global', 'must be exactly the scope picked in #mcpInstallScope -- must not silently come out as "extension" (inherited from the abandoned edit via a stale editingServerName) NOR as "" (a broken read); got: ' + JSON.stringify(posted[0]));
	});
});
