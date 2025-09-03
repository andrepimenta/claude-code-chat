export const getModalsHtml = () => `
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
				<div class="mcp-add-server">
					<button class="btn outlined" onclick="showAddServerForm()" id="addServerBtn">+ Add MCP Server</button>
				</div>
				<div class="mcp-popular-servers" id="popularServers">
					<h4>Popular MCP Servers</h4>
					<div class="popular-servers-grid">
						<div class="popular-server-item" onclick="addPopularServer('context7', { type: 'http', url: 'https://context7.liam.sh/mcp' })">
							<div class="popular-server-icon">📚</div>
							<div class="popular-server-info">
								<div class="popular-server-name">Context7</div>
								<div class="popular-server-desc">Up-to-date Code Docs For Any Prompt</div>
							</div>
						</div>
						<div class="popular-server-item" onclick="addPopularServer('sequential-thinking', { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-sequential-thinking'] })">
							<div class="popular-server-icon">🔗</div>
							<div class="popular-server-info">
								<div class="popular-server-name">Sequential Thinking</div>
								<div class="popular-server-desc">Step-by-step reasoning capabilities</div>
							</div>
						</div>
						<div class="popular-server-item" onclick="addPopularServer('memory', { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-memory'] })">
							<div class="popular-server-icon">🧠</div>
							<div class="popular-server-info">
								<div class="popular-server-name">Memory</div>
								<div class="popular-server-desc">Knowledge graph storage</div>
							</div>
						</div>
						<div class="popular-server-item" onclick="addPopularServer('puppeteer', { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-puppeteer'] })">
							<div class="popular-server-icon">🎭</div>
							<div class="popular-server-info">
								<div class="popular-server-name">Puppeteer</div>
								<div class="popular-server-desc">Browser automation</div>
							</div>
						</div>
						<div class="popular-server-item" onclick="addPopularServer('fetch', { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-fetch'] })">
							<div class="popular-server-icon">🌐</div>
							<div class="popular-server-info">
								<div class="popular-server-name">Fetch</div>
								<div class="popular-server-desc">HTTP requests & web scraping</div>
							</div>
						</div>
						<div class="popular-server-item" onclick="addPopularServer('filesystem', { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem'] })">
							<div class="popular-server-icon">📁</div>
							<div class="popular-server-info">
								<div class="popular-server-name">Filesystem</div>
								<div class="popular-server-desc">File operations & management</div>
							</div>
						</div>
					</div>
				</div>
				<div class="mcp-add-form" id="addServerForm" style="display: none;">
				<div class="form-group">
					<label for="serverName">Server Name:</label>
					<input type="text" id="serverName" placeholder="my-server" required>
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
	</div>
	</div>

	<!-- Settings modal -->
	<div id="settingsModal" class="tools-modal" style="display: none;">
		<div class="tools-modal-content">
			<div class="tools-modal-header">
				<span>Claude Code Chat Settings</span>
				<button class="tools-close-btn" onclick="hideSettingsModal()">✕</button>
			</div>
			<div class="tools-list">
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
							<label style="display: block; margin-bottom: 4px; font-size: 12px; color: var(--vscode-descriptionForeground);">Node.js Path in WSL</label>
							<input type="text" id="wsl-node-path" class="file-search-input" style="width: 100%;" placeholder="/usr/bin/node" onchange="updateSettings()">
							<p style="font-size: 11px; color: var(--vscode-descriptionForeground); margin: 4px 0 0 0;">
								Find your node installation path in WSL by running: <code style="background: var(--vscode-textCodeBlock-background); padding: 2px 4px; border-radius: 3px;">which node</code>
							</p>
						</div>
						
						<div style="margin-bottom: 12px;">
							<label style="display: block; margin-bottom: 4px; font-size: 12px; color: var(--vscode-descriptionForeground);">Claude Path in WSL</label>
							<input type="text" id="wsl-claude-path" class="file-search-input" style="width: 100%;" placeholder="/usr/local/bin/claude" onchange="updateSettings()">
							<p style="font-size: 11px; color: var(--vscode-descriptionForeground); margin: 4px 0 0 0;">
								Find your claude installation path in WSL by running: <code style="background: var(--vscode-textCodeBlock-background); padding: 2px 4px; border-radius: 3px;">which claude</code>
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

				
			</div>
		</div>
	</div>

	<!-- Model selector modal -->
	<div id="modelModal" class="tools-modal" style="display: none;">
		<div class="tools-modal-content" style="width: 400px;">
			<div class="tools-modal-header">
				<span>Enforce Model</span>
				<button class="tools-close-btn" onclick="hideModelModal()">✕</button>
			</div>
			<div class="model-explanatory-text">
				This overrides your default model setting for this conversation only.
			</div>
			<div class="tools-list">
				<div class="tool-item" onclick="selectModel('opus')">
					<input type="radio" name="model" id="model-opus" value="opus" checked>
					<label for="model-opus">
						<div class="model-title">Opus - Most capable model</div>
						<div class="model-description">
							Best for complex tasks and highest quality output
						</div>
					</label>
				</div>
				<div class="tool-item" onclick="selectModel('sonnet')">
					<input type="radio" name="model" id="model-sonnet" value="sonnet">
					<label for="model-sonnet">
						<div class="model-title">Sonnet - Balanced model</div>
						<div class="model-description">
							Good balance of speed and capability
						</div>
					</label>
				</div>
				<div class="tool-item" onclick="selectModel('default')">
					<input type="radio" name="model" id="model-default" value="default">
					<label for="model-default" class="default-model-layout">
						<div class="model-option-content">
							<div class="model-title">Default - User configured</div>
							<div class="model-description">
								Uses the model configured in your settings
							</div>
						</div>
						<button class="secondary-button configure-button" onclick="event.stopPropagation(); openModelTerminal();">
							Configure
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
						<div class="slash-command-description">View/modify configuration</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('cost')">
					<div class="slash-command-icon">💰</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/cost</div>
						<div class="slash-command-description">Show token usage statistics</div>
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
				<div class="slash-command-item" onclick="executeSlashCommand('status')">
					<div class="slash-command-icon">📊</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/status</div>
						<div class="slash-command-description">View account and system statuses</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('terminal-setup')">
					<div class="slash-command-icon">⌨️</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/terminal-setup</div>
						<div class="slash-command-description">Install Shift+Enter key binding for newlines</div>
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
`;