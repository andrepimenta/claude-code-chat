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
		let lastPendingEditIndex = -1; // Track the last Edit/MultiEdit/Write toolUse without result
		let lastPendingEditData = null; // Store diff data for the pending edit { filePath, oldContent, newContent }

		// Permission queue system - fixed bar that never scrolls
		const permissionQueue = [];
		let currentPermission = null;

		// Open diff using stored data (no file read needed)
		function openDiffEditor() {
			if (lastPendingEditData) {
				vscode.postMessage({
					type: 'openDiff',
					filePath: lastPendingEditData.filePath,
					oldContent: lastPendingEditData.oldContent,
					newContent: lastPendingEditData.newContent
				});
			}
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
						labelDiv.textContent = 'You';
						break;
					case 'claude':
						iconDiv.textContent = '🤖';
						labelDiv.textContent = 'Claude';
						break;
					case 'error':
						iconDiv.textContent = '⚠️';
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
						<span>💡 This looks like a permission issue. You can enable Yolo Mode to skip all permission checks.</span>
					</div>
					<button class="yolo-suggestion-btn" onclick="enableYoloMode()">Enable Yolo Mode</button>
				\`;
				messageDiv.appendChild(yoloSuggestion);
			}
			
			messagesDiv.appendChild(messageDiv);
			moveProcessingIndicatorToLast();
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
				toolName = 'Update Todos';
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
					let todoHtml = 'Todo List Update:';
					for (const todo of data.rawInput.todos) {
						const status = todo.status === 'completed' ? '✅' :
							todo.status === 'in_progress' ? '🔄' : '⏳';
						todoHtml += '\\n' + status + ' ' + todo.content;
					}
					contentDiv.innerHTML = todoHtml;
				} else {
					// Format raw input with expandable content for long values
					// Use diff format for Edit, MultiEdit, and Write tools, regular format for others
					if (data.toolName === 'Edit' || data.toolName === 'MultiEdit' || data.toolName === 'Write') {
						// Only show Open Diff button if we have fileContentBefore (live session, not reload)
						const showButton = data.fileContentBefore !== undefined && data.messageIndex >= 0;

						// Hide any existing pending edit button before showing new one
						if (showButton && lastPendingEditIndex >= 0) {
							const prevContent = document.querySelector('[data-edit-message-index="' + lastPendingEditIndex + '"]');
							if (prevContent) {
								const btn = prevContent.querySelector('.diff-open-btn');
								if (btn) btn.style.display = 'none';
							}
							lastPendingEditData = null;
						}

						if (showButton) {
							lastPendingEditIndex = data.messageIndex;
							contentDiv.setAttribute('data-edit-message-index', data.messageIndex);

							// Compute and store diff data for when button is clicked
							const oldContent = data.fileContentBefore || '';
							let newContent = oldContent;
							if (data.toolName === 'Edit' && data.rawInput.old_string && data.rawInput.new_string) {
								newContent = oldContent.replace(data.rawInput.old_string, data.rawInput.new_string);
							} else if (data.toolName === 'MultiEdit' && data.rawInput.edits) {
								for (const edit of data.rawInput.edits) {
									if (edit.old_string && edit.new_string) {
										newContent = newContent.replace(edit.old_string, edit.new_string);
									}
								}
							} else if (data.toolName === 'Write' && data.rawInput.content) {
								newContent = data.rawInput.content;
							}
							lastPendingEditData = {
								filePath: data.rawInput.file_path,
								oldContent: oldContent,
								newContent: newContent
							};
						}

						if (data.toolName === 'Edit') {
							contentDiv.innerHTML = formatEditToolDiff(data.rawInput, data.fileContentBefore, showButton, data.startLine);
						} else if (data.toolName === 'MultiEdit') {
							contentDiv.innerHTML = formatMultiEditToolDiff(data.rawInput, data.fileContentBefore, showButton, data.startLines);
						} else {
							contentDiv.innerHTML = formatWriteToolDiff(data.rawInput, data.fileContentBefore, showButton);
						}
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
				labelDiv.textContent = 'INPUT';
				inputElement.appendChild(labelDiv);
				
				const contentDiv = document.createElement('div');
				contentDiv.className = 'tool-input-content';
				contentDiv.textContent = data.toolInput;
				inputElement.appendChild(contentDiv);
				messageDiv.appendChild(inputElement);
			}
			
			messagesDiv.appendChild(messageDiv);
			moveProcessingIndicatorToLast();
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

			// When result comes in for Edit/MultiEdit/Write, hide the Open Diff button on the request
			// since the edit has now been applied (no longer pending)
			if (lastPendingEditIndex >= 0) {
				// Find and hide the button on the corresponding toolUse
				const toolUseContent = document.querySelector('[data-edit-message-index="' + lastPendingEditIndex + '"]');
				if (toolUseContent) {
					const btn = toolUseContent.querySelector('.diff-open-btn');
					if (btn) {
						btn.style.display = 'none';
					}
				}
				lastPendingEditIndex = -1;
				lastPendingEditData = null;
			}

			// For Read and TodoWrite tools, just hide loading state (no result message needed)
			if ((data.toolName === 'Read' || data.toolName === 'TodoWrite') && !data.isError) {
				return;
			}

			// For Edit/MultiEdit/Write, show simple completion message (diff is already shown on request)
			if ((data.toolName === 'Edit' || data.toolName === 'MultiEdit' || data.toolName === 'Write') && !data.isError) {
				let completionText;
				if (data.toolName === 'Edit') {
					completionText = '✅ Edit completed';
				} else if (data.toolName === 'MultiEdit') {
					completionText = '✅ MultiEdit completed';
				} else {
					completionText = '✅ Write completed';
				}
				addMessage(completionText, 'system');
				scrollToBottomIfNeeded(messagesDiv, shouldScroll);
				return;
			}
			
			if(data.isError && data.content?.includes("File has not been read yet. Read it first before writing to it.")){
				return addMessage("File has not been read yet. Let me read it first before writing to it.", 'system');
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
			labelDiv.textContent = data.isError ? 'Error' : 'Result';
			
			headerDiv.appendChild(iconDiv);
			headerDiv.appendChild(labelDiv);
			messageDiv.appendChild(headerDiv);
			
			// Add content
			const contentDiv = document.createElement('div');
			contentDiv.className = 'message-content';

			// Check if it's a tool result and truncate appropriately
			let content = data.content;

			// Clean up error messages by removing XML-like tags
			if (data.isError && content) {
				content = content.replace(/<tool_use_error>/g, '').replace(/<\\/tool_use_error>/g, '').trim();
			}
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
				expandButton.textContent = 'Show more';
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
						<span>💡 This looks like a permission issue. You can enable Yolo Mode to skip all permission checks.</span>
					</div>
					<button class="yolo-suggestion-btn" onclick="enableYoloMode()">Enable Yolo Mode</button>
				\`;
				messageDiv.appendChild(yoloSuggestion);
			}
			
			messagesDiv.appendChild(messageDiv);
			moveProcessingIndicatorToLast();
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

		// Simple LCS-based diff algorithm
		function computeLineDiff(oldLines, newLines) {
			// Compute longest common subsequence
			const m = oldLines.length;
			const n = newLines.length;
			const lcs = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

			for (let i = 1; i <= m; i++) {
				for (let j = 1; j <= n; j++) {
					if (oldLines[i - 1] === newLines[j - 1]) {
						lcs[i][j] = lcs[i - 1][j - 1] + 1;
					} else {
						lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
					}
				}
			}

			// Backtrack to build diff
			const diff = [];
			let i = m, j = n;

			while (i > 0 || j > 0) {
				if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
					diff.unshift({type: 'context', oldLine: i - 1, newLine: j - 1, content: oldLines[i - 1]});
					i--;
					j--;
				} else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
					diff.unshift({type: 'added', newLine: j - 1, content: newLines[j - 1]});
					j--;
				} else if (i > 0) {
					diff.unshift({type: 'removed', oldLine: i - 1, content: oldLines[i - 1]});
					i--;
				}
			}

			return diff;
		}

		// Parse tool result to extract line numbers
		function parseToolResult(resultContent) {
			if (!resultContent || typeof resultContent !== 'string') {
				return {startLine: 1, lines: []};
			}

			const lines = resultContent.split('\\n');
			const parsed = [];
			let startLine = null;

			for (const line of lines) {
				const match = line.match(/^\\s*(\\d+)→(.*)$/);
				if (match) {
					const lineNum = parseInt(match[1]);
					const content = match[2];
					if (startLine === null) startLine = lineNum;
					parsed.push({num: lineNum, content});
				}
			}

			return {startLine: startLine || 1, lines: parsed};
		}

		// Generate unified diff HTML with line numbers
		// showButton controls whether to show the "Open Diff" button
		function generateUnifiedDiffHTML(oldString, newString, filePath, startLine = 1, showButton = false) {
			const oldLines = oldString.split('\\n');
			const newLines = newString.split('\\n');
			const diff = computeLineDiff(oldLines, newLines);

			// Generate unique ID for this diff (used for truncation)
			const diffId = 'diff_' + Math.random().toString(36).substr(2, 9);

			let html = '';
			const formattedPath = formatFilePath(filePath);

			// Header with file path
			html += '<div class="diff-file-header">';
			html += '<div class="diff-file-path" onclick="openFileInEditor(\\\'' + escapeHtml(filePath) + '\\\')">' + formattedPath + '</div>';
			html += '</div>\\n';

			// Calculate line range
			let firstLine = startLine;
			let lastLine = startLine;
			let addedCount = 0;
			let removedCount = 0;

			// Calculate actual line numbers
			for (const change of diff) {
				if (change.type === 'added') addedCount++;
				if (change.type === 'removed') removedCount++;
			}

			lastLine = startLine + newLines.length - 1;

			html += '<div class="diff-container">';
			html += '<div class="diff-header">Lines ' + firstLine + '-' + lastLine + '</div>';

			// Build diff lines with proper line numbers
			let oldLineNum = startLine;
			let newLineNum = startLine;
			const maxLines = 6;
			let lineIndex = 0;

			// First pass: build all line HTML
			const allLinesHtml = [];
			for (const change of diff) {
				let lineNum, prefix, cssClass;

				if (change.type === 'context') {
					lineNum = newLineNum;
					prefix = ' ';
					cssClass = 'context';
					oldLineNum++;
					newLineNum++;
				} else if (change.type === 'added') {
					lineNum = newLineNum;
					prefix = '+';
					cssClass = 'added';
					newLineNum++;
				} else {
					lineNum = oldLineNum;
					prefix = '-';
					cssClass = 'removed';
					oldLineNum++;
				}

				const lineNumStr = lineNum.toString().padStart(3);
				allLinesHtml.push('<div class="diff-line ' + cssClass + '">' + prefix + lineNumStr + '  ' + escapeHtml(change.content) + '</div>');
			}

			// Show visible lines
			const shouldTruncate = allLinesHtml.length > maxLines;
			const visibleLines = shouldTruncate ? allLinesHtml.slice(0, maxLines) : allLinesHtml;
			const hiddenLines = shouldTruncate ? allLinesHtml.slice(maxLines) : [];

			html += '<div id="' + diffId + '_visible">';
			html += visibleLines.join('');
			html += '</div>';

			// Show hidden lines (initially hidden)
			if (shouldTruncate) {
				html += '<div id="' + diffId + '_hidden" style="display: none;">';
				html += hiddenLines.join('');
				html += '</div>';

				// Add expand button
				html += '<div class="diff-expand-container">';
				html += '<button class="diff-expand-btn" onclick="toggleDiffExpansion(\\'' + diffId + '\\')">Show ' + hiddenLines.length + ' more lines</button>';
				html += '</div>';
			}

			html += '</div>';

			// Summary
			let summary = '';
			if (addedCount > 0 && removedCount > 0) {
				summary = '+' + addedCount + ' line' + (addedCount > 1 ? 's' : '') + ' added, -' + removedCount + ' line' + (removedCount > 1 ? 's' : '') + ' removed';
			} else if (addedCount > 0) {
				summary = '+' + addedCount + ' line' + (addedCount > 1 ? 's' : '') + ' added';
			} else if (removedCount > 0) {
				summary = '-' + removedCount + ' line' + (removedCount > 1 ? 's' : '') + ' removed';
			}

			if (summary) {
				html += '<div class="diff-summary-row">';
				html += '<span class="diff-summary">Summary: ' + summary + '</span>';
				if (showButton) {
					html += '<button class="diff-open-btn" onclick="openDiffEditor()" title="Open side-by-side diff in VS Code">';
					html += '<svg width="14" height="14" viewBox="0 0 16 16"><rect x="1" y="1" width="6" height="14" rx="1" fill="none" stroke="currentColor" stroke-opacity="0.5"/><rect x="9" y="1" width="6" height="14" rx="1" fill="none" stroke="currentColor" stroke-opacity="0.5"/><line x1="2.5" y1="4" x2="5.5" y2="4" stroke="#e8a0a0" stroke-width="1.5"/><line x1="2.5" y1="7" x2="5.5" y2="7" stroke="currentColor" stroke-opacity="0.4" stroke-width="1.5"/><line x1="2.5" y1="10" x2="5.5" y2="10" stroke="currentColor" stroke-opacity="0.4" stroke-width="1.5"/><line x1="10.5" y1="4" x2="13.5" y2="4" stroke="currentColor" stroke-opacity="0.4" stroke-width="1.5"/><line x1="10.5" y1="7" x2="13.5" y2="7" stroke="#8fd48f" stroke-width="1.5"/><line x1="10.5" y1="10" x2="13.5" y2="10" stroke="#8fd48f" stroke-width="1.5"/></svg>';
					html += 'Open Diff</button>';
				}
				html += '</div>';
			}

			return html;
		}

		function formatEditToolDiff(input, fileContentBefore, showButton = false, providedStartLine = null) {
			if (!input || typeof input !== 'object') {
				return formatToolInputUI(input);
			}

			// Check if this is an Edit tool (has file_path, old_string, new_string)
			if (!input.file_path || !input.old_string || !input.new_string) {
				return formatToolInputUI(input);
			}

			// Use provided startLine if available (from saved data), otherwise compute from fileContentBefore
			let startLine = providedStartLine || 1;
			if (!providedStartLine && fileContentBefore) {
				const position = fileContentBefore.indexOf(input.old_string);
				if (position !== -1) {
					// Count newlines before the match to get line number
					const textBefore = fileContentBefore.substring(0, position);
					startLine = (textBefore.match(/\\n/g) || []).length + 1;
				}
			}

			return generateUnifiedDiffHTML(input.old_string, input.new_string, input.file_path, startLine, showButton);
		}

		function formatMultiEditToolDiff(input, fileContentBefore, showButton = false, providedStartLines = null) {
			if (!input || typeof input !== 'object') {
				return formatToolInputUI(input);
			}

			// Check if this is a MultiEdit tool (has file_path and edits array)
			if (!input.file_path || !input.edits || !Array.isArray(input.edits)) {
				return formatToolInputUI(input);
			}

			// Show full diffs for each edit
			const formattedPath = formatFilePath(input.file_path);
			let html = '<div class="diff-file-header">';
			html += '<div class="diff-file-path" onclick="openFileInEditor(\\\'' + escapeHtml(input.file_path) + '\\\')">' + formattedPath + '</div>';
			html += '</div>\\n';

			input.edits.forEach((edit, index) => {
				if (edit.old_string && edit.new_string) {
					if (index > 0) {
						html += '<div class="diff-edit-separator"></div>';
					}

					// Use provided startLine if available, otherwise compute from fileContentBefore
					let startLine = (providedStartLines && providedStartLines[index]) || 1;
					if (!providedStartLines && fileContentBefore) {
						const position = fileContentBefore.indexOf(edit.old_string);
						if (position !== -1) {
							const textBefore = fileContentBefore.substring(0, position);
							startLine = (textBefore.match(/\\n/g) || []).length + 1;
						}
					}

					const oldLines = edit.old_string.split('\\n');
					const newLines = edit.new_string.split('\\n');
					const diff = computeLineDiff(oldLines, newLines);

					html += '<div class="diff-container">';
					html += '<div class="diff-header">Edit ' + (index + 1) + ' (Line ' + startLine + ')</div>';

					let lineNum = startLine;
					for (const change of diff) {
						let prefix, cssClass;
						if (change.type === 'context') {
							prefix = ' ';
							cssClass = 'context';
							lineNum++;
						} else if (change.type === 'added') {
							prefix = '+';
							cssClass = 'added';
							lineNum++;
						} else {
							prefix = '-';
							cssClass = 'removed';
						}
						const lineNumStr = (change.type === 'removed' ? '' : lineNum - 1).toString().padStart(3);
						html += '<div class="diff-line ' + cssClass + '">' + prefix + lineNumStr + '  ' + escapeHtml(change.content) + '</div>';
					}
					html += '</div>';
				}
			});

			// Add summary row with Open Diff button
			html += '<div class="diff-summary-row">';
			html += '<span class="diff-summary">Summary: ' + input.edits.length + ' edit' + (input.edits.length > 1 ? 's' : '') + '</span>';
			if (showButton) {
				html += '<button class="diff-open-btn" onclick="openDiffEditor()" title="Open side-by-side diff in VS Code">';
				html += '<svg width="14" height="14" viewBox="0 0 16 16"><rect x="1" y="1" width="6" height="14" rx="1" fill="none" stroke="currentColor" stroke-opacity="0.5"/><rect x="9" y="1" width="6" height="14" rx="1" fill="none" stroke="currentColor" stroke-opacity="0.5"/><line x1="2.5" y1="4" x2="5.5" y2="4" stroke="#e8a0a0" stroke-width="1.5"/><line x1="2.5" y1="7" x2="5.5" y2="7" stroke="currentColor" stroke-opacity="0.4" stroke-width="1.5"/><line x1="2.5" y1="10" x2="5.5" y2="10" stroke="currentColor" stroke-opacity="0.4" stroke-width="1.5"/><line x1="10.5" y1="4" x2="13.5" y2="4" stroke="currentColor" stroke-opacity="0.4" stroke-width="1.5"/><line x1="10.5" y1="7" x2="13.5" y2="7" stroke="#8fd48f" stroke-width="1.5"/><line x1="10.5" y1="10" x2="13.5" y2="10" stroke="#8fd48f" stroke-width="1.5"/></svg>';
				html += 'Open Diff</button>';
			}
			html += '</div>';

			return html;
		}

		function formatWriteToolDiff(input, fileContentBefore, showButton = false) {
			if (!input || typeof input !== 'object') {
				return formatToolInputUI(input);
			}

			// Check if this is a Write tool (has file_path and content)
			if (!input.file_path || !input.content) {
				return formatToolInputUI(input);
			}

			// fileContentBefore may be empty string if new file, or existing content if overwriting
			const fullFileBefore = fileContentBefore || '';

			// Show full content as added lines (new file or replacement)
			return generateUnifiedDiffHTML(fullFileBefore, input.content, input.file_path, 1, showButton);
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
			// Notify extension of plan mode state change
			vscode.postMessage({
				type: 'planModeChanged',
				enabled: planModeEnabled
			});
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
		let contextUsed = 0;
		let contextSize = 200000;
		let modelDisplayName = '';
		let usageLimits = null;
		let requestStartTime = null;
		let requestTimer = null;
		let subscriptionType = null;  // 'pro', 'max', or null for API users

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

		function updateStatusHtml(html, state = 'ready') {
			statusTextDiv.innerHTML = html;
			statusDiv.className = \`status \${state}\`;
		}

		function viewUsage(usageType) {
			vscode.postMessage({ type: 'viewUsage', usageType: usageType });
		}

		function formatTokenCount(num) {
			if (num >= 1000000) {
				return (num / 1000000).toFixed(1) + 'm';
			} else if (num >= 1000) {
				return Math.round(num / 1000) + 'k';
			}
			return String(num);
		}

		function usageColorClass(pct) {
			if (pct >= 90) return 'usage-red';
			if (pct >= 70) return 'usage-orange';
			if (pct >= 50) return 'usage-yellow';
			return 'usage-green';
		}

		function formatResetTime(isoString) {
			if (!isoString || isoString === 'null') return '';
			try {
				const d = new Date(isoString);
				if (isNaN(d.getTime())) return '';
				const now = new Date();
				const hours = d.getHours();
				const minutes = d.getMinutes();
				const ampm = hours >= 12 ? 'pm' : 'am';
				const h = hours % 12 || 12;
				const timeStr = minutes > 0 ? \`\${h}:\${String(minutes).padStart(2, '0')}\${ampm}\` : \`\${h}\${ampm}\`;

				// Same day: just time
				if (d.toDateString() === now.toDateString()) {
					return timeStr;
				}
				// Within 7 days: day name + time
				const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
				if (diffDays > 0 && diffDays <= 7) {
					const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
					return \`\${dayName} \${timeStr}\`;
				}
				// Further out: date + time
				const month = d.toLocaleDateString('en-US', { month: 'short' });
				return \`\${month} \${d.getDate()}, \${timeStr}\`;
			} catch {
				return '';
			}
		}

		function updateStatusWithTotals() {
			const pct = contextSize > 0 ? Math.round(contextUsed * 100 / contextSize) : 0;
			const ctxStr = \`\${formatTokenCount(contextUsed)}/\${formatTokenCount(contextSize)}\`;

			if (isProcessing) {
				let elapsedStr = '';
				if (requestStartTime) {
					const elapsedSeconds = Math.floor((Date.now() - requestStartTime) / 1000);
					elapsedStr = \`\${elapsedSeconds}s\`;
				}

				const parts = ['Processing'];
				if (elapsedStr) parts.push(elapsedStr);
				parts.push(\`\${ctxStr} (<span class="\${usageColorClass(pct)}">\${pct}%</span>)\`);
				updateStatusHtml(parts.join(' \\u2022 '), 'processing');
			} else {
				const usageIcon = \`<svg class="usage-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
					<rect x="1" y="8" width="3" height="6" rx="0.5" fill="currentColor" opacity="0.5"/>
					<rect x="5.5" y="5" width="3" height="9" rx="0.5" fill="currentColor" opacity="0.7"/>
					<rect x="10" y="2" width="3" height="12" rx="0.5" fill="currentColor"/>
				</svg>\`;
				let usageBadge;
				if (subscriptionType) {
					let planName = subscriptionType.replace(/^claude\\s*/i, '').trim();
					planName = planName.charAt(0).toUpperCase() + planName.slice(1);
					usageBadge = \`<a href="#" onclick="event.preventDefault(); viewUsage('plan');" class="usage-badge" title="View live usage">\${planName} Plan\${usageIcon}</a>\`;
				} else {
					const costStr = totalCost > 0 ? \`$\${totalCost.toFixed(4)}\` : '$0.00';
					usageBadge = \`<a href="#" onclick="event.preventDefault(); viewUsage('api');" class="usage-badge" title="View usage">\${costStr}\${usageIcon}</a>\`;
				}

				const parts = [];
				if (modelDisplayName) {
					parts.push(\`<span class="status-model">\${modelDisplayName}</span>\`);
				}
				parts.push(\`\${ctxStr} (<span class="\${usageColorClass(pct)}">\${pct}%</span>)\`);

				// Rate limits (subscription users only)
				if (usageLimits) {
					if (usageLimits.five_hour) {
						const p = Math.round(usageLimits.five_hour.utilization || 0);
						const reset = formatResetTime(usageLimits.five_hour.resets_at);
						parts.push(\`5h <span class="\${usageColorClass(p)}">\${p}%</span>\${reset ? \` <span class="reset-time">@\${reset}</span>\` : ''}\`);
					}
					if (usageLimits.seven_day) {
						const p = Math.round(usageLimits.seven_day.utilization || 0);
						const reset = formatResetTime(usageLimits.seven_day.resets_at);
						parts.push(\`7d <span class="\${usageColorClass(p)}">\${p}%</span>\${reset ? \` <span class="reset-time">@\${reset}</span>\` : ''}\`);
					}
					if (usageLimits.extra_usage && usageLimits.extra_usage.is_enabled) {
						const used = (usageLimits.extra_usage.used_credits || 0) / 100;
						const limit = (usageLimits.extra_usage.monthly_limit || 0) / 100;
						const ep = Math.round(usageLimits.extra_usage.utilization || 0);
						parts.push(\`extra <span class="\${usageColorClass(ep)}">$\${used.toFixed(2)}/$\${limit.toFixed(2)}</span>\`);
					}
				}

				parts.push(usageBadge);
				updateStatusHtml(parts.join(' \\u2022 '), 'ready');
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

		function showProcessingIndicator() {
			// Remove any existing indicator first
			hideProcessingIndicator();

			// Create the indicator and append after all messages
			const indicator = document.createElement('div');
			indicator.className = 'processing-indicator';
			indicator.innerHTML = '<div class="morph-dot"></div>';
			messagesDiv.appendChild(indicator);
		}

		function hideProcessingIndicator() {
			const indicator = document.querySelector('.processing-indicator');
			if (indicator) {
				indicator.remove();
			}
		}

		function moveProcessingIndicatorToLast() {
			// Only move if we're processing
			if (isProcessing) {
				showProcessingIndicator();
			}
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
				addMessage('✅ Yolo Mode enabled! All permission checks will be bypassed for future commands.', 'system');
				
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
		const modelVersions = {}; // alias -> display name, e.g. { opus: 'Opus 4.5' }

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

		// Install modal functions
		function showInstallModal() {
			const modal = document.getElementById('installModal');
			const main = document.getElementById('installMain');
			const progress = document.getElementById('installProgress');
			const success = document.getElementById('installSuccess');

			if (modal) modal.style.display = 'flex';
			if (main) main.style.display = 'flex';
			if (progress) progress.style.display = 'none';
			if (success) success.style.display = 'none';

			sendStats('Install modal shown');
		}

		function hideInstallModal() {
			document.getElementById('installModal').style.display = 'none';
		}

		function startInstallation() {
			sendStats('Install started');

			// Hide main content, show progress
			document.getElementById('installMain').style.display = 'none';
			document.getElementById('installProgress').style.display = 'flex';

			// Extension handles platform detection and command selection
			vscode.postMessage({
				type: 'runInstallCommand'
			});
		}

		function handleInstallComplete(success, error) {
			document.getElementById('installProgress').style.display = 'none';

			const successEl = document.getElementById('installSuccess');
			successEl.style.display = 'flex';

			if (success) {
				sendStats('Install success');
				successEl.querySelector('.install-success-text').textContent = 'Installed';
				successEl.querySelector('.install-success-hint').textContent = 'Send a message to get started';
			} else {
				sendStats('Install failed');
				// Show error state
				successEl.querySelector('.install-check').style.display = 'none';
				successEl.querySelector('.install-success-text').textContent = 'Installation failed';
				successEl.querySelector('.install-success-hint').textContent = error || 'Try installing manually from claude.ai/download';
			}
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

			// Send command to VS Code to execute
			vscode.postMessage({
				type: 'executeSlashCommand',
				command: command
			});

			// Show user feedback - /compact runs in chat, others in terminal
			if (command === 'compact') {
				// No message needed - compact runs in chat and shows its own status
			} else {
				addMessage('user', \`Executing /\${command} command in terminal. Check the terminal output and return when ready.\`, 'assistant');
			}
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

		// Store discovered project commands
		let projectCommandsData = [];
		let projectCommandsCollapsed = false;

		/**
		 * Toggle collapse state of project commands section
		 */
		function toggleProjectCommandsCollapse() {
			projectCommandsCollapsed = !projectCommandsCollapsed;
			const content = document.getElementById('projectCommandsContent');
			const arrow = document.getElementById('projectCommandsArrow');

			if (content && arrow) {
				content.style.display = projectCommandsCollapsed ? 'none' : 'block';
				arrow.textContent = projectCommandsCollapsed ? '▶' : '▼';
				arrow.style.transform = projectCommandsCollapsed ? 'rotate(0deg)' : 'rotate(0deg)';
			}
		}

		/**
		 * Load and render discovered project commands from .claude/commands/
		 * @param commands - Array of command objects
		 * @param duplicates - Array of command names that exist in both project and global
		 */
		function loadProjectCommands(commands, duplicates = []) {
			projectCommandsData = commands || [];
			const list = document.getElementById('projectCommandsList');
			const section = document.getElementById('projectCommandsSection');
			const countEl = document.getElementById('projectCommandsCount');
			const duplicateWarning = document.getElementById('duplicateCommandsWarning');

			if (!list || !section) return;

			// Clear existing items
			list.innerHTML = '';

			// Show/hide section based on whether there are commands
			section.style.display = commands.length > 0 ? 'block' : 'none';

			// Update command count
			if (countEl) {
				countEl.textContent = '(' + commands.length + ')';
			}

			// Show/hide duplicate warning
			if (duplicateWarning) {
				if (duplicates.length > 0) {
					duplicateWarning.style.display = 'block';
					duplicateWarning.innerHTML = \`⚠️ <strong>\${duplicates.length} duplicate(s)</strong> found: \${duplicates.map(d => '/' + d).join(', ')} <span class="duplicate-note">(project version used)</span>\`;
				} else {
					duplicateWarning.style.display = 'none';
				}
			}

			commands.forEach(cmd => {
				const el = document.createElement('div');
				el.className = 'slash-command-item prompt-snippet-item project-command-item';
				el.onclick = () => executeProjectCommand(cmd.name);
				// Show different icon based on source: 📂 for project, 👤 for user
				const icon = cmd.source === 'user' ? '👤' : '📂';
				el.innerHTML = \`
					<div class="slash-command-icon">\${icon}</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/\${cmd.name}</div>
						<div class="slash-command-description">\${cmd.description}</div>
					</div>
				\`;
				list.appendChild(el);
			});
		}

		/**
		 * Execute a discovered project command by sending it to Claude
		 */
		function executeProjectCommand(name) {
			hideSlashCommandsModal();

			// Set the command in the input and send it
			messageInput.value = '/' + name;
			sendMessage();
		}

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
					<div class="slash-command-icon">📝</div>
					<div class="slash-command-content">
						<div class="slash-command-title">/\${snippet.name}</div>
						<div class="slash-command-description">\${snippet.prompt}</div>
					</div>
					<div class="snippet-actions">
						<button class="snippet-delete-btn" onclick="event.stopPropagation(); deleteCustomSnippet('\${snippet.id}')" title="Delete snippet">🗑️</button>
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

		// Update model display with actual version from CLI response
		function updateModelDisplay(data) {
			const modelBtn = document.getElementById('selectedModel');
			const modelSelector = document.getElementById('modelSelector');
			if (modelBtn && data.displayName) {
				modelBtn.textContent = data.displayName;
			}
			// Show full model ID on hover
			if (modelSelector && data.modelId) {
				modelSelector.title = data.modelId;
			}
			// Store the version for the current model alias and update modal title
			if (data.displayName && currentModel && currentModel !== 'default') {
				modelVersions[currentModel] = data.displayName;
				const radioEl = document.getElementById('model-' + currentModel);
				const labelEl = radioEl && radioEl.nextElementSibling;
				const titleEl = labelEl && labelEl.querySelector('.model-title');
				if (titleEl) {
					const descriptions = {
						opus: 'Most capable model',
						sonnet: 'Balanced model'
					};
					titleEl.textContent = data.displayName + ' - ' + (descriptions[currentModel] || '');
				}
			}
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

				case 'versionInfo':
					const versionBadge = document.getElementById('versionBadge');
					if (versionBadge && message.data.extensionVersion) {
						versionBadge.textContent = 'v' + message.data.extensionVersion;
					}
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
						showProcessingIndicator();
					} else {
						stopRequestTimer();
						hideStopButton();
						enableButtons();
						hideProcessingIndicator();
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
					if (message.data.contextUsed !== undefined) contextUsed = message.data.contextUsed;
					if (message.data.contextSize !== undefined) contextSize = message.data.contextSize;

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
					if (message.data.contextUsed !== undefined) contextUsed = message.data.contextUsed;
					if (message.data.contextSize !== undefined) contextSize = message.data.contextSize;
					if (message.data.modelDisplayName) modelDisplayName = message.data.modelDisplayName;

					// Update status bar with new totals
					updateStatusWithTotals();

					// Show current request info if available (only for API users)
					if (!subscriptionType && (message.data.currentCost || message.data.currentDuration)) {
						const currentCostStr = message.data.currentCost ? \`$\${message.data.currentCost.toFixed(4)}\` : 'N/A';
						const currentDurationStr = message.data.currentDuration ? \`\${message.data.currentDuration}ms\` : 'N/A';
						addMessage(\`Request completed - Cost: \${currentCostStr}, Duration: \${currentDurationStr}\`, 'system');
					}
					break;

				case 'accountInfo':
					// Store subscription type to determine cost vs plan display
					subscriptionType = message.data.subscriptionType || null;
					console.log('Account info received:', subscriptionType);
					// Update status bar to reflect plan type
					updateStatusWithTotals();
					break;

				case 'usageLimits':
					usageLimits = message.data;
					updateStatusWithTotals();
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
					addMessage('🆕 Started new session', 'system');
					// Reset totals
					totalCost = 0;
					totalTokensInput = 0;
					totalTokensOutput = 0;
					requestCount = 0;
					contextUsed = 0;
					modelDisplayName = '';
					updateStatusWithTotals();
					// Clear permission queue
					permissionQueue.length = 0;
					currentPermission = null;
					hidePermissionBar();
					break;

				case 'compacting':
					if (message.data.isCompacting) {
						addMessage('📦 Compacting conversation...', 'system');
					}
					break;

				case 'compactBoundary':
					// Reset token counts since conversation was compacted
					totalTokensInput = 0;
					totalTokensOutput = 0;
					contextUsed = 0;
					updateStatusWithTotals();

					const preTokens = message.data.preTokens ? message.data.preTokens.toLocaleString() : 'unknown';
					addMessage('✅ Compacted (' + preTokens + ' tokens → summary)', 'system');
					break;

				case 'loginRequired':
					sendStats('Login required');
					addMessage('🔐 Login Required\\n\\nPlease login with your Claude plan (Pro/Max) or API key.\\nA terminal has been opened - follow the login process there.\\n\\nAfter logging in, come back to this chat to continue.', 'error');
					updateStatus('Login Required', 'error');
					break;

				case 'showInstallModal':
					sendStats('Claude not installed');
					showInstallModal();
					updateStatus('Claude Code not installed', 'error');
					break;

				case 'installComplete':
					handleInstallComplete(message.success, message.error);
					if (message.success) {
						updateStatus('Ready', 'success');
					}
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
				case 'modelInfo':
					// Update UI with actual model version from CLI response
					updateModelDisplay(message.data);
					if (message.data.displayName) {
						modelDisplayName = message.data.displayName;
						updateStatusWithTotals();
					}
					break;
				case 'terminalOpened':
					// Display notification about checking the terminal
					addMessage(message.data, 'system');
					break;
				case 'permissionRequest':
					addPermissionRequestMessage(message.data);
					break;
				case 'updatePermissionStatus':
					updatePermissionStatus(message.data.id, message.data.status);
					break;
				case 'planModeExited':
					// Sync plan mode state when Claude exits plan mode
					planModeEnabled = false;
					const planSwitch = document.getElementById('planModeSwitch');
					if (planSwitch) {
						planSwitch.classList.remove('active');
					}
					console.log('Plan mode exited - toggle synced to OFF');
					break;
				case 'askUserQuestion':
					addAskUserQuestionMessage(message.data);
					break;
				case 'updateQuestionStatus':
					updateQuestionStatus(message.data.id, message.data.status, message.data.answers);
					break;
				case 'testAskUserQuestion':
					window.testAskUserQuestion();
					break;
				case 'expirePendingPermissions':
					expireAllPendingPermissions();
					break;
				case 'mcpServers':
					displayMCPServers(message.data);
					break;
				case 'mcpServerSaved':
					loadMCPServers(); // Reload the servers list
					addMessage('✅ MCP server "' + message.data.name + '" saved successfully', 'system');
					break;
				case 'mcpServerDeleted':
					loadMCPServers(); // Reload the servers list
					addMessage('✅ MCP server "' + message.data.name + '" deleted successfully', 'system');
					break;
				case 'mcpServerError':
					addMessage('❌ Error with MCP server: ' + message.data.error, 'error');
					break;
			}
		});
		
		// Permission queue management functions
		function queuePermission(data) {
			permissionQueue.push(data);
			if (!currentPermission) {
				showNextPermission();
			} else {
				updateQueueCount();
			}
		}

		function showNextPermission() {
			if (permissionQueue.length === 0) {
				hidePermissionBar();
				currentPermission = null;
				return;
			}

			currentPermission = permissionQueue.shift();
			const bar = document.getElementById('permissionBar');
			if (!bar) return;

			// Only animate if bar was hidden
			const wasHidden = bar.style.display === 'none';
			bar.style.display = 'flex';
			if (wasHidden) {
				bar.style.animation = 'none';
				bar.offsetHeight; // Force reflow
				bar.style.animation = '';
			}

			bar.querySelector('.permission-bar-tool').textContent = currentPermission.tool || 'Unknown Tool';
			bar.querySelector('.permission-bar-desc').textContent = getPermissionBarDesc(currentPermission);

			updateQueueCount();
		}

		function getPermissionBarDesc(data) {
			if (data.tool === 'Bash' && data.pattern) {
				return data.pattern.replace(' *', '');
			}
			return 'Allow this tool call?';
		}

		function respondFromBar(allowed, alwaysAllow = false) {
			if (!currentPermission) return;
			respondToPermission(currentPermission.id, allowed, alwaysAllow);
			showNextPermission();
		}

		function allowAllPending() {
			// Allow current permission
			if (currentPermission) {
				respondToPermission(currentPermission.id, true, false);
			}
			// Allow all queued permissions
			while (permissionQueue.length > 0) {
				const perm = permissionQueue.shift();
				respondToPermission(perm.id, true, false);
			}
			// Clear state and hide bar
			currentPermission = null;
			hidePermissionBar();
		}

		function updateQueueCount() {
			const queueDiv = document.querySelector('.permission-bar-queue');
			if (!queueDiv) return;

			if (permissionQueue.length > 0) {
				queueDiv.style.display = 'inline';
				queueDiv.textContent = '+' + permissionQueue.length + ' more';
			} else {
				queueDiv.style.display = 'none';
			}
		}

		function hidePermissionBar() {
			const bar = document.getElementById('permissionBar');
			if (bar) {
				bar.style.display = 'none';
			}
		}

		function removeFromPermissionQueue(id) {
			const idx = permissionQueue.findIndex(p => p.id === id);
			if (idx !== -1) {
				permissionQueue.splice(idx, 1);
				updateQueueCount();
			}
			// If this was the current permission, move to next
			if (currentPermission && currentPermission.id === id) {
				showNextPermission();
			}
		}

		// Permission request functions
		function addPermissionRequestMessage(data) {
			const messagesDiv = document.getElementById('messages');
			const shouldScroll = shouldAutoScroll(messagesDiv);
			const toolName = data.tool || 'Unknown Tool';
			const status = data.status || 'pending';

			// For pending permissions: queue to fixed bar + add placeholder
			if (status === 'pending') {
				queuePermission(data);

				// Add minimal placeholder in chat for context
				const placeholder = document.createElement('div');
				placeholder.className = 'message permission-placeholder';
				placeholder.id = \`permission-\${data.id}\`;
				placeholder.dataset.status = 'pending';

				let desc = toolName;
				if (toolName === 'Bash' && data.pattern) {
					desc = toolName + ': ' + data.pattern.replace(' *', '');
				}
				placeholder.innerHTML = \`<span class="icon">!</span> Permission requested for \${desc}\`;
				messagesDiv.appendChild(placeholder);
				scrollToBottomIfNeeded(messagesDiv, shouldScroll);
				return;
			}

			// For resolved permissions (history restore): show full inline message
			const messageDiv = document.createElement('div');
			messageDiv.className = 'message permission-request';
			messageDiv.id = \`permission-\${data.id}\`;
			messageDiv.dataset.status = status;

			let contentHtml = '';
			if (status === 'approved') {
				contentHtml = \`
					<div class="permission-header">
						<span class="icon">~</span>
						<span>Permission Required</span>
					</div>
					<div class="permission-content">
						<p>Allow <strong>\${toolName}</strong> to execute the tool call above?</p>
						<div class="permission-decision allowed">Allowed</div>
					</div>
				\`;
				messageDiv.classList.add('permission-decided', 'allowed');
			} else if (status === 'denied') {
				contentHtml = \`
					<div class="permission-header">
						<span class="icon">~</span>
						<span>Permission Required</span>
					</div>
					<div class="permission-content">
						<p>Allow <strong>\${toolName}</strong> to execute the tool call above?</p>
						<div class="permission-decision denied">Denied</div>
					</div>
				\`;
				messageDiv.classList.add('permission-decided', 'denied');
			} else if (status === 'cancelled' || status === 'expired') {
				contentHtml = \`
					<div class="permission-header">
						<span class="icon">~</span>
						<span>Permission Required</span>
					</div>
					<div class="permission-content">
						<p>Allow <strong>\${toolName}</strong> to execute the tool call above?</p>
						<div class="permission-decision expired">Expired</div>
					</div>
				\`;
				messageDiv.classList.add('permission-decided', 'expired');
			}

			messageDiv.innerHTML = contentHtml;
			messagesDiv.appendChild(messageDiv);
			scrollToBottomIfNeeded(messagesDiv, shouldScroll);
		}

		function updatePermissionStatus(id, status) {
			// Update placeholder in chat
			const placeholder = document.getElementById(\`permission-\${id}\`);
			if (placeholder) {
				placeholder.dataset.status = status;
				placeholder.classList.add('resolved');

				if (status === 'approved') {
					placeholder.classList.add('approved');
					placeholder.innerHTML = '<span class="icon">+</span> Permission granted';
				} else if (status === 'denied') {
					placeholder.classList.add('denied');
					placeholder.innerHTML = '<span class="icon">x</span> Permission denied';
				} else if (status === 'cancelled' || status === 'expired') {
					placeholder.classList.add('expired');
					placeholder.innerHTML = '<span class="icon">-</span> Permission expired';
				}
			}

			// Remove from queue and update bar
			removeFromPermissionQueue(id);
		}

		// AskUserQuestion functions
		function addAskUserQuestionMessage(data) {
			const messagesDiv = document.getElementById('messages');
			const shouldScroll = shouldAutoScroll(messagesDiv);

			const messageDiv = document.createElement('div');
			messageDiv.className = 'message ask-user-question';
			messageDiv.id = \`question-\${data.id}\`;
			messageDiv.dataset.status = data.status || 'pending';

			let contentHtml = '';
			const status = data.status || 'pending';

			if (status === 'pending') {
				contentHtml = \`
					<div class="question-header">
						<span class="icon">❓</span>
						<span>Claude needs your input</span>
					</div>
					<div class="question-content">
						<form id="questionForm-\${data.id}" onsubmit="submitQuestionResponse('\${data.id}', event)">
				\`;

				// Render each question
				data.questions.forEach((q, qIndex) => {
					const inputType = q.multiSelect ? 'checkbox' : 'radio';
					const inputName = \`question-\${data.id}-\${qIndex}\`;

					contentHtml += \`
						<div class="question-block" data-question-index="\${qIndex}">
							<div class="question-label">\${escapeHtml(q.header)}</div>
							<div class="question-text">\${escapeHtml(q.question)}</div>
							<div class="question-options">
					\`;

					// Render options
					q.options.forEach((opt, optIndex) => {
						contentHtml += \`
							<label class="question-option">
								<input type="\${inputType}" name="\${inputName}" value="\${optIndex}" />
								<div class="option-content">
									<span class="option-label">\${escapeHtml(opt.label)}</span>
									<span class="option-description">\${escapeHtml(opt.description)}</span>
								</div>
							</label>
						\`;
					});

					// Add "Other" option
					contentHtml += \`
							<label class="question-option other-option">
								<input type="\${inputType}" name="\${inputName}" value="other"
									   onchange="toggleOtherInput('\${data.id}', \${qIndex}, this.checked || this.selected)" />
								<div class="option-content">
									<span class="option-label">Other</span>
									<span class="option-description">Provide custom response</span>
								</div>
							</label>
							<div class="other-input-wrapper" id="otherInput-\${data.id}-\${qIndex}" style="display: none;">
								<input type="text" class="other-text-input" placeholder="Enter your response..."
									   name="\${inputName}-other-text" />
							</div>
						</div>
					</div>
					\`;
				});

				contentHtml += \`
						<div class="question-buttons">
							<button type="submit" class="btn submit-question">Submit</button>
						</div>
					</form>
				</div>
				\`;
			} else if (status === 'answered') {
				contentHtml = buildAnsweredQuestionHtml(data);
			} else if (status === 'cancelled' || status === 'expired') {
				contentHtml = buildExpiredQuestionHtml();
			}

			messageDiv.innerHTML = contentHtml;
			messagesDiv.appendChild(messageDiv);
			scrollToBottomIfNeeded(messagesDiv, shouldScroll);
		}

		function toggleOtherInput(requestId, questionIndex, isChecked) {
			const wrapper = document.getElementById(\`otherInput-\${requestId}-\${questionIndex}\`);
			if (wrapper) {
				wrapper.style.display = isChecked ? 'block' : 'none';
				if (isChecked) {
					const input = wrapper.querySelector('input');
					if (input) input.focus();
				}
			}
		}

		function submitQuestionResponse(requestId, event) {
			event.preventDefault();

			const form = document.getElementById(\`questionForm-\${requestId}\`);
			const messageDiv = document.getElementById(\`question-\${requestId}\`);
			const questionBlocks = messageDiv.querySelectorAll('.question-block');

			const answers = {};

			questionBlocks.forEach((questionBlock) => {
				const qIndex = questionBlock.dataset.questionIndex;
				const inputName = \`question-\${requestId}-\${qIndex}\`;
				const inputs = form.querySelectorAll(\`input[name="\${inputName}"]:checked\`);

				const selectedValues = [];
				inputs.forEach(input => {
					if (input.value === 'other') {
						const otherText = form.querySelector(\`input[name="\${inputName}-other-text"]\`);
						selectedValues.push(otherText ? otherText.value || 'Other' : 'Other');
					} else {
						// Get the label text for the selected option
						const optionLabel = input.closest('.question-option').querySelector('.option-label');
						selectedValues.push(optionLabel ? optionLabel.textContent : input.value);
					}
				});

				// For single-select, return string; for multi-select, return array
				const isMultiSelect = inputs.length > 0 && inputs[0].type === 'checkbox';
				answers[qIndex] = isMultiSelect ? selectedValues : (selectedValues[0] || '');
			});

			// Send to extension
			vscode.postMessage({
				type: 'questionResponse',
				id: requestId,
				answers: answers
			});

			// Update UI immediately to show answered state
			updateQuestionStatusLocal(requestId, 'answered', answers);
		}

		function updateQuestionStatusLocal(id, status, answers) {
			const questionMsg = document.getElementById(\`question-\${id}\`);
			if (!questionMsg) return;

			questionMsg.dataset.status = status;

			if (status === 'answered') {
				questionMsg.classList.add('question-answered');
				// Rebuild content to show answers
				const form = questionMsg.querySelector('form');
				if (form) {
					const buttons = form.querySelector('.question-buttons');
					if (buttons) buttons.style.display = 'none';

					// Disable all inputs
					form.querySelectorAll('input').forEach(input => {
						input.disabled = true;
					});

					// Add answered badge
					const questionContent = questionMsg.querySelector('.question-content');
					const decisionDiv = document.createElement('div');
					decisionDiv.className = 'question-decision answered';
					decisionDiv.innerHTML = '✅ Response submitted';
					questionContent.appendChild(decisionDiv);
				}
			}
		}

		function updateQuestionStatus(id, status, answers) {
			const questionMsg = document.getElementById(\`question-\${id}\`);
			if (!questionMsg) return;

			questionMsg.dataset.status = status;

			if (status === 'answered') {
				updateQuestionStatusLocal(id, status, answers);
			} else if (status === 'cancelled' || status === 'expired') {
				questionMsg.classList.add('question-expired');
				const form = questionMsg.querySelector('form');
				if (form) {
					form.innerHTML = '<div class="question-decision expired">⏱️ This question expired</div>';
				}
			}
		}

		function buildAnsweredQuestionHtml(data) {
			let html = \`
				<div class="question-header">
					<span class="icon">❓</span>
					<span>Claude needs your input</span>
				</div>
				<div class="question-content answered">
			\`;

			if (data.questions) {
				data.questions.forEach((q, qIndex) => {
					const answer = data.answers ? data.answers[qIndex] : '';
					const answerText = Array.isArray(answer) ? answer.join(', ') : answer;
					html += \`
						<div class="question-block answered">
							<div class="question-label">\${escapeHtml(q.header)}</div>
							<div class="question-text">\${escapeHtml(q.question)}</div>
							<div class="question-answer">Your answer: <strong>\${escapeHtml(answerText)}</strong></div>
						</div>
					\`;
				});
			}

			html += \`
					<div class="question-decision answered">✅ Response submitted</div>
				</div>
			\`;
			return html;
		}

		function buildExpiredQuestionHtml() {
			return \`
				<div class="question-header">
					<span class="icon">❓</span>
					<span>Claude needs your input</span>
				</div>
				<div class="question-content">
					<div class="question-decision expired">⏱️ This question expired</div>
				</div>
			\`;
		}

		// Debug function to test AskUserQuestion UI (call from console: testAskUserQuestion())
		window.testAskUserQuestion = function() {
			const testData = {
				id: 'test-' + Date.now(),
				status: 'pending',
				questions: [
					{
						header: 'Auth method',
						question: 'Which authentication method should we use for this application?',
						multiSelect: false,
						options: [
							{ label: 'OAuth 2.0', description: 'Industry standard, supports SSO and social login' },
							{ label: 'JWT tokens', description: 'Stateless authentication, good for APIs' },
							{ label: 'Session cookies', description: 'Traditional approach, simpler to implement' }
						]
					},
					{
						header: 'Features',
						question: 'Which additional features do you want to enable?',
						multiSelect: true,
						options: [
							{ label: 'Remember me', description: 'Keep users logged in across sessions' },
							{ label: '2FA', description: 'Two-factor authentication for extra security' },
							{ label: 'Password reset', description: 'Email-based password recovery' }
						]
					}
				]
			};
			addAskUserQuestionMessage(testData);
			console.log('Test AskUserQuestion added with id:', testData.id);
		};

		function expireAllPendingPermissions() {
			document.querySelectorAll('.permission-request').forEach(permissionMsg => {
				if (permissionMsg.dataset.status === 'pending') {
					const id = permissionMsg.id.replace('permission-', '');
					updatePermissionStatus(id, 'expired');
				}
			});
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
			addMessage('⚡ YOLO Mode enabled! All future permissions will be automatically allowed.', 'system');
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
				listDiv.innerHTML = '<p style="text-align: center; color: var(--vscode-descriptionForeground);">No conversations found</p>';
				return;
			}

			conversations.forEach(conv => {
				const item = document.createElement('div');
				item.className = 'conversation-item';
				item.onclick = () => loadConversation(conv.filename);

				const date = new Date(conv.startTime).toLocaleDateString();
				const time = new Date(conv.startTime).toLocaleTimeString();

				// Show plan type or cost based on subscription
				let usageStr;
				if (subscriptionType) {
					let planName = subscriptionType.replace(/^claude\\s*/i, '').trim();
					planName = planName.charAt(0).toUpperCase() + planName.slice(1);
					usageStr = planName;
				} else {
					usageStr = \`$\${conv.totalCost.toFixed(3)}\`;
				}

				item.innerHTML = \`
					<div class="conversation-title">\${conv.firstUserMessage.substring(0, 60)}\${conv.firstUserMessage.length > 60 ? '...' : ''}</div>
					<div class="conversation-meta">\${date} at \${time} • \${conv.messageCount} messages • \${usageStr}</div>
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

		function syncClaudeFolder() {
			const statusEl = document.getElementById('syncStatus');
			if (statusEl) {
				statusEl.style.display = 'block';
				statusEl.className = 'sync-status';
				statusEl.textContent = '🔄 Syncing...';
			}

			vscode.postMessage({ type: 'syncClaudeFolder' });
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

		// Request discovered project commands from .claude/commands/
		vscode.postMessage({
			type: 'getProjectCommands'
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
			} else if (message.type === 'projectCommandsData') {
				// Load discovered project commands from .claude/commands/
				loadProjectCommands(message.data || [], message.duplicates || []);
			} else if (message.type === 'syncComplete') {
				// Show sync result in settings
				const statusEl = document.getElementById('syncStatus');
				if (statusEl) {
					statusEl.style.display = 'block';
					statusEl.className = 'sync-status success';
					statusEl.textContent = '✅ ' + message.data.message;
					// Hide after 3 seconds
					setTimeout(() => {
						statusEl.style.display = 'none';
					}, 3000);
				}
			} else if (message.type === 'syncError') {
				// Show sync error in settings
				const statusEl = document.getElementById('syncStatus');
				if (statusEl) {
					statusEl.style.display = 'block';
					statusEl.className = 'sync-status error';
					statusEl.textContent = '❌ ' + message.data.message;
				}
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