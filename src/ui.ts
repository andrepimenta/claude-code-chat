import getScript from './script';
import styles from './ui-styles'


const getHtml = (isTelemetryEnabled: boolean) => `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Claude Code Chat</title>
	${styles}
	<script>
		// Icon definitions for UI
		window.icons = {
			history: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
			computer: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
			book: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
			brain: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44L6.5 19.5a2.5 2.5 0 0 0-2-2.5 2.5 2.5 0 0 0-2-2.5 2.5 2.5 0 0 1-2-2.5v-5a2.5 2.5 0 0 1 2-2.5 2.5 2.5 0 0 0 2-2.5 2.5 2.5 0 0 0 2-2.5h.5A2.5 2.5 0 0 1 9.5 2z"></path><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44L17.5 19.5a2.5 2.5 0 0 1 2-2.5 2.5 2.5 0 0 1 2-2.5 2.5 2.5 0 0 0 2-2.5v-5a2.5 2.5 0 0 0-2-2.5 2.5 2.5 0 0 1-2-2.5 2.5 2.5 0 0 1-2-2.5h-.5A2.5 2.5 0 0 0 14.5 2z"></path></svg>',
			folder: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
			plus: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
			zap: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
			lock: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
			search: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>',
			bookOpen: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>',
			bug: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"></rect><path d="M10 6h4"></path><path d="M12 6v14"></path><rect x="5" y="8" width="14" height="8" rx="1"></rect><path d="M7 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"></path></svg>',
			flask: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2v6l-3 3v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8l-3-3V2"></path><line x1="9" y1="2" x2="15" y2="2"></line></svg>',
			dollar: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
			heart: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>',
			help: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
			rocket: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5.5 0 5.5s3.24-1.5 5.5-3.5"></path><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path></svg>',
			key: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="1"></circle><path d="M15.5 11A5.5 5.5 0 1 1 9.5 11"></path><path d="M20 8l-6 6"></path><path d="M14 8l-6 6"></path></svg>',
			door: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>',
			plug: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
			message: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
			eye: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
			rewind: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 19 2 12 11 5 11 19"></polygon><polygon points="22 19 13 12 22 5 22 19"></polygon></svg>',
			barChart: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="20" y2="10"></line><line x1="18" x2="18" y1="20" y2="4"></line><line x1="6" x2="6" y1="20" y2="16"></line></svg>',
			trending: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
			robot: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>'
		};
	</script>
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
			<button class="btn outlined" id="settingsBtn" onclick="toggleSettings()" title="Settings">Settings</button>
			<button class="btn outlined" id="historyBtn" onclick="toggleConversationHistory()"><span style="display: inline-flex; align-items: center; gap: 4px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg> History</span></button>
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
				<div class="wsl-alert-icon" style="display: inline-flex; align-items: center; justify-content: center;"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg></div>
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
			<div class="input-modes">
				<div class="mode-toggle">
					<span onclick="togglePlanMode()">Plan First</span>
					<div class="mode-switch" id="planModeSwitch" onclick="togglePlanMode()"></div>
				</div>
				<div class="mode-toggle">
					<span id="thinkingModeLabel" onclick="toggleThinkingMode()">Thinking Mode</span>
					<div class="mode-switch" id="thinkingModeSwitch" onclick="toggleThinkingMode()"></div>
				</div>
			</div>
			<div class="textarea-container">
				<div class="textarea-wrapper">
					<textarea class="input-field" id="messageInput" placeholder="Type your message to Claude Code..." rows="1"></textarea>
					<div class="input-controls">
						<div class="left-controls">
							<button class="model-selector" id="modelSelector" onclick="showModelSelector()" title="Select model">
								<span id="selectedModel">Opus</span>
								<svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
									<path d="M1 2.5l3 3 3-3"></path>
								</svg>
							</button>
							<button class="tools-btn" onclick="showMCPModal()" title="Configure MCP servers">
								MCP
								<svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
									<path d="M1 2.5l3 3 3-3"></path>
								</svg>
							</button>
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
							<button class="send-btn" id="sendBtn" onclick="sendMessage()" title="Send message (Enter)">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<line x1="22" y1="2" x2="11" y2="13"></line>
									<polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
								</svg>
								<span>Send</span>
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
		<button class="stop-btn" id="stopBtn" onclick="stopRequest()" style="display: none;" title="Stop request">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
				<rect x="6" y="6" width="12" height="12" rx="2"></rect>
			</svg>
			<span>Stop</span>
		</button>
	</div>

			<div id="yoloWarning" class="yolo-warning" style="display: none;">
			Yolo Mode Active: Claude Code will auto-approve all tool requests.
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
				<div class="mcp-add-server">
					<button class="btn outlined" onclick="showAddServerForm()" id="addServerBtn">+ Add MCP Server</button>
				</div>
				<div class="mcp-popular-servers" id="popularServers">
					<h4>Popular MCP Servers</h4>
					<div class="popular-servers-grid">
						<div class="popular-server-item" onclick="addPopularServer('context7', { type: 'http', url: 'https://context7.liam.sh/mcp' })">
							<div class="popular-server-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg></div>
							<div class="popular-server-info">
								<div class="popular-server-name">Context7</div>
								<div class="popular-server-desc">Up-to-date Code Docs For Any Prompt</div>
							</div>
						</div>
						<div class="popular-server-item" onclick="addPopularServer('sequential-thinking', { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-sequential-thinking'] })">
							<div class="popular-server-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg></div>
							<div class="popular-server-info">
								<div class="popular-server-name">Sequential Thinking</div>
								<div class="popular-server-desc">Step-by-step reasoning capabilities</div>
							</div>
						</div>
						<div class="popular-server-item" onclick="addPopularServer('memory', { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-memory'] })">
							<div class="popular-server-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44L6.5 19.5a2.5 2.5 0 0 0-2-2.5 2.5 2.5 0 0 0-2-2.5 2.5 2.5 0 0 1-2-2.5v-5a2.5 2.5 0 0 1 2-2.5 2.5 2.5 0 0 0 2-2.5 2.5 2.5 0 0 0 2-2.5h.5A2.5 2.5 0 0 1 9.5 2z"></path><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44L17.5 19.5a2.5 2.5 0 0 1 2-2.5 2.5 2.5 0 0 1 2-2.5 2.5 2.5 0 0 0 2-2.5v-5a2.5 2.5 0 0 0-2-2.5 2.5 2.5 0 0 1-2-2.5 2.5 2.5 0 0 1-2-2.5h-.5A2.5 2.5 0 0 0 14.5 2z"></path></svg></div>
							<div class="popular-server-info">
								<div class="popular-server-name">Memory</div>
								<div class="popular-server-desc">Knowledge graph storage</div>
							</div>
						</div>
						<div class="popular-server-item" onclick="addPopularServer('puppeteer', { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-puppeteer'] })">
							<div class="popular-server-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg></div>
							<div class="popular-server-info">
								<div class="popular-server-name">Puppeteer</div>
								<div class="popular-server-desc">Browser automation</div>
							</div>
						</div>
						<div class="popular-server-item" onclick="addPopularServer('fetch', { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-fetch'] })">
							<div class="popular-server-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg></div>
							<div class="popular-server-info">
								<div class="popular-server-name">Fetch</div>
								<div class="popular-server-desc">HTTP requests & web scraping</div>
							</div>
						</div>
						<div class="popular-server-item" onclick="addPopularServer('filesystem', { type: 'stdio', command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem'] })">
							<div class="popular-server-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg></div>
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
						<div class="slash-command-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></div>
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
						<div class="slash-command-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg></div>
						<div class="slash-command-content">
							<div class="slash-command-title">/performance-analysis</div>
							<div class="slash-command-description">Analyze this code for performance issues and suggest optimizations</div>
						</div>
					</div>
					<div class="slash-command-item prompt-snippet-item" onclick="usePromptSnippet('security-review')">
						<div class="slash-command-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></div>
						<div class="slash-command-content">
							<div class="slash-command-title">/security-review</div>
							<div class="slash-command-description">Review this code for security vulnerabilities</div>
						</div>
					</div>
					<div class="slash-command-item prompt-snippet-item" onclick="usePromptSnippet('implementation-review')">
						<div class="slash-command-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg></div>
						<div class="slash-command-content">
							<div class="slash-command-title">/implementation-review</div>
							<div class="slash-command-description">Review the implementation in this code</div>
						</div>
					</div>
					<div class="slash-command-item prompt-snippet-item" onclick="usePromptSnippet('code-explanation')">
						<div class="slash-command-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg></div>
						<div class="slash-command-content">
							<div class="slash-command-title">/code-explanation</div>
							<div class="slash-command-description">Explain how this code works in detail</div>
						</div>
					</div>
					<div class="slash-command-item prompt-snippet-item" onclick="usePromptSnippet('bug-fix')">
						<div class="slash-command-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"></rect><path d="M10 6h4"></path><path d="M12 6v14"></path><rect x="5" y="8" width="14" height="8" rx="1"></rect><path d="M7 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"></path></svg></div>
						<div class="slash-command-content">
							<div class="slash-command-title">/bug-fix</div>
							<div class="slash-command-description">Help me fix this bug in my code</div>
						</div>
					</div>
					<div class="slash-command-item prompt-snippet-item" onclick="usePromptSnippet('refactor')">
						
						<div class="slash-command-content">
							<div class="slash-command-title">/refactor</div>
							<div class="slash-command-description">Refactor this code to improve readability and maintainability</div>
						</div>
					</div>
					<div class="slash-command-item prompt-snippet-item" onclick="usePromptSnippet('test-generation')">
						<div class="slash-command-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2v6l-3 3v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8l-3-3V2"></path><line x1="9" y1="2" x2="15" y2="2"></line></svg></div>
						<div class="slash-command-content">
							<div class="slash-command-title">/test-generation</div>
							<div class="slash-command-description">Generate comprehensive tests for this code</div>
						</div>
					</div>
					<div class="slash-command-item prompt-snippet-item" onclick="usePromptSnippet('documentation')">
						
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
					<div class="slash-command-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg></div>
					<div class="slash-command-content">
						<div class="slash-command-title">/add-dir</div>
						<div class="slash-command-description">Add additional working directories</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('agents')">
					<div class="slash-command-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg></div>
					<div class="slash-command-content">
						<div class="slash-command-title">/agents</div>
						<div class="slash-command-description">Manage custom AI subagents for specialized tasks</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('bug')">
					<div class="slash-command-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"></rect><path d="M10 6h4"></path><path d="M12 6v14"></path><rect x="5" y="8" width="14" height="8" rx="1"></rect><path d="M7 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"></path></svg></div>
					<div class="slash-command-content">
						<div class="slash-command-title">/bug</div>
						<div class="slash-command-description">Report bugs (sends conversation to Anthropic)</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('clear')">
					
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
					<div class="slash-command-icon">Settings</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/config</div>
						<div class="slash-command-description">Open the Settings interface (Config tab)</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('cost')">
					<div class="slash-command-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></div>
					<div class="slash-command-content">
						<div class="slash-command-title">/cost</div>
						<div class="slash-command-description">Show token usage statistics (see cost tracking guide for subscription-specific details)</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('doctor')">
					<div class="slash-command-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></div>
					<div class="slash-command-content">
						<div class="slash-command-title">/doctor</div>
						<div class="slash-command-description">Checks the health of your Claude Code installation</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('help')">
					<div class="slash-command-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div>
					<div class="slash-command-content">
						<div class="slash-command-title">/help</div>
						<div class="slash-command-description">Get usage help</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('init')">
					<div class="slash-command-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5.5 0 5.5s3.24-1.5 5.5-3.5"></path><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path></svg></div>
					<div class="slash-command-content">
						<div class="slash-command-title">/init</div>
						<div class="slash-command-description">Initialize project with CLAUDE.md guide</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('login')">
					<div class="slash-command-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="1"></circle><path d="M15.5 11A5.5 5.5 0 1 1 9.5 11"></path><path d="M20 8l-6 6"></path><path d="M14 8l-6 6"></path></svg></div>
					<div class="slash-command-content">
						<div class="slash-command-title">/login</div>
						<div class="slash-command-description">Switch Anthropic accounts</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('logout')">
					<div class="slash-command-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg></div>
					<div class="slash-command-content">
						<div class="slash-command-title">/logout</div>
						<div class="slash-command-description">Sign out from your Anthropic account</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('mcp')">
					<div class="slash-command-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></div>
					<div class="slash-command-content">
						<div class="slash-command-title">/mcp</div>
						<div class="slash-command-description">Manage MCP server connections and OAuth authentication</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('memory')">
					<div class="slash-command-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44L6.5 19.5a2.5 2.5 0 0 0-2-2.5 2.5 2.5 0 0 0-2-2.5 2.5 2.5 0 0 1-2-2.5v-5a2.5 2.5 0 0 1 2-2.5 2.5 2.5 0 0 0 2-2.5 2.5 2.5 0 0 0 2-2.5h.5A2.5 2.5 0 0 1 9.5 2z"></path><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44L17.5 19.5a2.5 2.5 0 0 1 2-2.5 2.5 2.5 0 0 1 2-2.5 2.5 2.5 0 0 0 2-2.5v-5a2.5 2.5 0 0 0-2-2.5 2.5 2.5 0 0 1-2-2.5 2.5 2.5 0 0 1-2-2.5h-.5A2.5 2.5 0 0 0 14.5 2z"></path></svg></div>
					<div class="slash-command-content">
						<div class="slash-command-title">/memory</div>
						<div class="slash-command-description">Edit CLAUDE.md memory files</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('model')">
					<div class="slash-command-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg></div>
					<div class="slash-command-content">
						<div class="slash-command-title">/model</div>
						<div class="slash-command-description">Select or change the AI model</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('permissions')">
					<div class="slash-command-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></div>
					<div class="slash-command-content">
						<div class="slash-command-title">/permissions</div>
						<div class="slash-command-description">View or update permissions</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('pr_comments')">
					<div class="slash-command-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></div>
					<div class="slash-command-content">
						<div class="slash-command-title">/pr_comments</div>
						<div class="slash-command-description">View pull request comments</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('review')">
					<div class="slash-command-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></div>
					<div class="slash-command-content">
						<div class="slash-command-title">/review</div>
						<div class="slash-command-description">Request code review</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('rewind')">
					<div class="slash-command-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 19 2 12 11 5 11 19"></polygon><polygon points="22 19 13 12 22 5 22 19"></polygon></svg></div>
					<div class="slash-command-content">
						<div class="slash-command-title">/rewind</div>
						<div class="slash-command-description">Rewind the conversation and/or code</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('status')">
					<div class="slash-command-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="20" y2="10"></line><line x1="18" x2="18" y1="20" y2="4"></line><line x1="6" x2="6" y1="20" y2="16"></line></svg></div>
					<div class="slash-command-content">
						<div class="slash-command-title">/status</div>
						<div class="slash-command-description">Open the Settings interface (Status tab) showing version, model, account, and connectivity</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('terminal-setup')">
					
					<div class="slash-command-content">
						<div class="slash-command-title">/terminal-setup</div>
						<div class="slash-command-description">Install Shift+Enter key binding for newlines (iTerm2 and VSCode only)</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('usage')">
					<div class="slash-command-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg></div>
					<div class="slash-command-content">
						<div class="slash-command-title">/usage</div>
						<div class="slash-command-description">Show plan usage limits and rate limit status (subscription plans only)</div>
					</div>
				</div>
				<div class="slash-command-item" onclick="executeSlashCommand('vim')">
					
					<div class="slash-command-content">
						<div class="slash-command-title">/vim</div>
						<div class="slash-command-description">Enter vim mode for alternating insert and command modes</div>
					</div>
				</div>
				<div class="slash-command-item custom-command-item">
					<div class="slash-command-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg></div>
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

	${getScript(isTelemetryEnabled)}
	
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

export default getHtml;