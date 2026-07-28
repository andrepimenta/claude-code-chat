// Shared extraction/DOM-inspection helpers for the webview vm-sandbox test suites
// (webview-attr-escape.test.ts, user-message-rawtext.test.ts). Both files extracted
// hand-copied duplicates of these five functions; pulled out here per #64.
//
// #64: extractFunction() used to find a function's source text via hand-rolled, quote-aware
// brace matching. That scanner knew about strings and // and /* */ comments, but not about
// regex literals -- escapeAttr's own `.replace(/'/g, '&#39;')` made the scanner see `/` then
// `'` and misread the apostrophe as a string start, desyncing the brace count for everything
// after it and dragging 2365 chars of unrelated trailing functions (safeHttpUrl,
// openFileInEditor, formatFilePath, toggleDiffExpansion, toggleResultExpansion) into the
// "escapeAttr" extraction -- 362 chars of escapeAttr came back as 2727.
// A real parser doesn't have this failure mode, so this now asks TypeScript's own parser
// (already a devDependency) for the function declaration's exact span instead of re-implementing
// a JS tokenizer by hand.
import * as ts from 'typescript';
import * as parse5 from 'parse5';

// Finds a "function NAME(...) { ... }" declaration anywhere in `source` (at any nesting depth --
// e.g. renderDropdown is declared inside initModelCombo) and returns its exact source text, in
// document order (first match wins, same as the old regex-based scanner). Throws the same kind
// of message as before when nothing matches.
export function extractFunction(source: string, name: string): string {
	const sourceFile = ts.createSourceFile('emitted-script.js', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
	let found: ts.FunctionDeclaration | undefined;
	const visit = (node: ts.Node): void => {
		if (found) { return; }
		if (ts.isFunctionDeclaration(node) && node.name && node.name.text === name) {
			found = node;
			return;
		}
		ts.forEachChild(node, visit);
	};
	visit(sourceFile);
	if (!found) {
		throw new Error('function ' + name + ' not found in emitted script');
	}
	return source.slice(found.getStart(sourceFile), found.getEnd());
}

// First DFS match wins (document order) -- e.g. formatToolInputUI's output nests a
// span.file-path-truncated (from formatFilePath) inside a div.diff-file-path, and both currently
// carry a data-file-path attribute with the same value, so a "last match wins" walk would
// silently return the inner span's copy instead of the outer div's -- the one the div's own
// onclick="openFileInEditor(this.dataset.filePath)" actually reads. That would let a regression
// that drops data-file-path from the div alone (while leaving the span's copy intact) pass
// unnoticed. Use findAttrOn() below when a specific element matters.
export function findAttr(html: string, attrName: string): { name: string; value: string } | undefined {
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
// attrName's value from THAT element specifically (undefined if the element lacks it) -- unlike
// findAttr(), this doesn't get confused by a same-named attribute on a nested element.
export function findAttrOn(html: string, cssClass: string, attrName: string): { name: string; value: string } | undefined {
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

// Concatenates the direct #text children of the first element carrying cssClass (document
// order); throws if no such element exists. If escaping were missing, a payload like
// '<img src=x onerror=alert(1)>' would parse as a real <img> element instead of literal text, so
// those characters would be MISSING from this concatenation -- the full raw payload
// round-tripping back as text is what proves the escaping worked.
export function textOn(html: string, cssClass: string): string {
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

export function tagExists(html: string, tagName: string): boolean {
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
