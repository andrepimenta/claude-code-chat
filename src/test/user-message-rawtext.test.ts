// PoC/regression tests for #63 (user messages rendered via parseSimpleMarkdown + innerHTML, so
// markdown syntax in the user's OWN typed text -- "**", "_", backticks, "#" lines, e.g. a prompt
// mentioning a path like src/_test_.ts -- got silently reinterpreted as formatting instead of
// showing up exactly as typed).
//
// Fix, revised per opus-Review: the case 'userInput' handler now calls renderUserMessageContent
// instead of parseSimpleMarkdown. renderUserMessageContent keeps prose completely raw (only
// escapeHtml, never markdown-parsed) but still runs fenced ``` code blocks through the same
// extractCodeBlocks() machinery parseSimpleMarkdown itself uses -- an earlier, plain-
// textContent-only version of this fix also flattened code blocks (lost the #48
// collapse/copy-button/language-label treatment and #62's data-raw-code), which Roman didn't want.
// Claude's/thinking's own messages are unchanged (parseSimpleMarkdown + innerHTML).
//
// These tests exercise the REAL case 'userInput': block's exact source text (extracted from the
// compiled webview output, not hand-copied) together with the REAL renderUserMessageContent,
// extractCodeBlocks and addMessage -- so they fail against both the pre-#63 source (wraps
// everything in <p>/<strong>/<code> via parseSimpleMarkdown) and the intermediate plain-
// textContent fix (flattens fenced code blocks into literal text), and pass against the current
// source, without the test itself having to guess which state the repository is in. Run with
// `npm run test:user-message-rawtext`.

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

// Duplicated from webview-attr-escape.test.ts (not exported there) -- see that file's own
// comment for why the quote-aware brace matching exists, and #64 for its known regex-literal
// gap. NOT repaired here, per #63's task scope; every call site below verifies its own
// extraction result instead of trusting it blindly (start/end/no dragged-in trailing function).
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

// Verifies an extractFunction() result actually starts/ends where expected and didn't drag in a
// trailing declaration (#64) -- the check the task asks for before building on the extraction.
function assertCleanExtraction(name: string, src: string, expectedStart: string): void {
	assert.ok(src.startsWith(expectedStart), 'extractFunction(' + name + ') did not start where expected; got: ' + src.slice(0, 80));
	assert.ok(src.trimEnd().endsWith('}'), 'extractFunction(' + name + ') did not end at a closing brace; got: ' + src.slice(-80));
	assert.ok(
		!/\n\s*function\s+\w+\s*\(/.test(src.slice(expectedStart.length)),
		'extractFunction(' + name + ') appears to have dragged in a trailing function declaration (#64); got length ' + src.length
	);
}

// Extracts the exact statements inside `case '<caseLabel>': ... break;` (quote-aware would be
// overkill here -- unlike extractFunction's braces, this case body contains no nested "break;" in
// any of the pre-#63/intermediate/current source variants, only its own terminating one).
// Verified below via an explicit assertion, same spirit as assertCleanExtraction for
// extractFunction.
function extractCaseBlock(source: string, caseLabel: string): string {
	const re = new RegExp('case \'' + caseLabel + '\':([\\s\\S]*?)\\n\\s*break;');
	const m = re.exec(source);
	if (!m) {
		throw new Error('case \'' + caseLabel + '\': block not found in emitted script');
	}
	return m[1];
}

// Faithful-enough DOM stand-in for addMessage(): unlike webview-attr-escape.test.ts's
// FakeElement/FakeDiv (built for direct innerHTML-string assignment sinks), addMessage builds
// the message via createElement()+appendChild() trees, so outerHTML must recursively serialise
// children -- this class does that. Only the setters/methods addMessage's (and escapeHtml's,
// which parseSimpleMarkdown/renderUserMessageContent also call) path actually touches are
// implemented; anything else the emitted code assigns (onclick, title, ...) lands as an ordinary
// dynamic JS property at runtime -- harmless, and irrelevant to what these tests assert on.
class FakeNode {
	readonly tagName: string;
	private _attrs = new Map<string, string>();
	private _children: FakeNode[] = [];
	private _text: string | null = null;
	private _rawHtml: string | null = null;

	constructor(tagName: string) { this.tagName = tagName; }

	set className(v: string) { this._attrs.set('class', v); }
	get className(): string { return this._attrs.get('class') || ''; }

	setAttribute(name: string, value: string): void { this._attrs.set(name, String(value)); }

	appendChild(child: FakeNode): FakeNode {
		this._children.push(child);
		this._text = null;
		this._rawHtml = null;
		return child;
	}

	// Node.textContent setter semantics: replaces all children with a single implicit text node.
	set textContent(v: string) {
		this._text = String(v);
		this._children = [];
		this._rawHtml = null;
	}

	// addMessage assigns innerHTML a hand-built HTML string (parseSimpleMarkdown's/
	// renderUserMessageContent's output, or copyBtn's fixed SVG) -- stored verbatim, meant to BE
	// parsed as markup, unlike textContent above.
	set innerHTML(v: string) {
		this._rawHtml = String(v);
		this._text = null;
		this._children = [];
	}

	// Real DOM Text-node HTML serialisation escapes only & < > (not " or ') -- matches
	// webview-attr-escape.test.ts's FakeDiv, and is what escapeHtml() (document.createElement
	// ('div').textContent = ...; return div.innerHTML) relies on internally.
	get innerHTML(): string {
		if (this._rawHtml !== null) { return this._rawHtml; }
		if (this._text !== null) {
			return this._text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		}
		return this._children.map(c => c.outerHTML).join('');
	}

	get outerHTML(): string {
		const attrs = Array.from(this._attrs.entries())
			.map(([k, v]) => ' ' + k + '="' + v.replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '"')
			.join('');
		return '<' + this.tagName + attrs + '>' + this.innerHTML + '</' + this.tagName + '>';
	}
}

// Concatenates the direct #text children of the first element carrying cssClass (document
// order); throws if no such element exists. Copied from webview-attr-escape.test.ts's helper of
// the same name/behaviour (not exported there). Crucially only looks at DIRECT text children --
// pre-#63 output wraps the text one level deeper in a <p>/<h1>/<li> etc., and a real code-block
// (a real <div>/<details> element) is skipped entirely too -- so this returns the exact prose
// text around a code block, or '' if the message is nothing but a code block.
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

// Scoped lookup (per the task: findAttrOn, not the global-scan findAttr) -- finds the first
// element carrying cssClass and returns attrName's value from THAT element specifically.
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

interface FakeMessagesDiv {
	scrollTop: number;
	scrollHeight: number;
	clientHeight: number;
	lastAppended: FakeNode | undefined;
	appendChild(child: FakeNode): FakeNode;
}

interface UserInputPipelineSandbox {
	addMessage(content: string, type: string): void;
	parseSimpleMarkdown(markdown: string): string;
	runUserInputCase(message: { data: string; timestamp?: string }): void;
}

// Splices together the REAL extracted addMessage/parseSimpleMarkdown/extractCodeBlocks/
// renderUserMessageContent (same recipe #62's loadCodeBlockSandbox already uses for
// parseSimpleMarkdown's own dependencies) and the REAL case 'userInput': block, wrapped
// as a callable function. Only addMessage's own free variables that are unrelated to #63 (scroll
// position, the copy-button raw-text map, the processing indicator, the two error-only helpers)
// are stubbed -- see the inline comments on each stub below for exactly why each one is safe to
// skip rather than extract. No timestamp/formatMessageTimestamp here -- that's a separate,
// unrelated feature not part of this security-hardening branch; addMessage here takes only
// (content, type), matching the actual signature in this branch.
function loadUserInputPipelineSandbox(): { sandbox: UserInputPipelineSandbox; messagesDiv: FakeMessagesDiv } {
	const body = getEmittedScriptBody();

	const addMessageSrc = extractFunction(body, 'addMessage');
	assertCleanExtraction('addMessage', addMessageSrc, 'function addMessage(');

	const parseSimpleMarkdownSrc = extractFunction(body, 'parseSimpleMarkdown');
	assertCleanExtraction('parseSimpleMarkdown', parseSimpleMarkdownSrc, 'function parseSimpleMarkdown(');

	const renderUserMessageContentSrc = extractFunction(body, 'renderUserMessageContent');
	assertCleanExtraction('renderUserMessageContent', renderUserMessageContentSrc, 'function renderUserMessageContent(');

	const caseBody = extractCaseBlock(body, 'userInput');
	assert.ok(caseBody.includes('addMessage('), 'case \'userInput\': block does not call addMessage; got: ' + caseBody);
	assert.ok(!/\bbreak\s*;/.test(caseBody), 'case \'userInput\': extraction appears to have swallowed more than one case (unexpected nested break;); got: ' + caseBody);

	const src = [
		extractFunction(body, 'escapeHtml'),
		extractFunction(body, 'escapeAttr'),
		extractFunction(body, 'normalizeCollapseThreshold'),
		extractFunction(body, 'evaluateCodeBlockCollapse'),
		extractFunction(body, 'extractCodeBlocks'),
		parseSimpleMarkdownSrc,
		renderUserMessageContentSrc,
		addMessageSrc,
		// #46's copy-button raw-text store -- addMessage only .set()s into it, never reads it
		// back, so a real (empty) WeakMap is enough, no extraction needed.
		'let messageRawText = new WeakMap();',
		// Scroll-position bookkeeping, entirely orthogonal to what/how the message text renders.
		'function shouldAutoScroll() { return false; }',
		'function scrollToBottomIfNeeded() { /* no-op */ }',
		// Needs isProcessing/showProcessingIndicator (unrelated globals) -- addMessage only ever
		// calls it, never inspects its result.
		'function moveProcessingIndicatorToLast() { /* no-op */ }',
		// Only reached when type === "error" (isPermissionError) -- never for the type === "user"
		// tests below.
		'function isPermissionError() { return false; }',
		'function runUserInputCase(message) {\n' + caseBody + '\n}',
	].join('\n');

	const messagesDiv: FakeMessagesDiv = {
		scrollTop: 0,
		scrollHeight: 0,
		clientHeight: 0,
		lastAppended: undefined,
		appendChild(child: FakeNode) { this.lastAppended = child; return child; }
	};
	const sandbox: Record<string, unknown> = {
		// parseSimpleMarkdown's/renderUserMessageContent's own settings -- math extraction
		// skipped entirely (none of the payloads below contain "$"/"\("), same simplification
		// #62's loadCodeBlockSandbox uses.
		renderMathEnabled: false,
		collapseLongCodeBlocks: true,
		collapseCodeBlockLines: 20,
		document: {
			getElementById(id: string) {
				if (id !== 'messages') { throw new Error('unexpected document.getElementById(' + id + ')'); }
				return messagesDiv;
			},
			createElement(tag: string) {
				if (tag !== 'div' && tag !== 'button' && tag !== 'span') {
					throw new Error('unexpected document.createElement(' + tag + ')');
				}
				return new FakeNode(tag);
			}
		}
	};
	vm.createContext(sandbox);
	new vm.Script(src).runInContext(sandbox);
	return { sandbox: sandbox as unknown as UserInputPipelineSandbox, messagesDiv };
}

// Runs the REAL case 'userInput': block (as compiled right now) against a mock incoming message
// and returns the resulting message element's outerHTML. Deliberately does NOT decide itself how
// the text gets rendered -- that's exactly what's compiled into caseBody, so this genuinely
// renders the pre-#63 markup-wrapped output against the old source, the flattened-code-block
// output against the intermediate textContent-only fix, and the raw-text-with-real-code-blocks
// output against the current source, without the test having to know which one it's looking at.
function renderUserInputMessage(payload: string): string {
	const { sandbox, messagesDiv } = loadUserInputPipelineSandbox();
	sandbox.runUserInputCase({ data: payload, timestamp: undefined });
	if (!messagesDiv.lastAppended) {
		throw new Error('case \'userInput\' did not append a message for payload: ' + payload);
	}
	return messagesDiv.lastAppended.outerHTML;
}

suite('webview user-message raw text rendering (#63)', () => {

	test('a markdown-looking payload with no code fence renders as exactly that text -- no <strong>/<em>/<code> elements', () => {
		const payload = 'Bitte prüfe **src/_test_.ts** und `foo_bar`';
		const html = renderUserInputMessage(payload);
		assert.strictEqual(textOn(html, 'message-content'), payload, 'message-content must contain the exact raw text; got: ' + html);
		assert.ok(!tagExists(html, 'strong'), 'must not render a <strong> element; got: ' + html);
		assert.ok(!tagExists(html, 'em'), 'must not render an <em> element; got: ' + html);
		assert.ok(!tagExists(html, 'code'), 'must not render a <code> element (no fenced block in this payload); got: ' + html);
	});

	test('an XSS payload with no code fence renders as inert text -- no <img> element and no onerror attribute', () => {
		const payload = '<img src=x onerror=alert(1)>';
		const html = renderUserInputMessage(payload);
		assert.strictEqual(textOn(html, 'message-content'), payload, 'message-content must contain the exact raw text; got: ' + html);
		assert.ok(!tagExists(html, 'img'), 'must not render an <img> element; got: ' + html);
		assert.ok(!findAttrOn(html, 'message-content', 'onerror'), 'message-content must not carry an onerror attribute; got: ' + html);
	});

	test('a multi-line payload with no code fence keeps its line breaks exactly', () => {
		const payload = 'first line\nsecond line\nthird line';
		const html = renderUserInputMessage(payload);
		assert.strictEqual(textOn(html, 'message-content'), payload, 'line breaks must survive exactly; got: ' + html);
	});

	test('a plain payload with no special characters still renders visibly (no functional regression)', () => {
		const payload = 'hello world';
		const html = renderUserInputMessage(payload);
		assert.strictEqual(textOn(html, 'message-content'), payload);
	});

	test('a fenced code block still renders as a real code-block-container (language label, copy button, exact data-raw-code), while the surrounding markdown-looking prose stays raw', () => {
		const payload = 'Bitte **teste** das:\n```js\nconst x = 1;\n```\nDanke `dir`';
		const html = renderUserInputMessage(payload);

		// The fence itself is consumed by the real code-block element; the prose on either side
		// stays exactly as typed (including its own "**"/backtick markdown-looking syntax).
		assert.strictEqual(
			textOn(html, 'message-content'),
			'Bitte **teste** das:\n\nDanke `dir`',
			'prose around the code block must stay raw and unwrapped; got: ' + html
		);
		assert.ok(!tagExists(html, 'strong'), 'the prose\'s own "**teste**" must not become a <strong> element; got: ' + html);
		assert.ok(!tagExists(html, 'em'), 'must not render an <em> element; got: ' + html);

		assert.ok(!findAttrOn(html, 'message-content', 'onerror'), 'sanity: message-content itself must not carry an onerror attribute; got: ' + html);
		const dataRawCode = findAttrOn(html, 'language-js', 'data-raw-code');
		assert.ok(dataRawCode, 'expected a data-raw-code attribute on the language-js code element; got: ' + html);
		assert.strictEqual(dataRawCode!.value, 'const x = 1;\n', 'data-raw-code must contain the exact fenced code (#62 -- getAttribute()-equivalent, escapeAttr-escaped); got: ' + html);
		assert.strictEqual(textOn(html, 'code-block-language'), 'js', 'the code block\'s language label must read "js"; got: ' + html);
		assert.ok(tagExists(html, 'button'), 'expected the code block\'s copy button (#48/#62 copyCodeBlock) to exist; got: ' + html);
	});

	test('an XSS payload INSIDE a fenced code block renders as inert text -- no <img> element anywhere, data-raw-code holds the exact raw code', () => {
		const payload = '```\n<img src=x onerror=alert(1)>\n```';
		const html = renderUserInputMessage(payload);

		assert.ok(!tagExists(html, 'img'), 'must not render a live <img> element inside the code block; got: ' + html);
		assert.ok(!findAttrOn(html, 'message-content', 'onerror'), 'sanity: message-content itself must not carry an onerror attribute; got: ' + html);
		// No prose at all -- the payload is nothing but the fenced block.
		assert.strictEqual(textOn(html, 'message-content'), '', 'a message that is only a code block must have no direct prose text; got: ' + html);

		const dataRawCode = findAttrOn(html, 'language-plaintext', 'data-raw-code');
		assert.ok(dataRawCode, 'expected a data-raw-code attribute on the language-plaintext code element; got: ' + html);
		assert.strictEqual(dataRawCode!.value, '<img src=x onerror=alert(1)>\n', 'data-raw-code must hold the exact raw (unescaped-at-read-time) code; got: ' + html);
		// The rendered .code-line text must be the decoded literal string too (proves each code
		// line is escapeHtml()'d, not parsed as HTML, same guarantee as parseSimpleMarkdown's
		// existing code-block rendering).
		assert.strictEqual(textOn(html, 'code-line'), '<img src=x onerror=alert(1)>', 'the rendered code line must be the exact literal text, not a parsed element; got: ' + html);
	});

	test('Claude\'s own messages are unaffected -- addMessage still renders pre-built HTML via innerHTML for type "claude"', () => {
		const { sandbox, messagesDiv } = loadUserInputPipelineSandbox();
		sandbox.addMessage(
			'<p>Bitte prüfe <strong>src/_test_.ts</strong></p>',
			'claude'
		);
		if (!messagesDiv.lastAppended) {
			throw new Error('addMessage did not append a message');
		}
		const html = messagesDiv.lastAppended.outerHTML;
		assert.ok(tagExists(html, 'strong'), 'claude messages must still render pre-parsed HTML markup; got: ' + html);
		assert.strictEqual(textOn(html, 'message-content'), '', 'the text must live inside the <p>/<strong>, not as message-content\'s own direct text; got: ' + html);
	});

	test('Claude\'s own fenced code blocks (via the real parseSimpleMarkdown) still render correctly after the extractCodeBlocks refactor', () => {
		const { sandbox } = loadUserInputPipelineSandbox();
		const rendered = sandbox.parseSimpleMarkdown('Bitte **teste** das:\n```js\nconst x = 1;\n```\nDanke');
		// Claude's own prose IS markdown-parsed -- "**teste**" becomes a real <strong>, unlike the
		// user-message tests above.
		assert.ok(tagExists(rendered, 'strong'), 'parseSimpleMarkdown must still render "**teste**" as <strong> for Claude messages; got: ' + rendered);
		const dataRawCode = findAttrOn(rendered, 'language-js', 'data-raw-code');
		assert.ok(dataRawCode, 'expected a data-raw-code attribute on the language-js code element; got: ' + rendered);
		assert.strictEqual(dataRawCode!.value, 'const x = 1;\n', 'data-raw-code must contain the exact fenced code; got: ' + rendered);
	});
});
