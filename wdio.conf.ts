import * as path from 'path';
import { execSync } from 'child_process';

/**
 * WebdriverIO config for real end-to-end tests: launches an actual VS Code with
 * this extension loaded and drives the UI, including inside the webview.
 *
 * These are NOT part of `npm test`. Two modes:
 *
 *   E2E_MODE=subscription   (default) — spawns the `claude` CLI with no gateway
 *                           env vars, so it uses your Claude Code subscription.
 *                           Costs ZERO OpenCredits credits. Use this for every
 *                           test that isn't specifically about the gateway.
 *
 *   E2E_MODE=opencredits    — routes through the production OpenCredits gateway.
 *                           SPENDS REAL CREDITS. Requires OPENCREDITS_KEY, and
 *                           bills at the rate of whatever E2E_MODEL names.
 *
 *   npm run test:e2e
 *   E2E_MODE=opencredits OPENCREDITS_KEY=oc_sk_… E2E_MODEL=minimax/minimax-m3 npm run test:e2e
 *
 * The key is read from the environment into the throwaway VS Code profile this
 * run creates — never committed, never read from your real settings.
 */
const MODE = process.env.E2E_MODE || 'subscription';
const OPENCREDITS_KEY = process.env.OPENCREDITS_KEY || '';
const MODEL = process.env.E2E_MODEL || '';
const YOLO = process.env.E2E_YOLO !== 'false';

/**
 * A throwaway folder, never this repo. The extension writes .claude/settings.json,
 * .claude/claude-code-chat-images/ and project skills into whatever workspace it
 * has open, and runs `git add -A` across it for every backup commit. With a live
 * model and yolo mode on, pointing that at the source tree is how you lose work.
 * scripts/test-workspace.sh builds this; the suite refuses to run without it.
 */
const WORKSPACE = process.env.E2E_WORKSPACE
	|| path.join(process.env.TMPDIR || '/tmp', 'ccc-e2e-ws');

/** Absolute path beats PATH inheritance: the launched VS Code may not have nvm's bin dir. */
function claudeBinary(): string {
	try { return execSync('command -v claude', { encoding: 'utf8' }).trim(); }
	catch { return ''; }
}

if (MODE === 'opencredits') {
	if (!OPENCREDITS_KEY) { throw new Error('E2E_MODE=opencredits requires OPENCREDITS_KEY'); }
	// E2E_MODEL pins every tier to one model. Omitting it is only valid for the
	// per-card models suite, where each card intentionally sets its own tiers.
	if (!MODEL && process.env.E2E_BUDGET_OK !== '1') {
		throw new Error('E2E_MODE=opencredits requires E2E_MODEL, or E2E_BUDGET_OK=1 for the per-card suite');
	}
}

/**
 * In opencredits mode EVERY tier is pinned to the single model under test, so a
 * run cannot silently bill a flagship tier through the CLI's background traffic.
 * In subscription mode we send no gateway vars at all, which is what makes
 * _isOpenCredits() false and routes the CLI to your own account.
 */
const envVars: Record<string, string> = MODE === 'opencredits'
	? {
		ANTHROPIC_BASE_URL: 'https://ccc.api.opencredits.ai',
		ANTHROPIC_AUTH_TOKEN: OPENCREDITS_KEY,
		// Pinning is best-effort only: selecting a model card calls
		// _setModelEnvVars, which overwrites all four of these with that card's
		// tier map. Treat it as a floor for runs that never click a card, not as
		// a guarantee. The real guard is the assertion in models.e2e.ts.
		...(MODEL ? {
			ANTHROPIC_DEFAULT_SONNET_MODEL: MODEL,
			ANTHROPIC_DEFAULT_OPUS_MODEL: MODEL,
			ANTHROPIC_DEFAULT_HAIKU_MODEL: MODEL,
			ANTHROPIC_DEFAULT_FABLE_MODEL: MODEL
		} : {})
	}
	: {};

export const config: WebdriverIO.Config = {
	runner: 'local',
	// Mode picks the suite: the billed per-model suite never runs by accident.
	specs: [MODE === 'opencredits'
		? path.join(__dirname, 'e2e', 'models.e2e.ts')
		: path.join(__dirname, 'e2e', '!(models|diag).e2e.ts')],
	maxInstances: 1,
	capabilities: [{
		browserName: 'vscode',
		browserVersion: 'stable',
		// Required by wdio-vscode-service under WebdriverIO v9: without it wdio
		// negotiates WebDriver BiDi, the VS Code session fails to start, and the
		// run silently falls back to plain Chrome.
		// @ts-expect-error provided by wdio-vscode-service
		'wdio:enforceWebDriverClassic': true,
		// @ts-expect-error provided by wdio-vscode-service
		'wdio:vscodeOptions': {
			extensionPath: __dirname,
			workspacePath: WORKSPACE,
			userSettings: {
				// The sandbox workspace is created fresh for every run, so VS Code
				// treats it as untrusted and puts a modal in front of the window.
				// That modal swallows the command palette, and every test then
				// fails on `.quick-input-widget` with no hint that trust is why.
				'security.workspace.trust.enabled': false,
				'workbench.startupEditor': 'none',
				'claudeCodeChat.environment.variables': envVars,
				'claudeCodeChat.permissions.yoloMode': YOLO,
				'claudeCodeChat.executable.path': claudeBinary()
			}
		}
	}],
	services: ['vscode'],
	framework: 'mocha',
	reporters: ['spec'],
	logLevel: 'warn',
	mochaOpts: { ui: 'bdd', timeout: 300000 },
	autoCompileOpts: {
		autoCompile: true,
		tsNodeOpts: { transpileOnly: true, project: path.join(__dirname, 'tsconfig.json') }
	}
};
