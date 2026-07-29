// Unit tests for the Windows shell-arg quoting helper used by the Claude
// process spawn (fork-issue-39). quoteWinShellArgs() is pure (no network, no
// vscode), so these run under plain mocha against the compiled out/ output —
// same pattern as the model-updater/downloader unit tests. Run with
// `npm run test:quote-win-shell-args`.

import * as assert from 'assert';
import { quoteWinShellArgs } from '../shell-utils';

suite('shell-utils: quoteWinShellArgs', () => {

	test('quotes an arg containing a space when useShell is true', () => {
		const args = ['--mcp-config', 'C:\\Users\\Vincent K. Bae\\x\\mcp-servers.json'];
		const out = quoteWinShellArgs(args, true);
		assert.strictEqual(out[out.length - 1], '"C:\\Users\\Vincent K. Bae\\x\\mcp-servers.json"');
	});

	test('leaves args without spaces unchanged when useShell is true', () => {
		const args = ['--mcp-config', 'C:\\Users\\Dev\\mcp-servers.json'];
		const out = quoteWinShellArgs(args, true);
		assert.deepStrictEqual(out, args);
	});

	test('leaves args with spaces unchanged when useShell is false (custom executable)', () => {
		const args = ['--mcp-config', 'C:\\Users\\Vincent K. Bae\\x\\mcp-servers.json'];
		const out = quoteWinShellArgs(args, false);
		assert.deepStrictEqual(out, args);
	});

	test('does not double-quote an already-quoted arg', () => {
		const args = ['"C:\\Users\\Vincent K. Bae\\x\\mcp-servers.json"'];
		const out = quoteWinShellArgs(args, true);
		assert.strictEqual(out[0], '"C:\\Users\\Vincent K. Bae\\x\\mcp-servers.json"');
	});
});
