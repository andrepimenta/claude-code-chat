import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as util from 'util';
import * as path from 'path';
import { CommitInfo } from '../types';

const exec = util.promisify(cp.exec);

export class BackupService {
	private _backupRepoPath: string | undefined;
	private _commits: CommitInfo[] = [];

	constructor(
		private readonly _context: vscode.ExtensionContext
	) {
		this._initializeBackupRepo();
	}

	public get commits(): CommitInfo[] {
		return this._commits;
	}

	private async _initializeBackupRepo(): Promise<void> {
		try {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder) { return; }

			const storagePath = this._context.storageUri?.fsPath;
			if (!storagePath) {
				console.error('No workspace storage available');
				return;
			}
			console.log('Workspace storage path:', storagePath);
			this._backupRepoPath = path.join(storagePath, 'backups', '.git');

			// Create backup git directory if it doesn't exist
			try {
				await vscode.workspace.fs.stat(vscode.Uri.file(this._backupRepoPath));
			} catch {
				await vscode.workspace.fs.createDirectory(vscode.Uri.file(this._backupRepoPath));

				const workspacePath = workspaceFolder.uri.fsPath;

				// Initialize git repo with workspace as work-tree
				await exec(`git --git-dir="${this._backupRepoPath}" --work-tree="${workspacePath}" init`);
				await exec(`git --git-dir="${this._backupRepoPath}" config user.name "Claude Code Chat"`);
				await exec(`git --git-dir="${this._backupRepoPath}" config user.email "claude@anthropic.com"`);

				console.log(`Initialized backup repository at: ${this._backupRepoPath}`);
			}
		} catch (error: any) {
			console.error('Failed to initialize backup repository:', error.message);
		}
	}

	public async createBackupCommit(userMessage: string): Promise<CommitInfo | undefined> {
		try {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder || !this._backupRepoPath) { return; }

			const workspacePath = workspaceFolder.uri.fsPath;
			const now = new Date();
			const timestamp = now.toISOString().replace(/[:.]/g, '-');
			const displayTimestamp = now.toISOString();
			const commitMessage = `Before: ${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}`;

			// Add all files using git-dir and work-tree (excludes .git automatically)
			await exec(`git --git-dir="${this._backupRepoPath}" --work-tree="${workspacePath}" add -A`);

			// Check if this is the first commit (no HEAD exists yet)
			let isFirstCommit = false;
			try {
				await exec(`git --git-dir="${this._backupRepoPath}" rev-parse HEAD`);
			} catch {
				isFirstCommit = true;
			}

			// Check if there are changes to commit
			const { stdout: status } = await exec(`git --git-dir="${this._backupRepoPath}" --work-tree="${workspacePath}" status --porcelain`);

			// Always create a checkpoint, even if no files changed
			let actualMessage;
			if (isFirstCommit) {
				actualMessage = `Initial backup: ${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}`;
			} else if (status.trim()) {
				actualMessage = commitMessage;
			} else {
				actualMessage = `Checkpoint (no changes): ${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}`;
			}

			// Create commit with --allow-empty to ensure checkpoint is always created
			await exec(`git --git-dir="${this._backupRepoPath}" --work-tree="${workspacePath}" commit --allow-empty -m "${actualMessage}"`);
			const { stdout: sha } = await exec(`git --git-dir="${this._backupRepoPath}" rev-parse HEAD`);

			// Store commit info
			const commitInfo: CommitInfo = {
				id: `commit-${timestamp}`,
				sha: sha.trim(),
				message: actualMessage,
				timestamp: displayTimestamp
			};

			this._commits.push(commitInfo);

			console.log(`Created backup commit: ${commitInfo.sha.substring(0, 8)} - ${actualMessage}`);
			return commitInfo;
		} catch (error: any) {
			console.error('Failed to create backup commit:', error.message);
			return undefined;
		}
	}

	public async restoreToCommit(commitSha: string): Promise<{ success: boolean; message: string }> {
		try {
			const commit = this._commits.find(c => c.sha === commitSha);
			if (!commit) {
				return { success: false, message: 'Commit not found' };
			}

			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder || !this._backupRepoPath) {
				return { success: false, message: 'No workspace folder or backup repository available' };
			}

			const workspacePath = workspaceFolder.uri.fsPath;

			// Restore files directly to workspace using git checkout
			await exec(`git --git-dir="${this._backupRepoPath}" --work-tree="${workspacePath}" checkout ${commitSha} -- .`);

			vscode.window.showInformationMessage(`Restored to commit: ${commit.message}`);
			return { success: true, message: `Successfully restored to: ${commit.message}` };

		} catch (error: any) {
			console.error('Failed to restore commit:', error.message);
			vscode.window.showErrorMessage(`Failed to restore commit: ${error.message}`);
			return { success: false, message: `Failed to restore: ${error.message}` };
		}
	}

	public clearCommits(): void {
		this._commits = [];
	}
}