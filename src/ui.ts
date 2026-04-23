import getScript from './script';
import styles from './ui-styles'
import recommendedModels from './recommended-models.json'
import topMcpServers from './top-mcp-servers.json'
import topSkills from './top-skills.json'
import topPlugins from './top-plugins.json'
import getSkillsHtml from './skills-ui'
import getPluginsHtml from './plugins-ui'


const getHtml = (isTelemetryEnabled: boolean, opencreditsApiUrl: string = 'https://ccc.api.opencredits.ai', opencreditsWebUrl: string = 'https://ccc.opencredits.ai', opencreditsPublishableKey: string = 'oc_pk_c43da4f9a9484ae484ad29bc97cc354f', editorName: string = 'unknown') => `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; frame-src *;">
	<title>Claude Code Chat</title>
	${styles}
</head>
<body>
	<div class="header">
		<div style="display: flex; align-items: center;">
			<h2>Claude Code Chat</h2>
			<!-- <div id="sessionInfo" class="session-badge" style="display: none;">
				<span class="session-icon">💬</span>
				<span id="sessionId">-</span>
				<span class="session-label">session</span>
			</div> -->
		</div>
		<div style="display: flex; gap: 8px; align-items: center;">
			<div id="sessionStatus" class="session-status" style="display: none;">No session</div>
			<button class="btn outlined" id="settingsBtn" onclick="toggleSettings()" title="Settings">⚙️</button>
			<button class="btn outlined" id="historyBtn" onclick="toggleConversationHistory()">📚 History</button>
			<button class="btn primary" id="newSessionBtn" onclick="newSession()">New Chat</button>
		</div>
	</div>
	
	<div id="conversationHistory" class="conversation-history" style="display: none;">
		<div class="conversation-header">
			<h3>Conversation History</h3>
			<button class="btn" onclick="toggleConversationHistory()">✕ Close</button>
		</div>
		<div id="conversationList" class="conversation-list">
			<!-- Conversations will be loaded here -->
		</div>
	</div>

	<div class="chat-container" id="chatContainer">
		<div class="messages" id="messages"></div>
		
		<!-- WSL Alert for Windows users -->
		<div id="wslAlert" class="wsl-alert" style="display: none;">
			<div class="wsl-alert-content">
				<div class="wsl-alert-icon">💻</div>
				<div class="wsl-alert-text">
					<strong>Looks like you are using Windows!</strong><br/>
					If you are using WSL to run Claude Code, you should enable WSL integration in the settings.
				</div>
				<div class="wsl-alert-actions">
					<button class="btn" onclick="openWSLSettings()">Enable WSL</button>
					<button class="btn outlined" onclick="dismissWSLAlert()">Dismiss</button>
				</div>
			</div>
		</div>
		
		<div class="input-container" id="inputContainer">
			<div class="model-selector-row">
				<button class="model-selector-main" id="modelDropdownBtn" onclick="showModelSelector()" title="Select model">
					<span id="modelDropdownText">Opus</span>
					<svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"><path d="M1 2.5l3 3 3-3"></path></svg>
				</button>
				<button class="model-selector-main" id="modelSelector" onclick="showModelSelector()" title="Select model" style="display: none;">
					<span class="model-selector-new" id="modelSelectorBadge">NEW</span>
					<span id="modelSelectorText">Try other models</span>
				</button>
				<div class="model-quick-select" id="modelQuickSelect">
				</div>
				<button class="model-more-btn" id="modelMoreBtn" onclick="showModelSelector()" style="display: none;">+</button>
			</div>
			<div class="textarea-container">
				<div class="textarea-wrapper">
					<div class="image-preview-container" id="imagePreviewContainer" style="display: none;"></div>
					<textarea class="input-field" id="messageInput" placeholder="Type your message to Claude Code..." rows="1"></textarea>
					<div class="input-controls">
						<div class="left-controls">
							<div class="connect-dropdown-wrapper">
								<button class="input-dropdown-btn" id="connectBtn" onclick="toggleConnectMenu()">
									<span>Add</span>
									<svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"><path d="M1 2.5l3 3 3-3"></path></svg>
								</button>
								<div class="connect-menu" id="connectMenu" style="display: none;">
									<div class="connect-menu-header">Add</div>
									<button class="connect-menu-item" onclick="hideConnectMenu(); showPluginsModal();">
										<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
										<span>Plugins</span>
									</button>
									<button class="connect-menu-item" onclick="hideConnectMenu(); showSkillsModal();">
										<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
										<span>Skills</span>
									</button>
									<button class="connect-menu-item" onclick="hideConnectMenu(); showMCPModal();">
										<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="6" cy="6" r="1" fill="currentColor"/><circle cx="6" cy="18" r="1" fill="currentColor"/></svg>
										<span>MCP Servers</span>
									</button>
								</div>
							</div>
							<button class="input-toggle-btn" id="planToggleBtn" onclick="cyclePlanMode()">Plan</button>
							<button class="input-toggle-btn" id="thinkToggleBtn" onclick="toggleThinkingMode()">Ultrathink</button>
						</div>
						<div class="right-controls">
							<button class="slash-btn" onclick="showSlashCommandsModal()" title="Slash commands">/</button>
							<button class="at-btn" onclick="showFilePicker()" title="Reference files">@</button>
							<button class="image-btn" id="imageBtn" onclick="selectImage()" title="Attach images">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 16 16"
								width="14"
								height="16"
								>
								<g fill="currentColor">
									<path d="M6.002 5.5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0"></path>
									<path d="M1.5 2A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2zm13 1a.5.5 0 0 1 .5.5v6l-3.775-1.947a.5.5 0 0 0-.577.093l-3.71 3.71l-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12v.54L1 12.5v-9a.5.5 0 0 1 .5-.5z"></path>
								</g>
							</svg>
							</button>
							<button class="send-btn" id="sendBtn" onclick="sendMessage()">
								<div>
								<span>Send </span>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="11" height="11">
									<path fill="currentColor" d="M20 4v9a4 4 0 0 1-4 4H6.914l2.5 2.5L8 20.914L3.086 16L8 11.086L9.414 12.5l-2.5 2.5H16a2 2 0 0 0 2-2V4z"></path>
								</svg>
								</div>
							</button>
							<button class="stop-inline-btn" id="stopInlineBtn" onclick="stopRequest()" style="display: none;">
								<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
									<path d="M6 6h12v12H6z"/>
								</svg>
								Stop
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	
	<div class="status ready" id="status">
		<div class="status-indicator"></div>
		<div class="status-text" id="statusText">Initializing...</div>
		<button class="support-btn" onclick="showSupportModal()" title="Send feedback">
			<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
			Support
		</button>
	</div>

			<div id="yoloWarning" class="yolo-warning" style="display: none;">
			⚠️ Yolo Mode Active: Claude Code will auto-approve all tool requests.
		</div>

	<!-- File picker modal -->
	<div id="filePickerModal" class="file-picker-modal" style="display: none;">
		<div class="file-picker-content">
			<div class="file-picker-header">
				<span>Select File</span>
				<input type="text" id="fileSearchInput" placeholder="Search files..." class="file-search-input">
			</div>
			<div id="fileList" class="file-list">
				<!-- Files will be loaded here -->
			</div>
		</div>
	</div>

	<!-- MCP Servers modal -->
	<div id="mcpModal" class="tools-modal" style="display: none;">
		<div class="tools-modal-content">
			<div class="tools-modal-header">
				<span>MCP Servers</span>
				<button class="tools-close-btn" onclick="hideMCPModal()">✕</button>
			</div>
			<div class="tools-list">
				<div class="mcp-servers-list" id="mcpServersList">
					<!-- MCP servers will be loaded here -->
				</div>
				<div class="mcp-popular-servers" id="popularServers">
					<h4>Search MCP Servers</h4>
					<div class="marketplace-search">
						<input type="text" id="marketplaceSearch" placeholder="Search MCP servers..." oninput="filterMarketplace(this.value)" />
					</div>
					<div class="marketplace-grid" id="marketplaceGrid">
					</div>
					<div class="marketplace-load-more" id="marketplaceLoadMore" style="display: none;">
						<button class="btn outlined" onclick="loadMoreMarketplace()">Load more</button>
					</div>
				</div>
				<div class="mcp-add-form" id="addServerForm" style="display: none;">
				<div class="form-group">
					<label for="serverName">Server Name:</label>
					<input type="text" id="serverName" placeholder="my-server" required>
				</div>
				<div class="form-group">
					<label for="serverScope">Install to:</label>
					<select id="serverScope">
						<option value="project">Project (.mcp.json)</option>
						<option value="global">Global (~/.claude.json)</option>
					</select>
				</div>
				<div class="form-group">
					<label for="serverType">Server Type:</label>
					<select id="serverType" onchange="updateServerForm()">
						<option value="http">HTTP</option>
						<option value="sse">SSE</option>
						<option value="stdio">stdio</option>
					</select>
				</div>
				<div class="form-group" id="commandGroup" style="display: none;">
					<label for="serverCommand">Command:</label>
					<input type="text" id="serverCommand" placeholder="/path/to/server">
				</div>
				<div class="form-group" id="urlGroup">
					<label for="serverUrl">URL:</label>
					<input type="text" id="serverUrl" placeholder="https://example.com/mcp">
				</div>
				<div class="form-group" id="argsGroup" style="display: none;">
					<label for="serverArgs">Arguments (one per line):</label>
					<textarea id="serverArgs" placeholder="--api-key&#10;abc123" rows="3"></textarea>
				</div>
				<div class="form-group" id="envGroup" style="display: none;">
					<label for="serverEnv">Environment Variables (KEY=value, one per line):</label>
					<textarea id="serverEnv" placeholder="API_KEY=123&#10;CACHE_DIR=/tmp" rows="3"></textarea>
				</div>
				<div class="form-group" id="headersGroup">
					<label for="serverHeaders">Headers (KEY=value, one per line):</label>
					<textarea id="serverHeaders" placeholder="Authorization=Bearer token&#10;X-API-Key=key" rows="3"></textarea>
				</div>
				<div class="form-buttons">
					<button class="btn" onclick="saveMCPServer()">Add Server</button>
					<button class="btn outlined" onclick="hideAddServerForm()">Cancel</button>
				</div>
			</div>
		</div>
		<div class="tools-list" id="mcpMarketplaceView" style="display: none;">
			<div class="marketplace-search">
				<input type="text" id="marketplaceSearch" placeholder="Search MCP servers..." oninput="filterMarketplace(this.value)" />
			</div>
			<div class="marketplace-grid" id="marketplaceGrid">
				<div class="marketplace-loading">Loading servers...</div>
			</div>
			<div class="marketplace-load-more" id="marketplaceLoadMore" style="display: none;">
				<button class="btn outlined" onclick="loadMoreMarketplace()">Load more</button>
			</div>
		</div>
	</div>
	</div>

	<!-- Support modal -->
	<div id="supportModal" class="tools-modal" style="display: none;">
		<div class="tools-modal-content" style="max-width: 420px;">
			<div class="tools-modal-header">
				<h3>Send Feedback</h3>
				<button class="tools-close-btn" onclick="hideSupportModal()">✕</button>
			</div>
			<div style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
				<div>
					<label style="font-size: 12px; color: var(--vscode-descriptionForeground); display: block; margin-bottom: 4px;">Type</label>
					<select id="supportType" style="width: 100%; padding: 6px 8px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 4px; font-size: 13px;">
						<option value="bug">Bug Report</option>
						<option value="feature">Feature Request</option>
					</select>
				</div>
				<div>
					<label style="font-size: 12px; color: var(--vscode-descriptionForeground); display: block; margin-bottom: 4px;">Email (optional)</label>
					<input type="email" id="supportEmail" placeholder="your@email.com" style="width: 100%; padding: 6px 8px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 4px; font-size: 13px; box-sizing: border-box;" />
				</div>
				<div>
					<label style="font-size: 12px; color: var(--vscode-descriptionForeground); display: block; margin-bottom: 4px;">Message</label>
					<textarea id="supportMessage" rows="5" placeholder="Describe the issue or suggestion..." style="width: 100%; padding: 6px 8px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 4px; font-size: 13px; resize: vertical; box-sizing: border-box;"></textarea>
				</div>
				<button id="supportSubmitBtn" onclick="submitSupport()" style="padding: 8px 16px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">Send</button>
			</div>
		</div>
	</div>

	<!-- Settings modal -->
	<div id="settingsModal" class="tools-modal" style="display: none;">
		<div class="tools-modal-content" style="max-height: 600px;">
			<div class="tools-modal-header">
				<span>Claude Code Chat Settings</span>
				<button class="tools-close-btn" onclick="hideSettingsModal()">✕</button>
			</div>
			<div class="tools-list" style="max-height: none;">
				<h3 style="margin-top: 0; margin-bottom: 16px; font-size: 14px; font-weight: 600;">WSL Configuration</h3>
				<div>
					<p style="font-size: 11px; color: var(--vscode-descriptionForeground); margin: 0;">
						WSL integration allows you to run Claude Code from within Windows Subsystem for Linux.
						This is useful if you have Claude installed in WSL instead of Windows.
					</p>
				</div>
				<div class="settings-group">
					<div class="tool-item">
						<input type="checkbox" id="wsl-enabled" onchange="updateSettings()">
						<label for="wsl-enabled">Enable WSL Integration</label>
					</div>
					
					<div id="wslOptions" style="margin-left: 24px; margin-top: 12px;">
						<div style="margin-bottom: 12px;">
							<label style="display: block; margin-bottom: 4px; font-size: 12px; color: var(--vscode-descriptionForeground);">WSL Distribution</label>
							<input type="text" id="wsl-distro" class="file-search-input" style="width: 100%;" placeholder="Ubuntu" onchange="updateSettings()">
						</div>
						
						<div style="margin-bottom: 12px;">
							<label style="display: block; margin-bottom: 4px; font-size: 12px; color: var(--vscode-descriptionForeground);">Claude Path in WSL</label>
							<input type="text" id="wsl-claude-path" class="file-search-input" style="width: 100%;" placeholder="/usr/local/bin/claude" onchange="updateSettings()">
							<p style="font-size: 11px; color: var(--vscode-descriptionForeground); margin: 4px 0 0 0;">
								Find your claude installation path in WSL by running: <code style="background: var(--vscode-textCodeBlock-background); padding: 2px 4px; border-radius: 3px;">which claude</code>
							</p>
						</div>

						<div style="margin-bottom: 12px;">
							<label style="display: block; margin-bottom: 4px; font-size: 12px; color: var(--vscode-descriptionForeground);">Node.js Path in WSL (Optional)</label>
							<input type="text" id="wsl-node-path" class="file-search-input" style="width: 100%;" placeholder="/usr/bin/node" onchange="updateSettings()">
							<p style="font-size: 11px; color: var(--vscode-descriptionForeground); margin: 4px 0 0 0;">
								Optional. Only needed if you previously installed Claude via npm. Recent Claude installs ship as a native executable and don't need Node. Set it by running: <code style="background: var(--vscode-textCodeBlock-background); padding: 2px 4px; border-radius: 3px;">which node</code>
							</p>
						</div>
					</div>
				</div>

				<h3 style="margin-top: 24px; margin-bottom: 16px; font-size: 14px; font-weight: 600;">Permissions</h3>
				<div>
					<p style="font-size: 11px; color: var(--vscode-descriptionForeground); margin: 0;">
						Manage commands and tools that are automatically allowed without asking for permission.
					</p>
				</div>
				<div class="settings-group">
					<div id="permissionsList" class="permissions-list">
						<div class="permissions-loading" style="text-align: center; padding: 20px; color: var(--vscode-descriptionForeground);">
							Loading permissions...
						</div>
					</div>
					<div class="permissions-add-section">
						<div id="addPermissionForm" class="permissions-add-form" style="display: none;">
							<div class="permissions-form-row">
								<select id="addPermissionTool" class="permissions-tool-select" onchange="toggleCommandInput()">
									<option value="">Select tool...</option>
									<option value="Bash">Bash</option>
									<option value="Read">Read</option>
									<option value="Edit">Edit</option>
									<option value="Write">Write</option>
									<option value="MultiEdit">MultiEdit</option>
									<option value="Glob">Glob</option>
									<option value="Grep">Grep</option>
									<option value="LS">LS</option>
									<option value="WebSearch">WebSearch</option>
									<option value="WebFetch">WebFetch</option>
								</select>
								<div style="flex-grow: 1; display: flex;">
									<input type="text" id="addPermissionCommand" class="permissions-command-input" placeholder="Command pattern (e.g., npm i *)" style="display: none;" />
								</div>
								<button id="addPermissionBtn" class="permissions-add-btn" onclick="addPermission()">Add</button>
							</div>
							<div id="permissionsFormHint" class="permissions-form-hint">
								Select a tool to add always-allow permission.
							</div>
						</div>
						<button id="showAddPermissionBtn" class="permissions-show-add-btn" onclick="showAddPermissionForm()">
							+ Add permission
						</button>
						<div class="yolo-mode-section">
							<input type="checkbox" id="yolo-mode" onchange="updateSettings(); updateYoloWarning();">
							<label for="yolo-mode">Enable Yolo Mode (Auto-allow all permissions)</label>
						</div>
					</div>
				</div>

				<h3 style="margin-top: 24px; margin-bottom: 16px; font-size: 14px; font-weight: 600;">Customize Claude Command</h3>
				<div>
					<p style="font-size: 11px; color: var(--vscode-descriptionForeground); margin: 0 0 12px 0;">
						Customize the Claude Code executable and environment.
					</p>
					<div id="opencreditsPromo" style="margin-bottom: 16px; padding: 14px 16px; border-radius: 8px; border: 1px solid var(--vscode-panel-border); background: rgba(139, 92, 246, 0.05);"></div>
				</div>
				<div class="settings-group">
					<div style="margin-bottom: 16px;">
						<label style="display: block; margin-bottom: 4px; font-size: 12px; color: var(--vscode-descriptionForeground);">Executable Path</label>
						<input type="text" id="executable-path" class="file-search-input" style="width: 100%;" placeholder="claude (default)" onchange="updateSettings()">
						<p style="font-size: 11px; color: var(--vscode-descriptionForeground); margin: 4px 0 0 0;">
							Custom path to the Claude Code executable. Leave empty to use the default <code style="background: var(--vscode-textCodeBlock-background); padding: 2px 4px; border-radius: 3px;">claude</code> command.
						</p>
					</div>

					<div>
						<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
							<label id="envsLabel" style="font-size: 12px; color: var(--vscode-descriptionForeground);">Environment Variables</label>
							<button id="envsToggleBtn" style="display: none; font-size: 10px; padding: 2px 10px; border-radius: 4px; border: 1px solid var(--vscode-panel-border); background: none; color: var(--vscode-descriptionForeground); cursor: pointer;"></button>
						</div>
						<div id="env-variables-list" class="env-variables-list"></div>
						<button class="permissions-show-add-btn" style="margin-top: 8px;" onclick="addEnvVariable()">+ Add Variable</button>
					</div>

					<div class="tool-item" style="margin-top: 16px; display: none;">
						<input type="checkbox" id="use-router" onchange="updateSettings()">
						<label for="use-router">Enable OpenAI → Anthropic Router</label>
					</div>
					<p style="display: none; font-size: 11px; color: var(--vscode-descriptionForeground); margin: 4px 0 0 24px;">
						Enable this if your API provider uses OpenAI-compatible format. The router will convert requests/responses locally.
					</p>

					<div id="providerExclusionSection" class="tool-item" style="margin-top: 16px; display: none;">
						<input type="checkbox" id="us-eu-providers-only" onchange="applyProviderExclusion()">
						<label for="us-eu-providers-only">Only use US & EU providers</label>
					</div>
					<p id="providerExclusionHint" style="display: none; font-size: 11px; color: var(--vscode-descriptionForeground); margin: 4px 0 0 24px;">
						When enabled, requests are routed only through US and EU-based infrastructure providers.
					</p>
				</div>

			</div>
		</div>
	</div>

	<!-- Model selector modal -->
	<div id="modelModal" class="tools-modal" style="display: none;">
		<div class="tools-modal-content model-modal-content">
			<div class="tools-modal-header">
				<span>Select Model</span>
				<button class="tools-close-btn" onclick="hideModelModal()">✕</button>
			</div>

			<!-- Claude Code section -->
			<div id="claudeCodeSection" class="model-section">
				<div class="model-section-header">
					<span class="model-section-title">CLAUDE CODE STANDARD MODELS</span>
				</div>
				<div class="claude-cards-container" id="claudeModelCards">
					<div class="claude-card" data-model="opus" onclick="selectModel('opus')">
						<div class="claude-card-name">Opus</div>
						<div class="claude-card-desc">Most powerful, best for complex tasks</div>
					</div>
					<div class="claude-card" data-model="sonnet" onclick="selectModel('sonnet')">
						<div class="claude-card-name">Sonnet</div>
						<div class="claude-card-desc">Balanced performance and speed</div>
					</div>
					<div class="claude-card" data-model="default" onclick="selectModel('default')">
						<div class="claude-card-name">Default</div>
						<div class="claude-card-desc">Let Claude Code choose the best model</div>
					</div>
				</div>
			</div>

			<!-- Divider (only shown when both sections visible) -->
			<div id="modelSectionDivider" class="model-section-divider" style="display: none;"></div>

			<!-- Other models section -->
			<div id="opencreditsModelsSection" class="model-section opencredits-section" style="display: none;">
				<div class="model-section-header">
					<span class="model-section-title">TRY OTHER MODELS <span class="new-badge">NEW</span><span class="beta-badge" data-tooltip="This feature is in beta. Experience may vary across models.">BETA</span></span>
				</div>
				<div id="opencreditsComparisonHeader"></div>
				<div class="model-cards-container" id="opencreditsModelCards">
					<!-- Cards populated by JavaScript -->
				</div>
				<div style="margin: 14px 0 0 0; padding: 8px 10px; border-radius: 6px; background: var(--vscode-textBlockQuote-background, rgba(127,127,127,0.1)); display: flex; gap: 6px; align-items: flex-start;">
				<span style="font-size: 10px; line-height: 1.4; flex-shrink: 0; opacity: 0.4;">&#9432;</span>
				<span style="font-size: 10px; color: var(--vscode-descriptionForeground); line-height: 1.4;">Savings are compared to using Claude Opus directly with Anthropic API. Models can be configured to use only US &amp; EU providers.</span>
			</div>
			</div>
		</div>
	</div>

	<!-- All Models Browser modal -->
	<div id="allModelsModal" class="tools-modal" style="display: none;">
		<div class="tools-modal-content" style="width: 500px; max-width: 95vw; max-height: 80vh;">
			<div class="tools-modal-header">
				<span>Browse All Models</span>
				<button class="tools-close-btn" onclick="hideAllModelsModal()">✕</button>
			</div>
			<div class="all-models-search">
				<input type="text" id="allModelsSearch" placeholder="Search models..." oninput="filterAllModels()">
			</div>
			<div class="all-models-list" id="allModelsList">
				<!-- Models populated by JavaScript -->
			</div>
		</div>
	</div>

	<!-- Advanced Settings modal (OpenCredits) -->
	<div id="advancedModal" class="tools-modal" style="display: none;">
		<div class="tools-modal-content" style="width: 440px; max-width: 90vw; max-height: 80vh; overflow-y: auto; overflow-x: hidden;">
			<div class="tools-modal-header">
				<span>Advanced Settings</span>
				<button class="tools-close-btn" onclick="hideAdvancedModal()">✕</button>
			</div>
			<div style="padding: 16px;">
				<p style="font-size: 12px; color: var(--vscode-descriptionForeground); margin-bottom: 16px;">
					Override the default models used when you select Opus, Sonnet, or Haiku.
				</p>
				<div class="custom-provider-field">
					<label>Sonnet Model</label>
					<div class="model-combo" id="comboSonnet">
						<input type="text" class="model-combo-input" placeholder="Default — click to search models" autocomplete="off">
						<div class="model-combo-dropdown"></div>
					</div>
				</div>
				<div class="custom-provider-field">
					<label>Opus Model</label>
					<div class="model-combo" id="comboOpus">
						<input type="text" class="model-combo-input" placeholder="Default — click to search models" autocomplete="off">
						<div class="model-combo-dropdown"></div>
					</div>
				</div>
				<div class="custom-provider-field">
					<label>Haiku Model</label>
					<div class="model-combo" id="comboHaiku">
						<input type="text" class="model-combo-input" placeholder="Default — click to search models" autocomplete="off">
						<div class="model-combo-dropdown"></div>
					</div>
				</div>
				<button class="install-btn" style="width: 100%; margin-top: 16px;" onclick="saveAdvancedSettings()">Save</button>
			</div>
		</div>
	</div>

	<!-- Custom Provider modal -->
	<div id="customProviderModal" class="tools-modal" style="display: none;">
		<div class="tools-modal-content" style="width: 440px;">
			<div class="tools-modal-header">
				<span>Custom Provider</span>
				<button class="tools-close-btn" onclick="hideCustomProviderModal()">✕</button>
			</div>
			<div style="padding: 16px;">
				<p style="font-size: 12px; color: var(--vscode-descriptionForeground); margin-bottom: 16px;">
					Connect to any OpenAI-compatible or Anthropic-compatible API endpoint.
				</p>
				<div class="custom-provider-field">
					<label>Base URL</label>
					<input type="text" id="customProviderBaseUrl" placeholder="https://api.example.com">
				</div>
				<div class="custom-provider-field">
					<label>Auth Token</label>
					<input type="password" id="customProviderAuthToken" placeholder="sk-...">
				</div>
				<div class="custom-provider-field">
					<label>Sonnet Model <span style="opacity:0.5">(optional)</span></label>
					<input type="text" id="customProviderSonnet" placeholder="claude-sonnet-4-20250514">
				</div>
				<div class="custom-provider-field">
					<label>Opus Model <span style="opacity:0.5">(optional)</span></label>
					<input type="text" id="customProviderOpus" placeholder="claude-opus-4-20250514">
				</div>
				<div class="custom-provider-field">
					<label>Haiku Model <span style="opacity:0.5">(optional)</span></label>
					<input type="text" id="customProviderHaiku" placeholder="claude-haiku-4-20250514">
				</div>
				<button class="install-btn" style="width: 100%; margin-top: 16px;" onclick="saveCustomProvider()">Save & Connect</button>
			</div>
		</div>
	</div>

	<!-- Install Claude Code modal -->
	<div id="installModal" class="install-modal" style="display: none;">
		<div class="install-modal-backdrop" onclick="hideInstallModal()"></div>
		<div class="install-modal-content">
			<button class="install-close-btn" onclick="hideInstallModal()">
				<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
					<path d="M1.5 1.5L10.5 10.5M1.5 10.5L10.5 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
				</svg>
			</button>

			<div class="install-body" id="installBody">
				<div class="install-main" id="installMain">
					<div class="install-icon-wrapper">
						<svg class="install-icon" width="40" height="40" viewBox="0 0 24 24" fill="none">
							<path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M12 3V15M12 15L7 10M12 15L17 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</div>
					<div class="install-text">
						<h2 class="install-title">Install Claude Code</h2>
						<p class="install-desc">The CLI is required to use this extension</p>
					</div>

					<button class="install-btn" id="installMainBtn" onclick="startInstallation()">
						Install Now
					</button>

					<div id="installRetryOptions" style="display: none; margin-top: 8px;">
						<button class="install-link" id="installRetryNpmBtn" onclick="startInstallationWithSudo()" style="background: none; border: none; color: var(--vscode-textLink-foreground); cursor: pointer; text-decoration: underline; padding: 4px;">
							Didn't work? Try with npm
						</button>
						<label id="installSudoLabel" style="display: none; margin-left: 10px; font-size: 11px; color: var(--vscode-descriptionForeground); cursor: pointer;">
							<input type="checkbox" id="installUseSudo" style="vertical-align: middle;"> Use sudo
						</label>
					</div>

					<a href="https://docs.anthropic.com/en/docs/claude-code" target="_blank" class="install-link">
						View documentation
					</a>
				</div>

				<div class="install-progress" id="installProgress" style="display: none;">
					<div class="install-spinner"></div>
					<p class="install-progress-text">Installing Claude Code...</p>
					<p class="install-progress-hint">This may take a minute</p>
				</div>

				<div class="install-success" id="installSuccess" style="display: none;">
					<div class="install-success-icon">
						<svg class="install-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
					</div>
					<p class="install-success-text">Installed!</p>
					<p class="install-success-hint">How would you like to use Claude Code?</p>

					<div class="install-options">
						<button class="install-option" onclick="loginWithPlan()">
							<span class="install-option-title">I have a plan</span>
							<span class="install-option-desc">Login with Anthropic · Pro, Max, or API key</span>
						</button>
						<button class="install-option install-option-secondary" id="installOpenCreditsOption" onclick="showFundsSelection()">
							<span class="install-option-title">Just try it</span>
							<span class="install-option-desc">No account needed · Pay as you go with OpenCredits</span>
						</button>
					</div>
				</div>

				<div class="install-funds" id="installFunds" style="display: none;">
					<p class="install-funds-title">Add funds to get started</p>
					<p class="install-funds-hint">Pay as you go - no subscription required</p>

					<div class="install-amounts">
						<button class="install-amount" onclick="selectFundsAmount(5)">$5</button>
						<button class="install-amount" onclick="selectFundsAmount(10)">$10</button>
						<button class="install-amount" onclick="selectFundsAmount(25)">$25</button>
						<button class="install-amount" onclick="selectFundsAmount(50)">$50</button>
						<button class="install-amount" onclick="selectFundsAmount(100)">$100</button>
					</div>

					<div class="install-custom-amount">
						<span class="install-custom-currency">$</span>
						<input type="number" id="customAmountInput" class="install-custom-input" placeholder="Other" min="1" max="500" />
						<button class="install-custom-btn" onclick="selectCustomAmount()">Add</button>
					</div>

					<div class="install-powered-by">
						Powered by <a href="${opencreditsWebUrl}" target="_blank">OpenCredits</a>
					</div>
					<p style="font-size: 10px; color: var(--vscode-descriptionForeground); margin: 8px 0 0; opacity: 0.7;">By continuing, you agree to OpenCredits' <a href="#" onclick="event.preventDefault(); vscode.postMessage({ type: 'openExternalUrl', url: '${opencreditsWebUrl}/legal/terms-of-service' });" style="color: var(--vscode-textLink-foreground);">Terms of Service</a> and <a href="#" onclick="event.preventDefault(); vscode.postMessage({ type: 'openExternalUrl', url: '${opencreditsWebUrl}/legal/privacy-policy' });" style="color: var(--vscode-textLink-foreground);">Privacy Policy</a>.</p>

					<button class="install-back-btn" onclick="showInstallOptions()">
						← Back
					</button>
				</div>

				<div class="install-checkout" id="installCheckout" style="display: none;">
					<div id="checkoutPreparing" style="text-align: center;">
						<div class="install-spinner" style="margin: 0 auto 16px;"></div>
						<p class="install-funds-title">Preparing checkout...</p>
						<p class="install-funds-hint">Please wait while we set up your payment</p>
					</div>

					<div id="checkoutReady" style="display: none; text-align: center;">
						<p class="install-funds-title">Checkout opened in your browser</p>
						<p class="install-funds-hint">Complete your payment, then come back here.</p>
						<div id="checkoutUrlBox" style="display: flex; align-items: center; gap: 6px; margin: 12px 0; padding: 8px 12px; background: var(--vscode-textBlockQuote-background, rgba(255,255,255,0.05)); border-radius: 6px; border: 1px solid var(--vscode-panel-border); overflow: hidden; min-width: 0; max-width: 100%;">
							<span id="checkoutUrlDisplay" style="flex: 1; min-width: 0; font-size: 11px; color: var(--vscode-descriptionForeground); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block;"></span>
							<button id="checkoutUrlCopyBtn" title="Copy URL" style="flex-shrink: 0; background: none; border: none; color: var(--vscode-foreground); cursor: pointer; padding: 2px; opacity: 0.7;">
								<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
							</button>
						</div>
						<button id="checkoutOpenBtn" class="install-btn" style="margin-top: 8px;">Open Checkout Again</button>
					</div>

					<div id="checkoutComplete" style="display: none; text-align: center;">
						<div class="install-success-icon" style="margin: 0 auto 16px;">
							<svg class="install-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
								<polyline points="20 6 9 17 4 12"></polyline>
							</svg>
						</div>
						<p class="install-funds-title">Payment successful!</p>
						<p class="install-funds-hint">Your account has been funded.</p>
						<button class="install-btn" style="margin-top: 12px;" onclick="hideInstallModal()">Close</button>
					</div>

					<div id="checkoutError" style="display: none; text-align: center;">
						<div style="width: 40px; height: 40px; margin: 0 auto 12px; border-radius: 50%; background: rgba(239, 68, 68, 0.15); display: flex; align-items: center; justify-content: center;">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5">
								<line x1="18" y1="6" x2="6" y2="18"></line>
								<line x1="6" y1="6" x2="18" y2="18"></line>
							</svg>
						</div>
						<p class="install-funds-title">Something went wrong</p>
						<p class="install-funds-hint" id="checkoutErrorMsg">Could not complete checkout. Please try again.</p>
						<button id="checkoutRetryBtn" class="install-btn" style="margin-top: 12px;">Try Again</button>
					</div>

					<p style="font-size: 10px; color: var(--vscode-descriptionForeground); margin: 16px 0 0; opacity: 0.7;">By continuing, you agree to OpenCredits' <a href="#" onclick="event.preventDefault(); vscode.postMessage({ type: 'openExternalUrl', url: 'https://opencredits.ai/terms' });" style="color: var(--vscode-textLink-foreground);">Terms of Service</a> and <a href="#" onclick="event.preventDefault(); vscode.postMessage({ type: 'openExternalUrl', url: 'https://opencredits.ai/privacy' });" style="color: var(--vscode-textLink-foreground);">Privacy Policy</a>.</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Provider choice modal -->
	<div id="providerChoiceModal" class="tools-modal" style="display: none;">
		<div class="tools-modal-content" style="width: 300px;">
			<div class="tools-modal-header">
				<span id="providerChoiceTitle">Use model via</span>
				<button class="tools-close-btn" onclick="document.getElementById('providerChoiceModal').style.display='none'">✕</button>
			</div>
			<div style="padding: 16px; display: flex; flex-direction: column; gap: 10px;">
				<button id="providerChoiceOpenCredits" style="padding: 12px 16px; border-radius: 8px; border: 1px solid var(--vscode-panel-border); background: var(--vscode-editor-background); color: var(--vscode-foreground); cursor: pointer; text-align: left;">
					<div style="font-weight: 600; font-size: 13px;">OpenCredits</div>
					<div style="font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 2px;">Pay as you go with your OpenCredits balance</div>
				</button>
				<button id="providerChoiceAnthropic" style="padding: 12px 16px; border-radius: 8px; border: 1px solid var(--vscode-panel-border); background: var(--vscode-editor-background); color: var(--vscode-foreground); cursor: pointer; text-align: left;">
					<div style="font-weight: 600; font-size: 13px;">Anthropic</div>
					<div style="font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 2px;">Use your Anthropic API key or subscription</div>
				</button>
			</div>
		</div>
	</div>

	<!-- External URL opened modal -->
	<div id="externalUrlModal" class="tools-modal" style="display: none;">
		<div class="tools-modal-content" style="width: 380px;">
			<div class="tools-modal-header">
				<span>Opening Browser</span>
				<button class="tools-close-btn" onclick="document.getElementById('externalUrlModal').style.display='none'">✕</button>
			</div>
			<div style="padding: 24px; text-align: center;">
				<p style="margin: 0 0 16px; font-size: 13px; color: var(--vscode-foreground);">A page should have opened in your browser.</p>
				<div style="display: flex; align-items: center; gap: 6px; margin: 0 0 20px; padding: 8px 12px; background: var(--vscode-textBlockQuote-background, rgba(255,255,255,0.05)); border-radius: 6px; border: 1px solid var(--vscode-panel-border);">
					<span id="externalUrlDisplay" style="flex: 1; font-size: 11px; color: var(--vscode-descriptionForeground); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: left;"></span>
					<button id="externalUrlCopyBtn" title="Copy URL" style="flex-shrink: 0; background: none; border: none; color: var(--vscode-foreground); cursor: pointer; padding: 2px; opacity: 0.7;">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
					</button>
				</div>
				<p style="margin: 0 0 16px; font-size: 12px; color: var(--vscode-descriptionForeground);">If it didn't open, click the button below.</p>
				<button id="externalUrlFallbackBtn" style="padding: 8px 20px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">Open in Browser</button>
			</div>
		</div>
	</div>

	<!-- Thinking intensity modal -->
	<div id="thinkingIntensityModal" class="tools-modal" style="display: none;">
		<div class="tools-modal-content" style="width: 450px;">
			<div class="tools-modal-header">
				<span>Thinking Mode Intensity</span>
				<button class="tools-close-btn" onclick="hideThinkingIntensityModal()">✕</button>
			</div>
			<div class="thinking-modal-description">
				Configure the intensity of thinking mode. Higher levels provide more detailed reasoning but consume more tokens.
			</div>
			<div class="tools-list">
				<div class="thinking-slider-container">
					<input type="range" min="0" max="3" value="0" step="1" class="thinking-slider" id="thinkingIntensitySlider" oninput="updateThinkingIntensityDisplay(this.value)">
					<div class="slider-labels">
						<div class="slider-label active" id="thinking-label-0" onclick="setThinkingIntensityValue(0)">Think</div>
						<div class="slider-label" id="thinking-label-1" onclick="setThinkingIntensityValue(1)">Think Hard</div>
						<div class="slider-label" id="thinking-label-2" onclick="setThinkingIntensityValue(2)">Think Harder</div>
						<div class="slider-label" id="thinking-label-3" onclick="setThinkingIntensityValue(3)">Ultrathink</div>
					</div>
				</div>
				<div class="thinking-modal-actions">
					<button class="confirm-btn" onclick="confirmThinkingIntensity()">Confirm</button>
				</div>
			</div>
		</div>
	</div>

	${getSkillsHtml()}
	${getPluginsHtml()}

	<!-- Slash commands modal -->
	<div id="slashCommandsModal" class="tools-modal" style="display: none;">
		<div class="tools-modal-content">
			<div class="tools-modal-header">
				<span>Commands & Prompt Snippets</span>
				<button class="tools-close-btn" onclick="hideSlashCommandsModal()">✕</button>
			</div>
			<div class="tools-modal-body">
			
			<!-- Search box -->
			<div class="slash-commands-search">
				<div class="search-input-wrapper">
					<span class="search-prefix">/</span>
					<input type="text" id="slashCommandsSearch" placeholder="Search commands and snippets..." oninput="filterSlashCommands()">
				</div>
			</div>
			
			<!-- Custom Commands Section -->
			<div class="slash-commands-section">
				<h3>Custom Commands</h3>
				<div class="slash-commands-info">
					<p>Custom slash commands for quick prompt access. Click to use directly in chat.</p>
				</div>
				<div class="slash-commands-list" id="promptSnippetsList">
					<!-- Add Custom Snippet Button -->
					<div class="slash-command-item add-snippet-item" onclick="showAddSnippetForm()">
						<div class="slash-command-icon">➕</div>
						<div class="slash-command-content">
							<div class="slash-command-title">Add Custom Command</div>
							<div class="slash-command-description">Create your own slash command</div>
						</div>
					</div>
					
					<!-- Add Custom Command Form (initially hidden) -->
					<div class="add-snippet-form" id="addSnippetForm" style="display: none;">
						<div class="form-group">
							<label for="snippetName">Command name:</label>
							<div class="command-input-wrapper">
								<span class="command-prefix">/</span>
								<input type="text" id="snippetName" placeholder="e.g., fix-bug" maxlength="50">
							</div>
						</div>
						<div class="form-group">
							<label for="snippetPrompt">Prompt Text:</label>
							<textarea id="snippetPrompt" placeholder="e.g., Help me fix this bug in my code..." rows="3"></textarea>
						</div>
						<div class="form-buttons">
							<button class="btn" onclick="saveCustomSnippet()">Save Command</button>
							<button class="btn outlined" onclick="hideAddSnippetForm()">Cancel</button>
						</div>
					</div>
					
					<!-- Built-in Snippets -->
					<div class="slash-command-item prompt-snippet-item" onclick="usePromptSnippet('performance-analysis')">
						<div class="slash-command-icon">⚡</div>
						<div class="slash-command-content">
							<div class="slash-command-title">/performance-analysis</div>
							<div class="slash-command-description">Analyze this code for performance issues and suggest optimizations</div>
						</div>
					</div>
					<div class="slash-command-item prompt-snippet-item" onclick="usePromptSnippet('security-review')">
						<div class="slash-command-icon">🔒</div>
						<div class="slash-command-content">
							<div class="slash-command-title">/security-review</div>
							<div class="slash-command-description">Review this code for security vulnerabilities</div>
						</div>
					</div>
					<div class="slash-command-item prompt-snippet-item" onclick="usePromptSnippet('implementation-review')">
						<div class="slash-command-icon">🔍</div>
						<div class="slash-command-content">
							<div class="slash-command-title">/implementation-review</div>
							<div class="slash-command-description">Review the implementation in this code</div>
						</div>
					</div>
					<div class="slash-command-item prompt-snippet-item" onclick="usePromptSnippet('code-explanation')">
						<div class="slash-command-icon">📖</div>
						<div class="slash-command-content">
							<div class="slash-command-title">/code-explanation</div>
							<div class="slash-command-description">Explain how this code works in detail</div>
						</div>
					</div>
					<div class="slash-command-item prompt-snippet-item" onclick="usePromptSnippet('bug-fix')">
						<div class="slash-command-icon">🐛</div>
						<div class="slash-command-content">
							<div class="slash-command-title">/bug-fix</div>
							<div class="slash-command-description">Help me fix this bug in my code</div>
						</div>
					</div>
					<div class="slash-command-item prompt-snippet-item" onclick="usePromptSnippet('refactor')">
						<div class="slash-command-icon">🔄</div>
						<div class="slash-command-content">
							<div class="slash-command-title">/refactor</div>
							<div class="slash-command-description">Refactor this code to improve readability and maintainability</div>
						</div>
					</div>
					<div class="slash-command-item prompt-snippet-item" onclick="usePromptSnippet('test-generation')">
						<div class="slash-command-icon">🧪</div>
						<div class="slash-command-content">
							<div class="slash-command-title">/test-generation</div>
							<div class="slash-command-description">Generate comprehensive tests for this code</div>
						</div>
					</div>
					<div class="slash-command-item prompt-snippet-item" onclick="usePromptSnippet('documentation')">
						<div class="slash-command-icon">📝</div>
						<div class="slash-command-content">
							<div class="slash-command-title">/documentation</div>
							<div class="slash-command-description">Generate documentation for this code</div>
						</div>
					</div>
				</div>
			</div>
			
			<!-- Built-in Commands Section -->
			<div class="slash-commands-section">
				<h3>Built-in Commands</h3>
				<div class="slash-commands-info">
					<p>These commands require the Claude CLI and will open in VS Code terminal. Return here after completion.</p>
				</div>
				<div class="slash-commands-list" id="nativeCommandsList">
				<div class="slash-command-item" onclick="executeSlashCommand('add-dir')">
					<div class="slash-command-icon">📁</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/add-dir</div>
						<div class="slash-command-description">Add additional working directories</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('agents')">
					<div class="slash-command-icon">🤖</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/agents</div>
						<div class="slash-command-description">Manage custom AI subagents for specialized tasks</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('bug')">
					<div class="slash-command-icon">🐛</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/bug</div>
						<div class="slash-command-description">Report bugs (sends conversation to Anthropic)</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('clear')">
					<div class="slash-command-icon">🗑️</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/clear</div>
						<div class="slash-command-description">Clear conversation history</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('compact')">
					<div class="slash-command-icon">📦</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/compact</div>
						<div class="slash-command-description">Compact conversation with optional focus instructions</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('config')">
					<div class="slash-command-icon">⚙️</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/config</div>
						<div class="slash-command-description">Open the Settings interface (Config tab)</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('cost')">
					<div class="slash-command-icon">💰</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/cost</div>
						<div class="slash-command-description">Show token usage statistics (see cost tracking guide for subscription-specific details)</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('doctor')">
					<div class="slash-command-icon">🩺</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/doctor</div>
						<div class="slash-command-description">Checks the health of your Claude Code installation</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('help')">
					<div class="slash-command-icon">❓</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/help</div>
						<div class="slash-command-description">Get usage help</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('init')">
					<div class="slash-command-icon">🚀</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/init</div>
						<div class="slash-command-description">Initialize project with CLAUDE.md guide</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('login')">
					<div class="slash-command-icon">🔑</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/login</div>
						<div class="slash-command-description">Switch Anthropic accounts</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('logout')">
					<div class="slash-command-icon">🚪</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/logout</div>
						<div class="slash-command-description">Sign out from your Anthropic account</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('mcp')">
					<div class="slash-command-icon">🔌</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/mcp</div>
						<div class="slash-command-description">Manage MCP server connections and OAuth authentication</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('memory')">
					<div class="slash-command-icon">🧠</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/memory</div>
						<div class="slash-command-description">Edit CLAUDE.md memory files</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('model')">
					<div class="slash-command-icon">🤖</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/model</div>
						<div class="slash-command-description">Select or change the AI model</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('permissions')">
					<div class="slash-command-icon">🔒</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/permissions</div>
						<div class="slash-command-description">View or update permissions</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('pr_comments')">
					<div class="slash-command-icon">💬</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/pr_comments</div>
						<div class="slash-command-description">View pull request comments</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('review')">
					<div class="slash-command-icon">👀</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/review</div>
						<div class="slash-command-description">Request code review</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('rewind')">
					<div class="slash-command-icon">⏪</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/rewind</div>
						<div class="slash-command-description">Rewind the conversation and/or code</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('status')">
					<div class="slash-command-icon">📊</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/status</div>
						<div class="slash-command-description">Open the Settings interface (Status tab) showing version, model, account, and connectivity</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('terminal-setup')">
					<div class="slash-command-icon">⌨️</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/terminal-setup</div>
						<div class="slash-command-description">Install Shift+Enter key binding for newlines (iTerm2 and VSCode only)</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('usage')">
					<div class="slash-command-icon">📈</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/usage</div>
						<div class="slash-command-description">Show plan usage limits and rate limit status (subscription plans only)</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('vim')">
					<div class="slash-command-icon">📝</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/vim</div>
						<div class="slash-command-description">Enter vim mode for alternating insert and command modes</div>
					</div>
				</div>
				<div class="slash-command-item custom-command-item">
					<div class="slash-command-icon">⚡</div>
					<div class="slash-command-content">
						<div class="slash-command-title">Quick Command</div>
						<div class="slash-command-description">
							<div class="command-input-wrapper">
								<span class="command-prefix">/</span>
								<input type="text" 
									   class="custom-command-input" 
									   id="customCommandInput"
									   placeholder="enter-command" 
									   onkeydown="handleCustomCommandKeydown(event)"
									   onclick="event.stopPropagation()">
							</div>
						</div>
					</div>
				</div>
			</div>
			</div>
		</div>
	</div>

	<script>window.__recommendedModels = ${JSON.stringify(recommendedModels)};window.__topMcpServers = ${JSON.stringify(topMcpServers)};window.__topSkills = ${JSON.stringify(topSkills)};window.__topPlugins = ${JSON.stringify(topPlugins)};</script>
	${getScript(isTelemetryEnabled, opencreditsApiUrl, opencreditsWebUrl, opencreditsPublishableKey)}
	
	<!--
	Analytics FAQ:

	1. Is Umami GDPR compliant?
	Yes, Umami does not collect any personally identifiable information and anonymizes all data collected. Users cannot be identified and are never tracked across websites.

	2. Do I need to display a cookie notice to users?
	No, Umami does not use any cookies in the tracking code.
	-->
	${isTelemetryEnabled ? '<script defer src="https://product.opencredits.ai/script.js" data-website-id="0159e9b1-4a98-4b49-943a-32db3e743b95" data-tag="' + editorName + '"></script>' : '<!-- Analytics disabled due to VS Code telemetry settings -->'}
</body>
</html>`;

export default getHtml;
