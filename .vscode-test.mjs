import { defineConfig } from '@vscode/test-cli';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// Tier 1 runs against a throwaway folder, never this repo. Several handlers
// write into the open workspace (.claude/settings.json for permissions,
// .claude/skills/ for project skills, .mcp.json for project MCP servers), and
// without ANY workspace folder the extension silently disables conversation
// storage — so "no workspace" is both unsafe and unrepresentative.
const workspace = join(tmpdir(), 'ccc-tier1-ws');
// Wiped, not just ensured: a previous run's skills, .mcp.json or permissions
// would otherwise leak into the next one and make failures depend on history.
rmSync(workspace, { recursive: true, force: true });
mkdirSync(join(workspace, '.claude'), { recursive: true });
writeFileSync(join(workspace, 'README.md'), '# Tier 1 sandbox\n');

export default defineConfig({
	files: 'out/test/**/*.test.js',
	workspaceFolder: workspace,
});
