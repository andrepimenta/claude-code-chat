import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as util from 'util';
import * as path from 'path';
import getHtml from './ui';
import { startRouter, stopRouter, setModelConfig, setBaseUrl } from './router';
import { fetchAndResolveModels } from './model-updater';
import recommendedModels from './recommended-models.json';

// OpenCredits environment configuration
let OPENCREDITS_API_URL = 'https://ccc.api.opencredits.ai';
let OPENCREDITS_WEB_URL = 'https://ccc.opencredits.ai';
let OPENCREDITS_PUBLISHABLE_KEY = 'oc_pk_c43da4f9a9484ae484ad29bc97cc354f';

const exec = util.promisify(cp.exec);

// Storage for diff content (used by DiffContentProvider)
const diffContentStore = new Map<string, string>();

// Custom TextDocumentContentProvider for read-only diff views
class DiffContentProvider implements vscode.TextDocumentContentProvider {
	provideTextDocumentContent(uri: vscode.Uri): string {
		const content = diffContentStore.get(uri.path);
		return content || '';
	}
}

export function activate(context: vscode.ExtensionContext) {

	if (context.extensionMode === vscode.ExtensionMode.Development) {
		OPENCREDITS_API_URL = 'http://localhost:8787';
		OPENCREDITS_WEB_URL = 'http://localhost:3000';
		OPENCREDITS_PUBLISHABLE_KEY = 'oc_pk_c78315e9ff3a425ebca398bb69282429';
	}
	const provider = new ClaudeChatProvider(context.extensionUri, context);

	const disposable = vscode.commands.registerCommand('claude-code-chat.openChat', (column?: vscode.ViewColumn) => {
		provider.show(column);
	});

	const loadConversationDisposable = vscode.commands.registerCommand('claude-code-chat.loadConversation', (filename: string) => {
		provider.loadConversation(filename);
	});

	// Register webview view provider for sidebar chat (using shared provider instance)
	const webviewProvider = new ClaudeChatWebviewProvider(context.extensionUri, provider);
	vscode.window.registerWebviewViewProvider('claude-code-chat.chat', webviewProvider);

	// Register custom content provider for read-only diff views
	const diffProvider = new DiffContentProvider();
	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('claude-diff', diffProvider));

	// Listen for configuration changes
	const configChangeDisposable = vscode.workspace.onDidChangeConfiguration(event => {
		if (event.affectsConfiguration('claudeCodeChat.wsl')) {
			provider.newSessionOnConfigChange();
		}
	});

	// Create status bar item
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusBarItem.text = "Claude";
	statusBarItem.tooltip = "Open Claude Code Chat (Ctrl+Shift+C)";
	statusBarItem.command = 'claude-code-chat.openChat';
	statusBarItem.show();

	// Register URI handler for deep links (e.g., OpenCredits key callback)
	const uriHandler = vscode.window.registerUriHandler({
		async handleUri(uri: vscode.Uri) {

			// Handle OpenCredits key callback: vscode://AndrePimenta.claude-code-chat/opencredits-key?key=xxx
			if (uri.path === '/opencredits-key') {
				const params = new URLSearchParams(uri.query);
				const key = params.get('key');

				if (key) {
					// Save the key and OpenCredits env vars
					const config = vscode.workspace.getConfiguration('claudeCodeChat');
					const envVars = config.get<Record<string, string>>('environment.variables', {});
					envVars['ANTHROPIC_AUTH_TOKEN'] = key;
					envVars['ANTHROPIC_BASE_URL'] = OPENCREDITS_API_URL;

					await config.update('environment.variables', envVars, vscode.ConfigurationTarget.Global);

					// Handle pending model activation after payment
					await provider.handleOpenCreditsKeyReceived(key);

					// Show success message
					vscode.window.showInformationMessage('OpenCredits account connected! You can now use Claude Code Chat.', 'Open Chat').then(selection => {
						if (selection === 'Open Chat') {
							provider.show();
						}
					});
				}
			}
		}
	});

	context.subscriptions.push(disposable, loadConversationDisposable, configChangeDisposable, statusBarItem, uriHandler);
}

export function deactivate() {
	// Stop the local router when the extension is deactivated
	stopRouter().catch(err => console.error('Failed to stop router:', err));
}

interface ConversationData {
	sessionId: string;
	startTime: string | undefined;
	endTime: string;
	messageCount: number;
	totalCost: number;
	totalTokens: {
		input: number;
		output: number;
	};
	messages: Array<{ timestamp: string, messageType: string, data: any }>;
	filename: string;
}

class ClaudeChatWebviewProvider implements vscode.WebviewViewProvider {
	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly _chatProvider: ClaudeChatProvider
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri]
		};

		// Use the shared chat provider instance for the sidebar
		this._chatProvider.showInWebview(webviewView.webview, webviewView);

		// Handle visibility changes to reinitialize when sidebar reopens
		webviewView.onDidChangeVisibility(() => {
			if (webviewView.visible) {
				// Close main panel when sidebar becomes visible
				if (this._chatProvider._panel) {
					this._chatProvider._panel.dispose();
					this._chatProvider._panel = undefined;
				}
				this._chatProvider.reinitializeWebview();
			}
		});
	}
}


class ClaudeChatProvider {
	public _panel: vscode.WebviewPanel | undefined;
	private _webview: vscode.Webview | undefined;
	private _webviewView: vscode.WebviewView | undefined;
	private _disposables: vscode.Disposable[] = [];
	private _messageHandlerDisposable: vscode.Disposable | undefined;
	private _totalCost: number = 0;
	private _totalTokensInput: number = 0;
	private _totalTokensOutput: number = 0;
	private _requestCount: number = 0;
	private _subscriptionType: string | undefined;  // 'pro', 'max', or undefined for API users
	private _accountInfoFetchedThisSession: boolean = false;  // Track if we fetched account info this session
	private _pendingModelAfterPayment: string | null = null;
	private _currentSessionId: string | undefined;
	private _backupRepoPath: string | undefined;
	private _commits: Array<{ id: string, sha: string, message: string, timestamp: string }> = [];
	private _conversationsPath: string | undefined;
	// Pending permission requests from stdio control_request messages
	private _pendingPermissionRequests: Map<string, {
		requestId: string;
		toolName: string;
		input: Record<string, unknown>;
		suggestions?: any[];
		toolUseId: string;
	}> = new Map();
	private _currentConversation: Array<{ timestamp: string, messageType: string, data: any }> = [];
	private _conversationStartTime: string | undefined;
	private _conversationIndex: Array<{
		filename: string,
		sessionId: string,
		startTime: string,
		endTime: string,
		messageCount: number,
		totalCost: number,
		firstUserMessage: string,
		lastUserMessage: string
	}> = [];
	private _currentClaudeProcess: cp.ChildProcess | undefined;
	private _abortController: AbortController | undefined;
	private _isWslProcess: boolean = false;
	private _wslDistro: string = 'Ubuntu';
	private _selectedModel: string = 'default'; // Default model
	private _isProcessing: boolean | undefined;
	private _draftMessage: string = '';

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly _context: vscode.ExtensionContext
	) {

		// Initialize backup repository and conversations
		this._initializeBackupRepo();
		this._initializeConversations();

		// Load conversation index from workspace state
		this._conversationIndex = this._context.workspaceState.get('claude.conversationIndex', []);

		// Load saved model preference
		this._selectedModel = this._context.workspaceState.get('claude.selectedModel', 'default');

		// Load cached subscription type (will be refreshed on first message)
		this._subscriptionType = this._context.globalState.get('claude.subscriptionType');

		// Resume session from latest conversation
		const latestConversation = this._getLatestConversation();
		this._currentSessionId = latestConversation?.sessionId;
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
		const iconPath = vscode.Uri.joinPath(this._extensionUri, 'icon-bubble.png');
		this._panel.iconPath = iconPath;

		this._panel.webview.html = this._getHtmlForWebview();

		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		this._setupWebviewMessageHandler(this._panel.webview);
		this._initializePermissions();

		// Resume session from latest conversation
		const latestConversation = this._getLatestConversation();
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

	// Get the OpenCredits API key from environment variables
	private _getOpenCreditsKey(): string {
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const envVars = config.get<Record<string, string>>('environment.variables', {});
		return envVars['ANTHROPIC_AUTH_TOKEN'] || '';
	}

	// Check if the configured base URL points to OpenCredits
	private _isOpenCredits(): boolean {
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		if (config.get<boolean>('environment.disabled', false)) {
			return false;
		}
		const envVars = config.get<Record<string, string>>('environment.variables', {});
		const baseUrl = envVars['ANTHROPIC_BASE_URL'] || '';
		return baseUrl.includes('opencredits.ai') || baseUrl.includes('localhost:8787');
	}

	private async _setEnvsDisabled(disabled: boolean): Promise<void> {
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		await config.update('environment.disabled', disabled, vscode.ConfigurationTarget.Global);
		this._sendCurrentSettings();

		if (!disabled && (this._isOpenCredits() || this._getOpenCreditsKey())) {
			this._sendOpenCreditsBalance();
		} else if (disabled) {
			this._postMessage({ type: 'opencreditsBalance', balance: null });
		}
	}

	private static readonly OC_KEY_SECRET = 'opencredits.userKey';

	private async _saveOpenCreditsKey(key: string) {
		await this._context.secrets.store(ClaudeChatProvider.OC_KEY_SECRET, key);
	}

	private async _getSavedOpenCreditsKey(): Promise<string | null> {
		return await this._context.secrets.get(ClaudeChatProvider.OC_KEY_SECRET) || null;
	}

	public async handleOpenCreditsKeyReceived(key: string) {
		// Persist key in encrypted storage
		await this._saveOpenCreditsKey(key);

		this._postMessage({
			type: 'opencreditsKeyReceived',
			key: key
		});

		if (this._pendingModelAfterPayment) {
			const pendingModel = this._pendingModelAfterPayment;
			this._pendingModelAfterPayment = null;

			try {
				this._updateLocalRouterModel(pendingModel);
				this._selectedModel = pendingModel;
				this._context.workspaceState.update('claude.selectedModel', pendingModel);
				await this._setModelEnvVars(pendingModel);

				const balance = await this._fetchOpenCreditsBalance();

				this._postMessage({
					type: 'opencreditsActivated',
					model: pendingModel,
					balance: balance
				});

			} catch (error) {
				console.error('Failed to activate model after payment:', error);
			}
		} else {
			await this._sendOpenCreditsBalance();
		}

		this._sendCurrentSettings();
	}

	private _postMessage(message: any) {
		if (this._panel && this._panel.webview) {
			this._panel.webview.postMessage(message);
		} else if (this._webview) {
			this._webview.postMessage(message);
		}
	}

	private async _getImageDataUri(filePath: string): Promise<string | undefined> {
		try {
			const imageData = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
			const base64 = Buffer.from(imageData).toString('base64');
			const ext = path.extname(filePath).toLowerCase();
			return `data:${ClaudeChatProvider.IMAGE_MEDIA_TYPES[ext] || 'image/png'};base64,${base64}`;
		} catch {
			return undefined;
		}
	}

	private _sendReadyMessage() {
		// Send current session info if available
		/*if (this._currentSessionId) {
			this._postMessage({
				type: 'sessionResumed',
				data: {
					sessionId: this._currentSessionId
				}
			});
		}*/

		this._postMessage({
			type: 'ready',
			data: this._isProcessing ? 'Claude is working...' : 'Ready to chat with Claude Code! Type your message below.'
		});

		// Send current model to webview
		this._postMessage({
			type: 'modelSelected',
			model: this._selectedModel
		});

		// Send cached subscription type to webview (will be refreshed on first message)
		if (this._subscriptionType) {
			this._postMessage({
				type: 'accountInfo',
				data: {
					subscriptionType: this._subscriptionType
				}
			});
		}

		// Send platform information to webview
		this._sendPlatformInfo();

		// Send current settings to webview
		this._sendCurrentSettings();

		// Fetch and send OpenCredits balance if using OpenCredits
		if (this._isOpenCredits() || this._getOpenCreditsKey()) {
			this._sendOpenCreditsBalance();
		}

		// Send saved draft message if any
		if (this._draftMessage) {
			this._postMessage({
				type: 'restoreInputText',
				data: this._draftMessage
			});
		}
	}

	private async _handleWebviewMessage(message: any) {
		switch (message.type) {
			case 'sendMessage':
				this._sendMessageToClaude(message.text, message.planMode, message.thinkingMode, message.images);
				return;
			case 'newSession':
				this._newSession();
				return;
			case 'restoreCommit':
				this._restoreToCommit(message.commitSha);
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
				this.loadConversation(message.filename);
				return;
			case 'stopRequest':
				this._stopClaudeProcess();
				return;
			case 'getSettings':
				this._sendCurrentSettings();
				return;
			case 'getEnvVars': {
				const evConfig = vscode.workspace.getConfiguration('claudeCodeChat');
				const evVars = evConfig.get<Record<string, string>>('environment.variables', {});
				this._postMessage({ type: 'envVarsData', data: evVars });
				return;
			}
			case 'setEnvsDisabled':
				await this._setEnvsDisabled(!!message.disabled);
				return;
			case 'updateSettings':
				this._updateSettings(message.settings);
				return;
			case 'getClipboardText':
				this._getClipboardText();
				return;
			case 'selectModel':
				this._setSelectedModel(message.model, message.tierModels);
				return;
			case 'openModelTerminal':
				this._openModelTerminal();
				return;
			case 'viewUsage':
				this._openUsageTerminal(message.usageType);
				return;
			case 'executeSlashCommand':
				this._executeSlashCommand(message.command);
				return;
			case 'dismissWSLAlert':
				this._dismissWSLAlert();
				return;
			case 'runInstallCommand':
				this._runInstallCommand();
				return;
			case 'openLoginTerminal':
				this._openLoginTerminal();
				return;
			case 'openFundsPage':
				if (message.pendingModel) {
					this._pendingModelAfterPayment = message.pendingModel;
				}
				vscode.env.openExternal(vscode.Uri.parse(`${OPENCREDITS_WEB_URL}/embed/checkout`));
				return;
			case 'setPendingModel':
				if (message.pendingModel) {
					this._pendingModelAfterPayment = message.pendingModel;
				}
				return;
			case 'opencreditsKeyFromCheckout':
				if (message.key) {
					// Save the key and OpenCredits env vars (same as URI handler)
					const checkoutConfig = vscode.workspace.getConfiguration('claudeCodeChat');
					const checkoutEnvVars = checkoutConfig.get<Record<string, string>>('environment.variables', {});
					checkoutEnvVars['ANTHROPIC_AUTH_TOKEN'] = message.key;
					checkoutEnvVars['ANTHROPIC_BASE_URL'] = OPENCREDITS_API_URL;
					checkoutConfig.update('environment.variables', checkoutEnvVars, vscode.ConfigurationTarget.Global).then(
						() => {
							this.handleOpenCreditsKeyReceived(message.key);
						},
						(err: Error) => {
							console.error('Failed to save OpenCredits env vars from checkout:', err);
							this._postMessage({
								type: 'checkoutSaveError',
								message: 'Failed to save your account credentials. Please try again.'
							});
						}
					);
					// Bring VS Code window to foreground
					if (this._panel) {
						this._panel.reveal(vscode.ViewColumn.One);
					}
					const focusCmd = process.platform === 'darwin' ? 'open'
						: process.platform === 'win32' ? 'start'
						: 'xdg-open';
					cp.spawn(focusCmd, [`${vscode.env.uriScheme}://AndrePimenta.claude-code-chat/focus`], { detached: true, stdio: 'ignore' }).unref();
				}
				return;
			case 'openOpenCreditsAccount':
				this._openOpenCreditsAccount();
				return;
			case 'restoreOpenCredits': {
				const savedKey = await this._getSavedOpenCreditsKey();
				if (savedKey) {
					const restoreConfig = vscode.workspace.getConfiguration('claudeCodeChat');
					const restoreEnvVars = restoreConfig.get<Record<string, string>>('environment.variables', {});
					restoreEnvVars['ANTHROPIC_AUTH_TOKEN'] = savedKey;
					restoreEnvVars['ANTHROPIC_BASE_URL'] = OPENCREDITS_API_URL;
					await restoreConfig.update('environment.variables', restoreEnvVars, vscode.ConfigurationTarget.Global);
					await this.handleOpenCreditsKeyReceived(savedKey);
				}
				return;
			}
			case 'checkSavedOpenCredits': {
				const hasSaved = !!(await this._getSavedOpenCreditsKey());
				this._postMessage({ type: 'savedOpenCreditsStatus', hasSavedKey: hasSaved });
				return;
			}
			case 'saveCustomProvider':
				if (message.envVars) {
					const cpConfig = vscode.workspace.getConfiguration('claudeCodeChat');
					const cpEnvVars = cpConfig.get<Record<string, string>>('environment.variables', {});
					Object.assign(cpEnvVars, message.envVars);
					cpConfig.update('environment.variables', cpEnvVars, vscode.ConfigurationTarget.Global).then(
						() => {
							this._postMessage({ type: 'customProviderSaved' });
						},
						(err: Error) => {
							console.error('Failed to save custom provider:', err);
						}
					);
				}
				return;
			case 'copyToClipboard':
				if (message.text) {
					vscode.env.clipboard.writeText(message.text);
				}
				return;
			case 'saveOpenCreditsKeyEarly':
				// Save key to secrets early (before payment) so it can be recovered if VS Code closes
				if (message.key) {
					this._saveOpenCreditsKey(message.key);
				}
				return;
			case 'openExternalUrl': {
				const extUrl = message.url;
				try {
					if (process.platform === 'win32') {
						cp.exec(`start "" "${extUrl}"`, { windowsHide: true });
					} else {
						const openCmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
						const proc = cp.spawn(openCmd, [extUrl], { detached: true, stdio: 'ignore' });
						proc.on('error', () => {
							vscode.env.openExternal(vscode.Uri.parse(extUrl));
						});
						proc.unref();
					}
				} catch {
					vscode.env.openExternal(vscode.Uri.parse(extUrl));
				}
				return;
			}
			case 'openFile':
				this._openFileInEditor(message.filePath);
				return;
			case 'openDiff':
				this._openDiffEditor(message.oldContent, message.newContent, message.filePath);
				return;
			case 'openDiffByIndex':
				this._openDiffByMessageIndex(message.messageIndex);
				return;
			case 'createImageFile':
				this._createImageFile(message.imageData, message.imageType);
				return;
			case 'permissionResponse':
				this._handlePermissionResponse(message.id, message.approved, message.alwaysAllow);
				return;
			case 'askUserQuestionResponse':
				this._handleAskUserQuestionResponse(message.id, message.answers);
				return;
			case 'showInfoMessage':
				vscode.window.showInformationMessage(message.message);
				return;
			case 'marketplaceFetch':
				this._fetchMarketplace(message.url, message.append, message.isSearch);
				return;
			case 'getPermissions':
				this._sendPermissions();
				return;
			case 'removePermission':
				this._removePermission(message.toolName, message.command);
				return;
			case 'addPermission':
				this._addPermission(message.toolName, message.command);
				return;
			case 'loadSkills':
				this._loadSkills();
				return;
			case 'saveSkill':
				this._saveSkill(message.name, message.scope, message.content);
				return;
			case 'deleteSkill':
				this._deleteSkill(message.name, message.scope);
				return;
			case 'searchSkills':
				this._searchSkills(message.query);
				return;
			case 'runTerminalCommand':
				this._runTerminalCommand(message.command);
				return;
			case 'loadPlugins':
				this._loadPlugins();
				return;
			case 'installPlugin':
				this._installPlugin(message.installId);
				return;
			case 'removePlugin':
				this._removePlugin(message.installId);
				return;
			case 'loadMCPServers':
				this._loadMCPServers();
				return;
			case 'saveMCPServer':
				this._saveMCPServer(message.name, message.config, message.scope || 'project');
				return;
			case 'deleteMCPServer':
				this._deleteMCPServer(message.name, message.scope || 'project');
				return;
			case 'getCustomSnippets':
				this._sendCustomSnippets();
				return;
			case 'saveCustomSnippet':
				this._saveCustomSnippet(message.snippet);
				return;
			case 'deleteCustomSnippet':
				this._deleteCustomSnippet(message.snippetId);
				return;
			case 'enableYoloMode':
				this._enableYoloMode();
				return;
			case 'saveInputText':
				this._saveInputText(message.text);
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
			this._panel.dispose();
			this._panel = undefined;
		}

		this._webview = webview;
		this._webviewView = webviewView;
		this._webview.html = this._getHtmlForWebview();

		this._setupWebviewMessageHandler(this._webview);
		this._initializePermissions();

		// Initialize the webview
		this._initializeWebview();
	}

	private _initializeWebview() {
		// Resume session from latest conversation
		const latestConversation = this._getLatestConversation();
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

		// Check feature flags and auto-update models (non-blocking)
		this._checkFeatureFlags().then(enabled => {
			if (enabled) {
				this._autoUpdateRecommendedModels().catch(() => {});
			}
		}).catch(() => {});
	}

	private static readonly FEATURES_CACHE_KEY = 'claude.featureFlags';
	private static readonly FEATURES_CACHE_TTL = 0; // Always re-fetch for now
	private static readonly MODEL_CACHE_KEY = 'claude.recommendedModelsCache.v1';
	private static readonly MODEL_CACHE_TTL = 24 * 60 * 60 * 1000; // 1 day

	private async _checkFeatureFlags(): Promise<boolean> {

		// Check cache first
		const cached = this._context.globalState.get<{ timestamp: number; opencredits_enabled: boolean }>(ClaudeChatProvider.FEATURES_CACHE_KEY);
		if (cached && Date.now() - cached.timestamp < ClaudeChatProvider.FEATURES_CACHE_TTL) {
			this._postMessage({ type: 'featureFlags', opencredits_enabled: cached.opencredits_enabled });
			return cached.opencredits_enabled;
		}

		try {
			const res = await fetch(OPENCREDITS_API_URL + '/v1/features');
			if (res.ok) {
				const data = await res.json() as { opencredits_enabled: boolean; country: string };
				this._context.globalState.update(ClaudeChatProvider.FEATURES_CACHE_KEY, {
					timestamp: Date.now(),
					opencredits_enabled: data.opencredits_enabled
				});
				this._postMessage({ type: 'featureFlags', opencredits_enabled: data.opencredits_enabled });
				return data.opencredits_enabled;
			}
		} catch (e) {
			console.error('[OpenCredits] Feature flags fetch failed:', e);
		}

		// Default to disabled if fetch fails
		this._postMessage({ type: 'featureFlags', opencredits_enabled: false });
		return false;
	}

	private static readonly REFERENCE_MODEL = 'anthropic/claude-opus-4.6';
	private static get PUBLISHABLE_KEY() { return OPENCREDITS_PUBLISHABLE_KEY; }
	private static readonly IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'];
	private static readonly IMAGE_MEDIA_TYPES: Record<string, string> = {
		'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
		'.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp', '.svg': 'image/svg+xml'
	};

	private async _autoUpdateRecommendedModels() {
		// Check cache first
		const cached = this._context.globalState.get<{ timestamp: number; models: any[]; creditsPricing?: any }>(ClaudeChatProvider.MODEL_CACHE_KEY);
		if (cached && Date.now() - cached.timestamp < ClaudeChatProvider.MODEL_CACHE_TTL) {
			this._postMessage({
				type: 'updateRecommendedModels',
				models: cached.models,
				creditsPricing: cached.creditsPricing
			});
			return;
		}

		const updated = await fetchAndResolveModels(recommendedModels as any[], OPENCREDITS_API_URL);
		if (updated && updated.length > 0) {
			// Fetch credit pricing for recommended models + reference model
			const modelIds = updated.map((m: any) => m.id);
			// Also include tier model IDs
			for (const m of updated) {
				if ((m as any).tierModels) {
					const tiers = (m as any).tierModels;
					for (const key of Object.keys(tiers)) {
						if (tiers[key] && !modelIds.includes(tiers[key])) {
							modelIds.push(tiers[key]);
						}
					}
				}
			}
			if (!modelIds.includes(ClaudeChatProvider.REFERENCE_MODEL)) {
				modelIds.push(ClaudeChatProvider.REFERENCE_MODEL);
			}
			if (!modelIds.includes('anthropic/claude-sonnet-4.6')) {
				modelIds.push('anthropic/claude-sonnet-4.6');
			}

			let creditsPricing: any = null;
			try {
				const pricingRes = await fetch(OPENCREDITS_API_URL + '/v1/credits/pricing', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						publishable_key: ClaudeChatProvider.PUBLISHABLE_KEY,
						models: modelIds
					})
				});
				if (pricingRes.ok) {
					const pricingData = await pricingRes.json() as any;
					creditsPricing = {
						referenceModel: ClaudeChatProvider.REFERENCE_MODEL,
						models: pricingData.models || [],
						tokenAssumption: pricingData.token_assumption
					};
				}
			} catch (e) {
				console.error('[OpenCredits] Credit pricing fetch failed:', e);
			}

			this._context.globalState.update(ClaudeChatProvider.MODEL_CACHE_KEY, {
				timestamp: Date.now(),
				models: updated,
				creditsPricing
			});
			this._postMessage({
				type: 'updateRecommendedModels',
				models: updated,
				creditsPricing
			});
		}
	}

	public reinitializeWebview() {
		// Only reinitialize if we have a webview (sidebar)
		if (this._webview) {
			this._initializePermissions();
			this._initializeWebview();
			// Set up message handler for the webview
			this._setupWebviewMessageHandler(this._webview);
		}
	}

	private async _sendMessageToClaude(message: string, planMode?: boolean, thinkingMode?: boolean, images?: string[]) {
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		const cwd = workspaceFolder ? workspaceFolder.uri.fsPath : process.cwd();

		// Get thinking intensity setting
		const configThink = vscode.workspace.getConfiguration('claudeCodeChat');
		const thinkingIntensity = configThink.get<string>('thinking.intensity', 'think');

		// Prepend thinking mode instructions if enabled
		let actualMessage = message;
		if (thinkingMode) {
			let thinkingPrompt = '';
			const thinkingMesssage = ' THROUGH THIS STEP BY STEP: \n'
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
			await this._createBackupCommit(message);
		}
		catch (e) {
			console.error("error", e);
		}

		// Show loading indicator
		this._postMessage({
			type: 'loading',
			data: 'Claude is working...'
		});

		// Build command arguments with session management
		// Use stream-json for both input and output to enable bidirectional communication
		// This is required for stdio-based permission prompts
		const args = [
			'--output-format', 'stream-json',
			'--input-format', 'stream-json',
			'--verbose'
		];

		// Get configuration
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const yoloMode = config.get<boolean>('permissions.yoloMode', false);

		if (yoloMode) {
			// Yolo mode: skip all permissions
			args.push('--dangerously-skip-permissions');
		} else {
			// Use stdio-based permission prompts (no MCP server needed)
			args.push('--permission-prompt-tool', 'stdio');
		}

		// Pass extension's MCP config to Claude CLI (only if file exists)
		const mcpConfigPath = this._getExtensionMCPConfigPath();
		if (mcpConfigPath) {
			try {
				await vscode.workspace.fs.stat(vscode.Uri.file(mcpConfigPath));
				args.push('--mcp-config', this.convertToWSLPath(mcpConfigPath));
			} catch {
				// File doesn't exist, skip --mcp-config
			}
		}

		// Add plan mode if enabled
		if (planMode) {
			args.push('--permission-mode', 'plan');
		}

		// Add model selection for Claude models only (opus, sonnet)
		// OpenCredits models are handled via env vars or router mapping
		const claudeModels = ['opus', 'sonnet'];
		if (this._selectedModel && claudeModels.includes(this._selectedModel)) {
			args.push('--model', this._selectedModel);
		}

		// Add session resume if we have a current session
		if (this._currentSessionId) {
			args.push('--resume', this._currentSessionId);
		}

		const wslEnabled = config.get<boolean>('wsl.enabled', false);
		const wslDistro = config.get<string>('wsl.distro', 'Ubuntu');
		const nodePath = config.get<string>('wsl.nodePath', '/usr/bin/node');
		const claudePath = config.get<string>('wsl.claudePath', '/usr/local/bin/claude');
		const routerExplicitlyEnabled = config.get<boolean>('router.enabled', false);
		const customExecutablePath = config.get<string>('executable.path', '');
		const envsDisabled = config.get<boolean>('environment.disabled', false);
		const customEnvVars = envsDisabled ? {} : config.get<Record<string, string>>('environment.variables', {});

		// Check if using OpenCredits (base URL contains opencredits.ai)
		const isOpenCredits = this._isOpenCredits();

		// Router is only used when explicitly enabled (fallback for older OpenCredits support)
		// OpenCredits now supports Anthropic API format directly, so env vars pass through
		const useRouter = routerExplicitlyEnabled && !wslEnabled;


		let claudeProcess: cp.ChildProcess;

		// Create new AbortController for this request
		this._abortController = new AbortController();

		// Build environment variables - apply custom env vars from settings
		let spawnEnv: NodeJS.ProcessEnv = {
			...process.env,
			FORCE_COLOR: '0',
			NO_COLOR: '1',
			...customEnvVars  // Apply custom environment variables (ANTHROPIC_AUTH_TOKEN, ANTHROPIC_BASE_URL, etc.)
		};

		// OpenCredits: clear Anthropic-specific vars so Claude CLI uses env vars directly
		if (isOpenCredits) {
			spawnEnv.ANTHROPIC_API_KEY = '';
			spawnEnv.DISABLE_TELEMETRY = 'true';
			spawnEnv.DISABLE_COST_WARNINGS = 'true';
			delete spawnEnv.CLAUDE_CODE_USE_BEDROCK;
		}

		// If router explicitly enabled, start local router and override ANTHROPIC_BASE_URL
		if (useRouter) {
			// Pass the real ANTHROPIC_BASE_URL to the router before starting
			const realBaseUrl = customEnvVars['ANTHROPIC_BASE_URL'] || '';
			if (realBaseUrl) {
				setBaseUrl(realBaseUrl);
			}

			const routerPort = await this._ensureLocalRouter();
			spawnEnv.ANTHROPIC_BASE_URL = `http://127.0.0.1:${routerPort}`;
			spawnEnv.NO_PROXY = '127.0.0.1';
		}

		if (wslEnabled) {
			// Build env var exports to prepend to the WSL command
			// WSL doesn't reliably inherit Windows env vars via spawn
			const wslEnvOverrides: Record<string, string> = { ...customEnvVars };
			if (isOpenCredits) {
				wslEnvOverrides['ANTHROPIC_API_KEY'] = '';
				wslEnvOverrides['DISABLE_TELEMETRY'] = 'true';
				wslEnvOverrides['DISABLE_COST_WARNINGS'] = 'true';
			}
			const envExports = Object.entries(wslEnvOverrides)
				.map(([k, v]) => `export ${k}="${v.replace(/"/g, '\\"')}"`)
				.join(' && ');
			const envPrefix = envExports ? envExports + ' && ' : '';

			const quotedArgs = args.map(a => a.includes(' ') ? `"${a}"` : a).join(' ');
			const wslCommand = `${envPrefix}"${nodePath}" --no-warnings --enable-source-maps "${claudePath}" ${quotedArgs}`;

			// Track WSL state for proper process termination
			this._isWslProcess = true;
			this._wslDistro = wslDistro;

			claudeProcess = cp.spawn('wsl', ['-d', wslDistro, 'bash', '-ic', wslCommand], {
				signal: this._abortController.signal,
				detached: process.platform !== 'win32',
				cwd: cwd,
				stdio: ['pipe', 'pipe', 'pipe'],
				env: spawnEnv
			});
		} else {
			// Not using WSL
			this._isWslProcess = false;

			// Use native claude command (or custom executable if configured)
			const executable = customExecutablePath || 'claude';
			claudeProcess = cp.spawn(executable, args, {
				signal: this._abortController.signal,
				shell: process.platform === 'win32',
				detached: process.platform !== 'win32',
				cwd: cwd,
				stdio: ['pipe', 'pipe', 'pipe'],
				env: spawnEnv
			});
		}

		// Store process reference for potential termination
		this._currentClaudeProcess = claudeProcess;

		// Send the message to Claude's stdin as JSON (stream-json input format)
		// Don't end stdin yet - we need to keep it open for permission responses
		if (claudeProcess.stdin) {
			// First, send an initialize request to get account info (once per session)
			if (!this._accountInfoFetchedThisSession) {
				this._accountInfoFetchedThisSession = true;
				const initRequest = {
					type: 'control_request',
					request_id: 'init-' + Date.now(),
					request: {
						subtype: 'initialize'
					}
				};
				claudeProcess.stdin.write(JSON.stringify(initRequest) + '\n');
			}

			// Build message content — detect image file paths and inline them as base64
			const content: Array<{type: string; text?: string; source?: {type: string; media_type: string; data: string}}> = [];
			const imageExtensions = ClaudeChatProvider.IMAGE_EXTENSIONS;
			const imageMediaTypes = ClaudeChatProvider.IMAGE_MEDIA_TYPES;

			// Scan message for image file paths and inline them as base64
			const imagePathRegex = /(\/[^\s]+\.(?:png|jpg|jpeg|gif|webp|bmp))\b/gi;
			let lastIndex = 0;
			let match;
			while ((match = imagePathRegex.exec(actualMessage)) !== null) {
				const imagePath = match[1];
				const ext = path.extname(imagePath).toLowerCase();
				if (imageExtensions.includes(ext)) {
					try {
						const imageData = await vscode.workspace.fs.readFile(vscode.Uri.file(imagePath));
						const base64 = Buffer.from(imageData).toString('base64');
						// Flush text before this match
						const textBefore = actualMessage.substring(lastIndex, match.index);
						if (textBefore.trim()) {
							content.push({ type: 'text', text: textBefore.trim() });
						}
						content.push({
							type: 'image',
							source: {
								type: 'base64',
								media_type: imageMediaTypes[ext] || 'image/png',
								data: base64
							}
						});
						lastIndex = match.index + match[0].length;
					} catch (e) {
						console.error('Could not read image file:', imagePath, e);
					}
				}
			}
			// Add remaining text
			const remaining = actualMessage.substring(lastIndex);
			if (remaining.trim()) {
				content.push({ type: 'text', text: remaining.trim() });
			}

			// Add explicitly attached images
			if (images && images.length > 0) {
				for (const imagePath of images) {
					const ext = imageExtensions.find(e => imagePath.toLowerCase().endsWith(e));
					if (ext) {
						try {
							const imageData = await vscode.workspace.fs.readFile(vscode.Uri.file(imagePath));
							const base64 = Buffer.from(imageData).toString('base64');
							content.push({
								type: 'image',
								source: {
									type: 'base64',
									media_type: imageMediaTypes[ext] || 'image/png',
									data: base64
								}
							});
						} catch (e) {
							console.error('Could not read attached image:', imagePath, e);
						}
					}
				}
			}

			// Ensure at least one text block
			if (content.length === 0) {
				content.push({ type: 'text', text: actualMessage });
			}

			const userMessage = {
				type: 'user',
				session_id: this._currentSessionId || '',
				message: {
					role: 'user',
					content: content
				},
				parent_tool_use_id: null
			};
			const userMessageJson = JSON.stringify(userMessage);
				claudeProcess.stdin.write(userMessageJson + '\n');
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
							const jsonData = JSON.parse(line.trim());

							// Handle control_request messages (permission requests via stdio)
							if (jsonData.type === 'control_request') {
								this._handleControlRequest(jsonData, claudeProcess).catch(err => {
									console.error('Error handling control request:', err);
								});
								continue;
							}

							// Handle control_response messages (responses to our initialize request)
							if (jsonData.type === 'control_response') {
								this._handleControlResponse(jsonData);
								continue;
							}

							// Handle result message - end stdin when done
							if (jsonData.type === 'result') {
								if (claudeProcess.stdin && !claudeProcess.stdin.destroyed) {
									claudeProcess.stdin.end();
								}
							}

							this._processJsonStreamData(jsonData);
						} catch (error) {
							console.error('Failed to parse JSON line:', line, error);
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

			if (!this._currentClaudeProcess) {
				return;
			}

			// Clear process reference
			this._currentClaudeProcess = undefined;

			// Cancel any pending permission requests (process is gone)
			this._cancelPendingPermissionRequests();

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
		});

		claudeProcess.on('error', (error) => {
			console.error('Claude process error:', error.message);

			if (!this._currentClaudeProcess) {
				return;
			}

			// Clear process reference
			this._currentClaudeProcess = undefined;

			// Cancel any pending permission requests (process is gone)
			this._cancelPendingPermissionRequests();

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
				this._postMessage({
					type: 'showInstallModal'
				});
			} else {
				this._sendAndSaveMessage({
					type: 'error',
					data: `Error running Claude: ${error.message}`
				});
			}
		});
	}

	private async _processJsonStreamData(jsonData: any) {
		switch (jsonData.type) {
			case 'system':
				if (jsonData.subtype === 'init') {
					// System initialization message - session ID will be captured from final result
					this._currentSessionId = jsonData.session_id;
					//this._sendAndSaveMessage({ type: 'init', data: { sessionId: jsonData.session_id; } })

					// Show session info in UI
					this._sendAndSaveMessage({
						type: 'sessionInfo',
						data: {
							sessionId: jsonData.session_id,
							tools: jsonData.tools || [],
							mcpServers: jsonData.mcp_servers || []
						}
					});
				} else if (jsonData.subtype === 'status') {
					// Handle status changes (e.g., compacting)
					if (jsonData.status === 'compacting') {
						this._sendAndSaveMessage({
							type: 'compacting',
							data: { isCompacting: true }
						});
					} else if (jsonData.status === null) {
						this._sendAndSaveMessage({
							type: 'compacting',
							data: { isCompacting: false }
						});
					}
				} else if (jsonData.subtype === 'compact_boundary') {
					// Compact boundary - conversation was compacted, reset token counts

					// Reset tokens since the conversation is now summarized
					this._totalTokensInput = 0;
					this._totalTokensOutput = 0;

					this._sendAndSaveMessage({
						type: 'compactBoundary',
						data: {
							trigger: jsonData.compact_metadata?.trigger,
							preTokens: jsonData.compact_metadata?.pre_tokens
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
							// Show tool execution with better formatting
							const toolInfo = `🔧 Executing: ${content.name}`;
							let toolInput = '';
							let fileContentBefore: string | undefined;

							if (content.input) {
								// Special formatting for TodoWrite to make it more readable
								if (content.name === 'TodoWrite' && content.input.todos) {
									toolInput = '\nTodo List Update:';
									for (const todo of content.input.todos) {
										const status = todo.status === 'completed' ? '✅' :
											todo.status === 'in_progress' ? '🔄' : '⏳';
										toolInput += `\n${status} ${todo.content} (priority: ${todo.priority})`;
									}
								} else {
									// Send raw input to UI for formatting
									toolInput = '';
								}

								// For Edit/MultiEdit/Write, read current file content (before state)
								if ((content.name === 'Edit' || content.name === 'MultiEdit' || content.name === 'Write') && content.input.file_path) {
									try {
										const fileUri = vscode.Uri.file(content.input.file_path);
										const fileData = await vscode.workspace.fs.readFile(fileUri);
										fileContentBefore = Buffer.from(fileData).toString('utf8');
									} catch {
										// File might not exist yet (for Write), that's ok
										fileContentBefore = '';
									}
								}
							}

							// Compute startLine(s) while we have the file content
							let startLine: number | undefined;
							let startLines: number[] | undefined;
							if (fileContentBefore !== undefined) {
								if (content.name === 'Edit' && content.input.old_string) {
									const position = fileContentBefore.indexOf(content.input.old_string);
									if (position !== -1) {
										const textBefore = fileContentBefore.substring(0, position);
										startLine = (textBefore.match(/\n/g) || []).length + 1;
									} else {
										startLine = 1;
									}
								} else if (content.name === 'MultiEdit' && content.input.edits) {
									startLines = content.input.edits.map((edit: any) => {
										if (edit.old_string) {
											const position = fileContentBefore!.indexOf(edit.old_string);
											if (position !== -1) {
												const textBefore = fileContentBefore!.substring(0, position);
												return (textBefore.match(/\n/g) || []).length + 1;
											}
										}
										return 1;
									});
								}
							}

							// Show tool use and save to conversation
							this._sendAndSaveMessage({
								type: 'toolUse',
								data: {
									toolInfo: toolInfo,
									toolInput: toolInput,
									rawInput: content.input,
									toolName: content.name,
									fileContentBefore: fileContentBefore,
									startLine: startLine,
									startLines: startLines
								}
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

							// Find the last tool use to get the tool name, input, and computed startLine
							const lastToolUse = this._currentConversation[this._currentConversation.length - 1]

							const toolName = lastToolUse?.data?.toolName;
							const rawInput = lastToolUse?.data?.rawInput;
							const startLine = lastToolUse?.data?.startLine;
							const startLines = lastToolUse?.data?.startLines;

							// For Edit/MultiEdit/Write, read current file content (after state)
							let fileContentAfter: string | undefined;
							if ((toolName === 'Edit' || toolName === 'MultiEdit' || toolName === 'Write') && rawInput?.file_path && !isError) {
								try {
									const fileUri = vscode.Uri.file(rawInput.file_path);
									const fileData = await vscode.workspace.fs.readFile(fileUri);
									fileContentAfter = Buffer.from(fileData).toString('utf8');
								} catch {
									// File read failed, that's ok
								}
							}

							// Don't send tool result for Read and TodoWrite tools unless there's an error
							if ((toolName === 'Read' || toolName === 'TodoWrite') && !isError) {
								// Still send to UI to hide loading state, but mark it as hidden
								this._sendAndSaveMessage({
									type: 'toolResult',
									data: {
										content: resultContent,
										isError: isError,
										toolUseId: content.tool_use_id,
										toolName: toolName,
										rawInput: rawInput,
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
										toolName: toolName,
										rawInput: rawInput,
										fileContentAfter: fileContentAfter,
										startLine: startLine,
										startLines: startLines
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
					if (jsonData.is_error && jsonData.result && (
						jsonData.result.includes('Invalid API key') ||
						jsonData.result.includes('Not logged in') ||
						jsonData.result.includes('/login') ||
						jsonData.result.includes('not authenticated')
					)) {
						this._handleLoginRequired();
						return;
					}

					this._isProcessing = false;

					// Capture session ID from final result
					if (jsonData.session_id) {

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

					// Refresh OpenCredits balance after each request if using OpenCredits
					if (this._isOpenCredits() || this._getOpenCreditsKey()) {
						this._sendOpenCreditsBalance();
					}
				}
				break;
		}
	}


	private async _newSession(): Promise<void> {
		this._isProcessing = false;

		// Update UI state
		this._postMessage({
			type: 'setProcessing',
			data: { isProcessing: false }
		});

		// Kill Claude process and all child processes
		await this._killClaudeProcess();

		// Clear current session
		this._currentSessionId = undefined;

		// Clear commits and conversation
		this._commits = [];
		this._currentConversation = [];
		this._conversationStartTime = undefined;

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

	private async _handleLoginRequired() {

		this._isProcessing = false;

		// Clear processing state
		this._postMessage({
			type: 'setProcessing',
			data: { isProcessing: false }
		});

		// Check if OpenCredits is enabled - if so, show options modal
		const opencreditsEnabled = await this._checkFeatureFlags();
		if (opencreditsEnabled) {
			this._postMessage({
				type: 'showLoginOptions'
			});
		} else {
			// Just open login terminal directly
			this._openLoginTerminal();
			this._postMessage({
				type: 'loginRequired'
			});
		}
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

			}
		} catch (error: any) {
			console.error('Failed to initialize backup repository:', error.message);
		}
	}

	private async _createBackupCommit(userMessage: string): Promise<void> {
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
			const commitInfo = {
				id: `commit-${timestamp}`,
				sha: sha.trim(),
				message: actualMessage,
				timestamp: displayTimestamp
			};

			this._commits.push(commitInfo);

			// Show restore option in UI and save to conversation
			this._sendAndSaveMessage({
				type: 'showRestoreOption',
				data: commitInfo
			});

		} catch (error: any) {
			console.error('Failed to create backup commit:', error.message);
		}
	}


	private async _restoreToCommit(commitSha: string): Promise<void> {
		try {
			const commit = this._commits.find(c => c.sha === commitSha);
			if (!commit) {
				this._postMessage({
					type: 'restoreError',
					data: 'Commit not found'
				});
				return;
			}

			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder || !this._backupRepoPath) {
				vscode.window.showErrorMessage('No workspace folder or backup repository available.');
				return;
			}

			const workspacePath = workspaceFolder.uri.fsPath;

			this._postMessage({
				type: 'restoreProgress',
				data: 'Restoring files from backup...'
			});

			// Restore files directly to workspace using git checkout
			await exec(`git --git-dir="${this._backupRepoPath}" --work-tree="${workspacePath}" checkout ${commitSha} -- .`);

			vscode.window.showInformationMessage(`Restored to commit: ${commit.message}`);

			this._sendAndSaveMessage({
				type: 'restoreSuccess',
				data: {
					message: `Successfully restored to: ${commit.message}`,
					commitSha: commitSha
				}
			});

		} catch (error: any) {
			console.error('Failed to restore commit:', error.message);
			vscode.window.showErrorMessage(`Failed to restore commit: ${error.message}`);
			this._postMessage({
				type: 'restoreError',
				data: `Failed to restore: ${error.message}`
			});
		}
	}

	private async _initializeConversations(): Promise<void> {
		try {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder) { return; }

			const storagePath = this._context.storageUri?.fsPath;
			if (!storagePath) { return; }

			this._conversationsPath = path.join(storagePath, 'conversations');

			// Create conversations directory if it doesn't exist
			try {
				await vscode.workspace.fs.stat(vscode.Uri.file(this._conversationsPath));
			} catch {
				await vscode.workspace.fs.createDirectory(vscode.Uri.file(this._conversationsPath));
			}
		} catch (error: any) {
			console.error('Failed to initialize conversations directory:', error.message);
		}
	}


	/**
	 * Check if a tool is pre-approved in local permissions
	 */
	private async _isToolPreApproved(toolName: string, input: Record<string, unknown>): Promise<boolean> {
		try {
			const storagePath = this._context.storageUri?.fsPath;
			if (!storagePath) return false;

			const permissionsUri = vscode.Uri.file(path.join(storagePath, 'permissions', 'permissions.json'));
			let permissions: any = { alwaysAllow: {} };

			try {
				const content = await vscode.workspace.fs.readFile(permissionsUri);
				permissions = JSON.parse(new TextDecoder().decode(content));
			} catch {
				return false; // No permissions file
			}

			const toolPermission = permissions.alwaysAllow?.[toolName];

			if (toolPermission === true) {
				// Tool is fully approved (all commands/inputs)
				return true;
			}

			if (Array.isArray(toolPermission) && toolName === 'Bash' && input.command) {
				// Check if the command matches any approved pattern
				const command = (input.command as string).trim();
				for (const pattern of toolPermission) {
					if (this._matchesPattern(command, pattern)) {
						return true;
					}
				}
			}

			return false;
		} catch (error) {
			console.error('Error checking pre-approved permissions:', error);
			return false;
		}
	}

	/**
	 * Check if a command matches a permission pattern (supports * wildcard)
	 */
	private _matchesPattern(command: string, pattern: string): boolean {
		if (pattern === command) return true;

		// Handle wildcard patterns like "npm install *"
		if (pattern.endsWith(' *')) {
			const prefix = pattern.slice(0, -1); // Remove the *
			return command.startsWith(prefix);
		}

		// Handle exact match patterns
		return false;
	}

	/**
	 * Handle control_response messages from Claude CLI via stdio
	 * This is used to get account info from the initialize request
	 */
	private _handleControlResponse(controlResponse: any): void {
		// Structure: controlResponse.response.response.account
		// The outer response has subtype/request_id, inner response has the actual data
		const innerResponse = controlResponse.response?.response;

		// Check if this is an initialize response with account info
		if (innerResponse?.account) {
			const account = innerResponse.account;
			this._subscriptionType = account.subscriptionType;


			// Save to globalState for persistence
			this._context.globalState.update('claude.subscriptionType', this._subscriptionType);

			// Send subscription type to UI
			this._postMessage({
				type: 'accountInfo',
				data: {
					subscriptionType: this._subscriptionType
				}
			});
		}
	}

	/**
	 * Handle control_request messages from Claude CLI via stdio
	 * This is the new permission flow that replaces the MCP file-based approach
	 */
	private async _handleControlRequest(controlRequest: any, _claudeProcess: cp.ChildProcess): Promise<void> {
		const request = controlRequest.request;
		const requestId = controlRequest.request_id;

		// Only handle can_use_tool requests (permission requests)
		if (request?.subtype !== 'can_use_tool') {
			return;
		}

		const toolName = request.tool_name || 'Unknown Tool';
		const input = request.input || {};
		const suggestions = request.permission_suggestions;
		const toolUseId = request.tool_use_id;


		// Handle AskUserQuestion tool separately
		if (toolName === 'AskUserQuestion') {
			this._handleAskUserQuestion(requestId, input, toolUseId);
			return;
		}

		// Check if this tool is pre-approved
		const isPreApproved = await this._isToolPreApproved(toolName, input);

		if (isPreApproved) {
			// Auto-approve without showing UI
			this._sendPermissionResponse(requestId, true, {
				requestId,
				toolName,
				input,
				suggestions,
				toolUseId
			}, false);
			return;
		}

		// Store the request data so we can respond later
		this._pendingPermissionRequests.set(requestId, {
			requestId,
			toolName,
			input,
			suggestions,
			toolUseId
		});

		// Generate pattern for Bash commands (for display purposes)
		let pattern: string | undefined;
		if (toolName === 'Bash' && input.command) {
			pattern = this.getCommandPattern(input.command as string);
		}

		// Send permission request to the UI with pending status
		this._sendAndSaveMessage({
			type: 'permissionRequest',
			data: {
				id: requestId,
				tool: toolName,
				input: input,
				pattern: pattern,
				suggestions: suggestions,
				decisionReason: request.decision_reason,
				blockedPath: request.blocked_path,
				status: 'pending'
			}
		});
	}

	/**
	 * Send permission response back to Claude CLI via stdin
	 */
	private _sendPermissionResponse(
		requestId: string,
		approved: boolean,
		pendingRequest: {
			requestId: string;
			toolName: string;
			input: Record<string, unknown>;
			suggestions?: any[];
			toolUseId: string;
		},
		alwaysAllow?: boolean
	): void {
		if (!this._currentClaudeProcess?.stdin || this._currentClaudeProcess.stdin.destroyed) {
			console.error('Cannot send permission response: stdin not available');
			return;
		}

		let response: any;
		if (approved) {
			response = {
				type: 'control_response',
				response: {
					subtype: 'success',
					request_id: requestId,
					response: {
						behavior: 'allow',
						updatedInput: pendingRequest.input,
						// Pass back suggestions if user chose "always allow"
						updatedPermissions: alwaysAllow ? pendingRequest.suggestions : undefined,
						toolUseID: pendingRequest.toolUseId
					}
				}
			};
		} else {
			response = {
				type: 'control_response',
				response: {
					subtype: 'success',
					request_id: requestId,
					response: {
						behavior: 'deny',
						message: 'User denied permission',
						interrupt: true,
						toolUseID: pendingRequest.toolUseId
					}
				}
			};
		}

		const responseJson = JSON.stringify(response) + '\n';
		this._currentClaudeProcess.stdin.write(responseJson);
	}

	private async _initializePermissions(): Promise<void> {
		// No longer needed - permissions are handled via stdio
		// This method is kept for compatibility but does nothing
	}

	/**
	 * Handle permission response from webview UI
	 * Sends control_response back to Claude CLI via stdin
	 */
	private _handlePermissionResponse(id: string, approved: boolean, alwaysAllow?: boolean): void {
		const pendingRequest = this._pendingPermissionRequests.get(id);
		if (!pendingRequest) {
			console.error('No pending permission request found for id:', id);
			return;
		}

		// Remove from pending requests
		this._pendingPermissionRequests.delete(id);

		// Send the response to Claude via stdin
		this._sendPermissionResponse(id, approved, pendingRequest, alwaysAllow);

		// Update the permission request status in UI
		this._postMessage({
			type: 'updatePermissionStatus',
			data: {
				id: id,
				status: approved ? 'approved' : 'denied'
			}
		});

		// Also save to local permissions.json for UI display purposes
		if (alwaysAllow && approved) {
			void this._saveLocalPermission(pendingRequest.toolName, pendingRequest.input);
		}
	}

	/**
	 * Handle AskUserQuestion tool - show questions UI and collect answers
	 */
	private _handleAskUserQuestion(requestId: string, input: Record<string, unknown>, toolUseId: string): void {
		const questions = (input.questions as any[]) || [];

		// Store the pending request
		this._pendingPermissionRequests.set(requestId, {
			requestId,
			toolName: 'AskUserQuestion',
			input,
			suggestions: undefined,
			toolUseId
		});

		// Send to UI for rendering
		this._sendAndSaveMessage({
			type: 'askUserQuestion',
			data: {
				id: requestId,
				questions: questions,
				status: 'pending'
			}
		});
	}

	/**
	 * Handle user's answers to AskUserQuestion
	 */
	private _handleAskUserQuestionResponse(requestId: string, answers: Record<string, string>): void {
		const pendingRequest = this._pendingPermissionRequests.get(requestId);
		if (!pendingRequest) {
			console.error('No pending AskUserQuestion request found for id:', requestId);
			return;
		}

		this._pendingPermissionRequests.delete(requestId);

		if (!this._currentClaudeProcess?.stdin || this._currentClaudeProcess.stdin.destroyed) {
			console.error('Cannot send AskUserQuestion response: stdin not available');
			return;
		}

		const response = {
			type: 'control_response',
			response: {
				subtype: 'success',
				request_id: requestId,
				response: {
					behavior: 'allow',
					updatedInput: {
						questions: (pendingRequest.input as any).questions,
						answers: answers
					},
					toolUseID: pendingRequest.toolUseId
				}
			}
		};

		const responseJson = JSON.stringify(response) + '\n';
		this._currentClaudeProcess.stdin.write(responseJson);

		// Update the saved conversation message to reflect answered status
		const savedMsg = this._currentConversation.find(
			m => m.messageType === 'askUserQuestion' && m.data?.id === requestId
		);
		if (savedMsg) {
			savedMsg.data = { ...savedMsg.data, status: 'answered', answers: answers };
			void this._saveCurrentConversation();
		}

		// Update UI status
		this._postMessage({
			type: 'updateAskUserQuestionStatus',
			data: {
				id: requestId,
				status: 'answered',
				answers: answers
			}
		});
	}

	/**
	 * Cancel all pending permission requests (called when process ends)
	 */
	private _cancelPendingPermissionRequests(): void {
		for (const [id, request] of this._pendingPermissionRequests) {
			if (request.toolName === 'AskUserQuestion') {
				this._postMessage({
					type: 'updateAskUserQuestionStatus',
					data: {
						id: id,
						status: 'cancelled',
						answers: null
					}
				});
			} else {
				this._postMessage({
					type: 'updatePermissionStatus',
					data: {
						id: id,
						status: 'cancelled'
					}
				});
			}
		}
		this._pendingPermissionRequests.clear();
	}

	/**
	 * Save permission to local storage for UI display in settings
	 * Note: The actual "always allow" is handled by Claude via updatedPermissions
	 */
	private async _saveLocalPermission(toolName: string, input: Record<string, unknown>): Promise<void> {
		try {
			const storagePath = this._context.storageUri?.fsPath;
			if (!storagePath) return;

			// Ensure permissions directory exists
			const permissionsDir = path.join(storagePath, 'permissions');
			try {
				await vscode.workspace.fs.stat(vscode.Uri.file(permissionsDir));
			} catch {
				await vscode.workspace.fs.createDirectory(vscode.Uri.file(permissionsDir));
			}

			// Load existing permissions
			const permissionsUri = vscode.Uri.file(path.join(permissionsDir, 'permissions.json'));
			let permissions: any = { alwaysAllow: {} };

			try {
				const content = await vscode.workspace.fs.readFile(permissionsUri);
				permissions = JSON.parse(new TextDecoder().decode(content));
			} catch {
				// File doesn't exist yet
			}

			// Add the permission
			if (toolName === 'Bash' && input.command) {
				if (!permissions.alwaysAllow[toolName]) {
					permissions.alwaysAllow[toolName] = [];
				}
				if (Array.isArray(permissions.alwaysAllow[toolName])) {
					const pattern = this.getCommandPattern(input.command as string);
					if (!permissions.alwaysAllow[toolName].includes(pattern)) {
						permissions.alwaysAllow[toolName].push(pattern);
					}
				}
			} else {
				permissions.alwaysAllow[toolName] = true;
			}

			// Save permissions
			const permissionsContent = new TextEncoder().encode(JSON.stringify(permissions, null, 2));
			await vscode.workspace.fs.writeFile(permissionsUri, permissionsContent);

		} catch (error) {
			console.error('Error saving local permission:', error);
		}
	}

	private getCommandPattern(command: string): string {
		const parts = command.trim().split(/\s+/);
		if (parts.length === 0) return command;

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

	private async _sendPermissions(): Promise<void> {
		try {
			const storagePath = this._context.storageUri?.fsPath;
			if (!storagePath) {
				this._postMessage({
					type: 'permissionsData',
					data: { alwaysAllow: {} }
				});
				return;
			}

			const permissionsUri = vscode.Uri.file(path.join(storagePath, 'permissions', 'permissions.json'));
			let permissions: any = { alwaysAllow: {} };

			try {
				const content = await vscode.workspace.fs.readFile(permissionsUri);
				permissions = JSON.parse(new TextDecoder().decode(content));
			} catch {
				// File doesn't exist or can't be read, use default permissions
			}

			this._postMessage({
				type: 'permissionsData',
				data: permissions
			});
		} catch (error) {
			console.error('Error sending permissions:', error);
			this._postMessage({
				type: 'permissionsData',
				data: { alwaysAllow: {} }
			});
		}
	}

	private async _removePermission(toolName: string, command: string | null): Promise<void> {
		try {
			const storagePath = this._context.storageUri?.fsPath;
			if (!storagePath) return;

			const permissionsUri = vscode.Uri.file(path.join(storagePath, 'permissions', 'permissions.json'));
			let permissions: any = { alwaysAllow: {} };

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

			// Send updated permissions to UI
			this._sendPermissions();

		} catch (error) {
			console.error('Error removing permission:', error);
		}
	}

	private async _addPermission(toolName: string, command: string | null): Promise<void> {
		try {
			const storagePath = this._context.storageUri?.fsPath;
			if (!storagePath) return;

			const permissionsUri = vscode.Uri.file(path.join(storagePath, 'permissions', 'permissions.json'));
			let permissions: any = { alwaysAllow: {} };

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

			// Send updated permissions to UI
			this._sendPermissions();

		} catch (error) {
			console.error('Error adding permission:', error);
		}
	}

	// ─── Skills ───

	private async _loadSkills(): Promise<void> {
		const skills: { name: string; scope: string; description: string; content: string }[] = [];
		const homeDir = process.env.HOME || process.env.USERPROFILE || '';

		// Scan personal skills
		const personalDir = path.join(homeDir, '.claude', 'skills');
		try {
			const entries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(personalDir));
			for (const [name, type] of entries) {
				if (type === vscode.FileType.Directory) {
					const skillPath = path.join(personalDir, name, 'SKILL.md');
					try {
						const content = await vscode.workspace.fs.readFile(vscode.Uri.file(skillPath));
						const text = new TextDecoder().decode(content);
						const descMatch = text.match(/description:\s*(.+)/);
						const bodyMatch = text.match(/^---[\s\S]*?---\s*([\s\S]*)$/);
						skills.push({ name, scope: 'personal', description: descMatch ? descMatch[1].trim() : '', content: bodyMatch ? bodyMatch[1].trim() : text });
					} catch { /* no SKILL.md */ }
				}
			}
		} catch { /* dir doesn't exist */ }

		// Scan project skills
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
		if (workspaceFolder) {
			const projectDir = path.join(workspaceFolder, '.claude', 'skills');
			try {
				const entries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(projectDir));
				for (const [name, type] of entries) {
					if (type === vscode.FileType.Directory) {
						const skillPath = path.join(projectDir, name, 'SKILL.md');
						try {
							const content = await vscode.workspace.fs.readFile(vscode.Uri.file(skillPath));
							const text = new TextDecoder().decode(content);
							const descMatch = text.match(/description:\s*(.+)/);
							const bodyMatch = text.match(/^---[\s\S]*?---\s*([\s\S]*)$/);
							skills.push({ name, scope: 'project', description: descMatch ? descMatch[1].trim() : '', content: bodyMatch ? bodyMatch[1].trim() : text });
						} catch { /* no SKILL.md */ }
					}
				}
			} catch { /* dir doesn't exist */ }
		}

		this._postMessage({ type: 'skillsList', data: skills });
	}

	private async _saveSkill(name: string, scope: string, content: string): Promise<void> {
		try {
			let baseDir: string;
			if (scope === 'project') {
				const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
				if (!workspaceFolder) { throw new Error('No workspace folder'); }
				baseDir = path.join(workspaceFolder, '.claude', 'skills');
			} else {
				const homeDir = process.env.HOME || process.env.USERPROFILE || '';
				baseDir = path.join(homeDir, '.claude', 'skills');
			}

			const skillDir = path.join(baseDir, name);
			await vscode.workspace.fs.createDirectory(vscode.Uri.file(skillDir));
			const skillPath = path.join(skillDir, 'SKILL.md');
			await vscode.workspace.fs.writeFile(vscode.Uri.file(skillPath), new TextEncoder().encode(content));

			this._postMessage({ type: 'skillSaved', data: { name } });
			vscode.window.showInformationMessage(`Skill "${name}" created successfully.`);
		} catch (err: any) {
			vscode.window.showErrorMessage(`Failed to create skill: ${err.message}`);
		}
	}

	private async _deleteSkill(name: string, scope: string): Promise<void> {
		try {
			let baseDir: string;
			if (scope === 'project') {
				const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
				if (!workspaceFolder) { throw new Error('No workspace folder'); }
				baseDir = path.join(workspaceFolder, '.claude', 'skills');
			} else {
				const homeDir = process.env.HOME || process.env.USERPROFILE || '';
				baseDir = path.join(homeDir, '.claude', 'skills');
			}

			const skillDir = path.join(baseDir, name);
			await vscode.workspace.fs.delete(vscode.Uri.file(skillDir), { recursive: true });

			this._postMessage({ type: 'skillDeleted', data: { name } });
			vscode.window.showInformationMessage(`Skill "${name}" deleted.`);
		} catch (err: any) {
			vscode.window.showErrorMessage(`Failed to delete skill: ${err.message}`);
		}
	}

	private async _searchSkills(query: string): Promise<void> {
		try {
			const res = await fetch(`https://skills.sh/api/search?q=${encodeURIComponent(query)}&limit=20`);
			if (!res.ok) { throw new Error('HTTP ' + res.status); }
			const data = await res.json() as any;
			this._postMessage({ type: 'skillsSearchResponse', data });
		} catch (err: any) {
			this._postMessage({ type: 'skillsSearchResponse', data: { skills: [] } });
		}
	}

	// ─── Plugins ───

	private async _getClaudeSettingsPath(): Promise<string | undefined> {
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
		if (!workspaceFolder) { return undefined; }
		return path.join(workspaceFolder, '.claude', 'settings.json');
	}

	private async _readClaudeSettings(): Promise<any> {
		const settingsPath = await this._getClaudeSettingsPath();
		if (!settingsPath) { return {}; }
		try {
			const content = await vscode.workspace.fs.readFile(vscode.Uri.file(settingsPath));
			return JSON.parse(new TextDecoder().decode(content));
		} catch {
			return {};
		}
	}

	private async _writeClaudeSettings(settings: any): Promise<void> {
		const settingsPath = await this._getClaudeSettingsPath();
		if (!settingsPath) { return; }
		const dirPath = path.dirname(settingsPath);
		await vscode.workspace.fs.createDirectory(vscode.Uri.file(dirPath));
		await vscode.workspace.fs.writeFile(
			vscode.Uri.file(settingsPath),
			new TextEncoder().encode(JSON.stringify(settings, null, 2) + '\n')
		);
	}

	private async _loadPlugins(): Promise<void> {
		const settings = await this._readClaudeSettings();
		const enabled = settings.enabledPlugins || {};
		this._postMessage({ type: 'pluginsList', data: { enabled } });
	}

	private async _installPlugin(installId: string): Promise<void> {
		try {
			const settings = await this._readClaudeSettings();
			if (!settings.enabledPlugins) { settings.enabledPlugins = {}; }
			settings.enabledPlugins[installId] = true;
			await this._writeClaudeSettings(settings);
			this._postMessage({ type: 'pluginInstalled', data: { installId } });
			vscode.window.showInformationMessage(`Plugin "${installId.replace(/@.*$/, '')}" enabled.`);
		} catch (err: any) {
			vscode.window.showErrorMessage(`Failed to enable plugin: ${err.message}`);
		}
	}

	private async _removePlugin(installId: string): Promise<void> {
		try {
			const settings = await this._readClaudeSettings();
			if (settings.enabledPlugins) {
				delete settings.enabledPlugins[installId];
				if (Object.keys(settings.enabledPlugins).length === 0) {
					delete settings.enabledPlugins;
				}
			}
			await this._writeClaudeSettings(settings);
			this._postMessage({ type: 'pluginRemoved', data: { installId } });
			vscode.window.showInformationMessage(`Plugin "${installId.replace(/@.*$/, '')}" removed.`);
		} catch (err: any) {
			vscode.window.showErrorMessage(`Failed to remove plugin: ${err.message}`);
		}
	}

	private _runTerminalCommand(command: string): void {
		const terminal = vscode.window.createTerminal({
			name: 'Claude Code',
			location: vscode.TerminalLocation.Editor
		});
		terminal.show();
		terminal.sendText(command);
	}

	private async _fetchMarketplace(url: string, append?: boolean, isSearch?: boolean): Promise<void> {
		try {
			const res = await fetch(url, {
				headers: { 'accept': 'application/json' }
			});
			if (!res.ok) { throw new Error('HTTP ' + res.status); }
			const data = await res.json() as any;
			data._append = !!append;
			data._isSearch = !!isSearch;
			this._postMessage({ type: 'marketplaceResponse', data });
		} catch (err: any) {
			console.error('Marketplace fetch error:', err);
			this._postMessage({ type: 'marketplaceError', data: { error: err.message } });
		}
	}

	private _getExtensionMCPConfigPath(): string | undefined {
		const storagePath = this._context.storageUri?.fsPath;
		if (!storagePath) { return undefined; }
		return path.join(storagePath, 'mcp', 'mcp-servers.json');
	}

	private _getMCPConfigPathForScope(scope: string): string | undefined {
		if (scope === 'global') {
			const homeDir = process.env.HOME || process.env.USERPROFILE || '';
			return homeDir ? path.join(homeDir, '.claude.json') : undefined;
		}
		if (scope === 'project') {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
			return workspaceFolder ? path.join(workspaceFolder, '.mcp.json') : undefined;
		}
		// 'extension' scope — the private config
		return this._getExtensionMCPConfigPath();
	}

	private async _readMCPConfigFile(filePath: string): Promise<Record<string, any>> {
		try {
			const content = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
			const config = JSON.parse(new TextDecoder().decode(content));
			return config.mcpServers || {};
		} catch {
			return {};
		}
	}

	private async _loadMCPServers(): Promise<void> {
		try {
			const servers: Record<string, any> = {};

			// Read extension's private config
			const extPath = this._getExtensionMCPConfigPath();
			if (extPath) {
				const extServers = await this._readMCPConfigFile(extPath);
				for (const [name, config] of Object.entries(extServers)) {
					if (name === 'claude-code-chat-permissions') continue;
					servers[name] = { ...config as any, _scope: 'extension' };
				}
			}

			// Read project .mcp.json
			const projectPath = this._getMCPConfigPathForScope('project');
			if (projectPath) {
				const projectServers = await this._readMCPConfigFile(projectPath);
				for (const [name, config] of Object.entries(projectServers)) {
					if (!servers[name]) {
						servers[name] = { ...config as any, _scope: 'project' };
					}
				}
			}

			// Read global ~/.claude.json
			const globalPath = this._getMCPConfigPathForScope('global');
			if (globalPath) {
				const globalServers = await this._readMCPConfigFile(globalPath);
				for (const [name, config] of Object.entries(globalServers)) {
					if (!servers[name]) {
						servers[name] = { ...config as any, _scope: 'global' };
					}
				}
			}

			this._postMessage({ type: 'mcpServers', data: servers });
		} catch (error) {
			console.error('Error loading MCP servers:', error);
			this._postMessage({ type: 'mcpServerError', data: { error: 'Failed to load MCP servers' } });
		}
	}

	private async _saveMCPServer(name: string, config: any, scope: string): Promise<void> {
		try {
			// Remove internal _scope field before saving
			const cleanConfig = { ...config };
			delete cleanConfig._scope;

			const configPath = this._getMCPConfigPathForScope(scope);
			if (!configPath) {
				this._postMessage({ type: 'mcpServerError', data: { error: scope === 'project' ? 'No workspace folder open' : 'Config path not available' } });
				return;
			}

			// Ensure directory exists for extension scope
			if (scope === 'extension') {
				const dir = vscode.Uri.file(path.dirname(configPath));
				try { await vscode.workspace.fs.stat(dir); } catch {
					await vscode.workspace.fs.createDirectory(dir);
				}
			}

			const configUri = vscode.Uri.file(configPath);
			let fileConfig: any = {};

			try {
				const content = await vscode.workspace.fs.readFile(configUri);
				fileConfig = JSON.parse(new TextDecoder().decode(content));
			} catch {
				// File doesn't exist
			}

			if (!fileConfig.mcpServers) {
				fileConfig.mcpServers = {};
			}

			fileConfig.mcpServers[name] = cleanConfig;

			const configContent = new TextEncoder().encode(JSON.stringify(fileConfig, null, 2));
			await vscode.workspace.fs.writeFile(configUri, configContent);

			this._postMessage({ type: 'mcpServerSaved', data: { name } });
		} catch (error) {
			console.error('Error saving MCP server:', error);
			this._postMessage({ type: 'mcpServerError', data: { error: 'Failed to save MCP server' } });
		}
	}

	private async _deleteMCPServer(name: string, scope: string): Promise<void> {
		try {
			const configPath = this._getMCPConfigPathForScope(scope);
			if (!configPath) {
				this._postMessage({ type: 'mcpServerError', data: { error: 'Config path not available' } });
				return;
			}

			const configUri = vscode.Uri.file(configPath);
			let fileConfig: any = {};

			try {
				const content = await vscode.workspace.fs.readFile(configUri);
				fileConfig = JSON.parse(new TextDecoder().decode(content));
			} catch {
				this._postMessage({ type: 'mcpServerError', data: { error: 'Config file not found' } });
				return;
			}

			if (fileConfig.mcpServers && fileConfig.mcpServers[name]) {
				delete fileConfig.mcpServers[name];
				const configContent = new TextEncoder().encode(JSON.stringify(fileConfig, null, 2));
				await vscode.workspace.fs.writeFile(configUri, configContent);
				this._postMessage({ type: 'mcpServerDeleted', data: { name } });
			} else {
				this._postMessage({ type: 'mcpServerError', data: { error: `Server '${name}' not found` } });
			}
		} catch (error) {
			console.error('Error deleting MCP server:', error);
			this._postMessage({ type: 'mcpServerError', data: { error: 'Failed to delete MCP server' } });
		}
	}

	private async _sendCustomSnippets(): Promise<void> {
		try {
			const customSnippets = this._context.globalState.get<{ [key: string]: any }>('customPromptSnippets', {});
			this._postMessage({
				type: 'customSnippetsData',
				data: customSnippets
			});
		} catch (error) {
			console.error('Error loading custom snippets:', error);
			this._postMessage({
				type: 'customSnippetsData',
				data: {}
			});
		}
	}

	private async _saveCustomSnippet(snippet: any): Promise<void> {
		try {
			const customSnippets = this._context.globalState.get<{ [key: string]: any }>('customPromptSnippets', {});
			customSnippets[snippet.id] = snippet;

			await this._context.globalState.update('customPromptSnippets', customSnippets);

			this._postMessage({
				type: 'customSnippetSaved',
				data: { snippet }
			});

		} catch (error) {
			console.error('Error saving custom snippet:', error);
			this._postMessage({
				type: 'error',
				data: 'Failed to save custom snippet'
			});
		}
	}

	private async _deleteCustomSnippet(snippetId: string): Promise<void> {
		try {
			const customSnippets = this._context.globalState.get<{ [key: string]: any }>('customPromptSnippets', {});

			if (customSnippets[snippetId]) {
				delete customSnippets[snippetId];
				await this._context.globalState.update('customPromptSnippets', customSnippets);

				this._postMessage({
					type: 'customSnippetDeleted',
					data: { snippetId }
				});

			} else {
				this._postMessage({
					type: 'error',
					data: 'Snippet not found'
				});
			}
		} catch (error) {
			console.error('Error deleting custom snippet:', error);
			this._postMessage({
				type: 'error',
				data: 'Failed to delete custom snippet'
			});
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


	private _sendAndSaveMessage(message: { type: string, data: any }): void {

		// Initialize conversation if this is the first message
		if (this._currentConversation.length === 0) {
			this._conversationStartTime = new Date().toISOString();
		}

		// The message index will be the current length (0-indexed position after push)
		const messageIndex = this._currentConversation.length;

		// For tool messages that support diff, include the message index
		const messageToSend = (message.type === 'toolUse' || message.type === 'toolResult')
			? { ...message, data: { ...message.data, messageIndex } }
			: message;

		// Send to UI using the helper method
		this._postMessage(messageToSend);

		// Strip fileContentBefore/fileContentAfter from saved data to reduce storage
		// Keep startLine/startLines which are small and needed for accurate line numbers on reload
		let dataToSave = message.data;
		if (message.type === 'toolUse' || message.type === 'toolResult') {
			const { fileContentBefore, fileContentAfter, ...rest } = message.data || {};
			dataToSave = rest; // startLine and startLines are preserved in rest
		}

		// Save to conversation
		this._currentConversation.push({
			timestamp: new Date().toISOString(),
			messageType: message.type,
			data: dataToSave
		});

		// Persist conversation
		void this._saveCurrentConversation();
	}

	private async _saveCurrentConversation(): Promise<void> {
		if (!this._conversationsPath || this._currentConversation.length === 0) { return; }
		if (!this._currentSessionId) { return; }

		try {
			// Create filename from first user message and timestamp
			const firstUserMessage = this._currentConversation.find(m => m.messageType === 'userInput');
			const firstMessage = firstUserMessage ? firstUserMessage.data : 'conversation';
			const startTime = this._conversationStartTime || new Date().toISOString();
			const sessionId = this._currentSessionId || 'unknown';

			// Clean and truncate first message for filename
			const cleanMessage = firstMessage
				.replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars
				.replace(/\s+/g, '-') // Replace spaces with dashes
				.substring(0, 50) // Limit length
				.toLowerCase();

			const datePrefix = startTime.substring(0, 16).replace('T', '_').replace(/:/g, '-');
			const filename = `${datePrefix}_${cleanMessage}.json`;

			const conversationData: ConversationData = {
				sessionId: sessionId,
				startTime: this._conversationStartTime,
				endTime: new Date().toISOString(),
				messageCount: this._currentConversation.length,
				totalCost: this._totalCost,
				totalTokens: {
					input: this._totalTokensInput,
					output: this._totalTokensOutput
				},
				messages: this._currentConversation,
				filename
			};

			const filePath = path.join(this._conversationsPath, filename);
			const content = new TextEncoder().encode(JSON.stringify(conversationData, null, 2));
			await vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), content);

			// Update conversation index
			this._updateConversationIndex(filename, conversationData);

		} catch (error: any) {
			console.error('Failed to save conversation:', error.message);
		}
	}


	public async loadConversation(filename: string): Promise<void> {
		// Load the conversation history
		await this._loadConversationHistory(filename);
	}

	private _sendConversationList(): void {
		this._postMessage({
			type: 'conversationList',
			data: this._conversationIndex
		});
	}

	private async _sendWorkspaceFiles(searchTerm?: string): Promise<void> {
		try {
			// Always get all files and filter on the backend for better search results
			const files = await vscode.workspace.findFiles(
				'**/*',
				'{**/node_modules/**,**/.git/**,**/dist/**,**/build/**,**/.next/**,**/.nuxt/**,**/target/**,**/bin/**,**/obj/**}',
				500 // Reasonable limit for filtering
			);

			let fileList = files.map(file => {
				const relativePath = vscode.workspace.asRelativePath(file);
				return {
					name: file.path.split('/').pop() || '',
					path: relativePath,
					fsPath: file.fsPath
				};
			});

			// Filter results based on search term
			if (searchTerm && searchTerm.trim()) {
				const term = searchTerm.toLowerCase();
				fileList = fileList.filter(file => {
					const fileName = file.name.toLowerCase();
					const filePath = file.path.toLowerCase();

					// Check if term matches filename or any part of the path
					return fileName.includes(term) ||
						filePath.includes(term) ||
						filePath.split('/').some(segment => segment.includes(term));
				});
			}

			// Sort and limit results
			fileList = fileList
				.sort((a, b) => a.name.localeCompare(b.name))
				.slice(0, 50);

			this._postMessage({
				type: 'workspaceFiles',
				data: fileList
			});
		} catch (error) {
			console.error('Error getting workspace files:', error);
			this._postMessage({
				type: 'workspaceFiles',
				data: []
			});
		}
	}

	private async _selectImageFile(): Promise<void> {
		try {
			// Show VS Code's native file picker for images
			const result = await vscode.window.showOpenDialog({
				canSelectFiles: true,
				canSelectFolders: false,
				canSelectMany: true,
				title: 'Select image files',
				filters: {
					'Images': ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp']
				}
			});

			if (result && result.length > 0) {
				for (const uri of result) {
					const dataUri = await this._getImageDataUri(uri.fsPath);
					if (dataUri) {
						this._postMessage({
							type: 'imageAttached',
							filePath: uri.fsPath,
							previewUri: dataUri
						});
					}
				}
			}

		} catch (error) {
			console.error('Error selecting image files:', error);
		}
	}

	private async _killProcessGroup(pid: number, signal: string = 'SIGTERM'): Promise<void> {
		if (this._isWslProcess) {
			// WSL: Kill processes inside WSL using pkill
			// The Windows PID won't work inside WSL, so we kill by name
			try {
				// Kill all node/claude processes started by this session inside WSL
				const killSignal = signal === 'SIGKILL' ? '-9' : '-15';
				await exec(`wsl -d ${this._wslDistro} pkill ${killSignal} -f "claude"`);
			} catch {
				// Process may already be dead or pkill not available
			}
			// Also kill the Windows-side wsl process
			try {
				await exec(`taskkill /pid ${pid} /t /f`);
			} catch {
				// Process may already be dead
			}
		} else if (process.platform === 'win32') {
			// Windows: Use taskkill with /T flag for tree kill
			try {
				await exec(`taskkill /pid ${pid} /t /f`);
			} catch {
				// Process may already be dead
			}
		} else {
			// Unix: Kill process group with negative PID
			try {
				process.kill(-pid, signal as NodeJS.Signals);
			} catch {
				// Process may already be dead
			}
		}
	}

	private async _killClaudeProcess(): Promise<void> {
		const processToKill = this._currentClaudeProcess;
		const pid = processToKill?.pid;

		// 1. Abort via controller (clean API)
		this._abortController?.abort();
		this._abortController = undefined;

		// 2. Clear reference immediately
		this._currentClaudeProcess = undefined;

		if (!pid) {
			return;
		}


		// 3. Kill process group (handles children)
		await this._killProcessGroup(pid, 'SIGTERM');

		// 4. Wait for process to exit, with timeout
		const exitPromise = new Promise<void>((resolve) => {
			if (processToKill?.killed) {
				resolve();
				return;
			}
			processToKill?.once('exit', () => resolve());
		});

		const timeoutPromise = new Promise<void>((resolve) => {
			setTimeout(() => resolve(), 2000);
		});

		await Promise.race([exitPromise, timeoutPromise]);

		// 5. Force kill if still running
		if (processToKill && !processToKill.killed) {
			await this._killProcessGroup(pid, 'SIGKILL');
		}

	}

	private async _stopClaudeProcess(): Promise<void> {

		this._isProcessing = false;

		// Update UI state
		this._postMessage({
			type: 'setProcessing',
			data: { isProcessing: false }
		});

		await this._killClaudeProcess();

		this._postMessage({
			type: 'clearLoading'
		});

		// Send stop confirmation message directly to UI and save
		this._sendAndSaveMessage({
			type: 'error',
			data: '⏹️ Claude code was stopped.'
		});

		// Refresh OpenCredits balance (request may have consumed credits)
		this._sendOpenCreditsBalance();
	}

	private _updateConversationIndex(filename: string, conversationData: ConversationData): void {
		// Extract first and last user messages
		const userMessages = conversationData.messages.filter((m: any) => m.messageType === 'userInput');
		const firstUserMessage = userMessages.length > 0 ? userMessages[0].data : 'No user message';
		const lastUserMessage = userMessages.length > 0 ? userMessages[userMessages.length - 1].data : firstUserMessage;

		// Create or update index entry
		const indexEntry = {
			filename: filename,
			sessionId: conversationData.sessionId,
			startTime: conversationData.startTime || '',
			endTime: conversationData.endTime,
			messageCount: conversationData.messageCount,
			totalCost: conversationData.totalCost,
			firstUserMessage: firstUserMessage.substring(0, 100), // Truncate for storage
			lastUserMessage: lastUserMessage.substring(0, 100)
		};

		// Remove any existing entry for this session (in case of updates)
		this._conversationIndex = this._conversationIndex.filter(entry => entry.filename !== conversationData.filename);

		// Add new entry at the beginning (most recent first)
		this._conversationIndex.unshift(indexEntry);

		// Keep only last 50 conversations to avoid workspace state bloat
		if (this._conversationIndex.length > 50) {
			this._conversationIndex = this._conversationIndex.slice(0, 50);
		}

		// Save to workspace state
		this._context.workspaceState.update('claude.conversationIndex', this._conversationIndex);
	}

	private _getLatestConversation(): any | undefined {
		return this._conversationIndex.length > 0 ? this._conversationIndex[0] : undefined;
	}

	private async _loadConversationHistory(filename: string): Promise<void> {
		if (!this._conversationsPath) { return; }

		try {
			const filePath = path.join(this._conversationsPath, filename);

			let conversationData: ConversationData;
			try {
				const fileUri = vscode.Uri.file(filePath);
				const content = await vscode.workspace.fs.readFile(fileUri);
				conversationData = JSON.parse(new TextDecoder().decode(content));
			} catch {
				return;
			}

			// Load conversation into current state
			this._currentConversation = conversationData.messages || [];
			this._conversationStartTime = conversationData.startTime;
			this._totalCost = conversationData.totalCost || 0;
			this._totalTokensInput = conversationData.totalTokens?.input || 0;
			this._totalTokensOutput = conversationData.totalTokens?.output || 0;

			// Clear UI messages first, then send all messages to recreate the conversation
			setTimeout(() => {
				// Clear existing messages
				this._postMessage({
					type: 'sessionCleared'
				});

				let requestStartTime: number

				// Small delay to ensure messages are cleared before loading new ones
				setTimeout(() => {
					const messages = this._currentConversation;
					for (let i = 0; i < messages.length; i++) {

						const message = messages[i];

						if(message.messageType === 'permissionRequest'){
							const isLast = i === messages.length - 1;
							if(!isLast){
								continue;
							}
						}

						// For tool messages, include the message index so Open Diff buttons work
						let messageData = (message.messageType === 'toolUse' || message.messageType === 'toolResult')
							? { ...message.data, messageIndex: i }
							: message.data;

						// For permission requests loaded from history, mark pending ones as expired
						// ONLY if there's no active Claude process (i.e., VS Code was restarted)
						if (message.messageType === 'permissionRequest' &&
							message.data?.status === 'pending' &&
							!this._currentClaudeProcess) {
							messageData = { ...message.data, status: 'expired' };
						}

						// For askUserQuestion loaded from history, expire pending ones if no active process
						if (message.messageType === 'askUserQuestion' &&
							message.data?.status === 'pending' &&
							!this._currentClaudeProcess) {
							messageData = { ...message.data, status: 'expired' };
						}

						this._postMessage({
							type: message.messageType,
							data: messageData
						});
						if (message.messageType === 'userInput') {
							try {
								requestStartTime = new Date(message.timestamp).getTime()
							} catch (e) {
								console.error('Failed to parse message timestamp:', e);
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

					// Mark any pending permission requests as expired ONLY if there's no active Claude process
					// (i.e., VS Code was restarted, not just the panel was closed/reopened)
					if (!this._currentClaudeProcess) {
						this._postMessage({
							type: 'expirePendingPermissions'
						});
					}

					// Send ready message after conversation is loaded
					this._sendReadyMessage();
				}, 50);
			}, 100); // Small delay to ensure webview is ready

		} catch (error: any) {
			console.error('Failed to load conversation history:', error.message);
		}
	}

	private _getHtmlForWebview(): string {
		return getHtml(vscode.env?.isTelemetryEnabled, OPENCREDITS_API_URL, OPENCREDITS_WEB_URL, OPENCREDITS_PUBLISHABLE_KEY, vscode.env?.appName);
	}

	private _sendCurrentSettings(): void {
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const settings = {
			'thinking.intensity': config.get<string>('thinking.intensity', 'think'),
			'wsl.enabled': config.get<boolean>('wsl.enabled', false),
			'wsl.distro': config.get<string>('wsl.distro', 'Ubuntu'),
			'wsl.nodePath': config.get<string>('wsl.nodePath', '/usr/bin/node'),
			'wsl.claudePath': config.get<string>('wsl.claudePath', '/usr/local/bin/claude'),
			'permissions.yoloMode': config.get<boolean>('permissions.yoloMode', false),
			'router.enabled': config.get<boolean>('router.enabled', false),
			'executable.path': config.get<string>('executable.path', ''),
			'environment.variables': config.get<Record<string, string>>('environment.variables', {}),
			'environment.disabled': config.get<boolean>('environment.disabled', false),
			'isOpenCredits': this._isOpenCredits()
		};

		this._postMessage({
			type: 'settingsData',
			data: settings
		});
	}

	private async _enableYoloMode(): Promise<void> {
		try {
			// Update VS Code configuration to enable YOLO mode
			const config = vscode.workspace.getConfiguration('claudeCodeChat');

			// Clear any global setting and set workspace setting
			await config.update('permissions.yoloMode', true, vscode.ConfigurationTarget.Workspace);


			// Send updated settings to UI
			this._sendCurrentSettings();

		} catch (error) {
			console.error('Error enabling YOLO mode:', error);
		}
	}

	private _saveInputText(text: string): void {
		this._draftMessage = text || '';
	}

	private async _updateSettings(settings: { [key: string]: any }): Promise<void> {
		const config = vscode.workspace.getConfiguration('claudeCodeChat');

		try {
			for (const [key, value] of Object.entries(settings)) {
				if (key === 'permissions.yoloMode') {
					// YOLO mode: try workspace first, fall back to global
					try {
						await config.update(key, value, vscode.ConfigurationTarget.Workspace);
					} catch {
						await config.update(key, value, vscode.ConfigurationTarget.Global);
					}
				} else {
					// Other settings are global (user-wide)
					await config.update(key, value, vscode.ConfigurationTarget.Global);
				}
			}

			// Re-send settings so webview gets updated isOpenCredits flag, etc.
			this._sendCurrentSettings();

			// Update balance display based on new env vars
			if (this._isOpenCredits() || this._getOpenCreditsKey()) {
				this._sendOpenCreditsBalance();
			} else {
				// Clear balance if no longer OpenCredits
				this._postMessage({
					type: 'opencreditsBalance',
					balance: null
				});
			}
		} catch (error: any) {
			console.error('Failed to update settings:', error?.message || error);
			vscode.window.showErrorMessage(`Failed to update settings: ${error?.message || 'Unknown error'}`);
		}
	}

	private async _getClipboardText(): Promise<void> {
		try {
			const text = await vscode.env.clipboard.readText();
			this._postMessage({
				type: 'clipboardText',
				data: text
			});
		} catch (error) {
			console.error('Failed to read clipboard:', error);
		}
	}

	private async _setSelectedModel(model: string, tierModels?: { sonnet: string; opus: string; haiku: string }): Promise<void> {
		// Valid Claude models
		const validClaudeModels = ['opus', 'sonnet', 'default'];

		if (validClaudeModels.includes(model)) {
			this._selectedModel = model;

			// Store the model preference in workspace state
			this._context.workspaceState.update('claude.selectedModel', model);

			// Remove model env vars so Claude CLI uses defaults
			await this._removeModelEnvVars();

			// Refresh settings UI to reflect removed env vars
			this._sendCurrentSettings();

			// Show confirmation
			vscode.window.showInformationMessage(`Model switched to: ${model.charAt(0).toUpperCase() + model.slice(1)}`);
		} else {
			// Any other model is treated as a OpenCredits model
			this._selectedModel = model;

			// Store the model preference in workspace state
			this._context.workspaceState.update('claude.selectedModel', model);

			// Set model env vars so Claude CLI routes to this model
			await this._setModelEnvVars(model, tierModels);

			// Notify webview that model is switching
			this._postMessage({
				type: 'modelSwitching',
				model: model
			});

			// Update the local router config to use this model
			this._updateLocalRouterModel(model, tierModels);

			// Fetch and send balance
			await this._sendOpenCreditsBalance();

			// Notify webview that model switch is complete
			this._postMessage({
				type: 'modelSwitched',
				model: model
			});

			// Show confirmation
			vscode.window.showInformationMessage(`Model switched to: ${model}`);
		}
	}

	// Set model env vars for non-Claude models
	private async _setModelEnvVars(model: string, tierModels?: { sonnet: string; opus: string; haiku: string }): Promise<void> {
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const envVars = config.get<Record<string, string>>('environment.variables', {});
		envVars['ANTHROPIC_DEFAULT_SONNET_MODEL'] = tierModels?.sonnet || model;
		envVars['ANTHROPIC_DEFAULT_OPUS_MODEL'] = tierModels?.opus || model;
		envVars['ANTHROPIC_DEFAULT_HAIKU_MODEL'] = tierModels?.haiku || model;
		await config.update('environment.variables', envVars, vscode.ConfigurationTarget.Global);
	}

	// Remove model env vars so Claude CLI uses defaults
	private async _removeModelEnvVars(): Promise<void> {
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const envVars = config.get<Record<string, string>>('environment.variables', {});
		const filtered: Record<string, string> = {};
		for (const [key, value] of Object.entries(envVars)) {
			if (key !== 'ANTHROPIC_DEFAULT_SONNET_MODEL' &&
				key !== 'ANTHROPIC_DEFAULT_OPUS_MODEL' &&
				key !== 'ANTHROPIC_DEFAULT_HAIKU_MODEL') {
				filtered[key] = value;
			}
		}
		await config.update('environment.variables', filtered, vscode.ConfigurationTarget.Global);
	}

	// Fetch OpenCredits account balance
	private async _fetchOpenCreditsBalance(): Promise<number | null> {
		const userKey = this._getOpenCreditsKey();

		if (!userKey) {
			return null;
		}

		try {
			const response = await fetch(OPENCREDITS_API_URL + '/v1/credits/balance', {
				method: 'GET',
				headers: {
					'X-User-Key': userKey,
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				console.error('Failed to fetch OpenCredits balance:', response.status);
				return null;
			}

			const data = await response.json() as { balance?: number };
			return data.balance != null ? data.balance : null;
		} catch (error) {
			console.error('Error fetching OpenCredits balance:', error);
			return null;
		}
	}

	private async _sendOpenCreditsBalance(): Promise<void> {
		const balance = await this._fetchOpenCreditsBalance();
		this._postMessage({
			type: 'opencreditsBalance',
			balance: balance
		});
	}

	private async _openOpenCreditsAccount(): Promise<void> {
		const url = OPENCREDITS_WEB_URL + '/dashboard';

		// Open via native OS command
		const openCmd = process.platform === 'darwin' ? 'open'
			: process.platform === 'win32' ? 'start'
			: 'xdg-open';
		cp.spawn(openCmd, [url], { detached: true, stdio: 'ignore' }).unref();

		// Show fallback modal in webview in case native open didn't work
		this._postMessage({
			type: 'openedExternalUrl',
			url: url
		});
	}

	// Update the model configuration for the local router
	private _updateLocalRouterModel(model: string, tierModels?: { sonnet: string; opus: string; haiku: string }): void {
		setModelConfig({
			haikuModel: tierModels?.haiku || model,
			sonnetModel: tierModels?.sonnet || model,
			opusModel: tierModels?.opus || model
		});
	}

	private _openModelTerminal(): void {
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const wslEnabled = config.get<boolean>('wsl.enabled', false);
		const wslDistro = config.get<string>('wsl.distro', 'Ubuntu');
		const nodePath = config.get<string>('wsl.nodePath', '/usr/bin/node');
		const claudePath = config.get<string>('wsl.claudePath', '/usr/local/bin/claude');

		// Build command arguments
		const args = ['/model'];

		// Add session resume if we have a current session
		if (this._currentSessionId) {
			args.push('--resume', this._currentSessionId);
		}

		// Create terminal with the claude /model command
		const terminal = vscode.window.createTerminal({
			name: 'Claude Model Selection',
			location: { viewColumn: vscode.ViewColumn.One }
		});
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

		// Send message to UI about terminal
		this._postMessage({
			type: 'terminalOpened',
			data: 'Check the terminal to update your default model configuration. Come back to this chat here after making changes.'
		});
	}

	private _openUsageTerminal(usageType: string): void {
		// Get WSL configuration
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const wslEnabled = config.get<boolean>('wsl.enabled', false);
		const wslDistro = config.get<string>('wsl.distro', 'Ubuntu');

		const terminal = vscode.window.createTerminal({
			name: 'Claude Usage',
			location: { viewColumn: vscode.ViewColumn.One }
		});

		let command: string;
		if (usageType === 'plan') {
			// Plan users get live usage view
			command = 'npx -y ccusage blocks --live';
		} else {
			// API users get recent usage history
			command = 'npx -y ccusage blocks --recent --order desc';
		}

		if (wslEnabled) {
			terminal.sendText(`wsl -d ${wslDistro} bash -ic "${command}"`);
		} else {
			terminal.sendText(command);
		}

		terminal.show();
	}

	private _runInstallCommand(): void {
		// Check if npm is available with Node >= 18
		cp.exec('node -e "process.exit(parseInt(process.version.slice(1)) >= 18 ? 0 : 1)"', (checkErr) => {
			if (checkErr) {
				this._postMessage({
					type: 'installComplete',
					success: false,
					error: 'Node.js 18+ is required. Please install Node.js from https://nodejs.org/en/download and try again.'
				});
				return;
			}

			cp.exec('npm install -g @anthropic-ai/claude-code', { timeout: 120000 }, (error) => {
				if (error) {
					this._postMessage({
						type: 'installComplete',
						success: false,
						error: 'Installation failed. Please run in terminal: npm install -g @anthropic-ai/claude-code'
					});
				} else {
					this._postMessage({ type: 'installComplete', success: true });
				}
			});
		});
	}

	private _openLoginTerminal(): void {
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const wslEnabled = config.get<boolean>('wsl.enabled', false);
		const wslDistro = config.get<string>('wsl.distro', 'Ubuntu');
		const nodePath = config.get<string>('wsl.nodePath', '/usr/bin/node');
		const claudePath = config.get<string>('wsl.claudePath', '/usr/local/bin/claude');

		const terminal = vscode.window.createTerminal({
			name: 'Claude Login',
			location: { viewColumn: vscode.ViewColumn.One }
		});

		if (wslEnabled) {
			terminal.sendText(`wsl -d ${wslDistro} ${nodePath} --no-warnings --enable-source-maps ${claudePath}`);
		} else {
			terminal.sendText('claude');
		}
		terminal.show();
	}

	// Start the local router and return its port
	private async _ensureLocalRouter(): Promise<number> {
		// Update model config with the selected model, restoring tier models from persisted env vars
		if (this._selectedModel && this._selectedModel !== 'default') {
			const config = vscode.workspace.getConfiguration('claudeCodeChat');
			const envVars = config.get<Record<string, string>>('environment.variables', {});
			const sonnet = envVars['ANTHROPIC_DEFAULT_SONNET_MODEL'];
			const opus = envVars['ANTHROPIC_DEFAULT_OPUS_MODEL'];
			const haiku = envVars['ANTHROPIC_DEFAULT_HAIKU_MODEL'];
			const tierModels = (sonnet || opus || haiku)
				? { sonnet: sonnet || this._selectedModel, opus: opus || this._selectedModel, haiku: haiku || this._selectedModel }
				: undefined;
			this._updateLocalRouterModel(this._selectedModel, tierModels);
		}

		// Start the router if not already running
		const port = await startRouter();
		return port;
	}

	private _executeSlashCommand(command: string): void {
		// Handle /compact in chat instead of spawning a terminal
		if (command === 'compact') {
			this._sendMessageToClaude(`/${command}`);
			return;
		}

		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const wslEnabled = config.get<boolean>('wsl.enabled', false);
		const wslDistro = config.get<string>('wsl.distro', 'Ubuntu');
		const nodePath = config.get<string>('wsl.nodePath', '/usr/bin/node');
		const claudePath = config.get<string>('wsl.claudePath', '/usr/local/bin/claude');

		// Build command arguments
		const args = [`/${command}`];

		// Add session resume if we have a current session
		if (this._currentSessionId) {
			args.push('--resume', this._currentSessionId);
		}

		// Create terminal with the claude command
		const terminal = vscode.window.createTerminal({
			name: `Claude /${command}`,
			location: { viewColumn: vscode.ViewColumn.One }
		});
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

		// Send message to UI about terminal
		this._postMessage({
			type: 'terminalOpened',
			data: `Executing /${command} command in terminal. Check the terminal output and return when ready.`,
		});
	}

	private _sendPlatformInfo() {
		const platform = process.platform;
		const dismissed = this._context.globalState.get<boolean>('wslAlertDismissed', false);

		// Get WSL configuration
		const config = vscode.workspace.getConfiguration('claudeCodeChat');
		const wslEnabled = config.get<boolean>('wsl.enabled', false);

		this._postMessage({
			type: 'platformInfo',
			data: {
				platform: platform,
				isWindows: platform === 'win32',
				wslAlertDismissed: dismissed,
				wslEnabled: wslEnabled
			}
		});
	}

	private _dismissWSLAlert() {
		this._context.globalState.update('wslAlertDismissed', true);
	}

	private async _openFileInEditor(filePath: string) {
		try {
			const uri = vscode.Uri.file(filePath);
			const document = await vscode.workspace.openTextDocument(uri);
			await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to open file: ${filePath}`);
			console.error('Error opening file:', error);
		}
	}

	private async _openDiffByMessageIndex(messageIndex: number) {
		try {
			const message = this._currentConversation[messageIndex];
			if (!message) {
				console.error('Message not found at index:', messageIndex);
				return;
			}

			const data = message.data;
			const toolName = data.toolName;
			const rawInput = data.rawInput;
			let filePath = rawInput?.file_path || '';
			let oldContent = '';
			let newContent = '';

			if (!filePath) {
				console.error('No file path found for message at index:', messageIndex);
				return;
			}

			// Read current file from disk - this is the "before" state since edit hasn't been applied yet
			try {
				const fileUri = vscode.Uri.file(filePath);
				const fileData = await vscode.workspace.fs.readFile(fileUri);
				oldContent = Buffer.from(fileData).toString('utf8');
			} catch {
				// File might not exist yet (for Write creating new file)
				oldContent = '';
			}

			// Compute "after" state by applying the edit to current file
			if (toolName === 'Edit' && rawInput?.old_string && rawInput?.new_string) {
				newContent = oldContent.replace(rawInput.old_string, rawInput.new_string);
			} else if (toolName === 'MultiEdit' && rawInput?.edits) {
				newContent = oldContent;
				for (const edit of rawInput.edits) {
					if (edit.old_string && edit.new_string) {
						newContent = newContent.replace(edit.old_string, edit.new_string);
					}
				}
			} else if (toolName === 'Write' && rawInput?.content) {
				newContent = rawInput.content;
			}

			if (oldContent !== newContent) {
				await this._openDiffEditor(oldContent, newContent, filePath);
			} else {
				vscode.window.showInformationMessage('No changes to show - the edit may have already been applied.');
			}
		} catch (error) {
			console.error('Error opening diff by message index:', error);
		}
	}

	private async _openDiffEditor(oldContent: string, newContent: string, filePath: string) {
		try {
			// oldContent and newContent are now full file contents passed from the webview
			const baseName = path.basename(filePath);
			const timestamp = Date.now();

			// Create unique paths for the virtual documents
			const oldPath = `/${timestamp}/old/${baseName}`;
			const newPath = `/${timestamp}/new/${baseName}`;

			// Store content in the global store for the content provider
			diffContentStore.set(oldPath, oldContent);
			diffContentStore.set(newPath, newContent);

			// Create URIs with our custom scheme
			const oldUri = vscode.Uri.parse(`claude-diff:${oldPath}`);
			const newUri = vscode.Uri.parse(`claude-diff:${newPath}`);

			// Ensure side-by-side diff mode is enabled
			const diffConfig = vscode.workspace.getConfiguration('diffEditor');
			const wasInlineMode = diffConfig.get('renderSideBySide') === false;
			if (wasInlineMode) {
				await diffConfig.update('renderSideBySide', true, vscode.ConfigurationTarget.Global);
			}

			// Open diff editor
			await vscode.commands.executeCommand('vscode.diff', oldUri, newUri, `${baseName} (Changes)`);

			// Clean up stored content when documents are closed
			const closeListener = vscode.workspace.onDidCloseTextDocument((doc) => {
				if (doc.uri.toString() === oldUri.toString()) {
					diffContentStore.delete(oldPath);
				}
				if (doc.uri.toString() === newUri.toString()) {
					diffContentStore.delete(newPath);
				}
				// Dispose listener when both are cleaned up
				if (!diffContentStore.has(oldPath) && !diffContentStore.has(newPath)) {
					closeListener.dispose();
				}
			});

			this._disposables.push(closeListener);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to open diff editor: ${error}`);
			console.error('Error opening diff editor:', error);
		}
	}

	private async _createImageFile(imageData: string, imageType: string) {
		try {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder) { return; }

			// Extract base64 data from data URL
			const base64Data = imageData.split(',')[1];
			const buffer = Buffer.from(base64Data, 'base64');

			// Get file extension from image type
			const extension = imageType.split('/')[1] || 'png';

			// Create unique filename with timestamp
			const timestamp = Date.now();
			const imageFileName = `image_${timestamp}.${extension}`;

			// Create images folder in workspace .claude directory
			const imagesDir = vscode.Uri.joinPath(workspaceFolder.uri, '.claude', 'claude-code-chat-images');
			await vscode.workspace.fs.createDirectory(imagesDir);

			// Create .gitignore to ignore all images
			const gitignorePath = vscode.Uri.joinPath(imagesDir, '.gitignore');
			try {
				await vscode.workspace.fs.stat(gitignorePath);
			} catch {
				// .gitignore doesn't exist, create it
				const gitignoreContent = new TextEncoder().encode('*\n');
				await vscode.workspace.fs.writeFile(gitignorePath, gitignoreContent);
			}

			// Create the image file
			const imagePath = vscode.Uri.joinPath(imagesDir, imageFileName);
			await vscode.workspace.fs.writeFile(imagePath, buffer);

			// Send the file path back to webview — use the original data URL for preview
			this._postMessage({
				type: 'imageAttached',
				filePath: imagePath.fsPath,
				previewUri: imageData
			});

		} catch (error) {
			console.error('Error creating image file:', error);
			vscode.window.showErrorMessage('Failed to create image file');
		}
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

		while (this._disposables.length) {
			const disposable = this._disposables.pop();
			if (disposable) {
				disposable.dispose();
			}
		}
	}
}