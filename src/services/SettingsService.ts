import * as vscode from 'vscode';
import { ClaudeSettings, PlatformInfo } from '../types';

export class SettingsService {
	private _selectedModel: string = 'default';

	constructor(
		private readonly _context: vscode.ExtensionContext
	) {
		// Load saved model preference
		this._selectedModel = this._context.workspaceState.get('claude.selectedModel', 'default');
	}

	public get selectedModel(): string {
		return this._selectedModel;
	}

	public getCurrentSettings(): ClaudeSettings {
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		return {
			'thinking.intensity': config.get<string>('thinking.intensity', 'think'),
			'wsl.enabled': config.get<boolean>('wsl.enabled', false),
			'wsl.distro': config.get<string>('wsl.distro', 'Ubuntu'),
			'wsl.nodePath': config.get<string>('wsl.nodePath', '/usr/bin/node'),
			'wsl.claudePath': config.get<string>('wsl.claudePath', '/usr/local/bin/claude'),
			'permissions.yoloMode': config.get<boolean>('permissions.yoloMode', false)
		};
	}

	public async updateSettings(settings: { [key: string]: any }): Promise<void> {
		const config = vscode.workspace.getConfiguration('claudeCodeChat');

		try {
			for (const [key, value] of Object.entries(settings)) {
				if (key === 'permissions.yoloMode') {
					// YOLO mode is workspace-specific
					await config.update(key, value, vscode.ConfigurationTarget.Workspace);
				} else {
					// Other settings are global (user-wide)
					await config.update(key, value, vscode.ConfigurationTarget.Global);
				}
			}

			console.log('Settings updated:', settings);
		} catch (error) {
			console.error('Failed to update settings:', error);
			vscode.window.showErrorMessage('Failed to update settings');
		}
	}

	public setSelectedModel(model: string): boolean {
		// Validate model name to prevent issues mentioned in the GitHub issue
		const validModels = ['opus', 'sonnet', 'default'];
		if (validModels.includes(model)) {
			this._selectedModel = model;
			console.log('Model selected:', model);

			// Store the model preference in workspace state
			this._context.workspaceState.update('claude.selectedModel', model);

			// Show confirmation
			vscode.window.showInformationMessage(`Claude model switched to: ${model.charAt(0).toUpperCase() + model.slice(1)}`);
			return true;
		} else {
			console.error('Invalid model selected:', model);
			vscode.window.showErrorMessage(`Invalid model: ${model}. Please select Opus, Sonnet, or Default.`);
			return false;
		}
	}

	public async enableYoloMode(): Promise<void> {
		try {
			// Update VS Code configuration to enable YOLO mode
			const config = vscode.workspace.getConfiguration('claudeCodeChat');

			// Clear any global setting and set workspace setting
			await config.update('permissions.yoloMode', true, vscode.ConfigurationTarget.Workspace);

			console.log('YOLO Mode enabled - all future permissions will be skipped');
		} catch (error) {
			console.error('Error enabling YOLO mode:', error);
		}
	}

	public dismissWSLAlert(): void {
		this._context.globalState.update('wslAlertDismissed', true);
	}

	public getPlatformInfo(): PlatformInfo {
		const platform = process.platform;
		const dismissed = this._context.globalState.get<boolean>('wslAlertDismissed', false);

		// Get WSL configuration
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const wslEnabled = config.get<boolean>('wsl.enabled', false);

		return {
			platform: platform,
			isWindows: platform === 'win32',
			wslAlertDismissed: dismissed,
			wslEnabled: wslEnabled
		};
	}

	public openModelTerminal(currentSessionId?: string): void {
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const wslEnabled = config.get<boolean>('wsl.enabled', false);
		const wslDistro = config.get<string>('wsl.distro', 'Ubuntu');
		const nodePath = config.get<string>('wsl.nodePath', '/usr/bin/node');
		const claudePath = config.get<string>('wsl.claudePath', '/usr/local/bin/claude');

		// Build command arguments
		const args = ['/model'];

		// Add session resume if we have a current session
		if (currentSessionId) {
			args.push('--resume', currentSessionId);
		}

		// Create terminal with the claude /model command
		const terminal = vscode.window.createTerminal('Claude Model Selection');
		if (wslEnabled) {
			terminal.sendText(`wsl -d ${wslDistro} ${nodePath} --no-warnings --enable-source-maps ${claudePath} ${args.join(' ')}`);
		} else {
			terminal.sendText(`claude ${args.join(' ')}`);
		}
		terminal.show();

		// Show info message
		vscode.window.showInformationMessage(
			'Check the terminal to update your default model configuration. Come back to this chat here after making changes.',
			'OK'
		);
	}

	public executeSlashCommand(command: string, currentSessionId?: string): void {
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const wslEnabled = config.get<boolean>('wsl.enabled', false);
		const wslDistro = config.get<string>('wsl.distro', 'Ubuntu');
		const nodePath = config.get<string>('wsl.nodePath', '/usr/bin/node');
		const claudePath = config.get<string>('wsl.claudePath', '/usr/local/bin/claude');

		// Build command arguments
		const args = [`/${command}`];

		// Add session resume if we have a current session
		if (currentSessionId) {
			args.push('--resume', currentSessionId);
		}

		// Create terminal with the claude command
		const terminal = vscode.window.createTerminal(`Claude /${command}`);
		if (wslEnabled) {
			terminal.sendText(`wsl -d ${wslDistro} ${nodePath} --no-warnings --enable-source-maps ${claudePath} ${args.join(' ')}`);
		} else {
			terminal.sendText(`claude ${args.join(' ')}`);
		}
		terminal.show();

		// Show info message
		vscode.window.showInformationMessage(
			`Executing /${command} command in terminal. Check the terminal output and return when ready.`,
			'OK'
		);
	}

	public async saveCustomSnippet(snippet: any): Promise<void> {
		try {
			const customSnippets = this._context.globalState.get<{ [key: string]: any }>('customPromptSnippets', {});
			customSnippets[snippet.id] = snippet;

			await this._context.globalState.update('customPromptSnippets', customSnippets);
			console.log('Saved custom snippet:', snippet.name);
		} catch (error) {
			console.error('Error saving custom snippet:', error);
			throw new Error('Failed to save custom snippet');
		}
	}

	public async deleteCustomSnippet(snippetId: string): Promise<void> {
		try {
			const customSnippets = this._context.globalState.get<{ [key: string]: any }>('customPromptSnippets', {});

			if (customSnippets[snippetId]) {
				delete customSnippets[snippetId];
				await this._context.globalState.update('customPromptSnippets', customSnippets);
				console.log('Deleted custom snippet:', snippetId);
			} else {
				throw new Error('Snippet not found');
			}
		} catch (error) {
			console.error('Error deleting custom snippet:', error);
			throw new Error('Failed to delete custom snippet');
		}
	}

	public getCustomSnippets(): { [key: string]: any } {
		return this._context.globalState.get<{ [key: string]: any }>('customPromptSnippets', {});
	}

	public isPermissionSystemEnabled(): boolean {
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const yoloMode = config.get<boolean>('permissions.yoloMode', false);
		return !yoloMode;
	}

	public convertToWSLPath(windowsPath: string): string {
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const wslEnabled = config.get<boolean>('wsl.enabled', false);

		if (wslEnabled && windowsPath.match(/^[a-zA-Z]:/)) {
			// Convert C:\Users\... to /mnt/c/Users/...
			return windowsPath.replace(/^([a-zA-Z]):/, '/mnt/$1').toLowerCase().replace(/\\/g, '/');
		}

		return windowsPath;
	}
}