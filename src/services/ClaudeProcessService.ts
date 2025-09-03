import * as vscode from 'vscode';
import * as cp from 'child_process';
import { TokenUsage } from '../types';

export interface ClaudeProcessOptions {
	message: string;
	sessionId?: string;
	selectedModel?: string;
	yoloMode?: boolean;
	mcpConfigPath?: string;
	wslConfig?: {
		enabled: boolean;
		distro: string;
		nodePath: string;
		claudePath: string;
	};
}

export interface JsonStreamData {
	type: string;
	subtype?: string;
	session_id?: string;
	tools?: any[];
	mcp_servers?: any[];
	message?: {
		content: any[];
		usage?: TokenUsage;
	};
	is_error?: boolean;
	result?: string;
	total_cost_usd?: number;
	duration_ms?: number;
	num_turns?: number;
}

export class ClaudeProcessService {
	private _currentClaudeProcess: cp.ChildProcess | undefined;

	public startClaudeProcess(
		options: ClaudeProcessOptions,
		onData: (data: JsonStreamData) => void,
		onClose: (code: number | null, errorOutput: string) => void,
		onError: (error: Error) => void
	): void {
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		const cwd = workspaceFolder ? workspaceFolder.uri.fsPath : process.cwd();

		// Build command arguments with session management
		const args = [
			'-p',
			'--output-format', 'stream-json', '--verbose'
		];

		if (options.yoloMode) {
			// Yolo mode: skip all permissions regardless of MCP config
			args.push('--dangerously-skip-permissions');
		} else if (options.mcpConfigPath) {
			// Add MCP configuration for permissions
			const convertedPath = this._convertToWSLPath(options.mcpConfigPath, options.wslConfig?.enabled || false);
			args.push('--mcp-config', convertedPath);
			args.push('--allowedTools', 'mcp__claude-code-chat-permissions__approval_prompt');
			args.push('--permission-prompt-tool', 'mcp__claude-code-chat-permissions__approval_prompt');
		}

		// Add model selection if not using default
		if (options.selectedModel && options.selectedModel !== 'default') {
			args.push('--model', options.selectedModel);
		}

		// Add session resume if we have a current session
		if (options.sessionId) {
			args.push('--resume', options.sessionId);
			console.log('Resuming session:', options.sessionId);
		} else {
			console.log('Starting new session');
		}

		console.log('Claude command args:', args);

		let claudeProcess: cp.ChildProcess;

		if (options.wslConfig?.enabled) {
			// Use WSL with bash -ic for proper environment loading
			console.log('Using WSL configuration:', options.wslConfig);
			const wslCommand = `"${options.wslConfig.nodePath}" --no-warnings --enable-source-maps "${options.wslConfig.claudePath}" ${args.join(' ')}`;

			claudeProcess = cp.spawn('wsl', ['-d', options.wslConfig.distro, 'bash', '-ic', wslCommand], {
				cwd: cwd,
				stdio: ['pipe', 'pipe', 'pipe'],
				env: {
					...process.env,
					FORCE_COLOR: '0',
					NO_COLOR: '1'
				}
			});
		} else {
			// Use native claude command
			console.log('Using native Claude command');
			// On Windows with shell:true, we need to properly quote arguments with spaces
			const quotedArgs = args.map(arg => {
				// Quote arguments that contain spaces
				if (arg.includes(' ') && !arg.startsWith('"')) {
					return `"${arg}"`;
				}
				return arg;
			});
			claudeProcess = cp.spawn('claude', quotedArgs, {
				shell: process.platform === 'win32',
				cwd: cwd,
				stdio: ['pipe', 'pipe', 'pipe'],
				env: {
					...process.env,
					FORCE_COLOR: '0',
					NO_COLOR: '1'
				}
			});
		}

		// Store process reference for potential termination
		this._currentClaudeProcess = claudeProcess;

		// Send the message to Claude's stdin
		if (claudeProcess.stdin) {
			claudeProcess.stdin.write(options.message + '\n');
			claudeProcess.stdin.end();
		}

		let rawOutput = '';
		let errorOutput = '';

		if (claudeProcess.stdout) {
			claudeProcess.stdout.on('data', (data) => {
				rawOutput += data.toString();

				// Process JSON stream line by line
				const lines = rawOutput.split('\n');
				rawOutput = lines.pop() || ''; // Keep incomplete line for next chunk

				for (const line of lines) {
					if (line.trim()) {
						try {
							const jsonData: JsonStreamData = JSON.parse(line.trim());
							onData(jsonData);
						} catch (error) {
							console.log('Failed to parse JSON line:', line, error);
						}
					}
				}
			});
		}

		if (claudeProcess.stderr) {
			claudeProcess.stderr.on('data', (data) => {
				errorOutput += data.toString();
			});
		}

		claudeProcess.on('close', (code) => {
			console.log('Claude process closed with code:', code);
			console.log('Claude stderr output:', errorOutput);

			if (!this._currentClaudeProcess) {
				return;
			}

			// Clear process reference
			this._currentClaudeProcess = undefined;
			onClose(code, errorOutput);
		});

		claudeProcess.on('error', (error) => {
			console.log('Claude process error:', error.message);

			if (!this._currentClaudeProcess) {
				return;
			}

			// Clear process reference
			this._currentClaudeProcess = undefined;
			onError(error);
		});
	}

	public stopClaudeProcess(): boolean {
		console.log('Stop request received');

		if (this._currentClaudeProcess) {
			console.log('Terminating Claude process...');

			// Try graceful termination first
			this._currentClaudeProcess.kill('SIGTERM');

			// Force kill after 2 seconds if still running
			setTimeout(() => {
				if (this._currentClaudeProcess && !this._currentClaudeProcess.killed) {
					console.log('Force killing Claude process...');
					this._currentClaudeProcess.kill('SIGKILL');
				}
			}, 2000);

			// Clear process reference
			this._currentClaudeProcess = undefined;

			console.log('Claude process termination initiated');
			return true;
		} else {
			console.log('No Claude process running to stop');
			return false;
		}
	}

	public isProcessRunning(): boolean {
		return !!this._currentClaudeProcess;
	}

	private _convertToWSLPath(windowsPath: string, wslEnabled: boolean): string {
		if (wslEnabled && windowsPath.match(/^[a-zA-Z]:/)) {
			// Convert C:\Users\... to /mnt/c/Users/...
			return windowsPath.replace(/^([a-zA-Z]):/, '/mnt/$1').toLowerCase().replace(/\\/g, '/');
		}

		return windowsPath;
	}
}