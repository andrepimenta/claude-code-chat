// PoC/regression tests for #63 (user messages rendered via parseSimpleMarkdown + innerHTML, so
// markdown syntax in the user's OWN typed text -- "**", "_", backticks, "#" lines, e.g. a prompt
// mentioning a path like src/_test_.ts -- got silently reinterpreted as formatting instead of
// showing up exactly as typed).
//
// Fix, revised after further review: the case 'userInput' handler now calls renderUserMessageContent
// instead of parseSimpleMarkdown. renderUserMessageContent keeps prose completely raw (only
// escapeHtml, never markdown-parsed) but still runs fenced ``` code blocks through the same
// extractCodeBlocks() machinery parseSimpleMarkdown itself uses -- an earlier, plain-
// textContent-only version of this fix also flattened code blocks (lost the #48
// collapse/copy-button/language-label treatment and #62's data-raw-code), which was intentionally excluded from this behavior.
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
import getScript from '../script';
import { extractFunction, findAttrOn, textOn, tagExists } from './webview-dom-helpers';

function getEmittedScriptBody(): string {
	const html = getScript(false);
	const match = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/.exec(html);
	if (!match) {
		throw new Error('getScript(false) did not contain a <script>...</script> block');
	}
	return match[1];
}

// Verifies an extractFunction() result actually starts/ends where expected and didn't drag in a
// trailing declaration (#64, fixed by making extractFunction parser-based) -- kept as a
// belt-and-suspenders check before building on the extraction.
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
	renderUserMessageContent(text: string): string;
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
		// restoreCodeBlockPlaceholders (#55): script.ts splices this in via
		// `${restoreCodeBlockPlaceholders.toString()}` (build-time, see markdown-restore.ts), so it
		// appears in the emitted body as an ordinary function declaration extractFunction can find --
		// both parseSimpleMarkdownSrc and renderUserMessageContentSrc below call it.
		extractFunction(body, 'restoreCodeBlockPlaceholders'),
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
		const payload = 'Please check **src/_test_.ts** and `foo_bar`';
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
		const payload = 'Please **test** this:\n```js\nconst x = 1;\n```\nThanks `dir`';
		const html = renderUserInputMessage(payload);

		// The fence itself is consumed by the real code-block element; the prose on either side
		// stays exactly as typed (including its own "**"/backtick markdown-looking syntax).
		assert.strictEqual(
			textOn(html, 'message-content'),
			'Please **test** this:\n\nThanks `dir`',
			'prose around the code block must stay raw and unwrapped; got: ' + html
		);
		assert.ok(!tagExists(html, 'strong'), 'the prose\'s own "**test**" must not become a <strong> element; got: ' + html);
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
			'<p>Please check <strong>src/_test_.ts</strong></p>',
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
		const rendered = sandbox.parseSimpleMarkdown('Please **test** this:\n```js\nconst x = 1;\n```\nThanks');
		// Claude's own prose IS markdown-parsed -- "**test**" becomes a real <strong>, unlike the
		// user-message tests above.
		assert.ok(tagExists(rendered, 'strong'), 'parseSimpleMarkdown must still render "**test**" as <strong> for Claude messages; got: ' + rendered);
		const dataRawCode = findAttrOn(rendered, 'language-js', 'data-raw-code');
		assert.ok(dataRawCode, 'expected a data-raw-code attribute on the language-js code element; got: ' + rendered);
		assert.strictEqual(dataRawCode!.value, 'const x = 1;\n', 'data-raw-code must contain the exact fenced code; got: ' + rendered);
	});
});

// ─────────────────────────────────────────────────────────────────────────
// PoC for the code-block restore fix: extractCodeBlocks' per-block HTML (data-raw-code attribute plus escaped
// code-line divs) does not strip "$"/"`"/"'" characters, so a code block whose content
// contains one of the String.replace(placeholder, string) substitution sequences
// ("$&"/"$`"/"$'"/"$$") reaches the placeholder-restore step still intact. Both
// parseSimpleMarkdown and renderUserMessageContent (#63) restore their __CODEBLOCK_N__
// placeholders via the shared restoreCodeBlockPlaceholders (#55) -- a FUNCTION replacer,
// immune to this. These tests exercise the REAL, full pipeline (extractCodeBlocks +
// escapeHtml/escapeAttr + restoreCodeBlockPlaceholders, not a direct unit call to
// restoreCodeBlockPlaceholders as in markdown-restore.test.ts) through both entry points and
// prove the surrounding prose is not corrupted: a plain html.replace(placeholder, codeBlockHtml)
// here would splice codeBlockHtml's own preceding/following HTML ("$`"/"$'") or a literal "$"
// duplicate ("$$") into the restored output, which would show up as MARKER_BEFORE/MARKER_AFTER
// appearing more than once and/or a corrupted data-raw-code value.
// ─────────────────────────────────────────────────────────────────────────

suite('webview code-block restore: "$" substitution patterns cannot corrupt surrounding HTML (#70, full pipeline)', () => {

	// Covers all four String.replace substitution sequences at once: "$&" (matched substring),
	// "$`" (pre-match), "$'" (post-match), "$$" (literal "$").
	const dollarPayload = 'echo $& run; VAR=$`date`; MSG=$\'ok\'; echo $$';

	test('parseSimpleMarkdown: a code block containing "$&"/"$`"/"$\'"/"$$" does not duplicate the surrounding prose and round-trips byte-for-byte', () => {
		const { sandbox } = loadUserInputPipelineSandbox();
		const markdown = 'MARKER_BEFORE\n\n```\n' + dollarPayload + '\n```\n\nMARKER_AFTER';
		const html = sandbox.parseSimpleMarkdown(markdown);

		assert.strictEqual(html.split('MARKER_BEFORE').length - 1, 1, 'MARKER_BEFORE must appear exactly once, not spliced into the code block; got: ' + html);
		assert.strictEqual(html.split('MARKER_AFTER').length - 1, 1, 'MARKER_AFTER must appear exactly once, not spliced into the code block; got: ' + html);

		const dataRawCode = findAttrOn(html, 'language-plaintext', 'data-raw-code');
		assert.ok(dataRawCode, 'expected a data-raw-code attribute on the language-plaintext code element; got: ' + html);
		assert.strictEqual(dataRawCode!.value, dollarPayload + '\n', 'data-raw-code must contain the exact fenced code, dollar sequences untouched; got: ' + html);
		assert.strictEqual(textOn(html, 'code-line'), dollarPayload, 'the rendered code line must be the exact literal text; got: ' + html);
	});

	test('renderUserMessageContent: a code block containing "$&"/"$`"/"$\'"/"$$" does not duplicate the surrounding raw-text prose and round-trips byte-for-byte', () => {
		const { sandbox } = loadUserInputPipelineSandbox();
		const text = 'MARKER_BEFORE\n```\n' + dollarPayload + '\n```\nMARKER_AFTER';
		const html = sandbox.renderUserMessageContent(text);

		assert.strictEqual(html.split('MARKER_BEFORE').length - 1, 1, 'MARKER_BEFORE must appear exactly once, not spliced into the code block; got: ' + html);
		assert.strictEqual(html.split('MARKER_AFTER').length - 1, 1, 'MARKER_AFTER must appear exactly once, not spliced into the code block; got: ' + html);

		const dataRawCode = findAttrOn(html, 'language-plaintext', 'data-raw-code');
		assert.ok(dataRawCode, 'expected a data-raw-code attribute on the language-plaintext code element; got: ' + html);
		assert.strictEqual(dataRawCode!.value, dollarPayload + '\n', 'data-raw-code must contain the exact fenced code, dollar sequences untouched; got: ' + html);
		assert.strictEqual(textOn(html, 'code-line'), dollarPayload, 'the rendered code line must be the exact literal text; got: ' + html);
	});
});
