import * as vscode from 'vscode';
import * as path from 'path';
import { PermissionRequest, PermissionResponse, Permissions } from '../types';

export class PermissionService {
	private _permissionRequestsPath: string | undefined;
	private _permissionWatcher: vscode.FileSystemWatcher | undefined;
	private _pendingPermissionResolvers: Map<string, (approved: boolean) => void> = new Map();
	private _disposables: vscode.Disposable[] = [];
	private _permissionRequestCallback: ((request: PermissionRequest) => void) | undefined;

	constructor(
		private readonly _context: vscode.ExtensionContext
	) {
		this._initializePermissions();
	}

	public setPermissionRequestCallback(callback: (request: PermissionRequest) => void): void {
		this._permissionRequestCallback = callback;
	}

	private async _initializePermissions(): Promise<void> {
		try {
			if (this._permissionWatcher) {
				this._permissionWatcher.dispose();
				this._permissionWatcher = undefined;
			}

			const storagePath = this._context.storageUri?.fsPath;
			if (!storagePath) { return; }

			// Create permission requests directory
			this._permissionRequestsPath = path.join(storagePath, 'permission-requests');
			try {
				await vscode.workspace.fs.stat(vscode.Uri.file(this._permissionRequestsPath));
			} catch {
				await vscode.workspace.fs.createDirectory(vscode.Uri.file(this._permissionRequestsPath));
				console.log(`Created permission requests directory at: ${this._permissionRequestsPath}`);
			}

			console.log("DIRECTORY-----", this._permissionRequestsPath);

			// Set up file watcher for *.request files
			this._permissionWatcher = vscode.workspace.createFileSystemWatcher(
				new vscode.RelativePattern(this._permissionRequestsPath, '*.request')
			);

			this._permissionWatcher.onDidCreate(async (uri) => {
				// Only handle file scheme URIs, ignore vscode-userdata scheme
				if (uri.scheme === 'file') {
					await this._handlePermissionRequest(uri);
				}
			});

			this._disposables.push(this._permissionWatcher);

		} catch (error: any) {
			console.error('Failed to initialize permissions:', error.message);
		}
	}

	private async _handlePermissionRequest(requestUri: vscode.Uri): Promise<void> {
		try {
			// Read the request file
			const content = await vscode.workspace.fs.readFile(requestUri);
			const request = JSON.parse(new TextDecoder().decode(content));

			// Show permission dialog
			const approved = await this._showPermissionDialog(request);

			// Write response file
			const responseFile = requestUri.fsPath.replace('.request', '.response');
			const response: PermissionResponse = {
				id: request.id,
				approved: approved,
				timestamp: new Date().toISOString()
			};

			const responseContent = new TextEncoder().encode(JSON.stringify(response));
			await vscode.workspace.fs.writeFile(vscode.Uri.file(responseFile), responseContent);

			// Clean up request file
			await vscode.workspace.fs.delete(requestUri);

		} catch (error: any) {
			console.error('Failed to handle permission request:', error.message);
		}
	}

	private async _showPermissionDialog(request: PermissionRequest): Promise<boolean> {
		// Store the resolver for when the permission response comes back
		const promise = new Promise<boolean>((resolve) => {
			this._pendingPermissionResolvers.set(request.id, resolve);
		});

		// Send permission request to webview via callback
		if (this._permissionRequestCallback) {
			this._permissionRequestCallback(request);
		} else {
			console.error('No permission request callback set - permission dialog will not be shown');
			// Default to deny if no callback is set
			this.resolvePermissionRequest(request.id, false);
		}

		return promise;
	}

	public resolvePermissionRequest(id: string, approved: boolean): void {
		if (this._pendingPermissionResolvers.has(id)) {
			const resolver = this._pendingPermissionResolvers.get(id);
			if (resolver) {
				resolver(approved);
				this._pendingPermissionResolvers.delete(id);
			}
		}
	}

	public async saveAlwaysAllowPermission(requestId: string): Promise<void> {
		try {
			// Read the original request to get tool name and input
			const storagePath = this._context.storageUri?.fsPath;
			if (!storagePath) {return;}

			const requestFileUri = vscode.Uri.file(path.join(storagePath, 'permission-requests', `${requestId}.request`));

			let requestContent: Uint8Array;
			try {
				requestContent = await vscode.workspace.fs.readFile(requestFileUri);
			} catch {
				return; // Request file doesn't exist
			}

			const request = JSON.parse(new TextDecoder().decode(requestContent));

			// Load existing workspace permissions
			const permissionsUri = vscode.Uri.file(path.join(storagePath, 'permission-requests', 'permissions.json'));
			let permissions: Permissions = { alwaysAllow: {} };

			try {
				const content = await vscode.workspace.fs.readFile(permissionsUri);
				permissions = JSON.parse(new TextDecoder().decode(content));
			} catch {
				// File doesn't exist yet, use default permissions
			}

			// Add the new permission
			const toolName = request.tool;
			if (toolName === 'Bash' && request.input?.command) {
				// For Bash, store the command pattern
				if (!permissions.alwaysAllow[toolName]) {
					permissions.alwaysAllow[toolName] = [];
				}
				if (Array.isArray(permissions.alwaysAllow[toolName])) {
					const command = request.input.command.trim();
					const pattern = this.getCommandPattern(command);
					if (!permissions.alwaysAllow[toolName].includes(pattern)) {
						permissions.alwaysAllow[toolName].push(pattern);
					}
				}
			} else {
				// For other tools, allow all instances
				permissions.alwaysAllow[toolName] = true;
			}

			// Ensure permissions directory exists
			const permissionsDir = vscode.Uri.file(path.dirname(permissionsUri.fsPath));
			try {
				await vscode.workspace.fs.stat(permissionsDir);
			} catch {
				await vscode.workspace.fs.createDirectory(permissionsDir);
			}

			// Save the permissions
			const permissionsContent = new TextEncoder().encode(JSON.stringify(permissions, null, 2));
			await vscode.workspace.fs.writeFile(permissionsUri, permissionsContent);

			console.log(`Saved always-allow permission for ${toolName}`);
		} catch (error) {
			console.error('Error saving always-allow permission:', error);
		}
	}

	public async getPermissions(): Promise<Permissions> {
		try {
			const storagePath = this._context.storageUri?.fsPath;
			if (!storagePath) {
				return { alwaysAllow: {} };
			}

			const permissionsUri = vscode.Uri.file(path.join(storagePath, 'permission-requests', 'permissions.json'));
			let permissions: Permissions = { alwaysAllow: {} };

			try {
				const content = await vscode.workspace.fs.readFile(permissionsUri);
				permissions = JSON.parse(new TextDecoder().decode(content));
			} catch {
				// File doesn't exist or can't be read, use default permissions
			}

			return permissions;
		} catch (error) {
			console.error('Error getting permissions:', error);
			return { alwaysAllow: {} };
		}
	}

	public async removePermission(toolName: string, command: string | null): Promise<void> {
		try {
			const storagePath = this._context.storageUri?.fsPath;
			if (!storagePath) {return;}

			const permissionsUri = vscode.Uri.file(path.join(storagePath, 'permission-requests', 'permissions.json'));
			let permissions: Permissions = { alwaysAllow: {} };

			try {
				const content = await vscode.workspace.fs.readFile(permissionsUri);
				permissions = JSON.parse(new TextDecoder().decode(content));
			} catch {
				// File doesn't exist or can't be read, nothing to remove
				return;
			}

			// Remove the permission
			if (command === null) {
				// Remove entire tool permission
				delete permissions.alwaysAllow[toolName];
			} else {
				// Remove specific command from tool permissions
				if (Array.isArray(permissions.alwaysAllow[toolName])) {
					permissions.alwaysAllow[toolName] = permissions.alwaysAllow[toolName].filter(
						(cmd: string) => cmd !== command
					);
					// If no commands left, remove the tool entirely
					if (permissions.alwaysAllow[toolName].length === 0) {
						delete permissions.alwaysAllow[toolName];
					}
				}
			}

			// Save updated permissions
			const permissionsContent = new TextEncoder().encode(JSON.stringify(permissions, null, 2));
			await vscode.workspace.fs.writeFile(permissionsUri, permissionsContent);

			console.log(`Removed permission for ${toolName}${command ? ` command: ${command}` : ''}`);
		} catch (error) {
			console.error('Error removing permission:', error);
		}
	}

	public async addPermission(toolName: string, command: string | null): Promise<void> {
		try {
			const storagePath = this._context.storageUri?.fsPath;
			if (!storagePath) {return;}

			const permissionsUri = vscode.Uri.file(path.join(storagePath, 'permission-requests', 'permissions.json'));
			let permissions: Permissions = { alwaysAllow: {} };

			try {
				const content = await vscode.workspace.fs.readFile(permissionsUri);
				permissions = JSON.parse(new TextDecoder().decode(content));
			} catch {
				// File doesn't exist, use default permissions
			}

			// Add the new permission
			if (command === null || command === '') {
				// Allow all commands for this tool
				permissions.alwaysAllow[toolName] = true;
			} else {
				// Add specific command pattern
				if (!permissions.alwaysAllow[toolName]) {
					permissions.alwaysAllow[toolName] = [];
				}

				// Convert to array if it's currently set to true
				if (permissions.alwaysAllow[toolName] === true) {
					permissions.alwaysAllow[toolName] = [];
				}

				if (Array.isArray(permissions.alwaysAllow[toolName])) {
					// For Bash commands, convert to pattern using existing logic
					let commandToAdd = command;
					if (toolName === 'Bash') {
						commandToAdd = this.getCommandPattern(command);
					}

					// Add if not already present
					if (!permissions.alwaysAllow[toolName].includes(commandToAdd)) {
						permissions.alwaysAllow[toolName].push(commandToAdd);
					}
				}
			}

			// Ensure permissions directory exists
			const permissionsDir = vscode.Uri.file(path.dirname(permissionsUri.fsPath));
			try {
				await vscode.workspace.fs.stat(permissionsDir);
			} catch {
				await vscode.workspace.fs.createDirectory(permissionsDir);
			}

			// Save updated permissions
			const permissionsContent = new TextEncoder().encode(JSON.stringify(permissions, null, 2));
			await vscode.workspace.fs.writeFile(permissionsUri, permissionsContent);

			console.log(`Added permission for ${toolName}${command ? ` command: ${command}` : ' (all commands)'}`);
		} catch (error) {
			console.error('Error adding permission:', error);
		}
	}

	public getCommandPattern(command: string): string {
		const parts = command.trim().split(/\s+/);
		if (parts.length === 0) {return command;}

		const baseCmd = parts[0];
		const subCmd = parts.length > 1 ? parts[1] : '';

		// Common patterns that should use wildcards
		const patterns = [
			// Package managers
			['npm', 'install', 'npm install *'],
			['npm', 'i', 'npm i *'],
			['npm', 'add', 'npm add *'],
			['npm', 'remove', 'npm remove *'],
			['npm', 'uninstall', 'npm uninstall *'],
			['npm', 'update', 'npm update *'],
			['npm', 'run', 'npm run *'],
			['yarn', 'add', 'yarn add *'],
			['yarn', 'remove', 'yarn remove *'],
			['yarn', 'install', 'yarn install *'],
			['pnpm', 'install', 'pnpm install *'],
			['pnpm', 'add', 'pnpm add *'],
			['pnpm', 'remove', 'pnpm remove *'],

			// Git commands
			['git', 'add', 'git add *'],
			['git', 'commit', 'git commit *'],
			['git', 'push', 'git push *'],
			['git', 'pull', 'git pull *'],
			['git', 'checkout', 'git checkout *'],
			['git', 'branch', 'git branch *'],
			['git', 'merge', 'git merge *'],
			['git', 'clone', 'git clone *'],
			['git', 'reset', 'git reset *'],
			['git', 'rebase', 'git rebase *'],
			['git', 'tag', 'git tag *'],

			// Docker commands
			['docker', 'run', 'docker run *'],
			['docker', 'build', 'docker build *'],
			['docker', 'exec', 'docker exec *'],
			['docker', 'logs', 'docker logs *'],
			['docker', 'stop', 'docker stop *'],
			['docker', 'start', 'docker start *'],
			['docker', 'rm', 'docker rm *'],
			['docker', 'rmi', 'docker rmi *'],
			['docker', 'pull', 'docker pull *'],
			['docker', 'push', 'docker push *'],

			// Build tools
			['make', '', 'make *'],
			['cargo', 'build', 'cargo build *'],
			['cargo', 'run', 'cargo run *'],
			['cargo', 'test', 'cargo test *'],
			['cargo', 'install', 'cargo install *'],
			['mvn', 'compile', 'mvn compile *'],
			['mvn', 'test', 'mvn test *'],
			['mvn', 'package', 'mvn package *'],
			['gradle', 'build', 'gradle build *'],
			['gradle', 'test', 'gradle test *'],

			// System commands
			['curl', '', 'curl *'],
			['wget', '', 'wget *'],
			['ssh', '', 'ssh *'],
			['scp', '', 'scp *'],
			['rsync', '', 'rsync *'],
			['tar', '', 'tar *'],
			['zip', '', 'zip *'],
			['unzip', '', 'unzip *'],

			// Development tools
			['node', '', 'node *'],
			['python', '', 'python *'],
			['python3', '', 'python3 *'],
			['pip', 'install', 'pip install *'],
			['pip3', 'install', 'pip3 install *'],
			['composer', 'install', 'composer install *'],
			['composer', 'require', 'composer require *'],
			['bundle', 'install', 'bundle install *'],
			['gem', 'install', 'gem install *'],
		];

		// Find matching pattern
		for (const [cmd, sub, pattern] of patterns) {
			if (baseCmd === cmd && (sub === '' || subCmd === sub)) {
				return pattern;
			}
		}

		// Default: return exact command
		return command;
	}

	public async initializeMCPConfig(): Promise<void> {
		try {
			const storagePath = this._context.storageUri?.fsPath;
			if (!storagePath) { return; }

			// Create MCP config directory
			const mcpConfigDir = path.join(storagePath, 'mcp');
			try {
				await vscode.workspace.fs.stat(vscode.Uri.file(mcpConfigDir));
			} catch {
				await vscode.workspace.fs.createDirectory(vscode.Uri.file(mcpConfigDir));
				console.log(`Created MCP config directory at: ${mcpConfigDir}`);
			}

			// Create or update mcp-servers.json with permissions server, preserving existing servers
			const mcpConfigPath = path.join(mcpConfigDir, 'mcp-servers.json');
			const mcpPermissionsPath = this.convertToWSLPath(path.join(this._context.extensionUri.fsPath, 'mcp-permissions.js'));
			const permissionRequestsPath = this.convertToWSLPath(path.join(storagePath, 'permission-requests'));

			// Load existing config or create new one
			let mcpConfig: any = { mcpServers: {} };
			const mcpConfigUri = vscode.Uri.file(mcpConfigPath);

			try {
				const existingContent = await vscode.workspace.fs.readFile(mcpConfigUri);
				mcpConfig = JSON.parse(new TextDecoder().decode(existingContent));
				console.log('Loaded existing MCP config, preserving user servers');
			} catch {
				console.log('No existing MCP config found, creating new one');
			}

			// Ensure mcpServers exists
			if (!mcpConfig.mcpServers) {
				mcpConfig.mcpServers = {};
			}

			// Add or update the permissions server entry
			mcpConfig.mcpServers['claude-code-chat-permissions'] = {
				command: 'node',
				args: [mcpPermissionsPath],
				env: {
					CLAUDE_PERMISSIONS_PATH: permissionRequestsPath
				}
			};

			const configContent = new TextEncoder().encode(JSON.stringify(mcpConfig, null, 2));
			await vscode.workspace.fs.writeFile(mcpConfigUri, configContent);

			console.log(`Updated MCP config at: ${mcpConfigPath}`);
		} catch (error: any) {
			console.error('Failed to initialize MCP config:', error.message);
		}
	}

	public getMCPConfigPath(): string | undefined {
		const storagePath = this._context.storageUri?.fsPath;
		if (!storagePath) { return undefined; }

		const configPath = path.join(storagePath, 'mcp', 'mcp-servers.json');
		return configPath;
	}

	public async loadMCPServers(): Promise<{ [name: string]: any }> {
		try {
			const mcpConfigPath = this.getMCPConfigPath();
			if (!mcpConfigPath) {
				return {};
			}

			const mcpConfigUri = vscode.Uri.file(mcpConfigPath);
			let mcpConfig: any = { mcpServers: {} };

			try {
				const content = await vscode.workspace.fs.readFile(mcpConfigUri);
				mcpConfig = JSON.parse(new TextDecoder().decode(content));
			} catch (error) {
				console.log('MCP config file not found or error reading:', error);
				return {};
			}

			// Filter out internal servers before returning
			const filteredServers = Object.fromEntries(
				Object.entries(mcpConfig.mcpServers || {}).filter(([name]) => name !== 'claude-code-chat-permissions')
			);
			return filteredServers;
		} catch (error) {
			console.error('Error loading MCP servers:', error);
			return {};
		}
	}

	public async saveMCPServer(name: string, config: any): Promise<{ success: boolean; error?: string }> {
		try {
			const mcpConfigPath = this.getMCPConfigPath();
			if (!mcpConfigPath) {
				return { success: false, error: 'Storage path not available' };
			}

			const mcpConfigUri = vscode.Uri.file(mcpConfigPath);
			let mcpConfig: any = { mcpServers: {} };

			// Load existing config
			try {
				const content = await vscode.workspace.fs.readFile(mcpConfigUri);
				mcpConfig = JSON.parse(new TextDecoder().decode(content));
			} catch {
				// File doesn't exist, use default structure
			}

			// Ensure mcpServers exists
			if (!mcpConfig.mcpServers) {
				mcpConfig.mcpServers = {};
			}

			// Add/update the server
			mcpConfig.mcpServers[name] = config;

			// Ensure directory exists
			const mcpDir = vscode.Uri.file(path.dirname(mcpConfigPath));
			try {
				await vscode.workspace.fs.stat(mcpDir);
			} catch {
				await vscode.workspace.fs.createDirectory(mcpDir);
			}

			// Save the config
			const configContent = new TextEncoder().encode(JSON.stringify(mcpConfig, null, 2));
			await vscode.workspace.fs.writeFile(mcpConfigUri, configContent);

			console.log(`Saved MCP server: ${name}`);
			return { success: true };
		} catch (error) {
			console.error('Error saving MCP server:', error);
			return { success: false, error: 'Failed to save MCP server' };
		}
	}

	public async deleteMCPServer(name: string): Promise<{ success: boolean; error?: string }> {
		try {
			const mcpConfigPath = this.getMCPConfigPath();
			if (!mcpConfigPath) {
				return { success: false, error: 'Storage path not available' };
			}

			const mcpConfigUri = vscode.Uri.file(mcpConfigPath);
			let mcpConfig: any = { mcpServers: {} };

			// Load existing config
			try {
				const content = await vscode.workspace.fs.readFile(mcpConfigUri);
				mcpConfig = JSON.parse(new TextDecoder().decode(content));
			} catch {
				return { success: false, error: 'MCP config file not found' };
			}

			// Delete the server
			if (mcpConfig.mcpServers && mcpConfig.mcpServers[name]) {
				delete mcpConfig.mcpServers[name];

				// Save the updated config
				const configContent = new TextEncoder().encode(JSON.stringify(mcpConfig, null, 2));
				await vscode.workspace.fs.writeFile(mcpConfigUri, configContent);

				console.log(`Deleted MCP server: ${name}`);
				return { success: true };
			} else {
				return { success: false, error: `Server '${name}' not found` };
			}
		} catch (error) {
			console.error('Error deleting MCP server:', error);
			return { success: false, error: 'Failed to delete MCP server' };
		}
	}

	private convertToWSLPath(windowsPath: string): string {
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const wslEnabled = config.get<boolean>('wsl.enabled', false);

		if (wslEnabled && windowsPath.match(/^[a-zA-Z]:/)) {
			// Convert C:\Users\... to /mnt/c/Users/...
			return windowsPath.replace(/^([a-zA-Z]):/, '/mnt/$1').toLowerCase().replace(/\\/g, '/');
		}

		return windowsPath;
	}

	public dispose(): void {
		if (this._permissionWatcher) {
			this._permissionWatcher.dispose();
			this._permissionWatcher = undefined;
		}

		while (this._disposables.length) {
			const disposable = this._disposables.pop();
			if (disposable) {
				disposable.dispose();
			}
		}
	}
}