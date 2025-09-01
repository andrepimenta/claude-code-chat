export const getHeaderHtml = () => `
	<div class="header">
		<div style="display: flex; align-items: center;">
			<h2>Claude Code Chat</h2>
			<div id="workspaceInfo" class="workspace-info" style="display: none;">
				<span class="workspace-icon">📁</span>
				<span id="workspaceName">-</span>
			</div>
		</div>
		<div style="display: flex; gap: 8px; align-items: center;">
			<div id="sessionStatus" class="session-status" style="display: none;">No session</div>
			<button class="btn outlined" id="settingsBtn" onclick="toggleSettings()" title="Settings">⚙️</button>
			<button class="btn outlined" id="historyBtn" onclick="toggleConversationHistory()">History</button>
			<button class="btn primary" id="newSessionBtn" onclick="newSession()">New Chat</button>
		</div>
	</div>
`;