// Regression tests for three security fixes. Each one is written to FAIL against
// the code as it was: if you revert the fix, the test goes red. That is the only
// property that makes a security test worth having.
//
// These run inside a real VS Code extension host, against the real provider.

import * as assert from 'assert';
import * as cp from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as util from 'util';
import * as vscode from 'vscode';

const execFile = util.promisify(cp.execFile);
const EXT_ID = 'AndrePimenta.claude-code-chat';

async function getProvider(): Promise<any> {
	const ext = vscode.extensions.getExtension(EXT_ID);
	assert.ok(ext, 'extension not found');
	const api: any = await ext!.activate();
	assert.ok(api?.provider, 'activate() did not expose the provider');
	return api.provider;
}

/** Swap in a webview that records what the extension posts back. */
function captureMessages(provider: any): any[] {
	const sent: any[] = [];
	provider._webview = { postMessage: (m: any) => { sent.push(m); return Promise.resolve(true); } };
	return sent;
}

suite('security: backup commit does not reach a shell', () => {

	test('$(...) in a chat message is data, not a command', async () => {
		const provider = await getProvider();
		const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ccc-sec-'));
		const gitDir = path.join(tmp, 'backup.git');
		const sentinel = path.join(tmp, 'PWNED');

		fs.mkdirSync(gitDir, { recursive: true });
		const workTree = vscode.workspace.workspaceFolders![0].uri.fsPath;
		await execFile('git', ['--git-dir', gitDir, '--work-tree', workTree, 'init']);
		await execFile('git', ['--git-dir', gitDir, 'config', 'user.name', 'test']);
		await execFile('git', ['--git-dir', gitDir, 'config', 'user.email', 'test@test']);

		const prev = provider._backupRepoPath;
		provider._backupRepoPath = gitDir;
		try {
			// The exact shape a user could type. Under cp.exec this ran.
			await provider._createBackupCommit(`what does $(touch ${sentinel}) do?`);

			assert.strictEqual(fs.existsSync(sentinel), false,
				'the substitution EXECUTED — the commit message still reaches a shell');

			const { stdout } = await execFile('git', ['--git-dir', gitDir, 'log', '-1', '--format=%s']);
			assert.ok(stdout.includes('$(touch'),
				`commit subject lost the literal text: ${stdout.trim()}`);
		} finally {
			provider._backupRepoPath = prev;
			fs.rmSync(tmp, { recursive: true, force: true });
		}
	});

	test('a double quote in a message no longer breaks the commit', async () => {
		// Pre-fix this produced a malformed shell command; the error was caught and
		// logged, so checkpoints silently stopped being created.
		const provider = await getProvider();
		const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ccc-sec-'));
		const gitDir = path.join(tmp, 'backup.git');
		fs.mkdirSync(gitDir, { recursive: true });
		const workTree = vscode.workspace.workspaceFolders![0].uri.fsPath;
		await execFile('git', ['--git-dir', gitDir, '--work-tree', workTree, 'init']);
		await execFile('git', ['--git-dir', gitDir, 'config', 'user.name', 'test']);
		await execFile('git', ['--git-dir', gitDir, 'config', 'user.email', 'test@test']);

		const prev = provider._backupRepoPath;
		provider._backupRepoPath = gitDir;
		try {
			await provider._createBackupCommit('fix the "quoted" thing');
			const { stdout } = await execFile('git', ['--git-dir', gitDir, 'log', '-1', '--format=%s']);
			assert.ok(stdout.includes('"quoted"'), `commit not created for a quoted message: ${stdout}`);
		} finally {
			provider._backupRepoPath = prev;
			fs.rmSync(tmp, { recursive: true, force: true });
		}
	});
});

suite('backup: commit and restore round-trip', () => {

	test('the extension initialises its OWN backup repo end to end', async () => {
		// _initializeBackupRepo catches every error and only console.errors it, so a
		// broken git invocation here is completely silent at runtime: checkpoints
		// just never appear. The other backup tests build the repo themselves with
		// execFile, which means they would still pass if these three calls were
		// wrong. This one drives the extension's own path.
		const provider = await getProvider();
		const storagePath = provider._context.storageUri?.fsPath;
		assert.ok(storagePath, 'no workspace storage — test host has no workspace folder');

		const repoPath = path.join(storagePath, 'backups', '.git');
		fs.rmSync(path.join(storagePath, 'backups'), { recursive: true, force: true });

		const prevCommits = provider._commits;
		provider._commits = [];
		captureMessages(provider);
		const ws = vscode.workspace.workspaceFolders![0].uri.fsPath;
		const probe = path.join(ws, 'backup-chain-probe.txt');
		try {
			await provider._initializeBackupRepo();

			assert.strictEqual(provider._backupRepoPath, repoPath);
			assert.ok(fs.existsSync(path.join(repoPath, 'HEAD')),
				'git init did not actually create a repository at ' + repoPath);

			const { stdout: name } = await execFile('git', ['--git-dir', repoPath, 'config', 'user.name']);
			const { stdout: email } = await execFile('git', ['--git-dir', repoPath, 'config', 'user.email']);
			assert.strictEqual(name.trim(), 'Claude Code Chat', 'user.name was never configured');
			assert.strictEqual(email.trim(), 'claude@anthropic.com', 'user.email was never configured');

			// Now the full chain on the repo the EXTENSION made.
			fs.writeFileSync(probe, 'original');
			await provider._createBackupCommit('checkpoint "one" $(touch /tmp/ccc-chain-probe)');

			assert.strictEqual(fs.existsSync('/tmp/ccc-chain-probe'), false,
				'the commit message reached a shell');
			const commit = provider._commits[provider._commits.length - 1];
			assert.ok(commit?.sha, 'no checkpoint was recorded by the extension');

			const { stdout: subject } = await execFile('git', ['--git-dir', repoPath, 'log', '-1', '--format=%s']);
			assert.ok(subject.includes('"one"'), `commit subject lost the quotes: ${subject.trim()}`);

			fs.writeFileSync(probe, 'CLOBBERED');
			await provider._restoreToCommit(commit.sha);
			assert.strictEqual(fs.readFileSync(probe, 'utf8'), 'original',
				'restore did not bring the file back');
		} finally {
			provider._commits = prevCommits;
			fs.rmSync(probe, { force: true });
			fs.rmSync('/tmp/ccc-chain-probe', { force: true });
			fs.rmSync(path.join(storagePath, 'backups'), { recursive: true, force: true });
		}
	});

	test('restore reverts edits and deletions, but NOT files the AI created', async () => {
		// Documents what restore actually does. `git checkout <sha> -- .` restores
		// paths present in the commit, so an edit is undone and a deletion is undone,
		// but a file created after the checkpoint is not in that commit and survives.
		// Leaving it is the safer failure mode — `git clean` would also delete
		// untracked files the USER made — but it means "Restore checkpoint" does not
		// return the tree to exactly how it looked.
		const provider = await getProvider();
		const ws = vscode.workspace.workspaceFolders![0].uri.fsPath;
		const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ccc-rewind-'));
		const gitDir = path.join(tmp, 'backup.git');
		fs.mkdirSync(gitDir, { recursive: true });
		await execFile('git', ['--git-dir', gitDir, '--work-tree', ws, 'init']);
		await execFile('git', ['--git-dir', gitDir, 'config', 'user.name', 'test']);
		await execFile('git', ['--git-dir', gitDir, 'config', 'user.email', 'test@test']);

		const edited = path.join(ws, 'rewind-edited.txt');
		const removed = path.join(ws, 'rewind-removed.txt');
		const created = path.join(ws, 'rewind-created.txt');

		const prevRepo = provider._backupRepoPath;
		const prevCommits = provider._commits;
		provider._backupRepoPath = gitDir;
		provider._commits = [];
		captureMessages(provider);
		try {
			fs.writeFileSync(edited, 'original');
			fs.writeFileSync(removed, 'present at checkpoint');
			await provider._createBackupCommit('checkpoint before the AI runs');
			const commit = provider._commits[provider._commits.length - 1];
			assert.ok(commit?.sha, 'no checkpoint recorded');

			// What an AI turn typically does to a workspace.
			fs.writeFileSync(edited, 'MODIFIED BY AI');
			fs.rmSync(removed);
			fs.writeFileSync(created, 'NEW FILE FROM AI');

			await provider._restoreToCommit(commit.sha);

			assert.strictEqual(fs.readFileSync(edited, 'utf8'), 'original',
				'an edited file was not reverted');
			assert.ok(fs.existsSync(removed), 'a deleted file was not restored');
			assert.strictEqual(fs.existsSync(created), true,
				'a file created after the checkpoint was removed — restore semantics ' +
				'changed; if that is now intended, update this test and tell users');
		} finally {
			provider._backupRepoPath = prevRepo;
			provider._commits = prevCommits;
			for (const f of [edited, removed, created]) { fs.rmSync(f, { force: true }); }
			fs.rmSync(tmp, { recursive: true, force: true });
		}
	});

	test('restoring a checkpoint puts the working tree back', async () => {
		// _restoreToCommit runs `git checkout <sha> -- .` against the LIVE workspace.
		// It was converted to argv alongside the rest, and it is the one git call
		// here that destroys data, so it gets its own test.
		const provider = await getProvider();
		const ws = vscode.workspace.workspaceFolders![0].uri.fsPath;
		const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ccc-restore-'));
		const gitDir = path.join(tmp, 'backup.git');
		const probe = path.join(ws, 'restore-probe.txt');

		fs.mkdirSync(gitDir, { recursive: true });
		await execFile('git', ['--git-dir', gitDir, '--work-tree', ws, 'init']);
		await execFile('git', ['--git-dir', gitDir, 'config', 'user.name', 'test']);
		await execFile('git', ['--git-dir', gitDir, 'config', 'user.email', 'test@test']);

		const prev = provider._backupRepoPath;
		const prevCommits = provider._commits;
		provider._backupRepoPath = gitDir;
		provider._commits = [];
		captureMessages(provider);
		try {
			fs.writeFileSync(probe, 'original');
			await provider._createBackupCommit('checkpoint before edit');

			const commit = provider._commits[provider._commits.length - 1];
			assert.ok(commit?.sha, 'no checkpoint was recorded');

			fs.writeFileSync(probe, 'CLOBBERED');
			await provider._restoreToCommit(commit.sha);

			assert.strictEqual(fs.readFileSync(probe, 'utf8'), 'original',
				'restore did not bring the file back');
		} finally {
			provider._backupRepoPath = prev;
			provider._commits = prevCommits;
			fs.rmSync(probe, { force: true });
			fs.rmSync(tmp, { recursive: true, force: true });
		}
	});
});

suite('security: MCP config is never written over an unreadable file', () => {

	test('a corrupt config is left untouched and an error is surfaced', async () => {
		const provider = await getProvider();
		const ws = vscode.workspace.workspaceFolders![0].uri.fsPath;
		const configPath = path.join(ws, '.mcp.json');

		// Stand in for the real hazard: ~/.claude.json caught mid-write by the
		// Claude Code CLI, i.e. valid-looking bytes that do not parse.
		const corrupt = '{"mcpServers": {"existing": {"command": "real"}}, "trunca';
		const existed = fs.existsSync(configPath);
		const backup = existed ? fs.readFileSync(configPath) : null;
		fs.writeFileSync(configPath, corrupt);

		const sent = captureMessages(provider);
		try {
			await provider._saveMCPServer('probe', { command: 'echo' }, 'project');

			assert.strictEqual(fs.readFileSync(configPath, 'utf8'), corrupt,
				'the unparseable config was OVERWRITTEN — existing servers would be lost');

			const errors = sent.filter(m => m.type === 'mcpServerError');
			assert.ok(errors.length > 0, 'the failure was silent; the user was told nothing');
		} finally {
			if (backup) { fs.writeFileSync(configPath, backup); }
			else { fs.rmSync(configPath, { force: true }); }
		}
	});

	test('an absent config still writes normally', async () => {
		const provider = await getProvider();
		const ws = vscode.workspace.workspaceFolders![0].uri.fsPath;
		const configPath = path.join(ws, '.mcp.json');
		const existed = fs.existsSync(configPath);
		const backup = existed ? fs.readFileSync(configPath) : null;
		fs.rmSync(configPath, { force: true });

		captureMessages(provider);
		try {
			await provider._saveMCPServer('probe', { command: 'echo' }, 'project');
			const written = JSON.parse(fs.readFileSync(configPath, 'utf8'));
			assert.ok(written.mcpServers?.probe, 'a missing file must still be created');
		} finally {
			if (backup) { fs.writeFileSync(configPath, backup); }
			else { fs.rmSync(configPath, { force: true }); }
		}
	});
});

suite('security: skill paths cannot escape their base directory', () => {

	const resolve = async () => {
		const provider = await getProvider();
		const ctor: any = provider.constructor;
		assert.ok(typeof ctor._resolveSkillDir === 'function', '_resolveSkillDir is missing');
		return (base: string, name: string) => ctor._resolveSkillDir(base, name);
	};

	test('traversal and separators are rejected', async () => {
		const r = await resolve();
		const base = path.join(os.homedir(), '.claude', 'skills');
		for (const hostile of ['..', '../../Documents', 'a/b', 'a\\b', '/etc', '.', '',
			'   ', './..', 'foo/../../bar']) {
			assert.throws(() => r(base, hostile), /Invalid skill name/,
				`accepted a hostile skill name: ${JSON.stringify(hostile)}`);
		}
	});

	test('ordinary names still resolve inside the base', async () => {
		const r = await resolve();
		const base = path.join(os.homedir(), '.claude', 'skills');
		for (const ok of ['my-skill', 'web_perf', 'skill.v2', 'Cloudflare']) {
			assert.strictEqual(r(base, ok), path.join(base, ok));
		}
	});
});
