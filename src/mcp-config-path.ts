// Pure scope-to-config-path resolver behind the fork-issue-69 fix. extension.ts's
// _getMCPConfigPathForScope used to be a private method on the vscode-dependent
// ClaudeChatProvider class, which made the fork-issue-69 hardening (an unknown/empty scope must
// resolve to undefined, not silently fall through to the extension's own config) both
// untested and untestable. This module owns only the pure scope -> path decision; every
// environment value it needs (home dir, workspace folder, extension storage path) is
// passed in by the caller instead of being read from vscode/process here, so this runs
// under plain mocha, same pattern as settings-batch/shell-utils. Run
// with `npm run test:mcp-config-path`.

import * as path from 'path';

export interface MCPConfigPathEnv {
	homeDir?: string;
	workspaceFolder?: string;
	extensionStoragePath?: string;
}

// Resolves an MCP scope to the config file path the extension reads/writes for it.
// Extracted from extension.ts's pre-extraction _getMCPConfigPathForScope
// (fork-issue-69), with one deliberate behaviour change: that method's catch-all
// branch used to resolve anything that wasn't 'local'/'global'/'project' -- including
// an unknown or empty scope -- to the extension's own config path; here only
// 'extension' resolves to that path, and any other/unknown scope resolves to
// undefined instead (see the fork-issue-69 note below).
export function getMCPConfigPathForScope(scope: string, env: MCPConfigPathEnv): string | undefined {
	// Local scope (fork-issue-39) is owned by the CLI (~/.claude.json → projects);
	// the extension never writes it. Guard against a future caller falling
	// through to the extension config path by mistake.
	if (scope === 'local') { return undefined; }
	if (scope === 'global') {
		return env.homeDir ? path.join(env.homeDir, '.claude.json') : undefined;
	}
	if (scope === 'project') {
		return env.workspaceFolder ? path.join(env.workspaceFolder, '.mcp.json') : undefined;
	}
	if (scope === 'extension') {
		return env.extensionStoragePath ? path.join(env.extensionStoragePath, 'mcp', 'mcp-servers.json') : undefined;
	}
	// fork-issue-69: an unknown/empty scope must fail loud via the caller's mcpServerError, not
	// silently resolve to the extension's own config -- this function's own previous
	// catch-all behaviour. Note that an empty scope was never actually reaching this
	// function in practice: extension.ts's message dispatch (`case 'saveMCPServer':`)
	// already turns '' into 'project' via `message.scope || 'project'` before anything gets
	// here (kept as-is, see the note at that call site), so
	// the real pre-fork-issue-67 symptom for a locked, display-only #serverScope select with no
	// matching 'extension' <option> (see fork-issue-65) was a stray duplicate written into the
	// workspace's own .mcp.json (scope: 'project'), not into the extension's config.
	// script.ts's saveMCPServer() (fork-issue-67 Part A) now sends the server's own scope directly
	// while editing, closing that path from the UI entirely; this branch stays as a
	// fail-loud guard for any other/future caller.
	return undefined;
}
