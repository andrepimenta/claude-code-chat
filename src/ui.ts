import styles from './ui-styles';
const getHtml = (isTelemetryEnabled: boolean, translations?: any) => {
	// Helper function for translations
	const t = (key: string, params?: Record<string, string | number>): string => {
		if (!translations) {return key;}
		
		const value = key.split('.').reduce((obj, k) => obj && obj[k], translations);
		if (!value) {return key;}
		
		if (params) {
			return value.replace(/\{(\w+)\}/g, (match: string, paramKey: string) => {
				return params[paramKey] !== undefined ? String(params[paramKey]) : match;
			});
		}
		
		return value;
	};

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Claude Code Chat</title>
	${styles}
	<script>
		// Make translations available globally for runtime JavaScript functions
		window.translations = ${JSON.stringify(translations || {})};
		
		// Global translation function for runtime use
		window.t = function(key, params) {
			if (!window.translations) return key;
			
			const value = key.split('.').reduce((obj, k) => obj && obj[k], window.translations);
			if (!value) return key;
			
			if (params) {
				return value.replace(/\\{(\\w+)\\}/g, (match, paramKey) => {
					return params[paramKey] !== undefined ? String(params[paramKey]) : match;
				});
			}
			
			return value;
		};
	</script>
</head>
<body>
	<div class="header">
		<div style="display: flex; align-items: center;">
			<h2>${t('ui.header.title')}</h2>
			<!-- <div id="sessionInfo" class="session-badge" style="display: none;">
				<span class="session-icon">💬</span>
				<span id="sessionId">-</span>
				<span class="session-label">session</span>
			</div> -->
		</div>
		<div style="display: flex; gap: 8px; align-items: center;">
			<div id="sessionStatus" class="session-status" style="display: none;">No session</div>
			<button class="btn outlined" id="settingsBtn" onclick="toggleSettings()" title="${t('ui.header.settings')}">⚙️</button>
			<button class="btn outlined" id="historyBtn" onclick="toggleConversationHistory()">📚 ${t('ui.header.history')}</button>
			<button class="btn primary" id="newSessionBtn" onclick="newSession()">${t('ui.header.newChat')}</button>
		</div>
	</div>
	
	<div id="conversationHistory" class="conversation-history" style="display: none;">
		<div class="conversation-header">
			<h3>${t('ui.conversationHistory.title')}</h3>
			<button class="btn" onclick="toggleConversationHistory()">${t('ui.conversationHistory.close')}</button>
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
					<strong>${t('ui.wslAlert.title')}</strong><br/>
					${t('ui.wslAlert.message')}
				</div>
				<div class="wsl-alert-actions">
					<button class="btn" onclick="openWSLSettings()">${t('ui.wslAlert.enableWSL')}</button>
					<button class="btn outlined" onclick="dismissWSLAlert()">${t('ui.wslAlert.dismiss')}</button>
				</div>
			</div>
		</div>
		
		<div class="input-container" id="inputContainer">
			<div class="input-modes">
				<div class="mode-toggle">
					<span onclick="togglePlanMode()">${t('ui.input.planFirst')}</span>
					<div class="mode-switch" id="planModeSwitch" onclick="togglePlanMode()"></div>
				</div>
				<div class="mode-toggle">
					<span id="thinkingModeLabel" onclick="toggleThinkingMode()">${t('ui.input.thinkingMode')}</span>
					<div class="mode-switch" id="thinkingModeSwitch" onclick="toggleThinkingMode()"></div>
				</div>
			</div>
			<div class="textarea-container">
				<div class="textarea-wrapper">
					<textarea class="input-field" id="messageInput" placeholder="${t('ui.input.placeholder')}" rows="1"></textarea>
					<div class="input-controls">
						<div class="left-controls">
							<button class="model-selector" id="modelSelector" onclick="showModelSelector()" title="${t('ui.modelSelector.tooltip')}">
								<span id="selectedModel">Opus</span>
								<svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
									<path d="M1 2.5l3 3 3-3"></path>
								</svg>
							</button>
							<button class="tools-btn" onclick="showMCPModal()" title="${t('ui.mcpServers.tooltip')}">
								MCP
								<svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
									<path d="M1 2.5l3 3 3-3"></path>
								</svg>
							</button>
						</div>
						<div class="right-controls">
							<button class="slash-btn" onclick="showSlashCommandsModal()" title="${t('ui.input.slashCommands')}">/</button>
							<button class="at-btn" onclick="showFilePicker()" title="${t('ui.input.referenceFiles')}">@</button>
							<button class="image-btn" id="imageBtn" onclick="selectImage()" title="${t('ui.input.attachImages')}">
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
							<span>${t('ui.input.send')} </span>
							   <svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								width="11"
								height="11"
								>
								<path
									fill="currentColor"
									d="M20 4v9a4 4 0 0 1-4 4H6.914l2.5 2.5L8 20.914L3.086 16L8 11.086L9.414 12.5l-2.5 2.5H16a2 2 0 0 0 2-2V4z"
								></path>
								</svg>
								</div>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	
	<div class="status ready" id="status">
		<div class="status-indicator"></div>
		<div class="status-text" id="statusText">${t('ui.status.initializing')}</div>
		<button class="btn stop" id="stopBtn" onclick="stopRequest()" style="display: none;">
			<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
				<path d="M6 6h12v12H6z"/>
			</svg>
			${t('ui.status.stop')}
		</button>
	</div>

			<div id="yoloWarning" class="yolo-warning" style="display: none;">
			${t('ui.yoloWarning')}
		</div>

	<!-- File picker modal -->
	<div id="filePickerModal" class="file-picker-modal" style="display: none;">
		<div class="file-picker-content">
			<div class="file-picker-header">
				<span>${t('ui.filePicker.title')}</span>
				<input type="text" id="fileSearchInput" placeholder="${t('ui.filePicker.searchPlaceholder')}" class="file-search-input">
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
				<span>${t('ui.mcpServers.title')}</span>
				<button class="tools-close-btn" onclick="hideMCPModal()">✕</button>
			</div>
			<div class="tools-list">
				<div class="mcp-servers-list" id="mcpServersList">
					<!-- MCP servers will be loaded here -->
				</div>
				<div class="mcp-add-server">
					<button class="btn outlined" onclick="showAddServerForm()" id="addServerBtn">${t('ui.mcpServers.addServer')}</button>
				</div>
				<div class="mcp-popular-servers" id="popularServers">
					<h4>${t('ui.mcpServers.popularServers')}</h4>
					<div class="popular-servers-grid">
						<div class="popular-server-item" onclick="addPopularServer('context7', { type: 'http', url: 'https://context7.liam.sh/mcp' })">
							<div class="popular-server-icon">📚</div>
							<div class="popular-server-info">
								<div class="popular-server-name">${t('ui.mcpServers.popularServersList.context7.name')}</div>
								<div class="popular-server-desc">${t('ui.mcpServers.popularServersList.context7.description')}</div>
							</div>
						</div>
						<div class="popular-server-item" onclick="addPopularServer('sequential-thinking', { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-sequential-thinking'] })">
							<div class="popular-server-icon">🔗</div>
							<div class="popular-server-info">
								<div class="popular-server-name">${t('ui.mcpServers.popularServersList.sequentialThinking.name')}</div>
								<div class="popular-server-desc">${t('ui.mcpServers.popularServersList.sequentialThinking.description')}</div>
							</div>
						</div>
						<div class="popular-server-item" onclick="addPopularServer('memory', { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-memory'] })">
							<div class="popular-server-icon">🧠</div>
							<div class="popular-server-info">
								<div class="popular-server-name">${t('ui.mcpServers.popularServersList.memory.name')}</div>
								<div class="popular-server-desc">${t('ui.mcpServers.popularServersList.memory.description')}</div>
							</div>
						</div>
						<div class="popular-server-item" onclick="addPopularServer('puppeteer', { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-puppeteer'] })">
							<div class="popular-server-icon">🎭</div>
							<div class="popular-server-info">
								<div class="popular-server-name">${t('ui.mcpServers.popularServersList.puppeteer.name')}</div>
								<div class="popular-server-desc">${t('ui.mcpServers.popularServersList.puppeteer.description')}</div>
							</div>
						</div>
						<div class="popular-server-item" onclick="addPopularServer('fetch', { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-fetch'] })">
							<div class="popular-server-icon">🌐</div>
							<div class="popular-server-info">
								<div class="popular-server-name">${t('ui.mcpServers.popularServersList.fetch.name')}</div>
								<div class="popular-server-desc">${t('ui.mcpServers.popularServersList.fetch.description')}</div>
							</div>
						</div>
						<div class="popular-server-item" onclick="addPopularServer('filesystem', { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem'] })">
							<div class="popular-server-icon">📁</div>
							<div class="popular-server-info">
								<div class="popular-server-name">${t('ui.mcpServers.popularServersList.filesystem.name')}</div>
								<div class="popular-server-desc">${t('ui.mcpServers.popularServersList.filesystem.description')}</div>
							</div>
						</div>
					</div>
				</div>
				<div class="mcp-add-form" id="addServerForm" style="display: none;">
				<div class="form-group">
					<label for="serverName">${t('ui.mcpServers.addForm.serverName')}</label>
					<input type="text" id="serverName" placeholder="my-server" required>
				</div>
				<div class="form-group">
					<label for="serverType">${t('ui.mcpServers.addForm.serverType')}</label>
					<select id="serverType" onchange="updateServerForm()">
						<option value="http">HTTP</option>
						<option value="sse">SSE</option>
						<option value="stdio">stdio</option>
					</select>
				</div>
				<div class="form-group" id="commandGroup" style="display: none;">
					<label for="serverCommand">${t('ui.mcpServers.addForm.command')}</label>
					<input type="text" id="serverCommand" placeholder="/path/to/server">
				</div>
				<div class="form-group" id="urlGroup">
					<label for="serverUrl">${t('ui.mcpServers.addForm.url')}</label>
					<input type="text" id="serverUrl" placeholder="https://example.com/mcp">
				</div>
				<div class="form-group" id="argsGroup" style="display: none;">
					<label for="serverArgs">${t('ui.mcpServers.addForm.arguments')}</label>
					<textarea id="serverArgs" placeholder="--api-key&#10;abc123" rows="3"></textarea>
				</div>
				<div class="form-group" id="envGroup" style="display: none;">
					<label for="serverEnv">${t('ui.mcpServers.addForm.environment')}</label>
					<textarea id="serverEnv" placeholder="API_KEY=123&#10;CACHE_DIR=/tmp" rows="3"></textarea>
				</div>
				<div class="form-group" id="headersGroup">
					<label for="serverHeaders">${t('ui.mcpServers.addForm.headers')}</label>
					<textarea id="serverHeaders" placeholder="Authorization=Bearer token&#10;X-API-Key=key" rows="3"></textarea>
				</div>
				<div class="form-buttons">
					<button class="btn" onclick="saveMCPServer()">${t('ui.mcpServers.addForm.addServer')}</button>
					<button class="btn outlined" onclick="hideAddServerForm()">${t('ui.mcpServers.addForm.cancel')}</button>
				</div>
			</div>
		</div>
	</div>
	</div>

	<!-- Settings modal -->
	<div id="settingsModal" class="tools-modal" style="display: none;">
		<div class="tools-modal-content">
			<div class="tools-modal-header">
				<span>${t('ui.settings.title')}</span>
				<button class="tools-close-btn" onclick="hideSettingsModal()">✕</button>
			</div>
			<div class="tools-list">
				<h3 style="margin-top: 0; margin-bottom: 16px; font-size: 14px; font-weight: 600;">${t('ui.settings.language.title')}</h3>
				<div>
					<p style="font-size: 11px; color: var(--vscode-descriptionForeground); margin: 0;">
						${t('ui.settings.language.description')}
					</p>
				</div>
				<div class="settings-group">
					<div style="margin-bottom: 12px;">
						<label style="display: block; margin-bottom: 4px; font-size: 12px; color: var(--vscode-descriptionForeground);">${t('ui.settings.language.title')}</label>
						<select id="language-select" class="file-search-input" style="width: 200px; max-width: 100%;" onchange="updateLanguage()">
							<!-- Language options will be populated by JavaScript -->
						</select>
					</div>
				</div>

				<h3 style="margin-top: 24px; margin-bottom: 16px; font-size: 14px; font-weight: 600;">${t('ui.settings.wsl.title')}</h3>
				<div>
					<p style="font-size: 11px; color: var(--vscode-descriptionForeground); margin: 0;">
						${t('ui.settings.wsl.description')}
					</p>
				</div>
				<div class="settings-group">
					<div class="tool-item">
						<input type="checkbox" id="wsl-enabled" onchange="updateSettings()">
						<label for="wsl-enabled">${t('ui.settings.wsl.enabled')}</label>
					</div>
					
					<div id="wslOptions" style="margin-left: 24px; margin-top: 12px;">
						<div style="margin-bottom: 12px;">
							<label style="display: block; margin-bottom: 4px; font-size: 12px; color: var(--vscode-descriptionForeground);">${t('ui.settings.wsl.distro')}</label>
							<input type="text" id="wsl-distro" class="file-search-input" style="width: 200px; max-width: 100%;" placeholder="Ubuntu" onchange="updateSettings()">
						</div>
						
						<div style="margin-bottom: 12px;">
							<label style="display: block; margin-bottom: 4px; font-size: 12px; color: var(--vscode-descriptionForeground);">${t('ui.settings.wsl.nodePath')}</label>
							<input type="text" id="wsl-node-path" class="file-search-input" style="width: 300px; max-width: 100%;" placeholder="/usr/bin/node" onchange="updateSettings()">
							<p style="font-size: 11px; color: var(--vscode-descriptionForeground); margin: 4px 0 0 0;">
								${t('ui.settings.wsl.nodePathHelper')} <code style="background: var(--vscode-textCodeBlock-background); padding: 2px 4px; border-radius: 3px;">which node</code>
							</p>
						</div>
						
						<div style="margin-bottom: 12px;">
							<label style="display: block; margin-bottom: 4px; font-size: 12px; color: var(--vscode-descriptionForeground);">${t('ui.settings.wsl.claudePath')}</label>
							<input type="text" id="wsl-claude-path" class="file-search-input" style="width: 300px; max-width: 100%;" placeholder="/usr/local/bin/claude" onchange="updateSettings()">
							<p style="font-size: 11px; color: var(--vscode-descriptionForeground); margin: 4px 0 0 0;">
								${t('ui.settings.wsl.claudePathHelper')} <code style="background: var(--vscode-textCodeBlock-background); padding: 2px 4px; border-radius: 3px;">which claude</code>
							</p>
						</div>
					</div>
				</div>

				<h3 style="margin-top: 24px; margin-bottom: 16px; font-size: 14px; font-weight: 600;">${t('ui.settings.permissions.title')}</h3>
				<div>
					<p style="font-size: 11px; color: var(--vscode-descriptionForeground); margin: 0;">
						${t('ui.settings.permissions.description')}
					</p>
				</div>
				<div class="settings-group">
					<div id="permissionsList" class="permissions-list">
						<div class="permissions-loading" style="text-align: center; padding: 20px; color: var(--vscode-descriptionForeground);">
							${t('ui.settings.permissions.loadingPermissions')}
						</div>
					</div>
					<div class="permissions-add-section">
						<div id="addPermissionForm" class="permissions-add-form" style="display: none;">
							<div class="permissions-form-row">
								<select id="addPermissionTool" class="permissions-tool-select" onchange="toggleCommandInput()">
									<option value="">${t('ui.settings.permissions.addForm.selectTool')}</option>
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
									<input type="text" id="addPermissionCommand" class="permissions-command-input" placeholder="${t('ui.settings.permissions.addForm.commandPattern')}" style="display: none;" />
								</div>
								<button id="addPermissionBtn" class="permissions-add-btn" onclick="addPermission()">${t('ui.settings.permissions.addForm.add')}</button>
							</div>
							<div id="permissionsFormHint" class="permissions-form-hint">
								${t('ui.settings.permissions.addForm.selectToolHint')}
							</div>
						</div>
						<button id="showAddPermissionBtn" class="permissions-show-add-btn" onclick="showAddPermissionForm()">
							${t('ui.settings.permissions.addPermission')}
						</button>
						<div class="yolo-mode-section">
							<input type="checkbox" id="yolo-mode" onchange="updateSettings(); updateYoloWarning();">
							<label for="yolo-mode">${t('ui.settings.permissions.yoloMode')}</label>
						</div>
					</div>
				</div>

				
			</div>
		</div>
	</div>

	<!-- Model selector modal -->
	<div id="modelModal" class="tools-modal" style="display: none;">
		<div class="tools-modal-content" style="width: 400px;">
			<div class="tools-modal-header">
				<span>${t('ui.modelSelector.title')}</span>
				<button class="tools-close-btn" onclick="hideModelModal()">✕</button>
			</div>
			<div class="model-explanatory-text">
				${t('ui.modelSelector.explanation')}
			</div>
			<div class="tools-list">
				<div class="tool-item" onclick="selectModel('opus')">
					<input type="radio" name="model" id="model-opus" value="opus" checked>
					<label for="model-opus">
						<div class="model-title">${t('ui.modelSelector.opus.title')}</div>
						<div class="model-description">
							${t('ui.modelSelector.opus.description')}
						</div>
					</label>
				</div>
				<div class="tool-item" onclick="selectModel('sonnet')">
					<input type="radio" name="model" id="model-sonnet" value="sonnet">
					<label for="model-sonnet">
						<div class="model-title">${t('ui.modelSelector.sonnet.title')}</div>
						<div class="model-description">
							${t('ui.modelSelector.sonnet.description')}
						</div>
					</label>
				</div>
				<div class="tool-item" onclick="selectModel('default')">
					<input type="radio" name="model" id="model-default" value="default">
					<label for="model-default" class="default-model-layout">
						<div class="model-option-content">
							<div class="model-title">${t('ui.modelSelector.default.title')}</div>
							<div class="model-description">
								${t('ui.modelSelector.default.description')}
							</div>
						</div>
						<button class="secondary-button configure-button" onclick="event.stopPropagation(); openModelTerminal();">
							${t('ui.modelSelector.default.configure')}
						</button>
					</label>
				</div>
			</div>
		</div>
	</div>

	<!-- Thinking intensity modal -->
	<div id="thinkingIntensityModal" class="tools-modal" style="display: none;">
		<div class="tools-modal-content" style="width: 450px;">
			<div class="tools-modal-header">
				<span>${t('ui.thinkingIntensity.title')}</span>
				<button class="tools-close-btn" onclick="hideThinkingIntensityModal()">✕</button>
			</div>
			<div class="thinking-modal-description">
				${t('ui.thinkingIntensity.description')}
			</div>
			<div class="tools-list">
				<div class="thinking-slider-container">
					<input type="range" min="0" max="3" value="0" step="1" class="thinking-slider" id="thinkingIntensitySlider" oninput="updateThinkingIntensityDisplay(this.value)">
					<div class="slider-labels">
						<div class="slider-label active" id="thinking-label-0" onclick="setThinkingIntensityValue(0)">${t('ui.thinkingIntensity.levels.think')}</div>
						<div class="slider-label" id="thinking-label-1" onclick="setThinkingIntensityValue(1)">${t('ui.thinkingIntensity.levels.thinkHard')}</div>
						<div class="slider-label" id="thinking-label-2" onclick="setThinkingIntensityValue(2)">${t('ui.thinkingIntensity.levels.thinkHarder')}</div>
						<div class="slider-label" id="thinking-label-3" onclick="setThinkingIntensityValue(3)">${t('ui.thinkingIntensity.levels.ultrathink')}</div>
					</div>
				</div>
				<div class="thinking-modal-actions">
					<button class="confirm-btn" onclick="confirmThinkingIntensity()">${t('ui.thinkingIntensity.confirm')}</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Slash commands modal -->
	<div id="slashCommandsModal" class="tools-modal" style="display: none;">
		<div class="tools-modal-content">
			<div class="tools-modal-header">
				<span>${t('ui.slashCommands.title')}</span>
				<button class="tools-close-btn" onclick="hideSlashCommandsModal()">✕</button>
			</div>
			<div class="tools-modal-body">
			
			<!-- Search box -->
			<div class="slash-commands-search">
				<div class="search-input-wrapper">
					<span class="search-prefix">/</span>
					<input type="text" id="slashCommandsSearch" placeholder="${t('ui.slashCommands.search')}" oninput="filterSlashCommands()">
				</div>
			</div>
			
			<!-- Custom Commands Section -->
			<div class="slash-commands-section">
				<h3>${t('ui.slashCommands.customCommands.title')}</h3>
				<div class="slash-commands-info">
					<p>${t('ui.slashCommands.customCommands.description')}</p>
				</div>
				<div class="slash-commands-list" id="promptSnippetsList">
					<!-- Add Custom Snippet Button -->
					<div class="slash-command-item add-snippet-item" onclick="showAddSnippetForm()">
						<div class="slash-command-icon">➕</div>
						<div class="slash-command-content">
							<div class="slash-command-title">${t('ui.slashCommands.customCommands.addCustom')}</div>
							<div class="slash-command-description">${t('ui.slashCommands.customCommands.addForm.create')}</div>
						</div>
					</div>
					
					<!-- Add Custom Command Form (initially hidden) -->
					<div class="add-snippet-form" id="addSnippetForm" style="display: none;">
						<div class="form-group">
							<label for="snippetName">${t('ui.slashCommands.customCommands.addForm.commandName')}</label>
							<div class="command-input-wrapper">
								<span class="command-prefix">/</span>
								<input type="text" id="snippetName" placeholder="e.g., fix-bug" maxlength="50">
							</div>
						</div>
						<div class="form-group">
							<label for="snippetPrompt">${t('ui.slashCommands.customCommands.addForm.promptText')}</label>
							<textarea id="snippetPrompt" placeholder="e.g., Help me fix this bug in my code..." rows="3"></textarea>
						</div>
						<div class="form-buttons">
							<button class="btn" onclick="saveCustomSnippet()">${t('ui.slashCommands.customCommands.addForm.save')}</button>
							<button class="btn outlined" onclick="hideAddSnippetForm()">${t('ui.slashCommands.customCommands.addForm.cancel')}</button>
						</div>
					</div>
					
					<!-- Built-in Snippets -->
					<div class="slash-command-item prompt-snippet-item" onclick="usePromptSnippet('performance-analysis')">
						<div class="slash-command-icon">⚡</div>
						<div class="slash-command-content">
							<div class="slash-command-title">${t('ui.slashCommands.promptSnippets.performanceAnalysis.title')}</div>
							<div class="slash-command-description">${t('ui.slashCommands.promptSnippets.performanceAnalysis.description')}</div>
						</div>
					</div>
					<div class="slash-command-item prompt-snippet-item" onclick="usePromptSnippet('security-review')">
						<div class="slash-command-icon">🔒</div>
						<div class="slash-command-content">
							<div class="slash-command-title">${t('ui.slashCommands.promptSnippets.securityReview.title')}</div>
							<div class="slash-command-description">${t('ui.slashCommands.promptSnippets.securityReview.description')}</div>
						</div>
					</div>
					<div class="slash-command-item prompt-snippet-item" onclick="usePromptSnippet('implementation-review')">
						<div class="slash-command-icon">🔍</div>
						<div class="slash-command-content">
							<div class="slash-command-title">${t('ui.slashCommands.promptSnippets.implementationReview.title')}</div>
							<div class="slash-command-description">${t('ui.slashCommands.promptSnippets.implementationReview.description')}</div>
						</div>
					</div>
					<div class="slash-command-item prompt-snippet-item" onclick="usePromptSnippet('code-explanation')">
						<div class="slash-command-icon">📖</div>
						<div class="slash-command-content">
							<div class="slash-command-title">${t('ui.slashCommands.promptSnippets.codeExplanation.title')}</div>
							<div class="slash-command-description">${t('ui.slashCommands.promptSnippets.codeExplanation.description')}</div>
						</div>
					</div>
					<div class="slash-command-item prompt-snippet-item" onclick="usePromptSnippet('bug-fix')">
						<div class="slash-command-icon">🐛</div>
						<div class="slash-command-content">
							<div class="slash-command-title">${t('ui.slashCommands.promptSnippets.bugFix.title')}</div>
							<div class="slash-command-description">${t('ui.slashCommands.promptSnippets.bugFix.description')}</div>
						</div>
					</div>
					<div class="slash-command-item prompt-snippet-item" onclick="usePromptSnippet('refactor')">
						<div class="slash-command-icon">🔄</div>
						<div class="slash-command-content">
							<div class="slash-command-title">${t('ui.slashCommands.promptSnippets.refactor.title')}</div>
							<div class="slash-command-description">${t('ui.slashCommands.promptSnippets.refactor.description')}</div>
						</div>
					</div>
					<div class="slash-command-item prompt-snippet-item" onclick="usePromptSnippet('test-generation')">
						<div class="slash-command-icon">🧪</div>
						<div class="slash-command-content">
							<div class="slash-command-title">${t('ui.slashCommands.promptSnippets.testGeneration.title')}</div>
							<div class="slash-command-description">${t('ui.slashCommands.promptSnippets.testGeneration.description')}</div>
						</div>
					</div>
					<div class="slash-command-item prompt-snippet-item" onclick="usePromptSnippet('documentation')">
						<div class="slash-command-icon">📝</div>
						<div class="slash-command-content">
							<div class="slash-command-title">${t('ui.slashCommands.promptSnippets.documentation.title')}</div>
							<div class="slash-command-description">${t('ui.slashCommands.promptSnippets.documentation.description')}</div>
						</div>
					</div>
				</div>
			</div>
			
			<!-- Built-in Commands Section -->
			<div class="slash-commands-section">
				<h3>${t('ui.slashCommands.builtinCommands.title')}</h3>
				<div class="slash-commands-info">
					<p>${t('ui.slashCommands.builtinCommands.description')}</p>
				</div>
				<div class="slash-commands-list" id="nativeCommandsList">
				<div class="slash-command-item" onclick="executeSlashCommand('bug')">
					<div class="slash-command-icon">🐛</div>
					<div class="slash-command-content">
						<div class="slash-command-title">${t('ui.slashCommands.builtinCommands.commands.bug.title')}</div>
						<div class="slash-command-description">${t('ui.slashCommands.builtinCommands.commands.bug.description')}</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('clear')">
					<div class="slash-command-icon">🗑️</div>
					<div class="slash-command-content">
						<div class="slash-command-title">${t('ui.slashCommands.builtinCommands.commands.clear.title')}</div>
						<div class="slash-command-description">${t('ui.slashCommands.builtinCommands.commands.clear.description')}</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('compact')">
					<div class="slash-command-icon">📦</div>
					<div class="slash-command-content">
						<div class="slash-command-title">${t('ui.slashCommands.builtinCommands.commands.compact.title')}</div>
						<div class="slash-command-description">${t('ui.slashCommands.builtinCommands.commands.compact.description')}</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('config')">
					<div class="slash-command-icon">⚙️</div>
					<div class="slash-command-content">
						<div class="slash-command-title">${t('ui.slashCommands.builtinCommands.commands.config.title')}</div>
						<div class="slash-command-description">${t('ui.slashCommands.builtinCommands.commands.config.description')}</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('cost')">
					<div class="slash-command-icon">💰</div>
					<div class="slash-command-content">
						<div class="slash-command-title">${t('ui.slashCommands.builtinCommands.commands.cost.title')}</div>
						<div class="slash-command-description">${t('ui.slashCommands.builtinCommands.commands.cost.description')}</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('doctor')">
					<div class="slash-command-icon">🩺</div>
					<div class="slash-command-content">
						<div class="slash-command-title">${t('ui.slashCommands.builtinCommands.commands.doctor.title')}</div>
						<div class="slash-command-description">${t('ui.slashCommands.builtinCommands.commands.doctor.description')}</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('help')">
					<div class="slash-command-icon">❓</div>
					<div class="slash-command-content">
						<div class="slash-command-title">${t('ui.slashCommands.builtinCommands.commands.help.title')}</div>
						<div class="slash-command-description">${t('ui.slashCommands.builtinCommands.commands.help.description')}</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('init')">
					<div class="slash-command-icon">🚀</div>
					<div class="slash-command-content">
						<div class="slash-command-title">${t('ui.slashCommands.builtinCommands.commands.init.title')}</div>
						<div class="slash-command-description">${t('ui.slashCommands.builtinCommands.commands.init.description')}</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('login')">
					<div class="slash-command-icon">🔑</div>
					<div class="slash-command-content">
						<div class="slash-command-title">${t('ui.slashCommands.builtinCommands.commands.login.title')}</div>
						<div class="slash-command-description">${t('ui.slashCommands.builtinCommands.commands.login.description')}</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('logout')">
					<div class="slash-command-icon">🚪</div>
					<div class="slash-command-content">
						<div class="slash-command-title">${t('ui.slashCommands.builtinCommands.commands.logout.title')}</div>
						<div class="slash-command-description">${t('ui.slashCommands.builtinCommands.commands.logout.description')}</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('mcp')">
					<div class="slash-command-icon">🔌</div>
					<div class="slash-command-content">
						<div class="slash-command-title">${t('ui.slashCommands.builtinCommands.commands.mcp.title')}</div>
						<div class="slash-command-description">${t('ui.slashCommands.builtinCommands.commands.mcp.description')}</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('memory')">
					<div class="slash-command-icon">🧠</div>
					<div class="slash-command-content">
						<div class="slash-command-title">${t('ui.slashCommands.builtinCommands.commands.memory.title')}</div>
						<div class="slash-command-description">${t('ui.slashCommands.builtinCommands.commands.memory.description')}</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('model')">
					<div class="slash-command-icon">🤖</div>
					<div class="slash-command-content">
						<div class="slash-command-title">${t('ui.slashCommands.builtinCommands.commands.model.title')}</div>
						<div class="slash-command-description">${t('ui.slashCommands.builtinCommands.commands.model.description')}</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('permissions')">
					<div class="slash-command-icon">🔒</div>
					<div class="slash-command-content">
						<div class="slash-command-title">${t('ui.slashCommands.builtinCommands.commands.permissions.title')}</div>
						<div class="slash-command-description">${t('ui.slashCommands.builtinCommands.commands.permissions.description')}</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('pr_comments')">
					<div class="slash-command-icon">💬</div>
					<div class="slash-command-content">
						<div class="slash-command-title">${t('ui.slashCommands.builtinCommands.commands.pr_comments.title')}</div>
						<div class="slash-command-description">${t('ui.slashCommands.builtinCommands.commands.pr_comments.description')}</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('review')">
					<div class="slash-command-icon">👀</div>
					<div class="slash-command-content">
						<div class="slash-command-title">${t('ui.slashCommands.builtinCommands.commands.review.title')}</div>
						<div class="slash-command-description">${t('ui.slashCommands.builtinCommands.commands.review.description')}</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('status')">
					<div class="slash-command-icon">📊</div>
					<div class="slash-command-content">
						<div class="slash-command-title">${t('ui.slashCommands.builtinCommands.commands.status.title')}</div>
						<div class="slash-command-description">${t('ui.slashCommands.builtinCommands.commands.status.description')}</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('terminal-setup')">
					<div class="slash-command-icon">⌨️</div>
					<div class="slash-command-content">
						<div class="slash-command-title">${t('ui.slashCommands.builtinCommands.commands.terminal-setup.title')}</div>
						<div class="slash-command-description">${t('ui.slashCommands.builtinCommands.commands.terminal-setup.description')}</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('vim')">
					<div class="slash-command-icon">📝</div>
					<div class="slash-command-content">
						<div class="slash-command-title">${t('ui.slashCommands.builtinCommands.commands.vim.title')}</div>
						<div class="slash-command-description">${t('ui.slashCommands.builtinCommands.commands.vim.description')}</div>
					</div>
				</div>
				<div class="slash-command-item custom-command-item">
					<div class="slash-command-icon">⚡</div>
					<div class="slash-command-content">
						<div class="slash-command-title">${t('ui.slashCommands.quickCommand.title')}</div>
						<div class="slash-command-description">
							<div class="command-input-wrapper">
								<span class="command-prefix">/</span>
								<input type="text" 
									   class="custom-command-input" 
									   id="customCommandInput"
									   placeholder="${t('ui.slashCommands.quickCommand.placeholder')}" 
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

	<script>
		const vscode = acquireVsCodeApi();
		const messagesDiv = document.getElementById('messages');
		const messageInput = document.getElementById('messageInput');
		const sendBtn = document.getElementById('sendBtn');
		const statusDiv = document.getElementById('status');
		const statusTextDiv = document.getElementById('statusText');
		const filePickerModal = document.getElementById('filePickerModal');
		const fileSearchInput = document.getElementById('fileSearchInput');
		const fileList = document.getElementById('fileList');
		const imageBtn = document.getElementById('imageBtn');

		let isProcessRunning = false;
		let filteredFiles = [];
		let selectedFileIndex = -1;
		let planModeEnabled = false;
		let thinkingModeEnabled = false;

		function shouldAutoScroll(messagesDiv) {
			const threshold = 100; // pixels from bottom
			const scrollTop = messagesDiv.scrollTop;
			const scrollHeight = messagesDiv.scrollHeight;
			const clientHeight = messagesDiv.clientHeight;
			
			return (scrollTop + clientHeight >= scrollHeight - threshold);
		}

		function scrollToBottomIfNeeded(messagesDiv, shouldScroll = null) {
			// If shouldScroll is not provided, check current scroll position
			if (shouldScroll === null) {
				shouldScroll = shouldAutoScroll(messagesDiv);
			}
			
			if (shouldScroll) {
				messagesDiv.scrollTop = messagesDiv.scrollHeight;
			}
		}

		function addMessage(content, type = 'claude') {
			const messagesDiv = document.getElementById('messages');
			const shouldScroll = shouldAutoScroll(messagesDiv);
			
			const messageDiv = document.createElement('div');
			messageDiv.className = \`message \${type}\`;
			
			// Add header for main message types (excluding system)
			if (type === 'user' || type === 'claude' || type === 'error') {
				const headerDiv = document.createElement('div');
				headerDiv.className = 'message-header';
				
				const iconDiv = document.createElement('div');
				iconDiv.className = \`message-icon \${type}\`;
				
				const labelDiv = document.createElement('div');
				labelDiv.className = 'message-label';
				
				// Set icon and label based on type
				switch(type) {
					case 'user':
						iconDiv.textContent = '👤';
						labelDiv.textContent = translations?.ui?.messages?.you || 'You';
						break;
					case 'claude':
						iconDiv.textContent = '🤖';
						labelDiv.textContent = translations?.ui?.messages?.claude || 'Claude';
						break;
					case 'error':
						iconDiv.textContent = '⚠️';
						labelDiv.textContent = translations?.ui?.messages?.error || 'Error';
						break;
				}
				
				// Add copy button
				const copyBtn = document.createElement('button');
				copyBtn.className = 'copy-btn';
				copyBtn.title = translations?.ui?.common?.copy || 'Copy message';
				copyBtn.onclick = () => copyMessageContent(messageDiv);
				copyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';
				
				headerDiv.appendChild(iconDiv);
				headerDiv.appendChild(labelDiv);
				headerDiv.appendChild(copyBtn);
				messageDiv.appendChild(headerDiv);
			}
			
			// Add content
			const contentDiv = document.createElement('div');
			contentDiv.className = 'message-content';
			
			if(type == 'user' || type === 'claude' || type === 'thinking'){
				contentDiv.innerHTML = content;
			} else {
				const preElement = document.createElement('pre');
				preElement.textContent = content;
				contentDiv.appendChild(preElement);
			}
			
			messageDiv.appendChild(contentDiv);
			
			// Check if this is a permission-related error and add yolo mode button
			if (type === 'error' && isPermissionError(content)) {
				const yoloSuggestion = document.createElement('div');
				yoloSuggestion.className = 'yolo-suggestion';
				yoloSuggestion.innerHTML = \`
					<div class="yolo-suggestion-text">
						<span>\${window.t('ui.permissionError.suggestion')}</span>
					</div>
					<button class="yolo-suggestion-btn" onclick="enableYoloMode()">\${window.t('ui.permissionError.enableYolo')}</button>
				\`;
				messageDiv.appendChild(yoloSuggestion);
			}
			
			messagesDiv.appendChild(messageDiv);
			scrollToBottomIfNeeded(messagesDiv, shouldScroll);
		}


		function addToolUseMessage(data) {
			const messagesDiv = document.getElementById('messages');
			const shouldScroll = shouldAutoScroll(messagesDiv);
			
			const messageDiv = document.createElement('div');
			messageDiv.className = 'message tool';
			
			// Create modern header with icon
			const headerDiv = document.createElement('div');
			headerDiv.className = 'tool-header';
			
			const iconDiv = document.createElement('div');
			iconDiv.className = 'tool-icon';
			iconDiv.textContent = '🔧';
			
			const toolInfoElement = document.createElement('div');
			toolInfoElement.className = 'tool-info';
			let toolName = data.toolInfo.replace('🔧 Executing: ', '');
			// Replace TodoWrite with more user-friendly name
			if (toolName === 'TodoWrite') {
				toolName = translations?.ui?.tools?.todoWrite?.name || 'Update Todos';
			}
			toolInfoElement.textContent = toolName;
			
			headerDiv.appendChild(iconDiv);
			headerDiv.appendChild(toolInfoElement);
			messageDiv.appendChild(headerDiv);
			
			if (data.rawInput) {
				const inputElement = document.createElement('div');
				inputElement.className = 'tool-input';
				
				const contentDiv = document.createElement('div');
				contentDiv.className = 'tool-input-content';
				
				// Handle TodoWrite specially or format raw input
				if (data.toolName === 'TodoWrite' && data.rawInput.todos) {
					let todoHtml = translations?.ui?.tools?.todoWrite?.listTitle || 'Todo List Update:';
					for (const todo of data.rawInput.todos) {
						const status = todo.status === 'completed' ? '✅' :
							todo.status === 'in_progress' ? '🔄' : '⏳';
						todoHtml += '\\n' + status + ' ' + todo.content + ' <span class="priority-badge ' + todo.priority + '">' + todo.priority + '</span>';
					}
					contentDiv.innerHTML = todoHtml;
				} else {
					// Format raw input with expandable content for long values
					// Use diff format for Edit, MultiEdit, and Write tools, regular format for others
					if (data.toolName === 'Edit') {
						contentDiv.innerHTML = formatEditToolDiff(data.rawInput);
					} else if (data.toolName === 'MultiEdit') {
						contentDiv.innerHTML = formatMultiEditToolDiff(data.rawInput);
					} else if (data.toolName === 'Write') {
						contentDiv.innerHTML = formatWriteToolDiff(data.rawInput);
					} else {
						contentDiv.innerHTML = formatToolInputUI(data.rawInput);
					}
				}
				
				inputElement.appendChild(contentDiv);
				messageDiv.appendChild(inputElement);
			} else if (data.toolInput) {
				// Fallback for pre-formatted input
				const inputElement = document.createElement('div');
				inputElement.className = 'tool-input';
				
				const labelDiv = document.createElement('div');
				labelDiv.className = 'tool-input-label';
				labelDiv.textContent = window.t('ui.tools.input') || 'INPUT';
				inputElement.appendChild(labelDiv);
				
				const contentDiv = document.createElement('div');
				contentDiv.className = 'tool-input-content';
				contentDiv.textContent = data.toolInput;
				inputElement.appendChild(contentDiv);
				messageDiv.appendChild(inputElement);
			}
			
			messagesDiv.appendChild(messageDiv);
			scrollToBottomIfNeeded(messagesDiv, shouldScroll);
		}

		function createExpandableInput(toolInput, rawInput) {
			try {
				let html = toolInput.replace(/\\[expand\\]/g, '<span class="expand-btn" onclick="toggleExpand(this)">' + (translations?.ui?.common?.expand || 'expand') + '</span>');
				
				// Store raw input data for expansion
				if (rawInput && typeof rawInput === 'object') {
					let btnIndex = 0;
					html = html.replace(/<span class="expand-btn"[^>]*>expand<\\/span>/g, (match) => {
						const keys = Object.keys(rawInput);
						const key = keys[btnIndex] || '';
						const value = rawInput[key] || '';
						const valueStr = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
						const escapedValue = valueStr.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
						btnIndex++;
						return \`<span class="expand-btn" data-key="\${key}" data-value="\${escapedValue}" onclick="toggleExpand(this)">\${translations?.ui?.common?.expand || 'expand'}</span>\`;
					});
				}
				
				return html;
			} catch (error) {
				console.error('Error creating expandable input:', error);
				return toolInput;
			}
		}


		function addToolResultMessage(data) {
			const messagesDiv = document.getElementById('messages');
			const shouldScroll = shouldAutoScroll(messagesDiv);
			
			// For Read and Edit tools with hidden flag, just hide loading state and show completion message
			if (data.hidden && (data.toolName === 'Read' || data.toolName === 'Edit' || data.toolName === 'TodoWrite' || data.toolName === 'MultiEdit') && !data.isError) {				
				return	
				// Show completion message
				const toolName = data.toolName;
				let completionText;
				if (toolName === 'Read') {
					completionText = window.t('ui.tools.read.completed');
				} else if (toolName === 'Edit') {
					completionText = window.t('ui.tools.edit.completed');
				} else if (toolName === 'Write') {
					completionText = window.t('ui.tools.write.completed');
				} else if (toolName === 'TodoWrite') {
					completionText = window.t('ui.tools.todoWrite.completed');
				} else {
					completionText = window.t('ui.tools.generic.completed', { toolName: toolName });
				}
				addMessage(completionText, 'system');
				return; // Don't show the result message
			}
			
			if(data.isError && data.content === "File has not been read yet. Read it first before writing to it."){
				return addMessage(window.t('ui.messages.fileNotReadError'), 'system');
			}

			const messageDiv = document.createElement('div');
			messageDiv.className = data.isError ? 'message error' : 'message tool-result';
			
			// Create header
			const headerDiv = document.createElement('div');
			headerDiv.className = 'message-header';
			
			const iconDiv = document.createElement('div');
			iconDiv.className = data.isError ? 'message-icon error' : 'message-icon';
			iconDiv.style.background = data.isError ? 
				'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' : 
				'linear-gradient(135deg, #1cc08c 0%, #16a974 100%)';
			iconDiv.textContent = data.isError ? '❌' : '✅';
			
			const labelDiv = document.createElement('div');
			labelDiv.className = 'message-label';
			labelDiv.textContent = data.isError ? (window.t('ui.messages.error') || 'Error') : (window.t('ui.tools.result') || 'Result');
			
			headerDiv.appendChild(iconDiv);
			headerDiv.appendChild(labelDiv);
			messageDiv.appendChild(headerDiv);
			
			// Add content
			const contentDiv = document.createElement('div');
			contentDiv.className = 'message-content';
			
			// Check if it's a tool result and truncate appropriately
			let content = data.content;
			if (content.length > 200 && !data.isError) {
				const truncateAt = 197;
				const truncated = content.substring(0, truncateAt);
				const resultId = 'result_' + Math.random().toString(36).substr(2, 9);
				
				const preElement = document.createElement('pre');
				preElement.innerHTML = '<span id="' + resultId + '_visible">' + escapeHtml(truncated) + '</span>' +
									   '<span id="' + resultId + '_ellipsis">...</span>' +
									   '<span id="' + resultId + '_hidden" style="display: none;">' + escapeHtml(content.substring(truncateAt)) + '</span>';
				contentDiv.appendChild(preElement);
				
				// Add expand button container
				const expandContainer = document.createElement('div');
				expandContainer.className = 'diff-expand-container';
				const expandButton = document.createElement('button');
				expandButton.className = 'diff-expand-btn';
				expandButton.textContent = window.t('ui.common.showMore') || 'Show more';
				expandButton.setAttribute('onclick', 'toggleResultExpansion(\\'' + resultId + '\\\')');
				expandContainer.appendChild(expandButton);
				contentDiv.appendChild(expandContainer);
			} else {
				const preElement = document.createElement('pre');
				preElement.textContent = content;
				contentDiv.appendChild(preElement);
			}
			
			messageDiv.appendChild(contentDiv);
			
			// Check if this is a permission-related error and add yolo mode button
			if (data.isError && isPermissionError(content)) {
				const yoloSuggestion = document.createElement('div');
				yoloSuggestion.className = 'yolo-suggestion';
				yoloSuggestion.innerHTML = \`
					<div class="yolo-suggestion-text">
						<span>\${window.t('ui.permissionError.suggestion')}</span>
					</div>
					<button class="yolo-suggestion-btn" onclick="enableYoloMode()">\${window.t('ui.permissionError.enableYolo')}</button>
				\`;
				messageDiv.appendChild(yoloSuggestion);
			}
			
			messagesDiv.appendChild(messageDiv);
			scrollToBottomIfNeeded(messagesDiv, shouldScroll);
		}

		function formatToolInputUI(input) {
			if (!input || typeof input !== 'object') {
				const str = String(input);
				if (str.length > 100) {
					const truncateAt = 97;
					const truncated = str.substring(0, truncateAt);
					const inputId = 'input_' + Math.random().toString(36).substr(2, 9);
					
					return '<span id="' + inputId + '_visible">' + escapeHtml(truncated) + '</span>' +
						   '<span id="' + inputId + '_ellipsis">...</span>' +
						   '<span id="' + inputId + '_hidden" style="display: none;">' + escapeHtml(str.substring(truncateAt)) + '</span>' +
						   '<div class="diff-expand-container">' +
						   '<button class="diff-expand-btn" onclick="toggleResultExpansion(\\\'' + inputId + '\\\')">Show more</button>' +
						   '</div>';
				}
				return str;
			}

			// Special handling for Read tool with file_path
			if (input.file_path && Object.keys(input).length === 1) {
				const formattedPath = formatFilePath(input.file_path);
				return '<div class="diff-file-path" onclick="openFileInEditor(\\\'' + escapeHtml(input.file_path) + '\\\')">' + formattedPath + '</div>';
			}

			let result = '';
			let isFirst = true;
			for (const [key, value] of Object.entries(input)) {
				const valueStr = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
				
				if (!isFirst) result += '\\n';
				isFirst = false;
				
				// Special formatting for file_path in Read tool context
				if (key === 'file_path') {
					const formattedPath = formatFilePath(valueStr);
					result += '<div class="diff-file-path" onclick="openFileInEditor(\\\'' + escapeHtml(valueStr) + '\\\')">' + formattedPath + '</div>';
				} else if (valueStr.length > 100) {
					const truncated = valueStr.substring(0, 97) + '...';
					const escapedValue = valueStr.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
					result += '<span class="expandable-item"><strong>' + key + ':</strong> ' + truncated + ' <span class="expand-btn" data-key="' + key + '" data-value="' + escapedValue + '" onclick="toggleExpand(this)">expand</span></span>';
				} else {
					result += '<strong>' + key + ':</strong> ' + valueStr;
				}
			}
			return result;
		}

		function formatEditToolDiff(input) {
			if (!input || typeof input !== 'object') {
				return formatToolInputUI(input);
			}

			// Check if this is an Edit tool (has file_path, old_string, new_string)
			if (!input.file_path || !input.old_string || !input.new_string) {
				return formatToolInputUI(input);
			}

			// Format file path with better display
			const formattedPath = formatFilePath(input.file_path);
			let result = '<div class="diff-file-path" onclick="openFileInEditor(\\\'' + escapeHtml(input.file_path) + '\\\')">' + formattedPath + '</div>\\n';
			
			// Create diff view
			const oldLines = input.old_string.split('\\n');
			const newLines = input.new_string.split('\\n');
			const allLines = [...oldLines.map(line => ({type: 'removed', content: line})), 
							 ...newLines.map(line => ({type: 'added', content: line}))];
			
			const maxLines = 6;
			const shouldTruncate = allLines.length > maxLines;
			const visibleLines = shouldTruncate ? allLines.slice(0, maxLines) : allLines;
			const hiddenLines = shouldTruncate ? allLines.slice(maxLines) : [];
			
			result += '<div class="diff-container">';
			result += '<div class="diff-header">Changes:</div>';
			
			// Create a unique ID for this diff
			const diffId = 'diff_' + Math.random().toString(36).substr(2, 9);
			
			// Show visible lines
			result += '<div id="' + diffId + '_visible">';
			for (const line of visibleLines) {
				const prefix = line.type === 'removed' ? '- ' : '+ ';
				const cssClass = line.type === 'removed' ? 'removed' : 'added';
				result += '<div class="diff-line ' + cssClass + '">' + prefix + escapeHtml(line.content) + '</div>';
			}
			result += '</div>';
			
			// Show hidden lines (initially hidden)
			if (shouldTruncate) {
				result += '<div id="' + diffId + '_hidden" style="display: none;">';
				for (const line of hiddenLines) {
					const prefix = line.type === 'removed' ? '- ' : '+ ';
					const cssClass = line.type === 'removed' ? 'removed' : 'added';
					result += '<div class="diff-line ' + cssClass + '">' + prefix + escapeHtml(line.content) + '</div>';
				}
				result += '</div>';
				
				// Add expand button
				result += '<div class="diff-expand-container">';
				result += '<button class="diff-expand-btn" onclick="toggleDiffExpansion(\\\'' + diffId + '\\\')">Show ' + hiddenLines.length + ' more lines</button>';
				result += '</div>';
			}
			
			result += '</div>';
			
			// Add other properties if they exist
			for (const [key, value] of Object.entries(input)) {
				if (key !== 'file_path' && key !== 'old_string' && key !== 'new_string') {
					const valueStr = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
					result += '\\n<strong>' + key + ':</strong> ' + valueStr;
				}
			}
			
			return result;
		}

		function formatMultiEditToolDiff(input) {
			if (!input || typeof input !== 'object') {
				return formatToolInputUI(input);
			}

			// Check if this is a MultiEdit tool (has file_path and edits array)
			if (!input.file_path || !input.edits || !Array.isArray(input.edits)) {
				return formatToolInputUI(input);
			}

			// Format file path with better display
			const formattedPath = formatFilePath(input.file_path);
			let result = '<div class="diff-file-path" onclick="openFileInEditor(\\\'' + escapeHtml(input.file_path) + '\\\')">' + formattedPath + '</div>\\n';
			
			// Count total lines across all edits for truncation
			let totalLines = 0;
			for (const edit of input.edits) {
				if (edit.old_string && edit.new_string) {
					const oldLines = edit.old_string.split('\\n');
					const newLines = edit.new_string.split('\\n');
					totalLines += oldLines.length + newLines.length;
				}
			}

			const maxLines = 6;
			const shouldTruncate = totalLines > maxLines;
			
			result += '<div class="diff-container">';
			result += '<div class="diff-header">Changes (' + input.edits.length + ' edit' + (input.edits.length > 1 ? 's' : '') + '):</div>';
			
			// Create a unique ID for this diff
			const diffId = 'multiedit_' + Math.random().toString(36).substr(2, 9);
			
			let currentLineCount = 0;
			let visibleEdits = [];
			let hiddenEdits = [];
			
			// Determine which edits to show/hide based on line count
			for (let i = 0; i < input.edits.length; i++) {
				const edit = input.edits[i];
				if (!edit.old_string || !edit.new_string) continue;
				
				const oldLines = edit.old_string.split('\\n');
				const newLines = edit.new_string.split('\\n');
				const editLines = oldLines.length + newLines.length;
				
				if (shouldTruncate && currentLineCount + editLines > maxLines && visibleEdits.length > 0) {
					hiddenEdits.push(edit);
				} else {
					visibleEdits.push(edit);
					currentLineCount += editLines;
				}
			}
			
			// Show visible edits
			result += '<div id="' + diffId + '_visible">';
			for (let i = 0; i < visibleEdits.length; i++) {
				const edit = visibleEdits[i];
				if (i > 0) result += '<div class="diff-edit-separator"></div>';
				result += formatSingleEdit(edit, i + 1);
			}
			result += '</div>';
			
			// Show hidden edits (initially hidden)
			if (hiddenEdits.length > 0) {
				result += '<div id="' + diffId + '_hidden" style="display: none;">';
				for (let i = 0; i < hiddenEdits.length; i++) {
					const edit = hiddenEdits[i];
					result += '<div class="diff-edit-separator"></div>';
					result += formatSingleEdit(edit, visibleEdits.length + i + 1);
				}
				result += '</div>';
				
				// Add expand button
				result += '<div class="diff-expand-container">';
				result += '<button class="diff-expand-btn" onclick="toggleDiffExpansion(\\\'' + diffId + '\\\')">Show ' + hiddenEdits.length + ' more edit' + (hiddenEdits.length > 1 ? 's' : '') + '</button>';
				result += '</div>';
			}
			
			result += '</div>';
			
			// Add other properties if they exist
			for (const [key, value] of Object.entries(input)) {
				if (key !== 'file_path' && key !== 'edits') {
					const valueStr = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
					result += '\\n<strong>' + key + ':</strong> ' + valueStr;
				}
			}
			
			return result;
		}

		function formatSingleEdit(edit, editNumber) {
			let result = '<div class="single-edit">';
			result += '<div class="edit-number">Edit #' + editNumber + '</div>';
			
			// Create diff view for this single edit
			const oldLines = edit.old_string.split('\\n');
			const newLines = edit.new_string.split('\\n');
			
			// Show removed lines
			for (const line of oldLines) {
				result += '<div class="diff-line removed">- ' + escapeHtml(line) + '</div>';
			}
			
			// Show added lines
			for (const line of newLines) {
				result += '<div class="diff-line added">+ ' + escapeHtml(line) + '</div>';
			}
			
			result += '</div>';
			return result;
		}

		function formatWriteToolDiff(input) {
			if (!input || typeof input !== 'object') {
				return formatToolInputUI(input);
			}

			// Check if this is a Write tool (has file_path and content)
			if (!input.file_path || !input.content) {
				return formatToolInputUI(input);
			}

			// Format file path with better display
			const formattedPath = formatFilePath(input.file_path);
			let result = '<div class="diff-file-path" onclick="openFileInEditor(\\\'' + escapeHtml(input.file_path) + '\\\')">' + formattedPath + '</div>\\n';
			
			// Create diff view showing all content as additions
			const contentLines = input.content.split('\\n');
			
			const maxLines = 6;
			const shouldTruncate = contentLines.length > maxLines;
			const visibleLines = shouldTruncate ? contentLines.slice(0, maxLines) : contentLines;
			const hiddenLines = shouldTruncate ? contentLines.slice(maxLines) : [];
			
			result += '<div class="diff-container">';
			result += '<div class="diff-header">New file content:</div>';
			
			// Create a unique ID for this diff
			const diffId = 'write_' + Math.random().toString(36).substr(2, 9);
			
			// Show visible lines (all as additions)
			result += '<div id="' + diffId + '_visible">';
			for (const line of visibleLines) {
				result += '<div class="diff-line added">+ ' + escapeHtml(line) + '</div>';
			}
			result += '</div>';
			
			// Show hidden lines (initially hidden)
			if (shouldTruncate) {
				result += '<div id="' + diffId + '_hidden" style="display: none;">';
				for (const line of hiddenLines) {
					result += '<div class="diff-line added">+ ' + escapeHtml(line) + '</div>';
				}
				result += '</div>';
				
				// Add expand button
				result += '<div class="diff-expand-container">';
				result += '<button class="diff-expand-btn" onclick="toggleDiffExpansion(\\\'' + diffId + '\\\')">Show ' + hiddenLines.length + ' more lines</button>';
				result += '</div>';
			}
			
			result += '</div>';
			
			// Add other properties if they exist
			for (const [key, value] of Object.entries(input)) {
				if (key !== 'file_path' && key !== 'content') {
					const valueStr = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
					result += '\\n<strong>' + key + ':</strong> ' + valueStr;
				}
			}
			
			return result;
		}

		function escapeHtml(text) {
			const div = document.createElement('div');
			div.textContent = text;
			return div.innerHTML;
		}

		function openFileInEditor(filePath) {
			vscode.postMessage({
				type: 'openFile',
				filePath: filePath
			});
		}

		function formatFilePath(filePath) {
			if (!filePath) return '';
			
			// Extract just the filename
			const parts = filePath.split('/');
			const fileName = parts[parts.length - 1];
			
			return '<span class="file-path-truncated" title="' + escapeHtml(filePath) + '" data-file-path="' + escapeHtml(filePath) + '">' + 
				   '<span class="file-icon">📄</span>' + escapeHtml(fileName) + '</span>';
		}

		function toggleDiffExpansion(diffId) {
			const hiddenDiv = document.getElementById(diffId + '_hidden');
			const button = document.querySelector('[onclick*="' + diffId + '"]');
			
			if (hiddenDiv && button) {
				if (hiddenDiv.style.display === 'none') {
					hiddenDiv.style.display = 'block';
					button.textContent = window.t('ui.common.showLess') || 'Show less';
				} else {
					hiddenDiv.style.display = 'none';
					const hiddenLines = hiddenDiv.querySelectorAll('.diff-line').length;
					button.textContent = (window.t('ui.tools.showMoreLines') || 'Show {count} more lines').replace('{count}', hiddenLines);
				}
			}
		}

		function toggleResultExpansion(resultId) {
			const hiddenDiv = document.getElementById(resultId + '_hidden');
			const ellipsis = document.getElementById(resultId + '_ellipsis');
			const button = document.querySelector('[onclick*="toggleResultExpansion(\\'' + resultId + '\\\')"]');
			
			if (hiddenDiv && button) {
				if (hiddenDiv.style.display === 'none') {
					hiddenDiv.style.display = 'inline';
					if (ellipsis) ellipsis.style.display = 'none';
					button.textContent = window.t('ui.common.showLess') || 'Show less';
				} else {
					hiddenDiv.style.display = 'none';
					if (ellipsis) ellipsis.style.display = 'inline';
					button.textContent = window.t('ui.common.showMore') || 'Show more';
				}
			}
		}

		function toggleExpand(button) {
			const key = button.getAttribute('data-key');
			const value = button.getAttribute('data-value');
			
			// Find the container that holds just this key-value pair
			let container = button.parentNode;
			while (container && !container.classList.contains('expandable-item')) {
				container = container.parentNode;
			}
			
			if (!container) {
				// Fallback: create a wrapper around the current line
				const parent = button.parentNode;
				const wrapper = document.createElement('div');
				wrapper.className = 'expandable-item';
				parent.insertBefore(wrapper, button.previousSibling || button);
				
				// Move the key, value text, and button into the wrapper
				let currentNode = wrapper.nextSibling;
				const nodesToMove = [];
				while (currentNode && currentNode !== button.nextSibling) {
					nodesToMove.push(currentNode);
					currentNode = currentNode.nextSibling;
				}
				nodesToMove.forEach(node => wrapper.appendChild(node));
				container = wrapper;
			}
			
			const expandText = translations?.ui?.common?.expand || 'expand';
			const collapseText = translations?.ui?.common?.collapse || 'collapse';
			
			if (button.textContent === expandText) {
				// Show full content
				const decodedValue = value.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
				container.innerHTML = '<strong>' + key + ':</strong> ' + decodedValue + ' <span class="expand-btn" data-key="' + key + '" data-value="' + value + '" onclick="toggleExpand(this)">' + collapseText + '</span>';
			} else {
				// Show truncated content
				const decodedValue = value.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
				const truncated = decodedValue.substring(0, 97) + '...';
				container.innerHTML = '<strong>' + key + ':</strong> ' + truncated + ' <span class="expand-btn" data-key="' + key + '" data-value="' + value + '" onclick="toggleExpand(this)">' + expandText + '</span>';
			}
		}

		function sendMessage() {
			const text = messageInput.value.trim();
			if (text) {
				sendStats('Send message');
				
				vscode.postMessage({
					type: 'sendMessage',
					text: text,
					planMode: planModeEnabled,
					thinkingMode: thinkingModeEnabled
				});
				
				messageInput.value = '';
			}
		}

		function togglePlanMode() {
			planModeEnabled = !planModeEnabled;
			const switchElement = document.getElementById('planModeSwitch');
			if (planModeEnabled) {
				switchElement.classList.add('active');
			} else {
				switchElement.classList.remove('active');
			}
		}

		function toggleThinkingMode() {
			thinkingModeEnabled = !thinkingModeEnabled;
			
			if (thinkingModeEnabled) {
				sendStats('Thinking mode enabled');
			}
			
			const switchElement = document.getElementById('thinkingModeSwitch');
			const toggleLabel = document.getElementById('thinkingModeLabel');
			if (thinkingModeEnabled) {
				switchElement.classList.add('active');
				// Show thinking intensity modal when thinking mode is enabled
				showThinkingIntensityModal();
			} else {
				switchElement.classList.remove('active');
				// Reset to default "Thinking Mode" when turned off
				if (toggleLabel) {
					toggleLabel.textContent = window.t('ui.input.thinkingMode');
				}
			}
		}


		let totalCost = 0;
		let totalTokensInput = 0;
		let totalTokensOutput = 0;
		let requestCount = 0;
		let isProcessing = false;
		let requestStartTime = null;
		let requestTimer = null;

		// Send usage statistics
		function sendStats(eventName) {
			${isTelemetryEnabled ? 
			`try {
				if (typeof umami !== 'undefined' && umami.track) {
					umami.track(eventName);
				}
			} catch (error) {
				console.error('Error sending stats:', error);
			}` : 
			`// Telemetry disabled - no tracking`}
		}

		function updateStatus(text, state = 'ready') {
			statusTextDiv.textContent = text;
			statusDiv.className = \`status \${state}\`;
		}

		function updateStatusWithTotals() {
			if (isProcessing) {
				// While processing, show tokens and elapsed time
				const totalTokens = totalTokensInput + totalTokensOutput;
				const tokensStr = totalTokens > 0 ? 
					\`\${totalTokens.toLocaleString()} \${translations?.ui?.status?.tokens || 'tokens'}\` : \`0 \${translations?.ui?.status?.tokens || 'tokens'}\`;
				
				let elapsedStr = '';
				if (requestStartTime) {
					const elapsedSeconds = Math.floor((Date.now() - requestStartTime) / 1000);
					elapsedStr = \` • \${elapsedSeconds}s\`;
				}
				
				const statusText = \`\${translations?.ui?.status?.processing || 'Processing'} • \${tokensStr}\${elapsedStr}\`;
				updateStatus(statusText, 'processing');
			} else {
				// When ready, show full info
				const costStr = totalCost > 0 ? \`$\${totalCost.toFixed(4)}\` : '$0.00';
				const totalTokens = totalTokensInput + totalTokensOutput;
				const tokensStr = totalTokens > 0 ? 
					\`\${totalTokens.toLocaleString()} \${translations?.ui?.status?.tokens || 'tokens'}\` : \`0 \${translations?.ui?.status?.tokens || 'tokens'}\`;
				const requestStr = requestCount > 0 ? \`\${requestCount} requests\` : '';
				
				const statusText = \`Ready • \${costStr} • \${tokensStr}\${requestStr ? \` • \${requestStr}\` : ''}\`;
				updateStatus(statusText, 'ready');
			}
		}

		function startRequestTimer(startTime = undefined) {
			requestStartTime = startTime || Date.now();
			// Update status every 100ms for smooth real-time display
			requestTimer = setInterval(() => {
				if (isProcessing) {
					updateStatusWithTotals();
				}
			}, 100);
		}

		function stopRequestTimer() {
			if (requestTimer) {
				clearInterval(requestTimer);
				requestTimer = null;
			}
			requestStartTime = null;
		}

		// Auto-resize textarea
		function adjustTextareaHeight() {
			// Reset height to calculate new height
			messageInput.style.height = 'auto';
			
			// Get computed styles
			const computedStyle = getComputedStyle(messageInput);
			const lineHeight = parseFloat(computedStyle.lineHeight);
			const paddingTop = parseFloat(computedStyle.paddingTop);
			const paddingBottom = parseFloat(computedStyle.paddingBottom);
			const borderTop = parseFloat(computedStyle.borderTopWidth);
			const borderBottom = parseFloat(computedStyle.borderBottomWidth);
			
			// Calculate heights
			const scrollHeight = messageInput.scrollHeight;
			const maxRows = 5;
			const minHeight = lineHeight + paddingTop + paddingBottom + borderTop + borderBottom;
			const maxHeight = (lineHeight * maxRows) + paddingTop + paddingBottom + borderTop + borderBottom;
			
			// Set height
			if (scrollHeight <= maxHeight) {
				messageInput.style.height = Math.max(scrollHeight, minHeight) + 'px';
				messageInput.style.overflowY = 'hidden';
			} else {
				messageInput.style.height = maxHeight + 'px';
				messageInput.style.overflowY = 'auto';
			}
		}

		messageInput.addEventListener('input', adjustTextareaHeight);
		
		// Save input text as user types (debounced)
		let saveInputTimeout;
		messageInput.addEventListener('input', () => {
			clearTimeout(saveInputTimeout);
			saveInputTimeout = setTimeout(() => {
				vscode.postMessage({
					type: 'saveInputText',
					text: messageInput.value
				});
			}, 500); // Save after 500ms of no typing
		});
		
		messageInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				const sendBtn = document.getElementById('sendBtn');
				if (sendBtn.disabled){
					return;
				}
				sendMessage();
			} else if (e.key === '@' && !e.ctrlKey && !e.metaKey) {
				// Don't prevent default, let @ be typed first
				setTimeout(() => {
					showFilePicker();
				}, 0);
			} else if (e.key === 'Escape' && filePickerModal.style.display === 'flex') {
				e.preventDefault();
				hideFilePicker();
			} else if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
				// Handle Ctrl+V/Cmd+V explicitly in case paste event doesn't fire
				// Don't prevent default - let browser handle it first
				setTimeout(() => {
					// If value hasn't changed, manually trigger paste
					const currentValue = messageInput.value;
					setTimeout(() => {
						if (messageInput.value === currentValue) {
							// Value didn't change, request clipboard from VS Code
							vscode.postMessage({
								type: 'getClipboardText'
							});
						}
					}, 50);
				}, 0);
			}
		});

		// Add explicit paste event handler for better clipboard support in VSCode webviews
		messageInput.addEventListener('paste', async (e) => {
			e.preventDefault();
			
			try {
				// Try to get clipboard data from the event first
				const clipboardData = e.clipboardData;
				
				// Check for images first
				if (clipboardData && clipboardData.items) {
					let hasImage = false;
					for (let i = 0; i < clipboardData.items.length; i++) {
						const item = clipboardData.items[i];
						if (item.type.startsWith('image/')) {
							// Found an image, handle it
							console.log('Image detected in clipboard:', item.type);
							hasImage = true;
							const blob = item.getAsFile();
							if (blob) {
								console.log('Converting image blob to base64...');
								// Convert blob to base64
								const reader = new FileReader();
								reader.onload = function(event) {
									const base64Data = event.target.result;
									console.log('Sending image to extension for file creation');
									// Send to extension to create file
									vscode.postMessage({
										type: 'createImageFile',
										imageData: base64Data,
										imageType: item.type
									});
								};
								reader.readAsDataURL(blob);
							}
							break; // Process only the first image found
						}
					}
					
					// If we found an image, don't process any text
					if (hasImage) {
						return;
					}
				}
				
				// No image found, handle text
				let text = '';
				
				if (clipboardData) {
					text = clipboardData.getData('text/plain');
				}
				
				// If no text from event, try navigator.clipboard API
				if (!text && navigator.clipboard && navigator.clipboard.readText) {
					try {
						text = await navigator.clipboard.readText();
					} catch (err) {
						console.log('Clipboard API failed:', err);
					}
				}
				
				// If still no text, request from VS Code extension
				if (!text) {
					vscode.postMessage({
						type: 'getClipboardText'
					});
					return;
				}
				
				// Insert text at cursor position
				const start = messageInput.selectionStart;
				const end = messageInput.selectionEnd;
				const currentValue = messageInput.value;
				
				const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
				messageInput.value = newValue;
				
				// Set cursor position after pasted text
				const newCursorPos = start + text.length;
				messageInput.setSelectionRange(newCursorPos, newCursorPos);
				
				// Trigger input event to adjust height
				messageInput.dispatchEvent(new Event('input', { bubbles: true }));
			} catch (error) {
				console.error('Paste error:', error);
			}
		});

		// Handle context menu paste
		messageInput.addEventListener('contextmenu', (e) => {
			// Don't prevent default - allow context menu to show
			// but ensure paste will work when selected
		});

		// Initialize textarea height
		adjustTextareaHeight();

		// File picker event listeners
		fileSearchInput.addEventListener('input', (e) => {
			filterFiles(e.target.value);
		});

		fileSearchInput.addEventListener('keydown', (e) => {
			if (e.key === 'ArrowDown') {
				e.preventDefault();
				selectedFileIndex = Math.min(selectedFileIndex + 1, filteredFiles.length - 1);
				renderFileList();
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				selectedFileIndex = Math.max(selectedFileIndex - 1, -1);
				renderFileList();
			} else if (e.key === 'Enter' && selectedFileIndex >= 0) {
				e.preventDefault();
				selectFile(filteredFiles[selectedFileIndex]);
			} else if (e.key === 'Escape') {
				e.preventDefault();
				hideFilePicker();
			}
		});

		// Close modal when clicking outside
		filePickerModal.addEventListener('click', (e) => {
			if (e.target === filePickerModal) {
				hideFilePicker();
			}
		});

		// Tools modal functions
		function showMCPModal() {
			document.getElementById('mcpModal').style.display = 'flex';
			// Load existing MCP servers
			loadMCPServers();
		}
		
		function updateYoloWarning() {
			const yoloModeCheckbox = document.getElementById('yolo-mode');
			const warning = document.getElementById('yoloWarning');
			
			if (!yoloModeCheckbox || !warning) {
				return; // Elements not ready yet
			}
			
			const yoloMode = yoloModeCheckbox.checked;
			warning.style.display = yoloMode ? 'block' : 'none';
		}
		
		function isPermissionError(content) {
			const permissionErrorPatterns = [
				'Error: MCP config file not found',
				'Error: MCP tool',
				'Claude requested permissions to use',
				'permission denied',
				'Permission denied',
				'permission request',
				'Permission request',
				'EACCES',
				'permission error',
				'Permission error'
			];
			
			return permissionErrorPatterns.some(pattern => 
				content.toLowerCase().includes(pattern.toLowerCase())
			);
		}
		
		function enableYoloMode() {
			sendStats('YOLO mode enabled');
			
			// Update the checkbox
			const yoloModeCheckbox = document.getElementById('yolo-mode');
			if (yoloModeCheckbox) {
				yoloModeCheckbox.checked = true;
				
				// Trigger the settings update
				updateSettings();
				
				// Show confirmation message
				addMessage(window.t('ui.messages.yoloModeEnabled'), 'system');
				
				// Update the warning banner
				updateYoloWarning();
			}
		}

		function hideMCPModal() {
			document.getElementById('mcpModal').style.display = 'none';
			hideAddServerForm();
		}

		// Close MCP modal when clicking outside
		document.getElementById('mcpModal').addEventListener('click', (e) => {
			if (e.target === document.getElementById('mcpModal')) {
				hideMCPModal();
			}
		});

		// MCP Server management functions
		function loadMCPServers() {
			vscode.postMessage({ type: 'loadMCPServers' });
		}

		function showAddServerForm() {
			document.getElementById('addServerBtn').style.display = 'none';
			document.getElementById('popularServers').style.display = 'none';
			document.getElementById('addServerForm').style.display = 'block';
		}

		function hideAddServerForm() {
			document.getElementById('addServerBtn').style.display = 'block';
			document.getElementById('popularServers').style.display = 'block';
			document.getElementById('addServerForm').style.display = 'none';
			
			// Reset editing state
			editingServerName = null;
			
			// Reset form title and button
			const formTitle = document.querySelector('#addServerForm h5');
			if (formTitle) formTitle.remove();
			
			const saveBtn = document.querySelector('#addServerForm .btn:not(.outlined)');
			if (saveBtn) saveBtn.textContent = 'Add Server';
			
			// Clear form
			document.getElementById('serverName').value = '';
			document.getElementById('serverName').disabled = false;
			document.getElementById('serverCommand').value = '';
			document.getElementById('serverUrl').value = '';
			document.getElementById('serverArgs').value = '';
			document.getElementById('serverEnv').value = '';
			document.getElementById('serverHeaders').value = '';
			document.getElementById('serverType').value = 'http';
			updateServerForm();
		}

		function updateServerForm() {
			const serverType = document.getElementById('serverType').value;
			const commandGroup = document.getElementById('commandGroup');
			const urlGroup = document.getElementById('urlGroup');
			const argsGroup = document.getElementById('argsGroup');
			const envGroup = document.getElementById('envGroup');
			const headersGroup = document.getElementById('headersGroup');

			if (serverType === 'stdio') {
				commandGroup.style.display = 'block';
				urlGroup.style.display = 'none';
				argsGroup.style.display = 'block';
				envGroup.style.display = 'block';
				headersGroup.style.display = 'none';
			} else if (serverType === 'http' || serverType === 'sse') {
				commandGroup.style.display = 'none';
				urlGroup.style.display = 'block';
				argsGroup.style.display = 'none';
				envGroup.style.display = 'none';
				headersGroup.style.display = 'block';
			}
		}

		function saveMCPServer() {
			sendStats('MCP server added');
			
			const name = document.getElementById('serverName').value.trim();
			const type = document.getElementById('serverType').value;
			
			if (!name) {
				// Use a simple notification instead of alert which is blocked
				const notification = document.createElement('div');
				notification.textContent = window.t('ui.mcpServers.addForm.validation.nameRequired');
				notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: var(--vscode-inputValidation-errorBackground); color: var(--vscode-inputValidation-errorForeground); padding: 8px 12px; border-radius: 4px; z-index: 9999;';
				document.body.appendChild(notification);
				setTimeout(() => notification.remove(), 3000);
				return;
			}

			// If editing, we can use the same name; if adding, check for duplicates
			if (!editingServerName) {
				const serversList = document.getElementById('mcpServersList');
				const existingServers = serversList.querySelectorAll('.server-name');
				for (let server of existingServers) {
					if (server.textContent === name) {
						const notification = document.createElement('div');
						notification.textContent = window.t('ui.mcpServers.addForm.validation.serverExists', { name });
						notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: var(--vscode-inputValidation-errorBackground); color: var(--vscode-inputValidation-errorForeground); padding: 8px 12px; border-radius: 4px; z-index: 9999;';
						document.body.appendChild(notification);
						setTimeout(() => notification.remove(), 3000);
						return;
					}
				}
			}

			const serverConfig = { type };

			if (type === 'stdio') {
				const command = document.getElementById('serverCommand').value.trim();
				if (!command) {
					const notification = document.createElement('div');
					notification.textContent = window.t('ui.mcpServers.addForm.validation.commandRequired');
					notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: var(--vscode-inputValidation-errorBackground); color: var(--vscode-inputValidation-errorForeground); padding: 8px 12px; border-radius: 4px; z-index: 9999;';
					document.body.appendChild(notification);
					setTimeout(() => notification.remove(), 3000);
					return;
				}
				serverConfig.command = command;

				const argsText = document.getElementById('serverArgs').value.trim();
				if (argsText) {
					serverConfig.args = argsText.split('\\n').filter(line => line.trim());
				}

				const envText = document.getElementById('serverEnv').value.trim();
				if (envText) {
					serverConfig.env = {};
					envText.split('\\n').forEach(line => {
						const [key, ...valueParts] = line.split('=');
						if (key && valueParts.length > 0) {
							serverConfig.env[key.trim()] = valueParts.join('=').trim();
						}
					});
				}
			} else if (type === 'http' || type === 'sse') {
				const url = document.getElementById('serverUrl').value.trim();
				if (!url) {
					const notification = document.createElement('div');
					notification.textContent = window.t('ui.mcpServers.addForm.validation.urlRequired');
					notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: var(--vscode-inputValidation-errorBackground); color: var(--vscode-inputValidation-errorForeground); padding: 8px 12px; border-radius: 4px; z-index: 9999;';
					document.body.appendChild(notification);
					setTimeout(() => notification.remove(), 3000);
					return;
				}
				serverConfig.url = url;

				const headersText = document.getElementById('serverHeaders').value.trim();
				if (headersText) {
					serverConfig.headers = {};
					headersText.split('\\n').forEach(line => {
						const [key, ...valueParts] = line.split('=');
						if (key && valueParts.length > 0) {
							serverConfig.headers[key.trim()] = valueParts.join('=').trim();
						}
					});
				}
			}

			vscode.postMessage({ 
				type: 'saveMCPServer', 
				name: name,
				config: serverConfig 
			});
			
			hideAddServerForm();
		}

		function deleteMCPServer(serverName) {
			// Just delete without confirmation
			vscode.postMessage({ 
				type: 'deleteMCPServer', 
				name: serverName 
			});
		}

		let editingServerName = null;

		function editMCPServer(name, config) {
			editingServerName = name;
			
			// Hide add button and popular servers
			document.getElementById('addServerBtn').style.display = 'none';
			document.getElementById('popularServers').style.display = 'none';
			
			// Show form
			document.getElementById('addServerForm').style.display = 'block';
			
			// Update form title and button
			const formTitle = document.querySelector('#addServerForm h5') || 
				document.querySelector('#addServerForm').insertAdjacentHTML('afterbegin', '<h5>Edit MCP Server</h5>') ||
				document.querySelector('#addServerForm h5');
			if (!document.querySelector('#addServerForm h5')) {
				document.getElementById('addServerForm').insertAdjacentHTML('afterbegin', '<h5 style="margin: 0 0 20px 0; font-size: 14px; font-weight: 600;">Edit MCP Server</h5>');
			} else {
				document.querySelector('#addServerForm h5').textContent = 'Edit MCP Server';
			}
			
			// Update save button text
			const saveBtn = document.querySelector('#addServerForm .btn:not(.outlined)');
			if (saveBtn) saveBtn.textContent = 'Update Server';
			
			// Populate form with existing values
			document.getElementById('serverName').value = name;
			document.getElementById('serverName').disabled = true; // Don't allow name changes when editing
			
			document.getElementById('serverType').value = config.type || 'stdio';
			
			if (config.command) {
				document.getElementById('serverCommand').value = config.command;
			}
			if (config.url) {
				document.getElementById('serverUrl').value = config.url;
			}
			if (config.args && Array.isArray(config.args)) {
				document.getElementById('serverArgs').value = config.args.join('\\n');
			}
			if (config.env) {
				const envLines = Object.entries(config.env).map(([key, value]) => \`\${key}=\${value}\`);
				document.getElementById('serverEnv').value = envLines.join('\\n');
			}
			if (config.headers) {
				const headerLines = Object.entries(config.headers).map(([key, value]) => \`\${key}=\${value}\`);
				document.getElementById('serverHeaders').value = headerLines.join('\\n');
			}
			
			// Update form field visibility
			updateServerForm();

			const toolsList = document.querySelector('.tools-list');
			if (toolsList) {
			  toolsList.scrollTop = toolsList.scrollHeight;
			}
		}

		function addPopularServer(name, config) {
			// Check if server already exists
			const serversList = document.getElementById('mcpServersList');
			const existingServers = serversList.querySelectorAll('.server-name');
			for (let server of existingServers) {
				if (server.textContent === name) {
					const notification = document.createElement('div');
					notification.textContent = window.t('ui.mcpServers.addForm.validation.serverExists', { name });
					notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: var(--vscode-inputValidation-errorBackground); color: var(--vscode-inputValidation-errorForeground); padding: 8px 12px; border-radius: 4px; z-index: 9999;';
					document.body.appendChild(notification);
					setTimeout(() => notification.remove(), 3000);
					return;
				}
			}
			
			sendStats('MCP server added');
			
			// Add the server
			vscode.postMessage({ 
				type: 'saveMCPServer', 
				name: name,
				config: config 
			});
		}

		function displayMCPServers(servers) {
			const serversList = document.getElementById('mcpServersList');
			serversList.innerHTML = '';

			if (Object.keys(servers).length === 0) {
				serversList.innerHTML = '<div class="no-servers">' + (translations?.ui?.mcpServers?.noServers || 'No MCP servers configured') + '</div>';
				return;
			}

			for (const [name, config] of Object.entries(servers)) {				
				const serverItem = document.createElement('div');
				serverItem.className = 'mcp-server-item';
				
				// Defensive check for config structure
				if (!config || typeof config !== 'object') {
					console.error('Invalid config for server:', name, config);
					continue;
				}
				
				const serverType = config.type || 'stdio';
				let configDisplay = '';
				
				if (serverType === 'stdio') {
					configDisplay = \`Command: \${config.command || 'Not specified'}\`;
					if (config.args && Array.isArray(config.args)) {
						configDisplay += \`<br>Args: \${config.args.join(' ')}\`;
					}
				} else if (serverType === 'http' || serverType === 'sse') {
					configDisplay = \`URL: \${config.url || 'Not specified'}\`;
				} else {
					configDisplay = \`Type: \${serverType}\`;
				}

				serverItem.innerHTML = \`
					<div class="server-info">
						<div class="server-name">\${name}</div>
						<div class="server-type">\${serverType.toUpperCase()}</div>
						<div class="server-config">\${configDisplay}</div>
					</div>
					<div class="server-actions">
						<button class="btn outlined server-edit-btn" onclick="editMCPServer('\${name}', \${JSON.stringify(config).replace(/"/g, '&quot;')})">Edit</button>
						<button class="btn outlined server-delete-btn" onclick="deleteMCPServer('\${name}')">Delete</button>
					</div>
				\`;
				
				serversList.appendChild(serverItem);
			}
		}

		// Model selector functions
		let currentModel = 'opus'; // Default model

		function showModelSelector() {
			document.getElementById('modelModal').style.display = 'flex';
			// Select the current model radio button
			const radioButton = document.getElementById('model-' + currentModel);
			if (radioButton) {
				radioButton.checked = true;
			}
		}

		function hideModelModal() {
			document.getElementById('modelModal').style.display = 'none';
		}

		// Slash commands modal functions
		function showSlashCommandsModal() {
			document.getElementById('slashCommandsModal').style.display = 'flex';
			// Auto-focus the search input
			setTimeout(() => {
				document.getElementById('slashCommandsSearch').focus();
			}, 100);
		}

		function hideSlashCommandsModal() {
			document.getElementById('slashCommandsModal').style.display = 'none';
		}

		// Thinking intensity modal functions
		function showThinkingIntensityModal() {
			// Request current settings from VS Code first
			vscode.postMessage({
				type: 'getSettings'
			});
			document.getElementById('thinkingIntensityModal').style.display = 'flex';
		}

		function hideThinkingIntensityModal() {
			document.getElementById('thinkingIntensityModal').style.display = 'none';
		}

		function saveThinkingIntensity() {
			const thinkingSlider = document.getElementById('thinkingIntensitySlider');
			const intensityValues = ['think', 'think-hard', 'think-harder', 'ultrathink'];
			const thinkingIntensity = intensityValues[thinkingSlider.value] || 'think';
			
			// Send settings to VS Code
			vscode.postMessage({
				type: 'updateSettings',
				settings: {
					'thinking.intensity': thinkingIntensity
				}
			});
		}

		function updateThinkingModeToggleName(intensityValue) {
			const intensityKeys = ['think', 'thinkHard', 'thinkHarder', 'ultrathink'];
			const modeKey = intensityKeys[intensityValue] || 'think';
			const modeName = window.t('ui.thinkingIntensity.modeLabels.' + modeKey);
			const toggleLabel = document.getElementById('thinkingModeLabel');
			if (toggleLabel) {
				toggleLabel.textContent = modeName;
			}
		}

		function updateThinkingIntensityDisplay(value) {
			// Update label highlighting for thinking intensity modal
			for (let i = 0; i < 4; i++) {
				const label = document.getElementById('thinking-label-' + i);
				if (i == value) {
					label.classList.add('active');
				} else {
					label.classList.remove('active');
				}
			}
			
			// Don't update toggle name until user confirms
		}

		function setThinkingIntensityValue(value) {
			// Set slider value for thinking intensity modal
			document.getElementById('thinkingIntensitySlider').value = value;
			
			// Update visual state
			updateThinkingIntensityDisplay(value);
		}

		function confirmThinkingIntensity() {
			// Get the current slider value
			const currentValue = document.getElementById('thinkingIntensitySlider').value;
			
			// Update the toggle name with confirmed selection
			updateThinkingModeToggleName(currentValue);
			
			// Save the current intensity setting
			saveThinkingIntensity();
			
			// Close the modal
			hideThinkingIntensityModal();
		}

		// WSL Alert functions
		function showWSLAlert() {
			const alert = document.getElementById('wslAlert');
			if (alert) {
				alert.style.display = 'block';
			}
		}

		function dismissWSLAlert() {
			const alert = document.getElementById('wslAlert');
			if (alert) {
				alert.style.display = 'none';
			}
			// Send dismiss message to extension to store in globalState
			vscode.postMessage({
				type: 'dismissWSLAlert'
			});
		}

		function openWSLSettings() {
			// Dismiss the alert
			dismissWSLAlert();
			
			// Open settings modal
			toggleSettings();
		}

		function executeSlashCommand(command) {
			// Hide the modal
			hideSlashCommandsModal();
			
			// Clear the input since user selected a command
			messageInput.value = '';
			
			// Send command to VS Code to execute in terminal
			vscode.postMessage({
				type: 'executeSlashCommand',
				command: command
			});
			
			// Show user feedback
			addMessage('user', window.t('ui.messages.slashCommandExecuted', { command }), 'assistant');
		}

		function handleCustomCommandKeydown(event) {
			if (event.key === 'Enter') {
				event.preventDefault();
				const customCommand = event.target.value.trim();
				if (customCommand) {
					executeSlashCommand(customCommand);
					// Clear the input for next use
					event.target.value = '';
				}
			}
		}

		// Store custom snippets data globally
		let customSnippetsData = {};

		function usePromptSnippet(snippetType) {
			// Get translated built-in snippets
			const builtInSnippets = {
				'performance-analysis': window.t('ui.slashCommands.promptSnippets.performanceAnalysis.description'),
				'security-review': window.t('ui.slashCommands.promptSnippets.securityReview.description'),
				'implementation-review': window.t('ui.slashCommands.promptSnippets.implementationReview.description'),
				'code-explanation': window.t('ui.slashCommands.promptSnippets.codeExplanation.description'),
				'bug-fix': window.t('ui.slashCommands.promptSnippets.bugFix.description'),
				'refactor': window.t('ui.slashCommands.promptSnippets.refactor.description'),
				'test-generation': window.t('ui.slashCommands.promptSnippets.testGeneration.description'),
				'documentation': window.t('ui.slashCommands.promptSnippets.documentation.description')
			};
			
			// Check built-in snippets first
			let promptText = builtInSnippets[snippetType];
			
			// If not found in built-in, check custom snippets
			if (!promptText && customSnippetsData[snippetType]) {
				promptText = customSnippetsData[snippetType].prompt;
			}
			
			if (promptText) {
				// Hide the modal
				hideSlashCommandsModal();
				
				// Insert the prompt into the message input
				messageInput.value = promptText;
				messageInput.focus();
				
				// Auto-resize the textarea
				autoResizeTextarea();
			}
		}

		function showAddSnippetForm() {
			document.getElementById('addSnippetForm').style.display = 'block';
			document.getElementById('snippetName').focus();
		}

		function hideAddSnippetForm() {
			document.getElementById('addSnippetForm').style.display = 'none';
			// Clear form fields
			document.getElementById('snippetName').value = '';
			document.getElementById('snippetPrompt').value = '';
		}

		function saveCustomSnippet() {
			const name = document.getElementById('snippetName').value.trim();
			const prompt = document.getElementById('snippetPrompt').value.trim();
			
			if (!name || !prompt) {
				alert('Please fill in both name and prompt text.');
				return;
			}
			
			// Generate a unique ID for the snippet
			const snippetId = 'custom-' + Date.now();
			
			// Save the snippet using VS Code global storage
			const snippetData = {
				name: name,
				prompt: prompt,
				id: snippetId
			};
			
			vscode.postMessage({
				type: 'saveCustomSnippet',
				snippet: snippetData
			});
			
			// Hide the form
			hideAddSnippetForm();
		}

		function loadCustomSnippets(snippetsData = {}) {
			const snippetsList = document.getElementById('promptSnippetsList');
			
			// Remove existing custom snippets
			const existingCustom = snippetsList.querySelectorAll('.custom-snippet-item');
			existingCustom.forEach(item => item.remove());
			
			// Add custom snippets after the add button and form
			const addForm = document.getElementById('addSnippetForm');
			
			Object.values(snippetsData).forEach(snippet => {
				const snippetElement = document.createElement('div');
				snippetElement.className = 'slash-command-item prompt-snippet-item custom-snippet-item';
				snippetElement.onclick = () => usePromptSnippet(snippet.id);
				
				snippetElement.innerHTML = \`
					<div class="slash-command-icon">📝</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/\${snippet.name}</div>
						<div class="slash-command-description">\${snippet.prompt}</div>
					</div>
					<div class="snippet-actions">
						<button class="snippet-delete-btn" onclick="event.stopPropagation(); deleteCustomSnippet('\${snippet.id}')" title="\${window.t('ui.slashCommands.management.deleteSnippet')}">🗑️</button>
					</div>
				\`;
				
				// Insert after the form
				addForm.parentNode.insertBefore(snippetElement, addForm.nextSibling);
			});
		}

		function deleteCustomSnippet(snippetId) {
			vscode.postMessage({
				type: 'deleteCustomSnippet',
				snippetId: snippetId
			});
		}

		function filterSlashCommands() {
			const searchTerm = document.getElementById('slashCommandsSearch').value.toLowerCase();
			const allItems = document.querySelectorAll('.slash-command-item');
			
			allItems.forEach(item => {
				const title = item.querySelector('.slash-command-title').textContent.toLowerCase();
				const description = item.querySelector('.slash-command-description').textContent.toLowerCase();
				
				if (title.includes(searchTerm) || description.includes(searchTerm)) {
					item.style.display = 'flex';
				} else {
					item.style.display = 'none';
				}
			});
		}

		function openModelTerminal() {
			vscode.postMessage({
				type: 'openModelTerminal'
			});
			hideModelModal();
		}

		function selectModel(model, fromBackend = false) {
			currentModel = model;
			
			// Update the display text
			const displayNames = {
				'opus': 'Opus',
				'sonnet': 'Sonnet',
				'default': 'Model'
			};
			document.getElementById('selectedModel').textContent = displayNames[model] || model;
			
			// Only send model selection to VS Code extension if not from backend
			if (!fromBackend) {
				vscode.postMessage({
					type: 'selectModel',
					model: model
				});
				
				// Save preference
				localStorage.setItem('selectedModel', model);
			}
			
			// Update radio button if modal is open
			const radioButton = document.getElementById('model-' + model);
			if (radioButton) {
				radioButton.checked = true;
			}
			
			hideModelModal();
		}

		// Initialize model display without sending message
		currentModel = 'opus';
		const displayNames = {
			'opus': 'Opus',
			'sonnet': 'Sonnet',
			'default': 'Default'
		};
		document.getElementById('selectedModel').textContent = displayNames[currentModel];

		// Close model modal when clicking outside
		document.getElementById('modelModal').addEventListener('click', (e) => {
			if (e.target === document.getElementById('modelModal')) {
				hideModelModal();
			}
		});

		// Stop button functions
		function showStopButton() {
			document.getElementById('stopBtn').style.display = 'flex';
		}

		function hideStopButton() {
			document.getElementById('stopBtn').style.display = 'none';
		}

		function stopRequest() {
			sendStats('Stop request');
			
			vscode.postMessage({
				type: 'stopRequest'
			});
			hideStopButton();
		}

		// Disable/enable buttons during processing
		function disableButtons() {
			const sendBtn = document.getElementById('sendBtn');
			if (sendBtn) sendBtn.disabled = true;
		}

		function enableButtons() {
			const sendBtn = document.getElementById('sendBtn');
			if (sendBtn) sendBtn.disabled = false;
		}

		// Copy message content function
		function copyMessageContent(messageDiv) {
			const contentDiv = messageDiv.querySelector('.message-content');
			if (contentDiv) {
				// Get text content, preserving line breaks
				const text = contentDiv.innerText || contentDiv.textContent;
				
				// Copy to clipboard
				navigator.clipboard.writeText(text).then(() => {
					// Show brief feedback
					const copyBtn = messageDiv.querySelector('.copy-btn');
					const originalHtml = copyBtn.innerHTML;
					copyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
					copyBtn.style.color = '#4caf50';
					
					setTimeout(() => {
						copyBtn.innerHTML = originalHtml;
						copyBtn.style.color = '';
					}, 1000);
				}).catch(err => {
					console.error('Failed to copy message:', err);
				});
			}
		}
		
		function copyCodeBlock(codeId) {
			const codeElement = document.getElementById(codeId);
			if (codeElement) {
				const rawCode = codeElement.getAttribute('data-raw-code');
				if (rawCode) {
					// Decode HTML entities
					const decodedCode = rawCode.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
					navigator.clipboard.writeText(decodedCode).then(() => {
						// Show temporary feedback
						const copyBtn = codeElement.closest('.code-block-container').querySelector('.code-copy-btn');
						if (copyBtn) {
							const originalInnerHTML = copyBtn.innerHTML;
							copyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
							copyBtn.style.color = '#4caf50';
							setTimeout(() => {
								copyBtn.innerHTML = originalInnerHTML;
								copyBtn.style.color = '';
							}, 1000);
						}
					}).catch(err => {
						console.error('Failed to copy code:', err);
					});
				}
			}
		}

		window.addEventListener('message', event => {
			const message = event.data;
			
			switch (message.type) {
				case 'ready':
					addMessage(message.data, 'system');
					updateStatusWithTotals();
					break;
					
				case 'restoreInputText':
					const inputField = document.getElementById('messageInput');
					if (inputField && message.data) {
						inputField.value = message.data;
						// Auto-resize the textarea
						inputField.style.height = 'auto';
						inputField.style.height = Math.min(inputField.scrollHeight, 200) + 'px';
					}
					break;
					
				case 'output':
					if (message.data.trim()) {
						let displayData = message.data;
						
						// Check if this is a usage limit message with Unix timestamp
						const usageLimitMatch = displayData.match(/Claude AI usage limit reached\\|(\\d+)/);
						if (usageLimitMatch) {
							const timestamp = parseInt(usageLimitMatch[1]);
							const date = new Date(timestamp * 1000);
							const readableDate = date.toLocaleString(
								undefined,
								{
									weekday: 'short',
									month: 'short',
									day: 'numeric',
									hour: 'numeric',
									minute: '2-digit',
									second: '2-digit',
									hour12: true,
									timeZoneName: 'short',
									year: 'numeric'
								}
							);
							displayData = displayData.replace(usageLimitMatch[0], \`Claude AI usage limit reached: \${readableDate}\`);
						}
						
						addMessage(parseSimpleMarkdown(displayData), 'claude');
					}
					updateStatusWithTotals();
					break;
					
				case 'userInput':
					if (message.data.trim()) {
						addMessage(parseSimpleMarkdown(message.data), 'user');
					}
					break;
					
				case 'loading':
					addMessage(message.data, 'system');
					updateStatusWithTotals();
					break;
					
				case 'setProcessing':
					isProcessing = message.data.isProcessing;
					if (isProcessing) {
						startRequestTimer(message.data.requestStartTime);
						showStopButton();
						disableButtons();
					} else {
						stopRequestTimer();
						hideStopButton();
						enableButtons();
					}
					updateStatusWithTotals();
					break;
					
				case 'clearLoading':
					// Remove the last loading message
					const messages = messagesDiv.children;
					if (messages.length > 0) {
						const lastMessage = messages[messages.length - 1];
						if (lastMessage.classList.contains('system')) {
							lastMessage.remove();
						}
					}
					updateStatusWithTotals();
					break;
					
				case 'error':
					if (message.data.trim()) {
						// Check if this is an install required error
						if (message.data.includes('Install claude code first') || 
							message.data.includes('command not found') ||
							message.data.includes('ENOENT')) {
							sendStats('Install required');
						}
						addMessage(message.data, 'error');
					}
					updateStatusWithTotals();
					break;
					
				case 'toolUse':
					if (typeof message.data === 'object') {
						addToolUseMessage(message.data);
					} else if (message.data.trim()) {
						addMessage(message.data, 'tool');
					}
					break;
					
				case 'toolResult':
							addToolResultMessage(message.data);
					break;
					
				case 'thinking':
					if (message.data.trim()) {
						addMessage(window.t('ui.messages.thinking') + parseSimpleMarkdown(message.data), 'thinking');
					}
					break;
					
				case 'sessionInfo':
					if (message.data.sessionId) {
						showSessionInfo(message.data.sessionId);
						// Show detailed session information
						const sessionDetails = [
							\`🆔 Session ID: \${message.data.sessionId}\`,
							\`🔧 Tools Available: \${message.data.tools.length}\`,
							\`🖥️ MCP Servers: \${message.data.mcpServers ? message.data.mcpServers.length : 0}\`
						];
						//addMessage(sessionDetails.join('\\n'), 'system');
					}
					break;
					
				case 'imagePath':
					// Handle image file path response
					if (message.data.filePath) {
						// Get current cursor position and content
						const cursorPosition = messageInput.selectionStart || messageInput.value.length;
						const currentValue = messageInput.value || '';
						
						// Insert the file path at the current cursor position
						const textBefore = currentValue.substring(0, cursorPosition);
						const textAfter = currentValue.substring(cursorPosition);
						
						// Add a space before the path if there's text before and it doesn't end with whitespace
						const separator = (textBefore && !textBefore.endsWith(' ') && !textBefore.endsWith('\\n')) ? ' ' : '';
						
						messageInput.value = textBefore + separator + message.data.filePath + textAfter;
						
						// Move cursor to end of inserted path
						const newCursorPosition = cursorPosition + separator.length + message.data.filePath.length;
						messageInput.setSelectionRange(newCursorPosition, newCursorPosition);
						
						// Focus back on textarea and adjust height
						messageInput.focus();
						adjustTextareaHeight();
						
						console.log('Inserted image path:', message.data.filePath);
						console.log('Full textarea value:', messageInput.value);
					}
					break;
					
				case 'updateTokens':
					// Update token totals in real-time
					totalTokensInput = message.data.totalTokensInput || 0;
					totalTokensOutput = message.data.totalTokensOutput || 0;
					
					// Update status bar immediately
					updateStatusWithTotals();
					
					// Show detailed token breakdown for current message
					const currentTotal = (message.data.currentInputTokens || 0) + (message.data.currentOutputTokens || 0);
					if (currentTotal > 0) {
						let tokenBreakdown = \`📊 Tokens: \${currentTotal.toLocaleString()}\`;
						
						if (message.data.cacheCreationTokens || message.data.cacheReadTokens) {
							const cacheInfo = [];
							if (message.data.cacheCreationTokens) cacheInfo.push(\`\${message.data.cacheCreationTokens.toLocaleString()} cache created\`);
							if (message.data.cacheReadTokens) cacheInfo.push(\`\${message.data.cacheReadTokens.toLocaleString()} cache read\`);
							tokenBreakdown += \` • \${cacheInfo.join(' • ')}\`;
						}
						
						addMessage(tokenBreakdown, 'system');
					}
					break;
					
				case 'updateTotals':
					// Update local tracking variables
					totalCost = message.data.totalCost || 0;
					totalTokensInput = message.data.totalTokensInput || 0;
					totalTokensOutput = message.data.totalTokensOutput || 0;
					requestCount = message.data.requestCount || 0;
					
					// Update status bar with new totals
					updateStatusWithTotals();
					
					// Show current request info if available
					if (message.data.currentCost || message.data.currentDuration) {
						const currentCostStr = message.data.currentCost ? \`$\${message.data.currentCost.toFixed(4)}\` : 'N/A';
						const currentDurationStr = message.data.currentDuration ? \`\${message.data.currentDuration}ms\` : 'N/A';
						addMessage(\`Request completed - Cost: \${currentCostStr}, Duration: \${currentDurationStr}\`, 'system');
					}
					break;
					
				case 'sessionResumed':
					console.log('Session resumed:', message.data);
					showSessionInfo(message.data.sessionId);
					addMessage(\`📝 Resumed previous session\\n🆔 Session ID: \${message.data.sessionId}\\n💡 Your conversation history is preserved\`, 'system');
					break;
					
				case 'sessionCleared':
					console.log('Session cleared');
					// Clear all messages from UI
					messagesDiv.innerHTML = '';
					hideSessionInfo();
					addMessage(window.t('ui.messages.newSession'), 'system');
					// Reset totals
					totalCost = 0;
					totalTokensInput = 0;
					totalTokensOutput = 0;
					requestCount = 0;
					updateStatusWithTotals();
					break;
					
				case 'loginRequired':
					sendStats('Login required');
					addMessage(window.t('ui.messages.loginRequired'), 'error');
					updateStatus(window.t('ui.status.loginRequired'), 'error');
					break;
					
				case 'showRestoreOption':
					showRestoreContainer(message.data);
					break;
					
				case 'restoreProgress':
					addMessage('🔄 ' + message.data, 'system');
					break;
					
				case 'restoreSuccess':
					//hideRestoreContainer(message.data.commitSha);
					addMessage('✅ ' + message.data.message, 'system');
					break;
					
				case 'restoreError':
					addMessage('❌ ' + message.data, 'error');
					break;
					
				case 'workspaceFiles':
					filteredFiles = message.data;
					selectedFileIndex = -1;
					renderFileList();
					break;
					
				case 'imagePath':
					// Add the image path to the textarea
					const currentText = messageInput.value;
					const pathIndicator = \`@\${message.path} \`;
					messageInput.value = currentText + pathIndicator;
					messageInput.focus();
					adjustTextareaHeight();
					break;
					
				case 'conversationList':
					displayConversationList(message.data);
					break;
				case 'clipboardText':
					handleClipboardText(message.data);
					break;
				case 'modelSelected':
					// Update the UI with the current model
					currentModel = message.model;
					selectModel(message.model, true);
					break;
				case 'terminalOpened':
					// Display notification about checking the terminal
					addMessage(message.data, 'system');
					break;
				case 'permissionRequest':
					addPermissionRequestMessage(message.data);
					break;
				case 'mcpServers':
					displayMCPServers(message.data);
					break;
				case 'mcpServerSaved':
					loadMCPServers(); // Reload the servers list
					addMessage(window.t('ui.messages.mcpServerSaved', { name: message.data.name }), 'system');
					break;
				case 'mcpServerDeleted':
					loadMCPServers(); // Reload the servers list
					addMessage(window.t('ui.messages.mcpServerDeleted', { name: message.data.name }), 'system');
					break;
				case 'mcpServerError':
					addMessage(window.t('ui.messages.mcpServerError', { error: message.data.error }), 'error');
					break;
			}
		});
		
		// Permission request functions
		function addPermissionRequestMessage(data) {
			const messagesDiv = document.getElementById('messages');
			const shouldScroll = shouldAutoScroll(messagesDiv);

			const messageDiv = document.createElement('div');
			messageDiv.className = 'message permission-request';
			
			const toolName = data.tool || 'Unknown Tool';
			
			// Create always allow button text with command styling for Bash
			let alwaysAllowText = window.t('ui.permissions.alwaysAllow', { tool: toolName });
			let alwaysAllowTooltip = '';
			if (toolName === 'Bash' && data.pattern) {
				const pattern = data.pattern;
				// Remove the asterisk for display - show "npm i" instead of "npm i *"
				const displayPattern = pattern.replace(' *', '');
				const truncatedPattern = displayPattern.length > 30 ? displayPattern.substring(0, 30) + '...' : displayPattern;
				alwaysAllowText = window.t('ui.permissions.alwaysAllowCommand', { command: truncatedPattern });
				alwaysAllowTooltip = displayPattern.length > 30 ? \`title="\${displayPattern}"\` : '';
			}
			
			messageDiv.innerHTML = \`
				<div class="permission-header">
					<span class="icon">🔐</span>
					<span>\${window.t('ui.permissions.title')}</span>
					<div class="permission-menu">
						<button class="permission-menu-btn" onclick="togglePermissionMenu('\${data.id}')" title="\${window.t('ui.slashCommands.management.moreOptions')}">⋮</button>
						<div class="permission-menu-dropdown" id="permissionMenu-\${data.id}" style="display: none;">
							<button class="permission-menu-item" onclick="enableYoloMode('\${data.id}')">
								<span class="menu-icon">⚡</span>
								<div class="menu-content">
									<span class="menu-title">\${window.t('ui.permissions.yoloModeTitle')}</span>
									<span class="menu-subtitle">\${window.t('ui.permissions.yoloModeSubtitle')}</span>
								</div>
							</button>
						</div>
					</div>
				</div>
				<div class="permission-content">
					<p>\${window.t('ui.permissions.message', { tool: toolName })}</p>
					<div class="permission-buttons">
						<button class="btn deny" onclick="respondToPermission('\${data.id}', false)">\${window.t('ui.permissions.deny')}</button>
						<button class="btn always-allow" onclick="respondToPermission('\${data.id}', true, true)" \${alwaysAllowTooltip}>\${alwaysAllowText}</button>
						<button class="btn allow" onclick="respondToPermission('\${data.id}', true)">\${window.t('ui.permissions.allow')}</button>
					</div>
				</div>
			\`;
			
			messagesDiv.appendChild(messageDiv);
			scrollToBottomIfNeeded(messagesDiv, shouldScroll);
		}
		
		function respondToPermission(id, approved, alwaysAllow = false) {
			// Send response back to extension
			vscode.postMessage({
				type: 'permissionResponse',
				id: id,
				approved: approved,
				alwaysAllow: alwaysAllow
			});
			
			// Update the UI to show the decision
			const permissionMsg = document.querySelector(\`.permission-request:has([onclick*="\${id}"])\`);
			if (permissionMsg) {
				const buttons = permissionMsg.querySelector('.permission-buttons');
				const permissionContent = permissionMsg.querySelector('.permission-content');
				let decision = approved ? 'You allowed this' : 'You denied this';
				
				if (alwaysAllow && approved) {
					decision = 'You allowed this and set it to always allow';
				}
				
				const emoji = approved ? '✅' : '❌';
				const decisionClass = approved ? 'allowed' : 'denied';
				
				// Hide buttons
				buttons.style.display = 'none';
				
				// Add decision div to permission-content
				const decisionDiv = document.createElement('div');
				decisionDiv.className = \`permission-decision \${decisionClass}\`;
				decisionDiv.innerHTML = \`\${emoji} \${decision}\`;
				permissionContent.appendChild(decisionDiv);
				
				permissionMsg.classList.add('permission-decided', decisionClass);
			}
		}

		function togglePermissionMenu(permissionId) {
			const menu = document.getElementById(\`permissionMenu-\${permissionId}\`);
			const isVisible = menu.style.display !== 'none';
			
			// Close all other permission menus
			document.querySelectorAll('.permission-menu-dropdown').forEach(dropdown => {
				dropdown.style.display = 'none';
			});
			
			// Toggle this menu
			menu.style.display = isVisible ? 'none' : 'block';
		}

		function enableYoloMode(permissionId) {
			sendStats('YOLO mode enabled');
			
			// Hide the menu
			document.getElementById(\`permissionMenu-\${permissionId}\`).style.display = 'none';
			
			// Send message to enable YOLO mode
			vscode.postMessage({
				type: 'enableYoloMode'
			});
			
			// Auto-approve this permission
			respondToPermission(permissionId, true);
			
			// Show notification
			addMessage(window.t('ui.messages.yoloModeEnabled'), 'system');
		}

		// Close permission menus when clicking outside
		document.addEventListener('click', function(event) {
			if (!event.target.closest('.permission-menu')) {
				document.querySelectorAll('.permission-menu-dropdown').forEach(dropdown => {
					dropdown.style.display = 'none';
				});
			}
		});

		// Session management functions
		function newSession() {
			sendStats('New chat');
			
			vscode.postMessage({
				type: 'newSession'
			});
		}

		function restoreToCommit(commitSha) {
			console.log('Restore button clicked for commit:', commitSha);
			vscode.postMessage({
				type: 'restoreCommit',
				commitSha: commitSha
			});
		}

		function showRestoreContainer(data) {
			const messagesDiv = document.getElementById('messages');
			const shouldScroll = shouldAutoScroll(messagesDiv);
			
			const restoreContainer = document.createElement('div');
			restoreContainer.className = 'restore-container';
			restoreContainer.id = \`restore-\${data.sha}\`;
			
			const timeAgo = new Date(data.timestamp).toLocaleTimeString();
			const shortSha = data.sha ? data.sha.substring(0, 8) : 'unknown';
			
			restoreContainer.innerHTML = \`
				<button class="restore-btn dark" onclick="restoreToCommit('\${data.sha}')">
					Restore checkpoint
				</button>
				<span class="restore-date">\${timeAgo}</span>
			\`;
			
			messagesDiv.appendChild(restoreContainer);
			scrollToBottomIfNeeded(messagesDiv, shouldScroll);
		}

		function hideRestoreContainer(commitSha) {
			const container = document.getElementById(\`restore-\${commitSha}\`);
			if (container) {
				container.remove();
			}
		}
		
		function showSessionInfo(sessionId) {
			// const sessionInfo = document.getElementById('sessionInfo');
			// const sessionIdSpan = document.getElementById('sessionId');
			const sessionStatus = document.getElementById('sessionStatus');
			const newSessionBtn = document.getElementById('newSessionBtn');
			const historyBtn = document.getElementById('historyBtn');
			
			if (sessionStatus && newSessionBtn) {
				// sessionIdSpan.textContent = sessionId.substring(0, 8);
				// sessionIdSpan.title = \`Full session ID: \${sessionId} (click to copy)\`;
				// sessionIdSpan.style.cursor = 'pointer';
				// sessionIdSpan.onclick = () => copySessionId(sessionId);
				// sessionInfo.style.display = 'flex';
				sessionStatus.style.display = 'none';
				newSessionBtn.style.display = 'block';
				if (historyBtn) historyBtn.style.display = 'block';
			}
		}
		
		function copySessionId(sessionId) {
			navigator.clipboard.writeText(sessionId).then(() => {
				// Show temporary feedback
				const sessionIdSpan = document.getElementById('sessionId');
				if (sessionIdSpan) {
					const originalText = sessionIdSpan.textContent;
					sessionIdSpan.textContent = translations?.ui?.common?.copied || 'Copied!';
					setTimeout(() => {
						sessionIdSpan.textContent = originalText;
					}, 1000);
				}
			}).catch(err => {
				console.error('Failed to copy session ID:', err);
			});
		}
		
		function hideSessionInfo() {
			// const sessionInfo = document.getElementById('sessionInfo');
			const sessionStatus = document.getElementById('sessionStatus');
			const newSessionBtn = document.getElementById('newSessionBtn');
			const historyBtn = document.getElementById('historyBtn');
			
			if (sessionStatus && newSessionBtn) {
				// sessionInfo.style.display = 'none';
				sessionStatus.style.display = 'none';

				// Always show new session
				newSessionBtn.style.display = 'block';
				// Keep history button visible - don't hide it
				if (historyBtn) historyBtn.style.display = 'block';
			}
		}

		updateStatus(translations?.ui?.status?.initializing || 'Initializing...', 'disconnected');
		

		function parseSimpleMarkdown(markdown) {
			// First, handle code blocks before line-by-line processing
			let processedMarkdown = markdown;
			
			// Store code blocks temporarily to protect them from further processing
			const codeBlockPlaceholders = [];
			
			// Handle multi-line code blocks with triple backticks
			// Using RegExp constructor to avoid backtick conflicts in template literal
			const codeBlockRegex = new RegExp('\\\`\\\`\\\`(\\\\w*)\\n([\\\\s\\\\S]*?)\\\`\\\`\\\`', 'g');
			processedMarkdown = processedMarkdown.replace(codeBlockRegex, function(match, lang, code) {
				const language = lang || 'plaintext';
				// Process code line by line to preserve formatting like diff implementation
				const codeLines = code.split('\\n');
				let codeHtml = '';
				
				for (const line of codeLines) {
					const escapedLine = escapeHtml(line);
					codeHtml += '<div class="code-line">' + escapedLine + '</div>';
				}
				
				// Create unique ID for this code block
				const codeId = 'code_' + Math.random().toString(36).substr(2, 9);
				const escapedCode = escapeHtml(code);
				
				const codeBlockHtml = '<div class="code-block-container"><div class="code-block-header"><span class="code-block-language">' + language + '</span><button class="code-copy-btn" onclick="copyCodeBlock(\\\'' + codeId + '\\\')" title="Copy code"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg></button></div><pre class="code-block"><code class="language-' + language + '" id="' + codeId + '" data-raw-code="' + escapedCode.replace(/"/g, '&quot;') + '">' + codeHtml + '</code></pre></div>';
				
				// Store the code block and return a placeholder
				const placeholder = '__CODEBLOCK_' + codeBlockPlaceholders.length + '__';
				codeBlockPlaceholders.push(codeBlockHtml);
				return placeholder;
			});
			
			// Handle inline code with single backticks
			const inlineCodeRegex = new RegExp('\\\`([^\\\`]+)\\\`', 'g');
			processedMarkdown = processedMarkdown.replace(inlineCodeRegex, '<code>$1</code>');
			
			const lines = processedMarkdown.split('\\n');
			let html = '';
			let inUnorderedList = false;
			let inOrderedList = false;

			for (let line of lines) {
				line = line.trim();
				
				// Check if this is a code block placeholder
				if (line.startsWith('__CODEBLOCK_') && line.endsWith('__')) {
					// This is a code block placeholder, don't process it
					html += line;
					continue;
				}

				// Bold
				line = line.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');

				// Italic - only apply when underscores are surrounded by whitespace or at beginning/end
				line = line.replace(/(?<!\\*)\\*(?!\\*)(.*?)\\*(?!\\*)/g, '<em>$1</em>');
				line = line.replace(/(^|\\s)_([^_\\s][^_]*[^_\\s]|[^_\\s])_(?=\\s|$)/g, '$1<em>$2</em>');

				// Headers
				if (/^####\\s+/.test(line)) {
				html += '<h4>' + line.replace(/^####\\s+/, '') + '</h4>';
				continue;
				} else if (/^###\\s+/.test(line)) {
				html += '<h3>' + line.replace(/^###\\s+/, '') + '</h3>';
				continue;
				} else if (/^##\\s+/.test(line)) {
				html += '<h2>' + line.replace(/^##\\s+/, '') + '</h2>';
				continue;
				} else if (/^#\\s+/.test(line)) {
				html += '<h1>' + line.replace(/^#\\s+/, '') + '</h1>';
				continue;
				}

				// Ordered list
				if (/^\\d+\\.\\s+/.test(line)) {
				if (!inOrderedList) {
					html += '<ol>';
					inOrderedList = true;
				}
				const item = line.replace(/^\\d+\\.\\s+/, '');
				html += '<li>' + item + '</li>';
				continue;
				}

				// Unordered list
				if (line.startsWith('- ')) {
				if (!inUnorderedList) {
					html += '<ul>';
					inUnorderedList = true;
				}
				html += '<li>' + line.slice(2) + '</li>';
				continue;
				}

				// Close lists
				if (inUnorderedList) {
				html += '</ul>';
				inUnorderedList = false;
				}
				if (inOrderedList) {
				html += '</ol>';
				inOrderedList = false;
				}

				// Paragraph or break
				if (line !== '') {
				html += '<p>' + line + '</p>';
				} else {
				html += '<br>';
				}
			}

			if (inUnorderedList) html += '</ul>';
			if (inOrderedList) html += '</ol>';

			// Restore code block placeholders
			for (let i = 0; i < codeBlockPlaceholders.length; i++) {
				const placeholder = '__CODEBLOCK_' + i + '__';
				html = html.replace(placeholder, codeBlockPlaceholders[i]);
			}

			return html;
		}

		// Conversation history functions
		function toggleConversationHistory() {
			const historyDiv = document.getElementById('conversationHistory');
			const chatContainer = document.getElementById('chatContainer');
			
			if (historyDiv.style.display === 'none') {
				sendStats('History opened');
				// Show conversation history
				requestConversationList();
				historyDiv.style.display = 'block';
				chatContainer.style.display = 'none';
			} else {
				// Hide conversation history
				historyDiv.style.display = 'none';
				chatContainer.style.display = 'flex';
			}
		}

		function requestConversationList() {
			vscode.postMessage({
				type: 'getConversationList'
			});
		}

		function loadConversation(filename) {
			vscode.postMessage({
				type: 'loadConversation',
				filename: filename
			});
			
			// Hide conversation history and show chat
			toggleConversationHistory();
		}

		// File picker functions
		function showFilePicker() {
			// Request initial file list from VS Code
			vscode.postMessage({
				type: 'getWorkspaceFiles',
				searchTerm: ''
			});
			
			// Show modal
			filePickerModal.style.display = 'flex';
			fileSearchInput.focus();
			selectedFileIndex = -1;
		}

		function hideFilePicker() {
			filePickerModal.style.display = 'none';
			fileSearchInput.value = '';
			selectedFileIndex = -1;
		}

		function getFileIcon(filename) {
			const ext = filename.split('.').pop()?.toLowerCase();
			switch (ext) {
				case 'js': case 'jsx': case 'ts': case 'tsx': return '📄';
				case 'html': case 'htm': return '🌐';
				case 'css': case 'scss': case 'sass': return '🎨';
				case 'json': return '📋';
				case 'md': return '📝';
				case 'py': return '🐍';
				case 'java': return '☕';
				case 'cpp': case 'c': case 'h': return '⚙️';
				case 'png': case 'jpg': case 'jpeg': case 'gif': case 'svg': return '🖼️';
				case 'pdf': return '📄';
				case 'zip': case 'tar': case 'gz': return '📦';
				default: return '📄';
			}
		}

		function renderFileList() {
			fileList.innerHTML = '';
			
			filteredFiles.forEach((file, index) => {
				const fileItem = document.createElement('div');
				fileItem.className = 'file-item';
				if (index === selectedFileIndex) {
					fileItem.classList.add('selected');
				}
				
				fileItem.innerHTML = \`
					<span class="file-icon">\${getFileIcon(file.name)}</span>
					<div class="file-info">
						<div class="file-name">\${file.name}</div>
						<div class="file-path">\${file.path}</div>
					</div>
				\`;
				
				fileItem.addEventListener('click', () => {
					selectFile(file);
				});
				
				fileList.appendChild(fileItem);
			});
		}

		function selectFile(file) {
			// Insert file path at cursor position
			const cursorPos = messageInput.selectionStart;
			const textBefore = messageInput.value.substring(0, cursorPos);
			const textAfter = messageInput.value.substring(cursorPos);
			
			// Replace the @ symbol with the file path
			const beforeAt = textBefore.substring(0, textBefore.lastIndexOf('@'));
			const newText = beforeAt + '@' + file.path + ' ' + textAfter;
			
			messageInput.value = newText;
			messageInput.focus();
			
			// Set cursor position after the inserted path
			const newCursorPos = beforeAt.length + file.path.length + 2;
			messageInput.setSelectionRange(newCursorPos, newCursorPos);
			
			hideFilePicker();
			adjustTextareaHeight();
		}

		function filterFiles(searchTerm) {
			// Send search request to backend instead of filtering locally
			vscode.postMessage({
				type: 'getWorkspaceFiles',
				searchTerm: searchTerm
			});
			selectedFileIndex = -1;
		}

		// Image handling functions
		function selectImage() {
			// Use VS Code's native file picker instead of browser file picker
			vscode.postMessage({
				type: 'selectImageFile'
			});
		}


		function showImageAddedFeedback(fileName) {
			// Create temporary feedback element
			const feedback = document.createElement('div');
			feedback.textContent = \`Added: \${fileName}\`;
			feedback.style.cssText = \`
				position: fixed;
				top: 20px;
				right: 20px;
				background: var(--vscode-notifications-background);
				color: var(--vscode-notifications-foreground);
				padding: 8px 12px;
				border-radius: 4px;
				font-size: 12px;
				z-index: 1000;
				opacity: 0;
				transition: opacity 0.3s ease;
			\`;
			
			document.body.appendChild(feedback);
			
			// Animate in
			setTimeout(() => feedback.style.opacity = '1', 10);
			
			// Animate out and remove
			setTimeout(() => {
				feedback.style.opacity = '0';
				setTimeout(() => feedback.remove(), 300);
			}, 2000);
		}

		function displayConversationList(conversations) {
			const listDiv = document.getElementById('conversationList');
			listDiv.innerHTML = '';

			if (conversations.length === 0) {
				listDiv.innerHTML = '<p style="text-align: center; color: var(--vscode-descriptionForeground);">' + (window.translations?.ui?.conversationHistory?.noConversations || 'No conversations found') + '</p>';
				return;
			}

			conversations.forEach(conv => {
				const item = document.createElement('div');
				item.className = 'conversation-item';
				item.onclick = () => loadConversation(conv.filename);

				const date = new Date(conv.startTime).toLocaleDateString();
				const time = new Date(conv.startTime).toLocaleTimeString();

				item.innerHTML = \`
					<div class="conversation-title">\${conv.firstUserMessage.substring(0, 60)}\${conv.firstUserMessage.length > 60 ? '...' : ''}</div>
					<div class="conversation-meta">\${date} at \${time} • \${conv.messageCount} messages • $\${conv.totalCost.toFixed(3)}</div>
					<div class="conversation-preview">Last: \${conv.lastUserMessage.substring(0, 80)}\${conv.lastUserMessage.length > 80 ? '...' : ''}</div>
				\`;

				listDiv.appendChild(item);
			});
		}

		function handleClipboardText(text) {
			if (!text) return;
			
			// Insert text at cursor position
			const start = messageInput.selectionStart;
			const end = messageInput.selectionEnd;
			const currentValue = messageInput.value;
			
			const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
			messageInput.value = newValue;
			
			// Set cursor position after pasted text
			const newCursorPos = start + text.length;
			messageInput.setSelectionRange(newCursorPos, newCursorPos);
			
			// Trigger input event to adjust height
			messageInput.dispatchEvent(new Event('input', { bubbles: true }));
		}

		// Settings functions

		function toggleSettings() {
			const settingsModal = document.getElementById('settingsModal');
			if (settingsModal.style.display === 'none') {
				// Request current settings from VS Code
				vscode.postMessage({
					type: 'getSettings'
				});
				// Request current permissions
				vscode.postMessage({
					type: 'getPermissions'
				});
				// Request current language data
				vscode.postMessage({
					type: 'getLanguage'
				});
				settingsModal.style.display = 'flex';
			} else {
				hideSettingsModal();
			}
		}

		function hideSettingsModal() {
			document.getElementById('settingsModal').style.display = 'none';
		}

		function updateSettings() {
			// Note: thinking intensity is now handled separately in the thinking intensity modal
			
			const wslEnabled = document.getElementById('wsl-enabled').checked;
			const wslDistro = document.getElementById('wsl-distro').value;
			const wslNodePath = document.getElementById('wsl-node-path').value;
			const wslClaudePath = document.getElementById('wsl-claude-path').value;
			const yoloMode = document.getElementById('yolo-mode').checked;

			// Update WSL options visibility
			document.getElementById('wslOptions').style.display = wslEnabled ? 'block' : 'none';

			// Send settings to VS Code immediately
			vscode.postMessage({
				type: 'updateSettings',
				settings: {
					'wsl.enabled': wslEnabled,
					'wsl.distro': wslDistro || 'Ubuntu',
					'wsl.nodePath': wslNodePath || '/usr/bin/node',
					'wsl.claudePath': wslClaudePath || '/usr/local/bin/claude',
					'permissions.yoloMode': yoloMode
				}
			});
		}

		// Language functions
		let currentLanguageData = null;

		function updateLanguage() {
			const languageSelect = document.getElementById('language-select');
			const selectedLanguage = languageSelect.value;
			
			vscode.postMessage({
				type: 'setLanguage',
				languageCode: selectedLanguage
			});
		}

		function populateLanguageOptions(languageData) {
			const languageSelect = document.getElementById('language-select');
			if (!languageSelect || !languageData) return;
			
			languageSelect.innerHTML = '';
			
			for (const lang of languageData.supportedLanguages) {
				const option = document.createElement('option');
				option.value = lang.code;
				option.textContent = lang.nativeName;
				if (lang.code === languageData.currentLanguage) {
					option.selected = true;
				}
				languageSelect.appendChild(option);
			}
		}

		function updateUIText(translations) {
			if (!translations) return;
			
			// Helper function for translations
			const t = (key) => {
				const value = key.split('.').reduce((obj, k) => obj && obj[k], translations);
				return value || key;
			};
			
			// Update header elements
			const headerTitle = document.querySelector('.header h2');
			if (headerTitle) headerTitle.textContent = t('ui.header.title');
			
			const settingsBtn = document.getElementById('settingsBtn');
			if (settingsBtn) settingsBtn.title = t('ui.header.settings');
			
			const historyBtn = document.getElementById('historyBtn');
			if (historyBtn) historyBtn.innerHTML = '📚 ' + t('ui.header.history');
			
			const newSessionBtn = document.getElementById('newSessionBtn');
			if (newSessionBtn) newSessionBtn.textContent = t('ui.header.newChat');
			
			// Update conversation history
			const conversationTitle = document.querySelector('.conversation-header h3');
			if (conversationTitle) conversationTitle.textContent = t('ui.conversationHistory.title');
			
			const conversationClose = document.querySelector('.conversation-header .btn');
			if (conversationClose) conversationClose.textContent = t('ui.conversationHistory.close');
			
			// Update input placeholder and controls
			const messageInput = document.getElementById('messageInput');
			if (messageInput) messageInput.placeholder = t('ui.input.placeholder');
			
			const planFirstSpan = document.querySelector('.mode-toggle span[onclick="togglePlanMode()"]');
			if (planFirstSpan) planFirstSpan.textContent = t('ui.input.planFirst');
			
			const thinkingModeSpan = document.getElementById('thinkingModeLabel');
			if (thinkingModeSpan) {
				// Check if thinking mode is currently active and update label accordingly
				const thinkingModeSwitch = document.getElementById('thinkingModeSwitch');
				if (thinkingModeSwitch && thinkingModeSwitch.classList.contains('active')) {
					// If thinking mode is active, get current intensity and update label
					const thinkingIntensitySlider = document.getElementById('thinkingIntensitySlider');
					if (thinkingIntensitySlider) {
						updateThinkingModeToggleName(thinkingIntensitySlider.value);
					} else {
						thinkingModeSpan.textContent = t('ui.input.thinkingMode');
					}
				} else {
					// If thinking mode is not active, use default label
					thinkingModeSpan.textContent = t('ui.input.thinkingMode');
				}
			}
			
			const slashBtn = document.querySelector('.slash-btn');
			if (slashBtn) slashBtn.title = t('ui.input.slashCommands');
			
			const atBtn = document.querySelector('.at-btn');
			if (atBtn) atBtn.title = t('ui.input.referenceFiles');
			
			const imageBtn = document.getElementById('imageBtn');
			if (imageBtn) imageBtn.title = t('ui.input.attachImages');
			
			const sendBtn = document.querySelector('.send-btn span');
			if (sendBtn) sendBtn.textContent = t('ui.input.send') + ' ';
			
			// Update status
			const statusText = document.getElementById('statusText');
			if (statusText && statusText.textContent.includes('Initializing')) {
				statusText.textContent = t('ui.status.initializing');
			}
			
			const stopBtn = document.querySelector('#stopBtn svg + text, #stopBtn');
			if (stopBtn && stopBtn.textContent && stopBtn.textContent.includes('Stop')) {
				stopBtn.childNodes.forEach(node => {
					if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() === 'Stop') {
						node.textContent = t('ui.status.stop');
					}
				});
			}
			
			// Update yolo warning
			const yoloWarning = document.getElementById('yoloWarning');
			if (yoloWarning) yoloWarning.textContent = t('ui.yoloWarning');
			
			// Update file picker
			const filePickerTitle = document.querySelector('#filePickerModal .file-picker-header span');
			if (filePickerTitle) filePickerTitle.textContent = t('ui.filePicker.title');
			
			const fileSearchInput = document.getElementById('fileSearchInput');
			if (fileSearchInput) fileSearchInput.placeholder = t('ui.filePicker.searchPlaceholder');
		}

		// Request language data on page load
		vscode.postMessage({
			type: 'getLanguage'
		});

		// Permissions management functions
		function renderPermissions(permissions) {
			const permissionsList = document.getElementById('permissionsList');
			
			if (!permissions || !permissions.alwaysAllow || Object.keys(permissions.alwaysAllow).length === 0) {
				permissionsList.innerHTML = \`
					<div class="permissions-empty">
						\${window.t('ui.settings.permissions.noPermissions')}
					</div>
				\`;
				return;
			}
			
			let html = '';
			
			for (const [toolName, permission] of Object.entries(permissions.alwaysAllow)) {
				if (permission === true) {
					// Tool is always allowed
					html += \`
						<div class="permission-item">
							<div class="permission-info">
								<span class="permission-tool">\${toolName}</span>
								<span class="permission-desc">\${window.t('ui.common.all')}</span>
							</div>
							<button class="permission-remove-btn" onclick="removePermission('\${toolName}', null)">\${window.t('ui.common.remove')}</button>
						</div>
					\`;
				} else if (Array.isArray(permission)) {
					// Tool has specific commands/patterns
					for (const command of permission) {
						const displayCommand = command.replace(' *', ''); // Remove asterisk for display
						html += \`
							<div class="permission-item">
								<div class="permission-info">
									<span class="permission-tool">\${toolName}</span>
									<span class="permission-command"><code>\${displayCommand}</code></span>
								</div>
								<button class="permission-remove-btn" onclick="removePermission('\${toolName}', '\${escapeHtml(command)}')">\${window.t('ui.common.remove')}</button>
							</div>
						\`;
					}
				}
			}
			
			permissionsList.innerHTML = html;
		}
		
		function removePermission(toolName, command) {
			vscode.postMessage({
				type: 'removePermission',
				toolName: toolName,
				command: command
			});
		}
		
		function showAddPermissionForm() {
			document.getElementById('showAddPermissionBtn').style.display = 'none';
			document.getElementById('addPermissionForm').style.display = 'block';
			
			// Focus on the tool select dropdown
			setTimeout(() => {
				document.getElementById('addPermissionTool').focus();
			}, 100);
		}
		
		function hideAddPermissionForm() {
			document.getElementById('showAddPermissionBtn').style.display = 'flex';
			document.getElementById('addPermissionForm').style.display = 'none';
			
			// Clear form inputs
			document.getElementById('addPermissionTool').value = '';
			document.getElementById('addPermissionCommand').value = '';
			document.getElementById('addPermissionCommand').style.display = 'none';
		}
		
		function toggleCommandInput() {
			const toolSelect = document.getElementById('addPermissionTool');
			const commandInput = document.getElementById('addPermissionCommand');
			const hintDiv = document.getElementById('permissionsFormHint');
			
			if (toolSelect.value === 'Bash') {
				commandInput.style.display = 'block';
				hintDiv.textContent = 'Use patterns like "npm i *" or "git add *" for specific commands.';
			} else if (toolSelect.value === '') {
				commandInput.style.display = 'none';
				commandInput.value = '';
				hintDiv.textContent = 'Select a tool to add always-allow permission.';
			} else {
				commandInput.style.display = 'none';
				commandInput.value = '';
				hintDiv.textContent = 'This will allow all ' + toolSelect.value + ' commands without asking for permission.';
			}
		}
		
		function addPermission() {
			const toolSelect = document.getElementById('addPermissionTool');
			const commandInput = document.getElementById('addPermissionCommand');
			const addBtn = document.getElementById('addPermissionBtn');
			
			const toolName = toolSelect.value.trim();
			const command = commandInput.value.trim();
			
			if (!toolName) {
				return;
			}
			
			// Disable button during processing
			addBtn.disabled = true;
			addBtn.textContent = 'Adding...';
			
			vscode.postMessage({
				type: 'addPermission',
				toolName: toolName,
				command: command || null
			});
			
			// Clear form and hide it
			toolSelect.value = '';
			commandInput.value = '';
			hideAddPermissionForm();
			
			// Re-enable button
			setTimeout(() => {
				addBtn.disabled = false;
				addBtn.textContent = 'Add';
			}, 500);
		}

		// Close settings modal when clicking outside
		document.getElementById('settingsModal').addEventListener('click', (e) => {
			if (e.target === document.getElementById('settingsModal')) {
				hideSettingsModal();
			}
		});

		// Close thinking intensity modal when clicking outside
		document.getElementById('thinkingIntensityModal').addEventListener('click', (e) => {
			if (e.target === document.getElementById('thinkingIntensityModal')) {
				hideThinkingIntensityModal();
			}
		});

		// Close slash commands modal when clicking outside
		document.getElementById('slashCommandsModal').addEventListener('click', (e) => {
			if (e.target === document.getElementById('slashCommandsModal')) {
				hideSlashCommandsModal();
			}
		});

		// Request custom snippets from VS Code on page load
		vscode.postMessage({
			type: 'getCustomSnippets'
		});

		// Detect slash commands input
		messageInput.addEventListener('input', (e) => {
			const value = messageInput.value;
			// Only trigger when "/" is the very first and only character
			if (value === '/') {
				showSlashCommandsModal();
			}
		});

		// Add settings message handler to window message event
		const originalMessageHandler = window.onmessage;
		window.addEventListener('message', event => {
			const message = event.data;
			
			if (message.type === 'customSnippetsData') {
				// Update global custom snippets data
				customSnippetsData = message.data || {};
				// Refresh the snippets display
				loadCustomSnippets(customSnippetsData);
			} else if (message.type === 'customSnippetSaved') {
				// Refresh snippets after saving
				vscode.postMessage({
					type: 'getCustomSnippets'
				});
			} else if (message.type === 'customSnippetDeleted') {
				// Refresh snippets after deletion
				vscode.postMessage({
					type: 'getCustomSnippets'
				});
			} else if (message.type === 'settingsData') {
				// Update UI with current settings
				const thinkingIntensity = message.data['thinking.intensity'] || 'think';
				const intensityValues = ['think', 'think-hard', 'think-harder', 'ultrathink'];
				const sliderValue = intensityValues.indexOf(thinkingIntensity);
				
				// Update thinking intensity modal if it exists
				const thinkingIntensitySlider = document.getElementById('thinkingIntensitySlider');
				if (thinkingIntensitySlider) {
					thinkingIntensitySlider.value = sliderValue >= 0 ? sliderValue : 0;
					updateThinkingIntensityDisplay(thinkingIntensitySlider.value);
				} else {
					// Update toggle name even if modal isn't open
					updateThinkingModeToggleName(sliderValue >= 0 ? sliderValue : 0);
				}
				
				document.getElementById('wsl-enabled').checked = message.data['wsl.enabled'] || false;
				document.getElementById('wsl-distro').value = message.data['wsl.distro'] || 'Ubuntu';
				document.getElementById('wsl-node-path').value = message.data['wsl.nodePath'] || '/usr/bin/node';
				document.getElementById('wsl-claude-path').value = message.data['wsl.claudePath'] || '/usr/local/bin/claude';
				document.getElementById('yolo-mode').checked = message.data['permissions.yoloMode'] || false;
				
				// Update yolo warning visibility
				updateYoloWarning();
				
				// Show/hide WSL options
				document.getElementById('wslOptions').style.display = message.data['wsl.enabled'] ? 'block' : 'none';
			}

			if (message.type === 'languageData') {
				// Update language data and populate options
				currentLanguageData = message.data;
				
				// Update global translations for runtime JavaScript functions
				window.translations = message.data.translations;
				
				populateLanguageOptions(message.data);
				updateUIText(message.data.translations);
			}

			if (message.type === 'platformInfo') {
				// Check if user is on Windows and show WSL alert if not dismissed and WSL not already enabled
				if (message.data.isWindows && !message.data.wslAlertDismissed && !message.data.wslEnabled) {
					// Small delay to ensure UI is ready
					setTimeout(() => {
						showWSLAlert();
					}, 1000);
				}
			}
			
			if (message.type === 'permissionsData') {
				// Update permissions UI
				renderPermissions(message.data);
			}
		});

	</script>
	
	<!-- 
	Analytics FAQ:
	
	1. Is Umami GDPR compliant?
	Yes, Umami does not collect any personally identifiable information and anonymizes all data collected. Users cannot be identified and are never tracked across websites.
	
	2. Do I need to display a cookie notice to users?
	No, Umami does not use any cookies in the tracking code.
	-->
	${isTelemetryEnabled ? '<script defer src="https://cloud.umami.is/script.js" data-website-id="d050ac9b-2b6d-4c67-b4c6-766432f95644"></script>' : '<!-- Umami analytics disabled due to VS Code telemetry settings -->'}
</body>
</html>`;
};

export default getHtml;