export const getInputControlsHtml = () => `
		<div class="input-container" id="inputContainer">
			<div class="status ready" id="status">
				<div class="status-left">
					<div class="mode-toggle">
						<span onclick="togglePlanMode()">Plan First</span>
						<div class="mode-switch" id="planModeSwitch" onclick="togglePlanMode()"></div>
					</div>
					<div class="mode-toggle">
						<span id="thinkingModeLabel" onclick="toggleThinkingMode()">Thinking Mode</span>
						<div class="mode-switch" id="thinkingModeSwitch" onclick="toggleThinkingMode()"></div>
					</div>
				</div>
				<div class="status-right">
					<div class="status-indicator"></div>
					<div class="status-text" id="statusText">Initializing...</div>
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
							<button class="send-btn" id="sendBtn" onclick="sendMessage()">
								<div id="sendContent">
									<span>Send </span>
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
								<div id="stopContent" style="display: none;">
									<span>Stop </span>
									<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
										<path d="M6 6h12v12H6z"/>
									</svg>
								</div>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
`;