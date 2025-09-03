import * as vscode from 'vscode';
import { WebviewMessage, PermissionRequest } from '../types';
import { BackupService } from '../services/BackupService';
import { ConversationService } from '../services/ConversationService';
import { PermissionService } from '../services/PermissionService';
import { SettingsService } from '../services/SettingsService';
import { FileService } from '../services/FileService';
import { ClaudeProcessService, JsonStreamData } from '../services/ClaudeProcessService';
import getHtml from '../ui';

export class ClaudeChatProvider {
	private _panel: vscode.WebviewPanel | undefined;
	private _webview: vscode.Webview | undefined;
	private _webviewView: vscode.WebviewView | undefined;
	private _disposables: vscode.Disposable[] = [];
	private _messageHandlerDisposable: vscode.Disposable | undefined;
	private _totalCost: number = 0;
	private _totalTokensInput: number = 0;
	private _totalTokensOutput: number = 0;
	private _requestCount: number = 0;
	private _currentSessionId: string | undefined;
	private _isProcessing: boolean = false;
	private _draftMessage: string = '';

	// Services
	private _backupService: BackupService;
	private _conversationService: ConversationService;
	private _permissionService: PermissionService;
	private _settingsService: SettingsService;
	private _fileService: FileService;
	private _claudeProcessService: ClaudeProcessService;

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly _context: vscode.ExtensionContext
	) {
		// Initialize services
		this._backupService = new BackupService(_context);
		this._conversationService = new ConversationService(_context);
		this._permissionService = new PermissionService(_context);
		this._settingsService = new SettingsService(_context);
		this._fileService = new FileService();
		this._claudeProcessService = new ClaudeProcessService();

		// Initialize MCP config and permissions
		this._permissionService.initializeMCPConfig();

		// Set up permission request callback
		this._permissionService.setPermissionRequestCallback((request) => {
			this._handlePermissionRequest(request);
		});

		// Resume session from latest conversation
		const latestConversation = this._conversationService.getLatestConversation();
		this._currentSessionId = latestConversation?.sessionId;
	}

	public get panel(): vscode.WebviewPanel | undefined {
		return this._panel;
	}

	public show(column: vscode.ViewColumn | vscode.Uri = vscode.ViewColumn.Two) {
		// Handle case where a URI is passed instead of ViewColumn
		const actualColumn = column instanceof vscode.Uri ? vscode.ViewColumn.Two : column;

		// Close sidebar if it's open
		this._closeSidebar();

		if (this._panel) {
			this._panel.reveal(actualColumn);
			return;
		}

		this._panel = vscode.window.createWebviewPanel(
			'claudeChat',
			'Claude Code Chat',
			actualColumn,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [this._extensionUri]
			}
		);

		// Set icon for the webview tab using URI path
		const iconPath = vscode.Uri.joinPath(this._extensionUri, 'icon.png');
		this._panel.iconPath = iconPath;

		this._panel.webview.html = this._getHtmlForWebview();

		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		this._setupWebviewMessageHandler(this._panel.webview);

		// Resume session from latest conversation
		const latestConversation = this._conversationService.getLatestConversation();
		this._currentSessionId = latestConversation?.sessionId;

		// Load latest conversation history if available
		if (latestConversation) {
			this._loadConversationHistory(latestConversation.filename);
		}

		// Send ready message immediately
		setTimeout(() => {
			// If no conversation to load, send ready immediately
			if (!latestConversation) {
				this._sendReadyMessage();
			}
		}, 100);
	}

	private _postMessage(message: any) {
		if (this._panel && this._panel.webview) {
			this._panel.webview.postMessage(message);
		} else if (this._webview) {
			this._webview.postMessage(message);
		}
	}

	private _sendReadyMessage() {
		this._postMessage({
			type: 'ready',
			data: this._isProcessing ? 'Claude is working...' : 'Ready to chat with Claude Code! Type your message below.'
		});

		// Send workspace info to webview
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (workspaceFolder) {
			const workspaceName = workspaceFolder.name;
			this._postMessage({
				type: 'workspaceInfo',
				data: { name: workspaceName }
			});
		}

		// Send current model to webview
		this._postMessage({
			type: 'modelSelected',
			model: this._settingsService.selectedModel
		});

		// Send platform information to webview
		this._postMessage({
			type: 'platformInfo',
			data: this._settingsService.getPlatformInfo()
		});

		// Send current settings to webview
		this._postMessage({
			type: 'settingsData',
			data: this._settingsService.getCurrentSettings()
		});

		// Send saved draft message if any
		if (this._draftMessage) {
			this._postMessage({
				type: 'restoreInputText',
				data: this._draftMessage
			});
		}
	}

	private _handleWebviewMessage(message: WebviewMessage) {
		switch (message.type) {
			case 'sendMessage':
				if (message.text) {
					this._sendMessageToClaude(message.text, message.planMode, message.thinkingMode);
				}
				return;
			case 'newSession':
				this._newSession();
				return;
			case 'restoreCommit':
				if (message.data) {
					this._restoreToCommit(message.data);
				}
				return;
			case 'getConversationList':
				this._sendConversationList();
				return;
			case 'getWorkspaceFiles':
				this._sendWorkspaceFiles(message.searchTerm);
				return;
			case 'selectImageFile':
				this._selectImageFile();
				return;
			case 'loadConversation':
				if (message.filename) {
					this.loadConversation(message.filename);
				}
				return;
			case 'stopRequest':
				this._stopClaudeProcess();
				return;
			case 'getSettings':
				this._sendCurrentSettings();
				return;
			case 'updateSettings':
				if (message.settings) {
					this._updateSettings(message.settings);
				}
				return;
			case 'getClipboardText':
				this._getClipboardText();
				return;
			case 'selectModel':
				if (message.model) {
					this._setSelectedModel(message.model);
				}
				return;
			case 'openModelTerminal':
				this._openModelTerminal();
				return;
			case 'executeSlashCommand':
				if (message.command) {
					this._executeSlashCommand(message.command);
				}
				return;
			case 'dismissWSLAlert':
				this._dismissWSLAlert();
				return;
			case 'openFile':
				if (message.filePath) {
					this._openFileInEditor(message.filePath);
				}
				return;
			case 'createImageFile':
				if (message.imageData && message.imageType) {
					this._createImageFile(message.imageData, message.imageType);
				}
				return;
			case 'permissionResponse':
				if (message.id !== undefined && message.approved !== undefined) {
					this._handlePermissionResponse(message.id, message.approved, message.alwaysAllow);
				}
				return;
			case 'getPermissions':
				this._sendPermissions();
				return;
			case 'removePermission':
				if (message.toolName) {
					this._removePermission(message.toolName, message.command || null);
				}
				return;
			case 'addPermission':
				if (message.toolName) {
					this._addPermission(message.toolName, message.command || null);
				}
				return;
			case 'loadMCPServers':
				this._loadMCPServers();
				return;
			case 'saveMCPServer':
				if (message.name && message.config) {
					this._saveMCPServer(message.name, message.config);
				}
				return;
			case 'deleteMCPServer':
				if (message.name) {
					this._deleteMCPServer(message.name);
				}
				return;
			case 'getCustomSnippets':
				this._sendCustomSnippets();
				return;
			case 'saveCustomSnippet':
				if (message.snippet) {
					this._saveCustomSnippet(message.snippet);
				}
				return;
			case 'deleteCustomSnippet':
				if (message.snippetId) {
					this._deleteCustomSnippet(message.snippetId);
				}
				return;
			case 'enableYoloMode':
				this._enableYoloMode();
				return;
			case 'saveInputText':
				if (message.text !== undefined) {
					this._saveInputText(message.text);
				}
				return;
		}
	}

	private _setupWebviewMessageHandler(webview: vscode.Webview) {
		// Dispose of any existing message handler
		if (this._messageHandlerDisposable) {
			this._messageHandlerDisposable.dispose();
		}

		// Set up new message handler
		this._messageHandlerDisposable = webview.onDidReceiveMessage(
			message => this._handleWebviewMessage(message),
			null,
			this._disposables
		);
	}

	private _closeSidebar() {
		if (this._webviewView) {
			// Switch VS Code to show Explorer view instead of chat sidebar
			vscode.commands.executeCommand('workbench.view.explorer');
		}
	}

	public showInWebview(webview: vscode.Webview, webviewView?: vscode.WebviewView) {
		// Close main panel if it's open
		if (this._panel) {
			console.log('Closing main panel because sidebar is opening');
			this._panel.dispose();
			this._panel = undefined;
		}

		this._webview = webview;
		this._webviewView = webviewView;
		this._webview.html = this._getHtmlForWebview();

		this._setupWebviewMessageHandler(this._webview);

		// Initialize the webview
		this._initializeWebview();
	}

	private _initializeWebview() {
		// Resume session from latest conversation
		const latestConversation = this._conversationService.getLatestConversation();
		this._currentSessionId = latestConversation?.sessionId;

		// Load latest conversation history if available
		if (latestConversation) {
			this._loadConversationHistory(latestConversation.filename);
		} else {
			// If no conversation to load, send ready immediately
			setTimeout(() => {
				this._sendReadyMessage();
			}, 100);
		}
	}

	public reinitializeWebview() {
		// Only reinitialize if we have a webview (sidebar)
		if (this._webview) {
			this._initializeWebview();
			// Set up message handler for the webview
			this._setupWebviewMessageHandler(this._webview);
		}
	}

	private async _sendMessageToClaude(message: string, planMode?: boolean, thinkingMode?: boolean) {
		// Get thinking intensity setting
		const configThink = vscode.workspace.getConfiguration('claudeCodeChat');
		const thinkingIntensity = configThink.get<string>('thinking.intensity', 'think');

		// Prepend mode instructions if enabled
		let actualMessage = message;
		if (planMode) {
			actualMessage = 'PLAN FIRST FOR THIS MESSAGE ONLY: Plan first before making any changes. Show me in detail what you will change and wait for my explicit approval in a separate message before proceeding. Do not implement anything until I confirm. This planning requirement applies ONLY to this current message. \n\n' + message;
		}
		if (thinkingMode) {
			let thinkingPrompt = '';
			const thinkingMesssage = ' THROUGH THIS STEP BY STEP: \n';
			switch (thinkingIntensity) {
				case 'think':
					thinkingPrompt = 'THINK';
					break;
				case 'think-hard':
					thinkingPrompt = 'THINK HARD';
					break;
				case 'think-harder':
					thinkingPrompt = 'THINK HARDER';
					break;
				case 'ultrathink':
					thinkingPrompt = 'ULTRATHINK';
					break;
				default:
					thinkingPrompt = 'THINK';
			}
			actualMessage = thinkingPrompt + thinkingMesssage + actualMessage;
		}

		this._isProcessing = true;

		// Clear draft message since we're sending it
		this._draftMessage = '';

		// Show original user input in chat and save to conversation (without mode prefixes)
		this._sendAndSaveMessage({
			type: 'userInput',
			data: message
		});

		// Set processing state to true
		this._postMessage({
			type: 'setProcessing',
			data: { isProcessing: true }
		});

		// Create backup commit before Claude makes changes
		try {
			const commitInfo = await this._backupService.createBackupCommit(message);
			if (commitInfo) {
				this._sendAndSaveMessage({
					type: 'showRestoreOption',
					data: commitInfo
				});
			}
		} catch (e) {
			console.log("error", e);
		}

		// Show loading indicator
		this._postMessage({
			type: 'loading',
			data: 'Claude is working...'
		});

		// Get configuration
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const yoloMode = config.get<boolean>('permissions.yoloMode', false);
		const wslEnabled = config.get<boolean>('wsl.enabled', false);
		const wslDistro = config.get<string>('wsl.distro', 'Ubuntu');
		const nodePath = config.get<string>('wsl.nodePath', '/usr/bin/node');
		const claudePath = config.get<string>('wsl.claudePath', '/usr/local/bin/claude');

		// Start Claude process
		this._claudeProcessService.startClaudeProcess(
			{
				message: actualMessage,
				sessionId: this._currentSessionId,
				selectedModel: this._settingsService.selectedModel,
				yoloMode,
				mcpConfigPath: this._permissionService.getMCPConfigPath(),
				wslConfig: wslEnabled ? {
					enabled: wslEnabled,
					distro: wslDistro,
					nodePath,
					claudePath
				} : undefined
			},
			(data: JsonStreamData) => this._processJsonStreamData(data),
			(code: number | null, errorOutput: string) => this._handleProcessClose(code, errorOutput),
			(error: Error) => this._handleProcessError(error)
		);
	}

	private _processJsonStreamData(jsonData: JsonStreamData) {
		switch (jsonData.type) {
			case 'system':
				if (jsonData.subtype === 'init') {
					// System initialization message - session ID will be captured from final result
					console.log('System initialized');
					this._currentSessionId = jsonData.session_id;

					// Show session info in UI
					this._sendAndSaveMessage({
						type: 'sessionInfo',
						data: {
							sessionId: jsonData.session_id,
							tools: jsonData.tools || [],
							mcpServers: jsonData.mcp_servers || []
						}
					});
				}
				break;

			case 'assistant':
				if (jsonData.message && jsonData.message.content) {
					// Track token usage in real-time if available
					if (jsonData.message.usage) {
						this._totalTokensInput += jsonData.message.usage.input_tokens || 0;
						this._totalTokensOutput += jsonData.message.usage.output_tokens || 0;

						// Send real-time token update to webview
						this._sendAndSaveMessage({
							type: 'updateTokens',
							data: {
								totalTokensInput: this._totalTokensInput,
								totalTokensOutput: this._totalTokensOutput,
								currentInputTokens: jsonData.message.usage.input_tokens || 0,
								currentOutputTokens: jsonData.message.usage.output_tokens || 0,
								cacheCreationTokens: jsonData.message.usage.cache_creation_input_tokens || 0,
								cacheReadTokens: jsonData.message.usage.cache_read_input_tokens || 0
							}
						});
					}

					// Process each content item in the assistant message
					for (const content of jsonData.message.content) {
						if (content.type === 'text' && content.text.trim()) {
							// Show text content and save to conversation
							this._sendAndSaveMessage({
								type: 'output',
								data: content.text.trim()
							});
						} else if (content.type === 'thinking' && content.thinking.trim()) {
							// Show thinking content and save to conversation
							this._sendAndSaveMessage({
								type: 'thinking',
								data: content.thinking.trim()
							});
						} else if (content.type === 'tool_use') {
							// Prepare tool execution information with better formatting
							let toolInfo = `🔧 Executing: ${content.name}`;
							
							// For file-related tools, show just the filename in the header
							if (content.input && content.input.file_path) {
								const filePath = content.input.file_path;
								const fileName = filePath.split(/[/\\]/).pop();
								toolInfo = `${content.name} ${fileName}`;
							}
							
							let toolInput = '';

							if (content.input) {
								// Special formatting for TodoWrite to make it more readable
								if (content.name === 'TodoWrite' && content.input.todos) {
									toolInput = '';
									for (let i = 0; i < content.input.todos.length; i++) {
										const todo = content.input.todos[i];
										const status = todo.status === 'completed' ? '✓' :
											todo.status === 'in_progress' ? '◌' : '○';
										const strikethrough = todo.status === 'completed' ? '~~' : '';
										const prefix = i > 0 ? '\n' : '';
										toolInput += `${prefix}${status} ${strikethrough}${todo.content}${strikethrough}${todo.priority ? ` (priority: ${todo.priority})` : ''}`;
									}
								} else {
									// Send raw input to UI for formatting
									toolInput = '';
								}
							}

							// Show tool use immediately - permission will be requested separately if needed
							const toolUseData = {
								toolInfo: toolInfo,
								toolInput: toolInput,
								rawInput: content.input,
								toolName: content.name,
								toolUseId: content.id,
								filePath: content.input && content.input.file_path ? content.input.file_path : null
							};
							
							this._sendAndSaveMessage({
								type: 'toolUse',
								data: toolUseData
							});
						}
					}
				}
				break;

			case 'user':
				if (jsonData.message && jsonData.message.content) {
					// Process tool results from user messages
					for (const content of jsonData.message.content) {
						if (content.type === 'tool_result') {
							let resultContent = content.content || 'Tool executed successfully';

							// Stringify if content is an object or array
							if (typeof resultContent === 'object' && resultContent !== null) {
								resultContent = JSON.stringify(resultContent, null, 2);
							}

							const isError = content.is_error || false;

							// Find the last tool use to get the tool name
							const lastToolUse = this._conversationService.currentConversation[this._conversationService.currentConversation.length - 1];
							const toolName = lastToolUse?.data?.toolName;

							// Don't send tool result for Read and Edit tools unless there's an error
							if ((toolName === 'Read' || toolName === 'Edit' || toolName === 'TodoWrite' || toolName === 'MultiEdit') && !isError) {
								// Still send to UI to hide loading state, but mark it as hidden
								this._sendAndSaveMessage({
									type: 'toolResult',
									data: {
										content: resultContent,
										isError: isError,
										toolUseId: content.tool_use_id,
										toolName: toolName,
										hidden: true
									}
								});
							} else {
								// Show tool result and save to conversation
								this._sendAndSaveMessage({
									type: 'toolResult',
									data: {
										content: resultContent,
										isError: isError,
										toolUseId: content.tool_use_id,
										toolName: toolName
									}
								});
							}
						}
					}
				}
				break;

			case 'result':
				if (jsonData.subtype === 'success') {
					// Check for login errors
					if (jsonData.is_error && jsonData.result && jsonData.result.includes('Invalid API key')) {
						this._handleLoginRequired();
						return;
					}

					this._isProcessing = false;

					// Capture session ID from final result
					if (jsonData.session_id) {
						const isNewSession = !this._currentSessionId;
						const sessionChanged = this._currentSessionId && this._currentSessionId !== jsonData.session_id;

						console.log('Session ID found in result:', {
							sessionId: jsonData.session_id,
							isNewSession,
							sessionChanged,
							currentSessionId: this._currentSessionId
						});

						this._currentSessionId = jsonData.session_id;

						// Show session info in UI
						this._sendAndSaveMessage({
							type: 'sessionInfo',
							data: {
								sessionId: jsonData.session_id,
								tools: jsonData.tools || [],
								mcpServers: jsonData.mcp_servers || []
							}
						});
					}

					// Clear processing state
					this._postMessage({
						type: 'setProcessing',
						data: { isProcessing: false }
					});

					// Update cumulative tracking
					this._requestCount++;
					if (jsonData.total_cost_usd) {
						this._totalCost += jsonData.total_cost_usd;
					}

					console.log('Result received:', {
						cost: jsonData.total_cost_usd,
						duration: jsonData.duration_ms,
						turns: jsonData.num_turns
					});

					// Send updated totals to webview
					this._postMessage({
						type: 'updateTotals',
						data: {
							totalCost: this._totalCost,
							totalTokensInput: this._totalTokensInput,
							totalTokensOutput: this._totalTokensOutput,
							requestCount: this._requestCount,
							currentCost: jsonData.total_cost_usd,
							currentDuration: jsonData.duration_ms,
							currentTurns: jsonData.num_turns
						}
					});
				}
				break;
		}
	}

	private _handleProcessClose(code: number | null, errorOutput: string) {
		// Clear loading indicator and set processing to false
		this._postMessage({
			type: 'clearLoading'
		});

		// Reset processing state
		this._isProcessing = false;

		// Clear processing state
		this._postMessage({
			type: 'setProcessing',
			data: { isProcessing: false }
		});

		if (code !== 0 && errorOutput.trim()) {
			// Error with output
			this._sendAndSaveMessage({
				type: 'error',
				data: errorOutput.trim()
			});
		}
	}

	private _handleProcessError(error: Error) {
		this._postMessage({
			type: 'clearLoading'
		});

		this._isProcessing = false;

		// Clear processing state
		this._postMessage({
			type: 'setProcessing',
			data: { isProcessing: false }
		});

		// Check if claude command is not installed
		if (error.message.includes('ENOENT') || error.message.includes('command not found')) {
			this._sendAndSaveMessage({
				type: 'error',
				data: 'Install claude code first: https://www.anthropic.com/claude-code'
			});
		} else {
			this._sendAndSaveMessage({
				type: 'error',
				data: `Error running Claude: ${error.message}`
			});
		}
	}

	private _newSession() {
		this._isProcessing = false;

		// Update UI state
		this._postMessage({
			type: 'setProcessing',
			data: { isProcessing: false }
		});

		// Stop any running process
		this._claudeProcessService.stopClaudeProcess();

		// Clear current session
		this._currentSessionId = undefined;

		// Clear services state
		this._backupService.clearCommits();
		this._conversationService.clearConversation();

		// Reset counters
		this._totalCost = 0;
		this._totalTokensInput = 0;
		this._totalTokensOutput = 0;
		this._requestCount = 0;

		// Notify webview to clear all messages and reset session
		this._postMessage({
			type: 'sessionCleared'
		});
	}

	public newSessionOnConfigChange() {
		// Reinitialize MCP config with new WSL paths
		this._permissionService.initializeMCPConfig();

		// Start a new session due to configuration change
		this._newSession();

		// Show notification to user
		vscode.window.showInformationMessage(
			'WSL configuration changed. Started a new Claude session.',
			'OK'
		);

		// Send message to webview about the config change
		this._sendAndSaveMessage({
			type: 'configChanged',
			data: '⚙️ WSL configuration changed. Started a new session.'
		});
	}

	private _handleLoginRequired() {
		this._isProcessing = false;

		// Clear processing state
		this._postMessage({
			type: 'setProcessing',
			data: { isProcessing: false }
		});

		// Show login required message
		this._postMessage({
			type: 'loginRequired'
		});

		// Get configuration to check if WSL is enabled
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const wslEnabled = config.get<boolean>('wsl.enabled', false);
		const wslDistro = config.get<string>('wsl.distro', 'Ubuntu');
		const nodePath = config.get<string>('wsl.nodePath', '/usr/bin/node');
		const claudePath = config.get<string>('wsl.claudePath', '/usr/local/bin/claude');

		// Open terminal and run claude login
		const terminal = vscode.window.createTerminal('Claude Login');
		if (wslEnabled) {
			terminal.sendText(`wsl -d ${wslDistro} ${nodePath} --no-warnings --enable-source-maps ${claudePath}`);
		} else {
			terminal.sendText('claude');
		}
		terminal.show();

		// Show info message
		vscode.window.showInformationMessage(
			'Please login to Claude in the terminal, then come back to this chat to continue.',
			'OK'
		);

		// Send message to UI about terminal
		this._postMessage({
			type: 'terminalOpened',
			data: `Please login to Claude in the terminal, then come back to this chat to continue.`,
		});
	}

	private _sendAndSaveMessage(message: { type: string, data: any }): void {
		// Send to UI
		this._postMessage(message);

		// Save to conversation
		this._conversationService.addMessage(message);

		// Save conversation with current metadata
		if (this._currentSessionId) {
			this._conversationService.saveConversationWithMetadata(
				this._currentSessionId,
				this._totalCost,
				this._totalTokensInput,
				this._totalTokensOutput
			);
		}
	}

	public async loadConversation(filename: string): Promise<void> {
		await this._loadConversationHistory(filename);
	}

	private async _loadConversationHistory(filename: string): Promise<void> {
		console.log("_loadConversationHistory");

		const conversationData = await this._conversationService.loadConversation(filename);
		if (!conversationData) { return; }

		// Load conversation metadata
		this._totalCost = conversationData.totalCost || 0;
		this._totalTokensInput = conversationData.totalTokens?.input || 0;
		this._totalTokensOutput = conversationData.totalTokens?.output || 0;

		// Clear UI messages first, then send all messages to recreate the conversation
		setTimeout(() => {
			// Clear existing messages
			this._postMessage({
				type: 'sessionCleared'
			});

			let requestStartTime: number;

			// Small delay to ensure messages are cleared before loading new ones
			setTimeout(() => {
				const messages = this._conversationService.currentConversation;
				for (let i = 0; i < messages.length; i++) {

					const message = messages[i];

					if (message.messageType === 'permissionRequest') {
						const isLast = i === messages.length - 1;
						if (!isLast) {
							continue;
						}
					}

					this._postMessage({
						type: message.messageType,
						data: message.data
					});
					if (message.messageType === 'userInput') {
						try {
							requestStartTime = new Date(message.timestamp).getTime();
						} catch (e) {
							console.log(e);
						}
					}
				}

				// Send updated totals
				this._postMessage({
					type: 'updateTotals',
					data: {
						totalCost: this._totalCost,
						totalTokensInput: this._totalTokensInput,
						totalTokensOutput: this._totalTokensOutput,
						requestCount: this._requestCount
					}
				});

				// Restore processing state if the conversation was saved while processing
				if (this._isProcessing) {
					this._postMessage({
						type: 'setProcessing',
						data: { isProcessing: this._isProcessing, requestStartTime }
					});
				}
				// Send ready message after conversation is loaded
				this._sendReadyMessage();
			}, 50);
		}, 100); // Small delay to ensure webview is ready

		console.log(`Loaded conversation history: ${filename}`);
	}

	private _sendConversationList(): void {
		this._postMessage({
			type: 'conversationList',
			data: this._conversationService.conversationIndex
		});
	}

	private async _sendWorkspaceFiles(searchTerm?: string): Promise<void> {
		const files = await this._fileService.getWorkspaceFiles(searchTerm);
		this._postMessage({
			type: 'workspaceFiles',
			data: files
		});
	}

	private async _selectImageFile(): Promise<void> {
		const filePaths = await this._fileService.selectImageFiles();
		filePaths.forEach(filePath => {
			this._postMessage({
				type: 'imagePath',
				path: filePath
			});
		});
	}

	private _stopClaudeProcess(): void {
		const stopped = this._claudeProcessService.stopClaudeProcess();
		
		this._isProcessing = false;

		// Update UI state
		this._postMessage({
			type: 'setProcessing',
			data: { isProcessing: false }
		});

		if (stopped) {
			this._postMessage({
				type: 'clearLoading'
			});

			// Send stop confirmation message directly to UI and save
			this._sendAndSaveMessage({
				type: 'error',
				data: '⏹️ Claude code was stopped.'
			});
		}
	}

	private _sendCurrentSettings(): void {
		this._postMessage({
			type: 'settingsData',
			data: this._settingsService.getCurrentSettings()
		});
	}

	private async _updateSettings(settings: { [key: string]: any }): Promise<void> {
		await this._settingsService.updateSettings(settings);
	}

	private async _getClipboardText(): Promise<void> {
		const text = await this._fileService.getClipboardText();
		this._postMessage({
			type: 'clipboardText',
			data: text
		});
	}

	private _setSelectedModel(model: string): void {
		this._settingsService.setSelectedModel(model);
	}

	private _openModelTerminal(): void {
		this._settingsService.openModelTerminal(this._currentSessionId);
		this._postMessage({
			type: 'terminalOpened',
			data: 'Check the terminal to update your default model configuration. Come back to this chat here after making changes.'
		});
	}

	private _executeSlashCommand(command: string): void {
		this._settingsService.executeSlashCommand(command, this._currentSessionId);
		this._postMessage({
			type: 'terminalOpened',
			data: `Executing /${command} command in terminal. Check the terminal output and return when ready.`,
		});
	}

	private _dismissWSLAlert() {
		this._settingsService.dismissWSLAlert();
	}

	private async _openFileInEditor(filePath: string) {
		await this._fileService.openFileInEditor(filePath);
	}

	private async _createImageFile(imageData: string, imageType: string) {
		const filePath = await this._fileService.createImageFile(imageData, imageType);
		if (filePath) {
			this._postMessage({
				type: 'imagePath',
				data: {
					filePath: filePath
				}
			});
		}
	}

	private _handlePermissionRequest(request: PermissionRequest): void {
		// Generate pattern for Bash commands
		let pattern: string | undefined;
		if (request.tool === 'Bash' && request.input?.command) {
			pattern = this._permissionService.getCommandPattern(request.input.command);
		}

		// Send permission request to webview to show permission dialog in tool card
		this._sendAndSaveMessage({
			type: 'permissionRequest',
			data: {
				id: request.id,
				tool: request.tool,
				input: request.input,
				pattern: pattern,
				timestamp: request.timestamp
			}
		});
	}

	private _handlePermissionResponse(id: string, approved: boolean, alwaysAllow?: boolean): void {
		this._permissionService.resolvePermissionRequest(id, approved);

		// Send permission response to UI to update tool use card state
		this._sendAndSaveMessage({
			type: 'permissionResponse',
			data: {
				id: id,
				approved: approved,
				alwaysAllow: alwaysAllow
			}
		});

		// Handle always allow setting
		if (alwaysAllow && approved) {
			void this._permissionService.saveAlwaysAllowPermission(id);
		}
	}

	private async _sendPermissions(): Promise<void> {
		const permissions = await this._permissionService.getPermissions();
		this._postMessage({
			type: 'permissionsData',
			data: permissions
		});
	}

	private async _removePermission(toolName: string, command: string | null): Promise<void> {
		await this._permissionService.removePermission(toolName, command);
		this._sendPermissions();
	}

	private async _addPermission(toolName: string, command: string | null): Promise<void> {
		await this._permissionService.addPermission(toolName, command);
		this._sendPermissions();
	}

	private async _loadMCPServers(): Promise<void> {
		const servers = await this._permissionService.loadMCPServers();
		this._postMessage({ type: 'mcpServers', data: servers });
	}

	private async _saveMCPServer(name: string, config: any): Promise<void> {
		const result = await this._permissionService.saveMCPServer(name, config);
		if (result.success) {
			this._postMessage({ type: 'mcpServerSaved', data: { name } });
		} else {
			this._postMessage({ type: 'mcpServerError', data: { error: result.error } });
		}
	}

	private async _deleteMCPServer(name: string): Promise<void> {
		const result = await this._permissionService.deleteMCPServer(name);
		if (result.success) {
			this._postMessage({ type: 'mcpServerDeleted', data: { name } });
		} else {
			this._postMessage({ type: 'mcpServerError', data: { error: result.error } });
		}
	}

	private _sendCustomSnippets(): void {
		const snippets = this._settingsService.getCustomSnippets();
		this._postMessage({
			type: 'customSnippetsData',
			data: snippets
		});
	}

	private async _saveCustomSnippet(snippet: any): Promise<void> {
		try {
			await this._settingsService.saveCustomSnippet(snippet);
			this._postMessage({
				type: 'customSnippetSaved',
				data: { snippet }
			});
		} catch (error) {
			this._postMessage({
				type: 'error',
				data: 'Failed to save custom snippet'
			});
		}
	}

	private async _deleteCustomSnippet(snippetId: string): Promise<void> {
		try {
			await this._settingsService.deleteCustomSnippet(snippetId);
			this._postMessage({
				type: 'customSnippetDeleted',
				data: { snippetId }
			});
		} catch (error) {
			this._postMessage({
				type: 'error',
				data: 'Failed to delete custom snippet'
			});
		}
	}

	private async _enableYoloMode(): Promise<void> {
		await this._settingsService.enableYoloMode();
		this._sendCurrentSettings();
	}

	private _saveInputText(text: string): void {
		this._draftMessage = text || '';
	}

	private async _restoreToCommit(commitSha: string): Promise<void> {
		const result = await this._backupService.restoreToCommit(commitSha);
		if (result.success) {
			this._sendAndSaveMessage({
				type: 'restoreSuccess',
				data: {
					message: result.message,
					commitSha: commitSha
				}
			});
		} else {
			this._postMessage({
				type: 'restoreError',
				data: result.message
			});
		}
	}

	private _getHtmlForWebview(): string {
		return getHtml(vscode.env?.isTelemetryEnabled);
	}

	public dispose() {
		if (this._panel) {
			this._panel.dispose();
			this._panel = undefined;
		}

		// Dispose message handler if it exists
		if (this._messageHandlerDisposable) {
			this._messageHandlerDisposable.dispose();
			this._messageHandlerDisposable = undefined;
		}

		// Dispose services
		this._permissionService.dispose();

		while (this._disposables.length) {
			const disposable = this._disposables.pop();
			if (disposable) {
				disposable.dispose();
			}
		}
	}
}