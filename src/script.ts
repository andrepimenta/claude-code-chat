const getScript = (isTelemetryEnabled: boolean) => `<script>
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
		let messageIndex = 0; // Track message index for branching

		// Icon helper functions
		const icons = {
			user: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
			claude: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="none" stroke-width="0"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="#D97757"></path><text x="12" y="13.5" text-anchor="middle" font-size="7" font-weight="700" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif">CC</text></svg>',
			error: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
			success: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
			info: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
			warning: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
			lock: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
			history: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
			computer: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
			zap: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
			chart: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="20" y2="10"></line><line x1="18" x2="18" y1="20" y2="4"></line><line x1="6" x2="6" y1="20" y2="16"></line></svg>',
			branch: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>',
			restore: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path></svg>'
		};

		function getStatusBadge(type, text) {
			const badgeClass = \`status-badge \${type}\`;
			const icon = icons[type] || icons.info;
			return \`<span class="\${badgeClass}">\${icon}\${text}</span>\`;
		}

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

		function addMessage(content, type = 'claude', msgIndex = null) {
			const messagesDiv = document.getElementById('messages');
			const shouldScroll = shouldAutoScroll(messagesDiv);
			
			const messageDiv = document.createElement('div');
			messageDiv.className = \`message \${type}\`;
			
			// Assign message index if not provided
			if (msgIndex === null) {
				msgIndex = messageIndex++;
			}
			messageDiv.setAttribute('data-message-index', msgIndex);
			
			// For user messages, only show restore button box (content already in input)
			if (type === 'user') {
				const restoreBox = document.createElement('div');
				restoreBox.className = 'user-restore-box';
				
				const restoreBtn = document.createElement('button');
				restoreBtn.className = 'user-restore-btn';
				restoreBtn.onclick = (e) => {
					e.stopPropagation();
					restoreMessageToInput(content);
				};
				restoreBtn.innerHTML = \`<span class="restore-icon">\${icons.restore}</span><span class="restore-text">Restore</span>\`;
				
				restoreBox.appendChild(restoreBtn);
				messageDiv.appendChild(restoreBox);
			} else {
				// Add header for other message types (claude, error)
				if (type === 'claude' || type === 'error') {
					const headerDiv = document.createElement('div');
					headerDiv.className = 'message-header';
					
					const iconDiv = document.createElement('div');
					iconDiv.className = \`message-icon \${type}\`;
					
					const labelDiv = document.createElement('div');
					labelDiv.className = 'message-label';
					
					// Set icon and label based on type
					switch(type) {
						case 'claude':
							iconDiv.innerHTML = icons.claude;
							labelDiv.textContent = 'Claude';
							break;
						case 'error':
							iconDiv.innerHTML = icons.error;
							labelDiv.textContent = 'Error';
							break;
					}
					
					// Add copy button
					const copyBtn = document.createElement('button');
					copyBtn.className = 'copy-btn';
					copyBtn.title = 'Copy message';
					copyBtn.onclick = () => copyMessageContent(messageDiv);
					copyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';
					
					headerDiv.appendChild(iconDiv);
					headerDiv.appendChild(labelDiv);
					headerDiv.appendChild(copyBtn);
					
					messageDiv.appendChild(headerDiv);
				}
				
				// Add content for non-user messages
				const contentDiv = document.createElement('div');
				contentDiv.className = 'message-content';
				
				if(type === 'claude' || type === 'thinking'){
					contentDiv.innerHTML = content;
				} else {
					// Check if content contains HTML (like SVG icons)
					if (content.includes('<svg') || content.includes('<') && content.includes('>')) {
						contentDiv.innerHTML = content;
					} else {
						const preElement = document.createElement('pre');
						preElement.textContent = content;
						contentDiv.appendChild(preElement);
					}
				}
				
				messageDiv.appendChild(contentDiv);
			}
			
			// Check if this is a permission-related error and add yolo mode button
			if (type === 'error' && isPermissionError(content)) {
				const yoloSuggestion = document.createElement('div');
				yoloSuggestion.className = 'yolo-suggestion';
				yoloSuggestion.innerHTML = \`
					<div class="yolo-suggestion-text">
						<span>This looks like a permission issue. You can enable Yolo Mode to skip all permission checks.</span>
					</div>
					<button class="yolo-suggestion-btn" onclick="enableYoloMode()">Enable Yolo Mode</button>
				\`;
				messageDiv.appendChild(yoloSuggestion);
			}
			
			messagesDiv.appendChild(messageDiv);
			scrollToBottomIfNeeded(messagesDiv, shouldScroll);
		}


		function addToolUseMessage(data) {
			const messagesDiv = document.getElementById('messages');
			const shouldScroll = shouldAutoScroll(messagesDiv);
			
			// Check if this is a terminal command (Bash, Shell, etc.)
			const isTerminalCommand = data.toolName === 'Bash' || data.toolName === 'Shell' || data.toolName === 'Terminal' || 
									  (data.toolName && (data.toolName.toLowerCase().includes('bash') || data.toolName.toLowerCase().includes('shell') || data.toolName.toLowerCase().includes('terminal')));
			
			// Check if this is a file write operation
			const isFileWrite = data.toolName === 'Write' || data.toolName === 'Edit' || data.toolName === 'MultiEdit';
			
			const messageDiv = document.createElement('div');
			messageDiv.className = 'message tool';
			if (isTerminalCommand) {
				messageDiv.classList.add('terminal-command-waiting');
				// Create terminal-style container
				messageDiv.classList.add('terminal-container');
			}
			if (isFileWrite) {
				messageDiv.classList.add('file-write-container');
			}
			
			// Create modern header with icon
			const headerDiv = document.createElement('div');
			headerDiv.className = 'tool-header';
			
			const iconDiv = document.createElement('div');
			iconDiv.className = 'tool-icon';
			if (isTerminalCommand) {
				iconDiv.innerHTML = icons.computer;
			} else if (isFileWrite) {
				iconDiv.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>';
			} else {
				iconDiv.innerHTML = icons.zap;
			}
			
			const toolInfoElement = document.createElement('div');
			toolInfoElement.className = 'tool-info';
			let toolName = data.toolInfo ? data.toolInfo.replace('🔧 Executing: ', '').replace('⚡ Executing: ', '') : data.toolName || 'Tool';
			// Replace TodoWrite with more user-friendly name
			if (toolName === 'TodoWrite') {
				toolName = 'Update Todos';
			}
			toolInfoElement.textContent = toolName;
			
			headerDiv.appendChild(iconDiv);
			headerDiv.appendChild(toolInfoElement);
			
			
			messageDiv.appendChild(headerDiv);
			
			// Store tool name for later reference
			messageDiv.setAttribute('data-tool-name', data.toolName || '');
			messageDiv.setAttribute('data-tool-use-id', data.toolUseId || Math.random().toString(36).substr(2, 9));
			
			if (data.rawInput) {
				// Handle TodoWrite specially - always show, no collapse, checklist style
				const isTodoWrite = (data.toolName === 'TodoWrite' || toolName === 'Update Todos' || toolName === 'TodoWrite');
				// Check for todos in multiple possible locations
				const todos = data.rawInput.todos || data.rawInput.todo_list || data.rawInput.items || 
					(data.rawInput && Array.isArray(data.rawInput) ? data.rawInput : null) || null;
				
				// Debug logging
				if (isTodoWrite) {
					console.log('TodoWrite detected:', { toolName: data.toolName, displayName: toolName, rawInput: data.rawInput, todos: todos, isArray: Array.isArray(todos) });
				}
				
				// Show todos if TodoWrite tool and todos array exists
				if (isTodoWrite && todos && Array.isArray(todos) && todos.length > 0) {
					const todoContainer = document.createElement('div');
					todoContainer.className = 'todo-list-container';
					
					let todoHtml = '<ul class="todo-list">';
					for (const todo of todos) {
						// Handle both object format and string format
						let todoContent = '';
						let todoStatus = 'pending';
						let todoPriority = null;
						
						if (typeof todo === 'string') {
							todoContent = todo;
						} else if (typeof todo === 'object' && todo !== null) {
							todoContent = todo.content || todo.text || todo.task || todo.item || String(todo);
							todoStatus = todo.status || todo.state || 'pending';
							todoPriority = todo.priority || null;
						} else {
							todoContent = String(todo);
						}
						
						const statusClass = todoStatus === 'completed' ? 'completed' :
							todoStatus === 'in_progress' || todoStatus === 'in-progress' ? 'in-progress' : 'pending';
						const priority = todoPriority ? '<span class="todo-priority priority-' + todoPriority + '">' + todoPriority + '</span>' : '';
						
						// Checkbox icons - slim design
						const checkboxIcon = statusClass === 'completed' 
							? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>'
							: statusClass === 'in-progress'
							? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>'
							: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>';
						
						todoHtml += '<li class="todo-item ' + statusClass + '"><div class="todo-checkbox-wrapper">' + checkboxIcon + '</div><div class="todo-content-wrapper"><span class="todo-content">' + escapeHtml(todoContent) + '</span>' + priority + '</div></li>';
					}
					todoHtml += '</ul>';
					todoContainer.innerHTML = todoHtml;
					messageDiv.appendChild(todoContainer);
				} else if (isTerminalCommand && data.rawInput.command) {
					// Terminal command - show command prompt style
					const terminalContent = document.createElement('div');
					terminalContent.className = 'terminal-content';
					terminalContent.setAttribute('data-streaming', 'true');
					
					const command = String(data.rawInput.command || '');
					const prompt = '$ ';
					const commandLine = document.createElement('div');
					commandLine.className = 'terminal-command-line';
					commandLine.innerHTML = '<span class="terminal-prompt">' + escapeHtml(prompt) + '</span><span class="terminal-command">' + escapeHtml(command) + '</span>';
					terminalContent.appendChild(commandLine);
					
					// Create output area for streaming
					const outputArea = document.createElement('div');
					outputArea.className = 'terminal-output-area';
					outputArea.innerHTML = '<span class="terminal-cursor">▋</span>';
					terminalContent.appendChild(outputArea);
					
					messageDiv.appendChild(terminalContent);
				} else if (isFileWrite) {
					// File write operation - show file path and streaming content area
					const fileWriteContent = document.createElement('div');
					fileWriteContent.className = 'file-write-content';
					fileWriteContent.setAttribute('data-streaming', 'true');
					
					if (data.rawInput.file_path) {
						const filePathDiv = document.createElement('div');
						filePathDiv.className = 'file-write-path';
						filePathDiv.innerHTML = '<span class="file-write-label">Writing to:</span> <span class="file-write-path-text" onclick="openFileInEditor(\\\'' + escapeHtml(String(data.rawInput.file_path)) + '\\\')">' + escapeHtml(String(data.rawInput.file_path)) + '</span>';
						fileWriteContent.appendChild(filePathDiv);
					}
					
					// Create streaming content area
					const contentArea = document.createElement('div');
					contentArea.className = 'file-write-streaming';
					contentArea.innerHTML = '<pre class="file-write-code"><span class="file-write-cursor">▋</span></pre>';
					fileWriteContent.appendChild(contentArea);
					
					messageDiv.appendChild(fileWriteContent);
				} else {
					// Regular tool input with collapse
					const inputElement = document.createElement('div');
					inputElement.className = 'tool-input collapsed';
					
					const labelDiv = document.createElement('div');
					labelDiv.className = 'tool-input-label';
					labelDiv.textContent = 'INPUT';
					labelDiv.onclick = () => inputElement.classList.toggle('collapsed');
					inputElement.appendChild(labelDiv);
					
					const contentDiv = document.createElement('div');
					contentDiv.className = 'tool-input-content';
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
					
					inputElement.appendChild(contentDiv);
					messageDiv.appendChild(inputElement);
				}
			} else if (data.toolInput) {
				// Fallback for pre-formatted input
				const inputElement = document.createElement('div');
				inputElement.className = 'tool-input collapsed';
				
				const labelDiv = document.createElement('div');
				labelDiv.className = 'tool-input-label';
				labelDiv.textContent = 'INPUT';
				labelDiv.onclick = () => inputElement.classList.toggle('collapsed');
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
				let html = toolInput.replace(/\\[expand\\]/g, '<span class="expand-btn" onclick="toggleExpand(this)">expand</span>');
				
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
						return \`<span class="expand-btn" data-key="\${key}" data-value="\${escapedValue}" onclick="toggleExpand(this)">expand</span>\`;
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
			
			// Check if this is terminal output (Bash, Shell, etc.) - check toolName from data
			const isTerminalOutput = data.toolName === 'Bash' || data.toolName === 'Shell' || data.toolName === 'Terminal' || 
									  (data.toolName && (data.toolName.toLowerCase().includes('bash') || data.toolName.toLowerCase().includes('shell') || data.toolName.toLowerCase().includes('terminal')));
			
			// Check if this is a file write operation
			const isFileWrite = data.toolName === 'Write' || data.toolName === 'Edit' || data.toolName === 'MultiEdit';
			
			// For Read and Edit tools with hidden flag, just hide loading state and show completion message
			if (data.hidden && (data.toolName === 'Read' || data.toolName === 'Edit' || data.toolName === 'TodoWrite' || data.toolName === 'MultiEdit') && !data.isError) {
				// Hide loading state by finding and removing the tool use message
				const toolMessages = messagesDiv.querySelectorAll('[data-tool-name="' + data.toolName + '"]');
				if (toolMessages.length > 0) {
					const lastToolMessage = toolMessages[toolMessages.length - 1];
					if (lastToolMessage) {
						lastToolMessage.remove();
					}
				}
				return; // Don't show the result message
			}
			
			if(data.isError && data.content === "File has not been read yet. Read it first before writing to it."){
				return addMessage("File has not been read yet. Let me read it first before writing to it.", 'system');
			}

			// Try to find existing terminal/file-write container to append to
			let existingContainer = null;
			if (isTerminalOutput || isFileWrite) {
				const toolUseId = data.toolUseId;
				if (toolUseId) {
					existingContainer = messagesDiv.querySelector('[data-tool-use-id="' + toolUseId + '"]');
				} else {
					// Fallback: find by tool name
					const toolMessages = messagesDiv.querySelectorAll('[data-tool-name="' + data.toolName + '"]');
					if (toolMessages.length > 0) {
						existingContainer = toolMessages[toolMessages.length - 1];
					}
				}
			}

			// If we found an existing container, append to it (streaming)
			if (existingContainer && (isTerminalOutput || isFileWrite)) {
				let content = data.content || '';
				if (typeof content !== 'string') {
					try {
						content = JSON.stringify(content, null, 2);
					} catch (error) {
						content = '[Unable to display result]';
					}
				}

				if (isTerminalOutput) {
					// Append to terminal output area
					const outputArea = existingContainer.querySelector('.terminal-output-area');
					if (outputArea) {
						// Remove cursor
						const cursor = outputArea.querySelector('.terminal-cursor');
						if (cursor) cursor.remove();
						
						// Append content (preserve newlines)
						if (content) {
							// Split by newlines and add each line
							const lines = content.split('\\n');
							lines.forEach((line, index) => {
								if (index > 0) {
									outputArea.appendChild(document.createElement('br'));
								}
								if (line) {
									const lineSpan = document.createElement('span');
									lineSpan.textContent = line;
									outputArea.appendChild(lineSpan);
								}
							});
						}
						
						// Only add cursor if not complete (not an error and content might continue)
						// Also remove cursor if complete or error
						if (data.complete || data.isError) {
							// Cursor already removed above, don't add it back
						} else if (!data.isError && !data.complete) {
							const newCursor = document.createElement('span');
							newCursor.className = 'terminal-cursor';
							newCursor.textContent = '▋';
							outputArea.appendChild(newCursor);
						}
						
						// Update error state if needed
						if (data.isError) {
							existingContainer.classList.add('error');
							const header = existingContainer.querySelector('.tool-header');
							if (header) {
								header.classList.add('error');
							}
						}
						
						scrollToBottomIfNeeded(messagesDiv, shouldScroll);
						return;
					}
				} else if (isFileWrite) {
					// Append to file write streaming area
					const streamingArea = existingContainer.querySelector('.file-write-streaming pre');
					if (streamingArea) {
						// Remove cursor
						const cursor = streamingArea.querySelector('.file-write-cursor');
						if (cursor) cursor.remove();
						
						// Append content (preserve formatting)
						if (content) {
							const codeContent = document.createElement('span');
							codeContent.textContent = content;
							streamingArea.appendChild(codeContent);
						}
						
						// Only add cursor if not complete
						if (!data.isError && !data.complete) {
							const newCursor = document.createElement('span');
							newCursor.className = 'file-write-cursor';
							newCursor.textContent = '▋';
							streamingArea.appendChild(newCursor);
						}
						
						scrollToBottomIfNeeded(messagesDiv, shouldScroll);
						return;
					}
				}
			}

			// Otherwise, create new result message (fallback)
			const messageDiv = document.createElement('div');
			if (isTerminalOutput) {
				messageDiv.className = data.isError ? 'message terminal-output error' : 'message terminal-output';
			} else {
				messageDiv.className = data.isError ? 'message error' : 'message tool-result success';
			}
			
			// Create header
			const headerDiv = document.createElement('div');
			headerDiv.className = 'message-header';
			
			const iconDiv = document.createElement('div');
			if (isTerminalOutput) {
				iconDiv.className = 'message-icon terminal';
				iconDiv.innerHTML = icons.computer;
			} else {
				iconDiv.className = data.isError ? 'message-icon error' : 'message-icon success';
				iconDiv.innerHTML = data.isError ? icons.error : '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
			}
			
			const labelDiv = document.createElement('div');
			labelDiv.className = 'message-label';
			if (isTerminalOutput) {
				labelDiv.textContent = data.isError ? 'Terminal Error' : 'Terminal Output';
			} else {
				labelDiv.textContent = data.isError ? 'Error' : (data.toolName || 'Result');
			}
			
			headerDiv.appendChild(iconDiv);
			headerDiv.appendChild(labelDiv);
			messageDiv.appendChild(headerDiv);
			
			// Add content
			const contentDiv = document.createElement('div');
			contentDiv.className = isTerminalOutput ? 'terminal-content' : 'message-content';
			
			// Check if it's a tool result and truncate appropriately - always collapse long content
			let content = data.content || '';
			if (typeof content !== 'string') {
				try {
					content = JSON.stringify(content, null, 2);
				} catch (error) {
					content = '[Unable to display result]';
				}
			}
			const shouldCollapse = !isTerminalOutput && content && (content.length > 100 || content.split('\\n').length > 5);
			
			if (shouldCollapse && !data.isError) {
				const truncateAt = Math.min(97, content.length);
				const truncated = content.substring(0, truncateAt);
				const resultId = 'result_' + Math.random().toString(36).substr(2, 9);
				
				const preElement = document.createElement('pre');
				preElement.style.margin = '0';
				preElement.style.fontSize = '12px';
				preElement.innerHTML = '<span id="' + resultId + '_visible">' + escapeHtml(truncated) + '</span>' +
									   '<span id="' + resultId + '_ellipsis">...</span>' +
									   '<span id="' + resultId + '_hidden" style="display: none;">' + escapeHtml(content.substring(truncateAt)) + '</span>';
				contentDiv.appendChild(preElement);
				
				// Add expand button container
				const expandContainer = document.createElement('div');
				expandContainer.className = 'diff-expand-container';
				const expandButton = document.createElement('button');
				expandButton.className = 'diff-expand-btn';
				expandButton.textContent = 'Show more';
				expandButton.setAttribute('onclick', 'toggleResultExpansion(\\'' + resultId + '\\\')');
				expandContainer.appendChild(expandButton);
				contentDiv.appendChild(expandContainer);
			} else {
				const preElement = document.createElement('pre');
				preElement.className = isTerminalOutput ? 'terminal-output-text' : '';
				preElement.style.margin = '0';
				preElement.style.fontSize = isTerminalOutput ? '13px' : '12px';
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
						<span>This looks like a permission issue. You can enable Yolo Mode to skip all permission checks.</span>
					</div>
					<button class="yolo-suggestion-btn" onclick="enableYoloMode()">Enable Yolo Mode</button>
				\`;
				messageDiv.appendChild(yoloSuggestion);
			}
			
			messagesDiv.appendChild(messageDiv);
			scrollToBottomIfNeeded(messagesDiv, shouldScroll);
		}

		function formatToolInputUI(input) {
			try {
				if (!input || typeof input !== 'object') {
					const str = String(input || '');
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
					return escapeHtml(str);
				}

				// Special handling for Read tool with file_path
				if (input.file_path && Object.keys(input).length === 1) {
					const formattedPath = formatFilePath(input.file_path);
					return '<div class="diff-file-path" onclick="openFileInEditor(\\\'' + escapeHtml(String(input.file_path)) + '\\\')">' + formattedPath + '</div>';
				}

				let result = '';
				let isFirst = true;
				for (const [key, value] of Object.entries(input)) {
					if (!key) continue;
					
					let valueStr;
					try {
						if (value === null || value === undefined) {
							valueStr = String(value);
						} else if (typeof value === 'string') {
							valueStr = value;
						} else {
							valueStr = JSON.stringify(value, null, 2);
						}
					} catch (error) {
						valueStr = '[Unable to format value]';
					}
					
					if (!isFirst) result += '\\n';
					isFirst = false;
					
					// Special formatting for file_path in Read tool context
					if (key === 'file_path') {
						const formattedPath = formatFilePath(valueStr);
						result += '<div class="diff-file-path" onclick="openFileInEditor(\\\'' + escapeHtml(valueStr) + '\\\')">' + formattedPath + '</div>';
					} else if (valueStr && valueStr.length > 100) {
						const truncated = escapeHtml(valueStr.substring(0, 97)) + '...';
						const escapedValue = valueStr.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
						result += '<span class="expandable-item"><strong>' + escapeHtml(key) + ':</strong> ' + truncated + ' <span class="expand-btn" data-key="' + escapeHtml(key) + '" data-value="' + escapedValue + '" onclick="toggleExpand(this)">expand</span></span>';
					} else {
						result += '<strong>' + escapeHtml(key) + ':</strong> ' + escapeHtml(valueStr || '');
					}
				}
				return result || '[Empty input]';
			} catch (error) {
				console.error('Error formatting tool input:', error);
				return '[Error formatting input]';
			}
		}

		function formatEditToolDiff(input) {
			try {
				if (!input || typeof input !== 'object') {
					return formatToolInputUI(input);
				}

				// Check if this is an Edit tool (has file_path, old_string, new_string)
				if (!input.file_path || input.old_string === undefined || input.new_string === undefined) {
					return formatToolInputUI(input);
				}

				// Format file path with better display
				const formattedPath = formatFilePath(String(input.file_path));
				let result = '<div class="diff-file-path" onclick="openFileInEditor(\\\'' + escapeHtml(String(input.file_path)) + '\\\')">' + formattedPath + '</div>\\n';
				
				// Create diff view - handle null/undefined strings
				const oldString = String(input.old_string || '');
				const newString = String(input.new_string || '');
				const oldLines = oldString.split('\\n');
				const newLines = newString.split('\\n');
				const allLines = [...oldLines.map(line => ({type: 'removed', content: line || ''})), 
								 ...newLines.map(line => ({type: 'added', content: line || ''}))];
				
				const maxLines = 6;
				const shouldTruncate = allLines.length > maxLines;
				const visibleLines = shouldTruncate ? allLines.slice(0, maxLines) : allLines;
				const hiddenLines = shouldTruncate ? allLines.slice(maxLines) : [];
				
				result += '<div class="diff-container collapsed" onclick="this.classList.toggle(\\'collapsed\\')">';
				result += '<div class="diff-header">Changes:</div>';
				
				// Create a unique ID for this diff
				const diffId = 'diff_' + Math.random().toString(36).substr(2, 9);
				
				// Show visible lines
				result += '<div id="' + diffId + '_visible">';
				for (const line of visibleLines) {
					if (line && line.content !== undefined) {
						const cssClass = line.type === 'removed' ? 'removed' : 'added';
						result += '<div class="diff-line ' + cssClass + '">' + escapeHtml(String(line.content)) + '</div>';
					}
				}
				result += '</div>';
				
				// Show hidden lines (initially hidden)
				if (shouldTruncate && hiddenLines.length > 0) {
					result += '<div id="' + diffId + '_hidden" style="display: none;">';
					for (const line of hiddenLines) {
						if (line && line.content !== undefined) {
							const cssClass = line.type === 'removed' ? 'removed' : 'added';
							result += '<div class="diff-line ' + cssClass + '">' + escapeHtml(String(line.content)) + '</div>';
						}
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
						try {
							const valueStr = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
							result += '\\n<strong>' + escapeHtml(key) + ':</strong> ' + escapeHtml(valueStr);
						} catch (error) {
							result += '\\n<strong>' + escapeHtml(key) + ':</strong> [Unable to format]';
						}
					}
				}
				
				return result;
			} catch (error) {
				console.error('Error formatting Edit tool diff:', error);
				return formatToolInputUI(input);
			}
		}

		function formatMultiEditToolDiff(input) {
			try {
				if (!input || typeof input !== 'object') {
					return formatToolInputUI(input);
				}

				// Check if this is a MultiEdit tool (has file_path and edits array)
				if (!input.file_path || !input.edits || !Array.isArray(input.edits) || input.edits.length === 0) {
					return formatToolInputUI(input);
				}

				// Format file path with better display
				const formattedPath = formatFilePath(String(input.file_path));
				let result = '<div class="diff-file-path" onclick="openFileInEditor(\\\'' + escapeHtml(String(input.file_path)) + '\\\')">' + formattedPath + '</div>\\n';
				
				// Count total lines across all edits for truncation
				let totalLines = 0;
				for (const edit of input.edits) {
					if (edit && typeof edit === 'object') {
						const oldStr = String(edit.old_string || '');
						const newStr = String(edit.new_string || '');
						const oldLines = oldStr.split('\\n');
						const newLines = newStr.split('\\n');
						totalLines += oldLines.length + newLines.length;
					}
				}

				const maxLines = 6;
				const shouldTruncate = totalLines > maxLines;
				
				result += '<div class="diff-container collapsed" onclick="this.classList.toggle(\\'collapsed\\')">';
				result += '<div class="diff-header">Changes (' + input.edits.length + ' edit' + (input.edits.length > 1 ? 's' : '') + '):</div>';
				
				// Create a unique ID for this diff
				const diffId = 'multiedit_' + Math.random().toString(36).substr(2, 9);
				
				let currentLineCount = 0;
				let visibleEdits = [];
				let hiddenEdits = [];
				
				// Determine which edits to show/hide based on line count
				for (let i = 0; i < input.edits.length; i++) {
					const edit = input.edits[i];
					if (!edit || typeof edit !== 'object' || edit.old_string === undefined || edit.new_string === undefined) {
						continue;
					}
					
					const oldStr = String(edit.old_string || '');
					const newStr = String(edit.new_string || '');
					const oldLines = oldStr.split('\\n');
					const newLines = newStr.split('\\n');
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
						try {
							const valueStr = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
							result += '\\n<strong>' + escapeHtml(key) + ':</strong> ' + escapeHtml(valueStr);
						} catch (error) {
							result += '\\n<strong>' + escapeHtml(key) + ':</strong> [Unable to format]';
						}
					}
				}
				
				return result;
			} catch (error) {
				console.error('Error formatting MultiEdit tool diff:', error);
				return formatToolInputUI(input);
			}
		}

		function formatSingleEdit(edit, editNumber) {
			try {
				if (!edit || typeof edit !== 'object') {
					return '<div class="single-edit"><div class="edit-number">Edit #' + editNumber + '</div><div class="diff-line">[Invalid edit]</div></div>';
				}
				
				let result = '<div class="single-edit">';
				result += '<div class="edit-number">Edit #' + editNumber + '</div>';
				
				// Create diff view for this single edit - handle null/undefined
				const oldString = String(edit.old_string || '');
				const newString = String(edit.new_string || '');
				const oldLines = oldString.split('\\n');
				const newLines = newString.split('\\n');
				
				// Show removed lines
				for (const line of oldLines) {
					result += '<div class="diff-line removed">' + escapeHtml(String(line || '')) + '</div>';
				}
				
				// Show added lines
				for (const line of newLines) {
					result += '<div class="diff-line added">' + escapeHtml(String(line || '')) + '</div>';
				}
				
				result += '</div>';
				return result;
			} catch (error) {
				console.error('Error formatting single edit:', error);
				return '<div class="single-edit"><div class="edit-number">Edit #' + editNumber + '</div><div class="diff-line">[Error formatting edit]</div></div>';
			}
		}

		function formatWriteToolDiff(input) {
			try {
				if (!input || typeof input !== 'object') {
					return formatToolInputUI(input);
				}

				// Check if this is a Write tool (has file_path and content)
				if (!input.file_path || input.content === undefined || input.content === null) {
					return formatToolInputUI(input);
				}

				// Format file path with better display
				const formattedPath = formatFilePath(String(input.file_path));
				let result = '<div class="diff-file-path" onclick="openFileInEditor(\\\'' + escapeHtml(String(input.file_path)) + '\\\')">' + formattedPath + '</div>\\n';
				
				// Create diff view showing all content as additions - handle null/undefined
				const contentString = String(input.content || '');
				const contentLines = contentString.split('\\n');
				
				const maxLines = 6;
				const shouldTruncate = contentLines.length > maxLines;
				const visibleLines = shouldTruncate ? contentLines.slice(0, maxLines) : contentLines;
				const hiddenLines = shouldTruncate ? contentLines.slice(maxLines) : [];
				
				result += '<div class="diff-container collapsed" onclick="this.classList.toggle(\\'collapsed\\')">';
				result += '<div class="diff-header">New file content:</div>';
				
				// Create a unique ID for this diff
				const diffId = 'write_' + Math.random().toString(36).substr(2, 9);
				
				// Show visible lines (all as additions)
				result += '<div id="' + diffId + '_visible">';
				for (const line of visibleLines) {
					result += '<div class="diff-line added">' + escapeHtml(String(line || '')) + '</div>';
				}
				result += '</div>';
				
				// Show hidden lines (initially hidden)
				if (shouldTruncate && hiddenLines.length > 0) {
					result += '<div id="' + diffId + '_hidden" style="display: none;">';
					for (const line of hiddenLines) {
						result += '<div class="diff-line added">' + escapeHtml(String(line || '')) + '</div>';
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
						try {
							const valueStr = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
							result += '\\n<strong>' + escapeHtml(key) + ':</strong> ' + escapeHtml(valueStr);
						} catch (error) {
							result += '\\n<strong>' + escapeHtml(key) + ':</strong> [Unable to format]';
						}
					}
				}
				
				return result;
			} catch (error) {
				console.error('Error formatting Write tool diff:', error);
				return formatToolInputUI(input);
			}
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
					button.textContent = 'Show less';
				} else {
					hiddenDiv.style.display = 'none';
					const hiddenLines = hiddenDiv.querySelectorAll('.diff-line').length;
					button.textContent = 'Show ' + hiddenLines + ' more lines';
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
					button.textContent = 'Show less';
				} else {
					hiddenDiv.style.display = 'none';
					if (ellipsis) ellipsis.style.display = 'inline';
					button.textContent = 'Show more';
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
			
			if (button.textContent === 'expand') {
				// Show full content
				const decodedValue = value.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
				container.innerHTML = '<strong>' + key + ':</strong> ' + decodedValue + ' <span class="expand-btn" data-key="' + key + '" data-value="' + value + '" onclick="toggleExpand(this)">collapse</span>';
			} else {
				// Show truncated content
				const decodedValue = value.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
				const truncated = decodedValue.substring(0, 97) + '...';
				container.innerHTML = '<strong>' + key + ':</strong> ' + truncated + ' <span class="expand-btn" data-key="' + key + '" data-value="' + value + '" onclick="toggleExpand(this)">expand</span>';
			}
		}

		function sendMessage() {
			const text = messageInput.value.trim();
			if (text) {
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
					toggleLabel.textContent = 'Thinking Mode';
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
					\`\${totalTokens.toLocaleString()} tokens\` : '0 tokens';
				
				let elapsedStr = '';
				if (requestStartTime) {
					const elapsedSeconds = Math.floor((Date.now() - requestStartTime) / 1000);
					elapsedStr = \` • \${elapsedSeconds}s\`;
				}
				
				const statusText = \`Processing • \${tokensStr}\${elapsedStr}\`;
				updateStatus(statusText, 'processing');
			} else {
				// When ready, show full info
				const costStr = totalCost > 0 ? \`$\${totalCost.toFixed(4)}\` : '$0.00';
				const totalTokens = totalTokensInput + totalTokensOutput;
				const tokensStr = totalTokens > 0 ? 
					\`\${totalTokens.toLocaleString()} tokens\` : '0 tokens';
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
				addMessage('Yolo Mode enabled! All permission checks will be bypassed for future commands.', 'system');
				
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
				notification.textContent = 'Server name is required';
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
						notification.textContent = \`Server "\${name}" already exists\`;
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
					notification.textContent = 'Command is required for stdio servers';
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
					notification.textContent = 'URL is required for HTTP/SSE servers';
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
					notification.textContent = \`Server "\${name}" already exists\`;
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
				serversList.innerHTML = '<div class="no-servers">No MCP servers configured</div>';
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
			const intensityNames = ['Thinking', 'Think Hard', 'Think Harder', 'Ultrathink'];
			const modeName = intensityNames[intensityValue] || 'Thinking';
			const toggleLabel = document.getElementById('thinkingModeLabel');
			if (toggleLabel) {
				toggleLabel.textContent = modeName + ' Mode';
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
			addMessage('user', \`Executing /\${command} command in terminal. Check the terminal output and return when ready.\`, 'assistant');
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
			const builtInSnippets = {
				'performance-analysis': 'Analyze this code for performance issues and suggest optimizations',
				'security-review': 'Review this code for security vulnerabilities',
				'implementation-review': 'Review the implementation in this code',
				'code-explanation': 'Explain how this code works in detail',
				'bug-fix': 'Help me fix this bug in my code',
				'refactor': 'Refactor this code to improve readability and maintainability',
				'test-generation': 'Generate comprehensive tests for this code',
				'documentation': 'Generate documentation for this code'
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
					
					<div class="slash-command-content">
						<div class="slash-command-title">/\${snippet.name}</div>
						<div class="slash-command-description">\${snippet.prompt}</div>
					</div>
					<div class="snippet-actions">
						<button class="snippet-delete-btn" onclick="event.stopPropagation(); deleteCustomSnippet('\${snippet.id}')" title="Delete snippet">Delete</button>
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
			const stopBtn = document.getElementById('stopBtn');
			if (stopBtn) {
				stopBtn.style.display = 'flex';
			}
		}

		function hideStopButton() {
			const stopBtn = document.getElementById('stopBtn');
			if (stopBtn) {
				stopBtn.style.display = 'none';
			}
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

		function restoreMessageToInput(content) {
			// Get plain text content (strip HTML)
			const tempDiv = document.createElement('div');
			tempDiv.innerHTML = content;
			const plainText = tempDiv.innerText || tempDiv.textContent || content;
			
			// Restore to input field
			messageInput.value = plainText;
			messageInput.focus();
			
			// Auto-resize the textarea
			messageInput.style.height = 'auto';
			messageInput.style.height = Math.min(messageInput.scrollHeight, 200) + 'px';
			
			// Scroll input into view if needed
			messageInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}


		function branchFromMessage(msgIndex, originalContent) {
			// Get plain text content (strip HTML)
			const tempDiv = document.createElement('div');
			tempDiv.innerHTML = originalContent;
			const plainText = tempDiv.innerText || tempDiv.textContent || originalContent;
			
			// Pre-fill the input with the original message
			messageInput.value = plainText;
			messageInput.focus();
			
			// Auto-resize the textarea
			messageInput.style.height = 'auto';
			messageInput.style.height = Math.min(messageInput.scrollHeight, 200) + 'px';
			
			// Send branch request to backend
			vscode.postMessage({
				type: 'branchFromMessage',
				messageIndex: msgIndex,
				originalMessage: plainText
			});
			
			// Remove all messages after this one
			const messagesDiv = document.getElementById('messages');
			const allMessages = Array.from(messagesDiv.children);
			let foundIndex = false;
			let lastKeptIndex = -1;
			
			allMessages.forEach(msg => {
				const index = parseInt(msg.getAttribute('data-message-index') || '-1');
				if (foundIndex || index > msgIndex) {
					foundIndex = true;
					msg.remove();
				} else if (index === msgIndex) {
					foundIndex = true;
					lastKeptIndex = index;
				} else if (index <= msgIndex) {
					lastKeptIndex = Math.max(lastKeptIndex, index);
				}
			});
			
			// Reset message index counter to continue from the branch point
			// Count user messages up to the branch point to set the counter correctly
			let userMsgCount = 0;
			const remainingMessages = Array.from(messagesDiv.children);
			remainingMessages.forEach(msg => {
				if (msg.classList.contains('user')) {
					userMsgCount++;
				}
			});
			messageIndex = userMsgCount;
		}
		
		function toggleCodeBlock(container) {
			container.classList.toggle('collapsed');
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
					if (message.data && message.data.trim()) {
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
						
						// Check if there's an existing Claude message being streamed
						const messagesDiv = document.getElementById('messages');
						const lastMessage = messagesDiv.lastElementChild;
						const isStreaming = lastMessage && 
							lastMessage.classList.contains('claude') && 
							lastMessage.hasAttribute('data-streaming');
						
						if (isStreaming) {
							// Append to existing streaming message
							const contentDiv = lastMessage.querySelector('.message-content');
							if (contentDiv) {
								// Get current content as text
								const currentText = contentDiv.innerText || contentDiv.textContent || '';
								// Append new content
								const newText = currentText + displayData;
								// Re-parse markdown with full content
								contentDiv.innerHTML = parseSimpleMarkdown(newText);
								scrollToBottomIfNeeded(messagesDiv, shouldAutoScroll(messagesDiv));
							}
						} else {
							// Create new streaming message
							const messageDiv = document.createElement('div');
							messageDiv.className = 'message claude';
							messageDiv.setAttribute('data-streaming', 'true');
							messageDiv.setAttribute('data-message-index', messageIndex++);
							
							// Add header
							const headerDiv = document.createElement('div');
							headerDiv.className = 'message-header';
							
							const iconDiv = document.createElement('div');
							iconDiv.className = 'message-icon claude';
							iconDiv.innerHTML = icons.claude;
							
							const labelDiv = document.createElement('div');
							labelDiv.className = 'message-label';
							labelDiv.textContent = 'Claude';
							
							const copyBtn = document.createElement('button');
							copyBtn.className = 'copy-btn';
							copyBtn.title = 'Copy message';
							copyBtn.onclick = () => copyMessageContent(messageDiv);
							copyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';
							
							headerDiv.appendChild(iconDiv);
							headerDiv.appendChild(labelDiv);
							headerDiv.appendChild(copyBtn);
							messageDiv.appendChild(headerDiv);
							
							// Add content
							const contentDiv = document.createElement('div');
							contentDiv.className = 'message-content';
							contentDiv.innerHTML = parseSimpleMarkdown(displayData);
							messageDiv.appendChild(contentDiv);
							
							messagesDiv.appendChild(messageDiv);
							scrollToBottomIfNeeded(messagesDiv, shouldAutoScroll(messagesDiv));
						}
					}
					updateStatusWithTotals();
					break;
					
				case 'userInput':
					if (message.data.trim()) {
						const msgIdx = message.messageIndex !== undefined ? message.messageIndex : null;
						addMessage(parseSimpleMarkdown(message.data), 'user', msgIdx);
						// Update messageIndex counter to ensure it's always ahead of loaded messages
						if (msgIdx !== null && msgIdx >= messageIndex) {
							messageIndex = msgIdx + 1;
						}
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
						// Mark streaming as complete and remove cursors
						const messagesDiv = document.getElementById('messages');
						
						// Remove Claude message streaming attribute
						const lastMessage = messagesDiv.lastElementChild;
						if (lastMessage && lastMessage.hasAttribute('data-streaming')) {
							lastMessage.removeAttribute('data-streaming');
						}
						
						// Remove all terminal cursors
						const terminalCursors = messagesDiv.querySelectorAll('.terminal-cursor');
						terminalCursors.forEach(cursor => cursor.remove());
						
						// Remove all file write cursors
						const fileWriteCursors = messagesDiv.querySelectorAll('.file-write-cursor');
						fileWriteCursors.forEach(cursor => cursor.remove());
						
						// Remove streaming attributes from terminal/file-write containers
						const streamingContainers = messagesDiv.querySelectorAll('[data-streaming="true"]');
						streamingContainers.forEach(container => container.removeAttribute('data-streaming'));
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
						addMessage('💭 Thinking...' + parseSimpleMarkdown(message.data), 'thinking');
					}
					break;
					
				case 'sessionInfo':
					if (message.data.sessionId) {
						showSessionInfo(message.data.sessionId);
						// Show detailed session information
						const sessionDetails = [
							\`Session ID: \${message.data.sessionId}\`,
							\`🔧 Tools Available: \${message.data.tools.length}\`,
							\`MCP Servers: \${message.data.mcpServers ? message.data.mcpServers.length : 0}\`
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
						let tokenBreakdown = \`\${icons.chart} Tokens: \${currentTotal.toLocaleString()}\`;
						
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
					addMessage(\`Resumed previous session\\nSession ID: \${message.data.sessionId}\\nYour conversation history is preserved\`, 'system');
					break;
					
				case 'sessionCleared':
					console.log('Session cleared');
					// Clear all messages from UI
					messagesDiv.innerHTML = '';
					hideSessionInfo();
					addMessage('New chat started. How can I help you today?', 'system');
					// Reset totals
					totalCost = 0;
					totalTokensInput = 0;
					totalTokensOutput = 0;
					requestCount = 0;
					// Don't reset messageIndex - keep it persistent for restore/branch functionality
					// messageIndex = 0; // Keep message index persistent
					updateStatusWithTotals();
					break;
					
				case 'setMessageIndex':
					// Set message index counter (used when loading conversation history)
					if (message.data && message.data.messageIndex !== undefined) {
						messageIndex = message.data.messageIndex;
					}
					break;
					
				case 'loginRequired':
					sendStats('Login required');
					addMessage('🔐 Login Required\\n\\nYour Claude API key is invalid or expired.\\nA terminal has been opened - please run the login process there.\\n\\nAfter logging in, come back to this chat to continue.', 'error');
					updateStatus('Login Required', 'error');
					break;
					
				case 'showRestoreOption':
					showRestoreContainer(message.data);
					break;
					
				case 'restoreProgress':
					addMessage(message.data, 'system');
					break;

				case 'restoreSuccess':
					//hideRestoreContainer(message.data.commitSha);
					addMessage(message.data.message, 'system');
					hideRedoRestoreButton(); // Hide redo button when new restore happens
					if (message.data.canUndo) {
						showUndoRestoreButton();
					}
					break;

				case 'undoRestoreSuccess':
					addMessage(message.data.message, 'system');
					hideUndoRestoreButton();
					if (message.data.canRedo) {
						showRedoRestoreButton();
					}
					break;

				case 'redoRestoreSuccess':
					addMessage(message.data.message, 'system');
					hideRedoRestoreButton();
					hideUndoRestoreButton(); // Hide undo button when redo happens
					if (message.data.canUndo) {
						showUndoRestoreButton();
					}
					break;

				case 'restoreError':
					addMessage(message.data, 'error');
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
					addMessage('MCP server "' + message.data.name + '" saved successfully', 'system');
					break;
				case 'mcpServerDeleted':
					loadMCPServers(); // Reload the servers list
					addMessage('MCP server "' + message.data.name + '" deleted successfully', 'system');
					break;
				case 'mcpServerError':
					addMessage('Error with MCP server: ' + message.data.error, 'error');
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
			let alwaysAllowText = \`Always allow \${toolName}\`;
			let alwaysAllowTooltip = '';
			if (toolName === 'Bash' && data.pattern) {
				const pattern = data.pattern;
				// Remove the asterisk for display - show "npm i" instead of "npm i *"
				const displayPattern = pattern.replace(' *', '');
				const truncatedPattern = displayPattern.length > 30 ? displayPattern.substring(0, 30) + '...' : displayPattern;
				alwaysAllowText = \`Always allow <code>\${truncatedPattern}</code>\`;
				alwaysAllowTooltip = displayPattern.length > 30 ? \`title="\${displayPattern}"\` : '';
			}
			
			messageDiv.innerHTML = \`
				<div class="permission-header">
					<span class="icon">\${icons.lock}</span>
					<span>Permission Required</span>
					<div class="permission-menu">
						<button class="permission-menu-btn" onclick="togglePermissionMenu('\${data.id}')" title="More options">⋮</button>
						<div class="permission-menu-dropdown" id="permissionMenu-\${data.id}" style="display: none;">
							<button class="permission-menu-item" onclick="enableYoloMode('\${data.id}')">
								<span class="menu-icon">\${icons.zap}</span>
								<div class="menu-content">
									<span class="menu-title">Enable YOLO Mode</span>
									<span class="menu-subtitle">Auto-allow all permissions</span>
								</div>
							</button>
						</div>
					</div>
				</div>
				<div class="permission-content">
					<p>Allow <strong>\${toolName}</strong>?</p>
					<div class="permission-buttons">
						<button class="btn allow" onclick="respondToPermission('\${data.id}', true)">Allow</button>
						<button class="btn deny" onclick="respondToPermission('\${data.id}', false)">Deny</button>
						<button class="btn always-allow" onclick="respondToPermission('\${data.id}', true, true)" \${alwaysAllowTooltip}>\${alwaysAllowText}</button>
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
				const headerDiv = permissionMsg.querySelector('.permission-header');
				
				// Hide buttons
				if (buttons) {
					buttons.style.display = 'none';
				}
				
				// Hide menu button
				if (headerDiv) {
					const menuBtn = headerDiv.querySelector('.permission-menu');
					if (menuBtn) {
						menuBtn.style.display = 'none';
					}
				}
				
				// Update content with approval message
				if (permissionContent) {
					let approvalText = approved ? 'Approved You allowed this' : 'Denied';
					if (alwaysAllow && approved) {
						approvalText = 'Approved You allowed this and set it to always allow';
					}
					permissionContent.innerHTML = \`<p style="color: rgba(76, 175, 80, 0.9); margin: 0;">\${approvalText}</p>\`;
				}
				
				// Add class for styling
				if (approved) {
					permissionMsg.classList.add('approved');
				} else {
					permissionMsg.classList.add('denied');
				}
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
			addMessage(\`\${icons.zap} YOLO Mode enabled! All future permissions will be automatically allowed.\`, 'system');
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
			restoreContainer.className = 'checkpoint-card';
			restoreContainer.id = \`restore-\${data.sha}\`;

			const date = new Date(data.timestamp);
			const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
			const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
			const shortSha = data.sha ? data.sha.substring(0, 7) : 'unknown';

			restoreContainer.innerHTML = \`
				<div class="checkpoint-header">
					<span class="checkpoint-label">Checkpoint</span>
					<span class="checkpoint-sha">\${shortSha}</span>
				</div>
				<div class="checkpoint-info">
					<div class="checkpoint-message">\${data.message}</div>
					<div class="checkpoint-time">\${dateStr} at \${timeStr}</div>
				</div>
				<button class="checkpoint-restore-btn" onclick="restoreToCommit('\${data.sha}')">
					Restore
				</button>
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

		function undoRestore() {
			vscode.postMessage({
				type: 'undoRestore'
			});
		}

		function showUndoRestoreButton() {
			// Remove any existing undo button first
			hideUndoRestoreButton();

			const messagesDiv = document.getElementById('messages');
			const shouldScroll = shouldAutoScroll(messagesDiv);

			const undoContainer = document.createElement('div');
			undoContainer.className = 'checkpoint-undo-card';
			undoContainer.id = 'undo-restore-container';

			undoContainer.innerHTML = \`
				<div class="undo-message">Workspace restored. You can undo this action.</div>
				<button class="checkpoint-undo-btn" onclick="undoRestore()">
					Undo
				</button>
			\`;

			messagesDiv.appendChild(undoContainer);
			scrollToBottomIfNeeded(messagesDiv, shouldScroll);
		}

		function hideUndoRestoreButton() {
			const container = document.getElementById('undo-restore-container');
			if (container) {
				container.remove();
			}
		}

		function redoRestore() {
			vscode.postMessage({
				type: 'redoRestore'
			});
		}

		function showRedoRestoreButton() {
			// Remove any existing redo button first
			hideRedoRestoreButton();

			const messagesDiv = document.getElementById('messages');
			const shouldScroll = shouldAutoScroll(messagesDiv);

			const redoContainer = document.createElement('div');
			redoContainer.className = 'checkpoint-undo-card';
			redoContainer.id = 'redo-restore-container';

			redoContainer.innerHTML = \`
				<div class="undo-message">Restore undone. You can redo this action.</div>
				<button class="checkpoint-undo-btn" onclick="redoRestore()">
					Redo
				</button>
			\`;

			messagesDiv.appendChild(redoContainer);
			scrollToBottomIfNeeded(messagesDiv, shouldScroll);
		}

		function hideRedoRestoreButton() {
			const container = document.getElementById('redo-restore-container');
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
					sessionIdSpan.textContent = 'Copied!';
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

		updateStatus('Initializing...', 'disconnected');
		

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
				
				const codeBlockHtml = '<div class="code-block-container collapsed" onclick="toggleCodeBlock(this)"><div class="code-block-header"><span class="code-block-language">' + language + '</span><button class="code-copy-btn" onclick="event.stopPropagation(); copyCodeBlock(\\\'' + codeId + '\\\')" title="Copy code"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg></button></div><pre class="code-block"><code class="language-' + language + '" id="' + codeId + '" data-raw-code="' + escapedCode.replace(/"/g, '&quot;') + '">' + codeHtml + '</code></pre></div>';
				
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
				case 'md': return '';
				case 'py': return '🐍';
				case 'java': return '☕';
				case 'cpp': case 'c': case 'h': return '';
				case 'png': case 'jpg': case 'jpeg': case 'gif': case 'svg': return '';
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
				listDiv.innerHTML = '<p style="text-align: center; color: var(--vscode-descriptionForeground);">No conversations found</p>';
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

		// Permissions management functions
		function renderPermissions(permissions) {
			const permissionsList = document.getElementById('permissionsList');
			
			if (!permissions || !permissions.alwaysAllow || Object.keys(permissions.alwaysAllow).length === 0) {
				permissionsList.innerHTML = \`
					<div class="permissions-empty">
						No always-allow permissions set
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
								<span class="permission-desc">All</span>
							</div>
							<button class="permission-remove-btn" onclick="removePermission('\${toolName}', null)">Remove</button>
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
								<button class="permission-remove-btn" onclick="removePermission('\${toolName}', '\${escapeHtml(command)}')">Remove</button>
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

	</script>`

export default getScript;