import getSkillsScript from './skills-script';
import getPluginsScript from './plugins-script';

const getScript = (isTelemetryEnabled: boolean, opencreditsApiUrl: string = 'https://ccc.api.opencredits.ai', opencreditsWebUrl: string = 'https://ccc.opencredits.ai', opencreditsPublishableKey: string = 'oc_pk_c43da4f9a9484ae484ad29bc97cc354f') => `<script>
		var OPENCREDITS_API_URL = '${opencreditsApiUrl}';
		var OPENCREDITS_WEB_URL = '${opencreditsWebUrl}';

		// ─── OpenCredits SDK (inlined) ───
		!function(){var e="https://opencredits.ai",t="",o="",n={},a=null,r=null,i=null,d=null,c=!1,s=null;function l(){var e=document.getElementById("oc-overlay");e&&(e.remove(),document.body.style.overflow=""),r=null,i=null}function u(e){if(e){a=e;try{localStorage.setItem(d,e)}catch(e){}}}function p(e,t){n[e]&&n[e](function(e){if(!e||"object"!=typeof e)return e;var t={};for(var o in e)"source"!==o&&"event"!==o&&(t[o]=e[o]);return t}(t))}function m(e){if(e.data&&"opencredits"===e.data.source&&r&&e.source===r.contentWindow&&e.origin===o){var t=e.data.event;if("ready"===t){var l={source:"opencredits_init",publishable_key:d,currency:n.currency||"usd",checkout_mode:n.checkoutMode||"embedded"};i&&i.amount&&(l.amount=i.amount),i&&i.model&&(l.model=i.model),n.inputTokens&&(l.input_tokens=n.inputTokens),n.outputTokens&&(l.output_tokens=n.outputTokens),a&&(l.user_key=a),r.contentWindow.postMessage(l,o)}else if("checkout_opened"===t)u(e.data.user_key),e.data.checkout_url&&"new_tab"===n.checkoutMode&&window.open(e.data.checkout_url,"_blank"),p("onCheckoutOpened",e.data);else if("purchase_completed"===t)u(e.data.user_key),c=!0,s={user_key:a,balance:e.data.balance,credits_added:e.data.credits_added},p("onPurchaseCompleted",e.data),e.data.can_close&&p("onComplete",s);else if("purchase_error"===t)p("onPurchaseError",e.data),p("onError",e.data);else if("login_completed"===t)u(e.data.user_key),p("onLoginCompleted",e.data);else if("logged_out"===t){a=null;try{localStorage.removeItem(d)}catch(e){}p("onLoggedOut",e.data)}else"copy_url"===t?p("onCopyUrl",e.data):"open_url"===t?p("onOpenUrl",e.data):"account_details_shown"===t?p("onAccountDetailsShown",e.data):"account_details_dismissed"===t&&(p("onAccountDetailsDismissed",e.data),c&&p("onComplete",s))}}window.OpenCredits={init:function(r){if(!(d=(n=r||{}).publishableKey))throw new Error("OpenCredits: publishableKey is required");e=n.baseUrl||window.OPENCREDITS_ORIGIN||"https://opencredits.ai",t=e+"/embed/checkout.html",o=new URL(t).origin,a=localStorage.getItem(d)||n.userKey||null,window.addEventListener("message",m)},open:function(e){if(e=e||{},!d)throw new Error("OpenCredits: call init() first");c=!1,s=null;var o=document.createElement("div");o.id="oc-overlay",o.style.cssText="position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;animation:ocFadeIn .2s ease";var n=document.createElement("div");n.style.cssText="background:#fff;border-radius:16px;width:480px;max-width:95vw;height:680px;max-height:90vh;overflow:hidden;position:relative;box-shadow:0 24px 48px rgba(0,0,0,0.2);animation:ocSlideUp .25s ease";var a=document.createElement("button");if(a.innerHTML="&times;",a.style.cssText="position:absolute;top:12px;right:12px;z-index:10;width:32px;height:32px;border-radius:50%;border:none;background:rgba(0,0,0,0.06);cursor:pointer;font-size:18px;color:#666;display:flex;align-items:center;justify-content:center",a.onmouseover=function(){a.style.background="rgba(0,0,0,0.12)",a.style.color="#000"},a.onmouseout=function(){a.style.background="rgba(0,0,0,0.06)",a.style.color="#666"},a.onclick=function(){l()},(r=document.createElement("iframe")).style.cssText="width:100%;height:100%;border:none",r.src=t,n.appendChild(a),n.appendChild(r),o.appendChild(n),o.onclick=function(e){e.target===o&&l()},document.body.appendChild(o),document.body.style.overflow="hidden",i=e,!document.getElementById("oc-keyframes")){var u=document.createElement("style");u.id="oc-keyframes",u.textContent="@keyframes ocFadeIn{from{opacity:0}to{opacity:1}}@keyframes ocSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}",document.head.appendChild(u)}},close:l,getUserKey:function(){return a}}}();

		// ─── Initialize OpenCredits SDK ───
		OpenCredits.init({
			publishableKey: '${opencreditsPublishableKey}',
			baseUrl: OPENCREDITS_WEB_URL,
			checkoutMode: 'manual',
			currency: 'usd',
			inputTokens: 25000,
			outputTokens: 25000,
			onCheckoutOpened: function(data) {
				// Save user key early so it persists even if VS Code closes during payment
				if (data.user_key) {
					vscode.postMessage({
						type: 'saveOpenCreditsKeyEarly',
						key: data.user_key
					});
				}
				if (data.checkout_url) {
					vscode.postMessage({
						type: 'openExternalUrl',
						url: data.checkout_url
					});
				}
			},
			onPurchaseCompleted: function(data) {
				sendStats('Checkout completed');
				vscode.postMessage({
					type: 'opencreditsKeyFromCheckout',
					key: data.user_key
				});
			},
			onLoginCompleted: function(data) {
				vscode.postMessage({
					type: 'opencreditsKeyFromCheckout',
					key: data.user_key
				});
			},
			onCopyUrl: function(data) {
				if (data.url) {
					vscode.postMessage({ type: 'copyToClipboard', text: data.url });
				}
			},
			onOpenUrl: function(data) {
				if (data.url) {
					vscode.postMessage({ type: 'openExternalUrl', url: data.url });
				}
			},
			onPurchaseError: function(data) {
				console.error('OpenCredits purchase error:', data);
			},
			onComplete: function() {
				OpenCredits.close();
			}
		});

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
		let isWindows = false;
		let lastPendingEditIndex = -1; // Track the last Edit/MultiEdit/Write toolUse without result
		let lastPendingEditData = null; // Store diff data for the pending edit { filePath, oldContent, newContent }
		let attachedImages = []; // Array of { filePath, previewUri }

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
			iconDiv.textContent = data.toolName === 'ExitPlanMode' ? '📋' : '🔧';

			const toolInfoElement = document.createElement('div');
			toolInfoElement.className = 'tool-info';
			let toolName = data.toolInfo.replace('🔧 Executing: ', '');
			if (toolName === 'TodoWrite') {
				toolName = 'Update Todos';
			} else if (toolName === 'ExitPlanMode') {
				toolName = 'Plan';
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
					} else if (data.toolName === 'ExitPlanMode' && data.rawInput) {
						contentDiv.innerHTML = formatPlanOutput(data.rawInput);
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

		function formatPlanOutput(input) {
			var html = '';

			// Render plan markdown
			if (input.plan) {
				html += '<div class="plan-content">' + parseSimpleMarkdown(input.plan) + '</div>';
			}

			// Render allowed prompts as action buttons
			if (input.allowedPrompts && input.allowedPrompts.length > 0) {
				html += '<div class="plan-actions">';
				html += '<div class="plan-actions-label">Suggested actions:</div>';
				input.allowedPrompts.forEach(function(p) {
					var label = p.prompt || (p.tool + ' command');
					var escapedPrompt = escapeHtml(label).replace(/'/g, '&#39;');
					html += '<button class="plan-action-btn" onclick="sendPlanAction(&#39;' + escapedPrompt + '&#39;)" title="' + escapeHtml(p.tool) + '">' + escapeHtml(label) + '</button>';
				});
				html += '</div>';
			}

			return html;
		}

		function sendPlanAction(prompt) {
			messageInput.value = prompt;
			sendMessage();
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
			if (text || attachedImages.length > 0) {
				const msg = {
					type: 'sendMessage',
					text: text,
					planMode: planModeEnabled,
					thinkingMode: thinkingModeEnabled
				};
				if (attachedImages.length > 0) {
					msg.images = attachedImages.map(img => img.filePath);
				}
				vscode.postMessage(msg);

				messageInput.value = '';
				attachedImages = [];
				renderImagePreviews();
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
			sendStats('Thinking mode toggled', { enabled: thinkingModeEnabled });

			var switchElement = document.getElementById('thinkingModeSwitch');
			var toggleLabel = document.getElementById('thinkingModeLabel');
			var thinkBtn = document.getElementById('thinkToggleBtn');
			if (thinkingModeEnabled) {
				if (switchElement) switchElement.classList.add('active');
				if (thinkBtn) thinkBtn.classList.add('active');
				if (toggleLabel) toggleLabel.textContent = 'Ultrathink Mode';
				// Set ultrathink intensity directly
				vscode.postMessage({
					type: 'updateSettings',
					settings: { 'thinking.intensity': 'ultrathink' }
				});
				vscode.postMessage({
					type: 'showInfoMessage',
					message: 'Ultrathink enabled \u2014 deep reasoning for complex tasks.'
				});
			} else {
				if (switchElement) switchElement.classList.remove('active');
				if (thinkBtn) thinkBtn.classList.remove('active');
				if (toggleLabel) toggleLabel.textContent = 'Thinking Mode';
			}
		}

		function toggleConnectMenu() {
			var menu = document.getElementById('connectMenu');
			if (!menu) return;
			menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
		}

		function hideConnectMenu() {
			var menu = document.getElementById('connectMenu');
			if (menu) menu.style.display = 'none';
		}

		// Close connect menu when clicking outside
		document.addEventListener('click', function(e) {
			if (!e.target.closest('.connect-dropdown-wrapper')) {
				hideConnectMenu();
			}
		});

		function cyclePlanMode() {
			planModeEnabled = !planModeEnabled;
			sendStats('Plan mode toggled', { enabled: planModeEnabled });
			var switchElement = document.getElementById('planModeSwitch');
			var toggleBtn = document.getElementById('planToggleBtn');
			if (planModeEnabled) {
				if (switchElement) switchElement.classList.add('active');
				if (toggleBtn) toggleBtn.classList.add('active');
				vscode.postMessage({
					type: 'showInfoMessage',
					message: 'Plan mode enabled \u2014 Claude will plan before making changes.'
				});
			} else {
				if (switchElement) switchElement.classList.remove('active');
				if (toggleBtn) toggleBtn.classList.remove('active');
			}
		}


		let totalCost = 0;
		let totalTokensInput = 0;
		let totalTokensOutput = 0;
		let requestCount = 0;
		let isProcessing = false;
		let requestStartTime = null;
		let requestTimer = null;
		let subscriptionType = null;  // 'pro', 'max', or null for API users

		// Send usage statistics
		function sendStats(eventName, properties) {
			${isTelemetryEnabled ?
			`try {
				if (typeof umami !== 'undefined' && umami.track) {
					umami.track(eventName, properties);
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

		function updateStatusWithTotals() {
			if (isProcessing) {
				// While processing, show elapsed time (and tokens for non-OpenCredits users)
				let elapsedStr = '';
				if (requestStartTime) {
					const elapsedSeconds = Math.floor((Date.now() - requestStartTime) / 1000);
					elapsedStr = \`\${elapsedSeconds}s\`;
				}

				let statusText;
				if (hasOpenCreditsKey) {
					// OpenCredits users: don't show tokens, just elapsed time
					statusText = \`Processing\${elapsedStr ? \` • \${elapsedStr}\` : ''}\`;
				} else {
					// Regular users: show tokens and elapsed time
					const totalTokens = totalTokensInput + totalTokensOutput;
					const tokensStr = totalTokens > 0 ?
						\`\${totalTokens.toLocaleString()} tokens\` : '0 tokens';
					statusText = \`Processing • \${tokensStr}\${elapsedStr ? \` • \${elapsedStr}\` : ''}\`;
				}
				updateStatus(statusText, 'processing');
			} else {
				// When ready, show full info
				let usageStr;
				const usageIcon = \`<svg class="usage-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
					<rect x="1" y="8" width="3" height="6" rx="0.5" fill="currentColor" opacity="0.5"/>
					<rect x="5.5" y="5" width="3" height="9" rx="0.5" fill="currentColor" opacity="0.7"/>
					<rect x="10" y="2" width="3" height="12" rx="0.5" fill="currentColor"/>
				</svg>\`;

				if (hasOpenCreditsKey && openCreditsBalance !== null) {
					// OpenCredits user with OpenCredits model selected: show balance
					const balanceStr = \`Balance: \${openCreditsBalance.toFixed(1)} credits\`;
					usageStr = \`<a href="#" onclick="event.preventDefault(); OpenCredits.open();" class="usage-badge opencredits-balance" title="Open OpenCredits Account">\${balanceStr}</a>\`;
				} else if (subscriptionType) {
					// Plan subscriber: show plan type
					let planName = subscriptionType.replace(/^claude\\s*/i, '').trim();
					planName = planName.charAt(0).toUpperCase() + planName.slice(1);
					usageStr = \`<a href="#" onclick="event.preventDefault(); viewUsage('plan');" class="usage-badge" title="View live usage">\${planName} Plan\${usageIcon}</a>\`;
				} else {
					// API user: show cost
					const costStr = totalCost > 0 ? \`$\${totalCost.toFixed(4)}\` : '$0.00';
					usageStr = \`<a href="#" onclick="event.preventDefault(); viewUsage('api');" class="usage-badge" title="View usage">\${costStr}\${usageIcon}</a>\`;
				}

				let statusText;
				if (hasOpenCreditsKey) {
					// OpenCredits users with OpenCredits model: just show ready and balance (no tokens)
					const requestStr = requestCount > 0 ? \`\${requestCount} requests\` : '';
					statusText = \`Ready\${requestStr ? \` • \${requestStr}\` : ''} • \${usageStr}\`;
				} else {
					// Regular users: show tokens, requests, and usage
					const totalTokens = totalTokensInput + totalTokensOutput;
					const tokensStr = totalTokens > 0 ?
						\`\${totalTokens.toLocaleString()} tokens\` : '0 tokens';
					const requestStr = requestCount > 0 ? \`\${requestCount} requests\` : '';
					statusText = \`Ready • \${tokensStr}\${requestStr ? \` • \${requestStr}\` : ''} • \${usageStr}\`;
				}
				updateStatusHtml(statusText, 'ready');
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
							hasImage = true;
							const blob = item.getAsFile();
							if (blob) {
								// Convert blob to base64
								const reader = new FileReader();
								reader.onload = function(event) {
									const base64Data = event.target.result;
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
						console.error('Clipboard API failed:', err);
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
			sendStats('MCP modal opened');
			document.getElementById('mcpModal').style.display = 'flex';
			loadMCPServers();
			if (!marketplaceCache || marketplaceCache.length === 0) {
				loadMarketplace();
			}
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
			document.getElementById('mcpServersList').style.display = 'none';
			document.getElementById('popularServers').style.display = 'none';
			document.getElementById('addServerForm').style.display = 'block';
		}

		function hideAddServerForm() {
			document.getElementById('mcpServersList').style.display = '';
			document.getElementById('popularServers').style.display = 'block';
			document.getElementById('addServerForm').style.display = 'none';
			loadMCPServers();
			
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

			var scope = document.getElementById('serverScope') ? document.getElementById('serverScope').value : 'project';
			sendStats('MCP server added', { name: name });
			vscode.postMessage({
				type: 'saveMCPServer',
				name: name,
				config: serverConfig,
				scope: scope
			});

			hideAddServerForm();
		}

		function authenticateMCPs() {
			vscode.postMessage({ type: 'runTerminalCommand', command: 'claude /mcp' });
		}

		function deleteMCPServer(serverName, scope) {
			sendStats('MCP server removed', { name: serverName });
			vscode.postMessage({
				type: 'deleteMCPServer',
				name: serverName,
				scope: scope || 'project'
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

		function addPopularServer(name, config, scope) {
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
			
			sendStats('MCP server added', { name: name });

			// Add the server
			vscode.postMessage({
				type: 'saveMCPServer',
				name: name,
				config: config,
				scope: scope || 'project'
			});
		}

		// MCP Marketplace
		var marketplaceCache = null;
		var marketplaceDisplayed = null;
		var marketplaceCursor = null;
		var marketplaceSearchTimeout = null;
		var pendingRegistryResponses = 0;
		var accumulatedRegistryResults = [];

		// Top MCP servers (static) + MCP Registry search
		var topMcpServers = (window.__topMcpServers || []);

		function loadMarketplace() {
			marketplaceCache = topMcpServers;
			renderMarketplace(marketplaceCache);
			// Also fetch fresh data from curated registry
			vscode.postMessage({ type: 'marketplaceFetch', url: 'https://mcp.agent-tooling.dev/api/v1/servers?version=latest&limit=50', isSearch: false });
		}

		function loadMoreMarketplace() {}

		function filterMarketplace(query) {
			clearTimeout(marketplaceSearchTimeout);
			marketplaceSearchTimeout = setTimeout(function() {
				if (!query) {
					lastSearchQuery = '';
					pendingRegistryResponses = 0;
					accumulatedRegistryResults = [];
					marketplaceCache = topMcpServers;
					renderMarketplace(marketplaceCache);
					return;
				}
				// Show loading, then accumulate from both registries
				lastSearchQuery = query;
				accumulatedRegistryResults = [];
				pendingRegistryResponses = 2;
				renderMarketplace([], true);
				vscode.postMessage({ type: 'marketplaceFetch', url: 'https://mcp.agent-tooling.dev/api/v1/servers?version=latest&limit=50&search=' + encodeURIComponent(query), isSearch: true });
				vscode.postMessage({ type: 'marketplaceFetch', url: 'https://registry.modelcontextprotocol.io/v0.1/servers?version=latest&limit=50&search=' + encodeURIComponent(query), isSearch: true });
			}, 300);
		}

		// Trusted namespace prefixes for ranking (official/vendor servers)
		var TRUSTED_PREFIXES = ['com.supabase/', 'io.github.github/', 'com.stripe/', 'com.vercel/', 'io.github.vercel/', 'com.notion/', 'app.linear/', 'com.atlassian/', 'com.cloudflare.', 'io.github.getsentry/', 'io.github.mongodb-js/', 'io.github.railwayapp/', 'com.postman/', 'com.slack/', 'com.neon/', 'com.figma/', 'dev.firecrawl/', 'com.netlify/', 'com.resend/', 'ai.exa/', 'com.airtable/', 'com.apify/', 'com.mux/', 'com.render/'];
		var SMITHERY_PREFIX = 'ai.smithery/';

		function rankRegistryResult(query, entry) {
			var q = (query || '').trim().toLowerCase();
			var name = (entry.id || '').toLowerCase();
			var title = (entry.name || '').toLowerCase();
			var desc = (entry.description || '').toLowerCase();
			var haystack = name + ' ' + title + ' ' + desc;
			var score = 0;

			if (q) {
				if (name === q) score += 800;
				if (name.indexOf(q) >= 0) score += 350;
				if (title.indexOf(q) >= 0) score += 250;
				if (desc.indexOf(q) >= 0) score += 120;

				var tokens = q.split(/[^a-z0-9]+/).filter(function(t) { return t.length > 0; });
				var haystackTokens = haystack.split(/[^a-z0-9]+/).filter(function(t) { return t.length > 0; });
				var haystackSet = {};
				haystackTokens.forEach(function(t) { haystackSet[t] = true; });
				tokens.forEach(function(t) {
					if (haystackSet[t]) score += 60;
					else if (t.length >= 3 && haystack.indexOf(t) >= 0) score += 20;
				});
			}

			// Prefer trusted namespaces
			for (var i = 0; i < TRUSTED_PREFIXES.length; i++) {
				if (name.indexOf(TRUSTED_PREFIXES[i]) === 0) { score += 500; break; }
			}

			// Demote smithery aggregators
			if (name.indexOf(SMITHERY_PREFIX) === 0) score -= 500;

			return score;
		}

		function parseRegistryEntry(item) {
			var s = item.server || item;
			var meta = item._meta || {};
			var status = (meta['io.modelcontextprotocol.registry/official'] || {}).status || 'active';
			if (status !== 'active') return null;
			var packages = s.packages || [];
			var remotes = s.remotes || [];
			if (!packages.length && !remotes.length) return null;

			var installConfig = null;
			var installType = '';
			if (remotes.length > 0) {
				var remote = remotes[0];
				var rtype = remote.type === 'streamable-http' ? 'http' : (remote.type || 'http');
				installType = rtype;
				installConfig = { type: rtype === 'sse' ? 'sse' : 'http', url: remote.url };
				if (remote.headers && remote.headers.length > 0) {
					var headers = {};
					remote.headers.forEach(function(h) { if (h.name) headers[h.name] = ''; });
					if (Object.keys(headers).length > 0) installConfig.headers = headers;
				}
			} else if (packages.length > 0) {
				var pkg = packages[0];
				installType = pkg.registryType || 'npm';
				if (pkg.registryType === 'npm') {
					installConfig = { type: 'stdio', command: 'npx', args: ['-y', pkg.identifier || s.name] };
				} else if (pkg.registryType === 'oci' || pkg.registryType === 'docker') {
					installConfig = { type: 'stdio', command: 'docker', args: ['run', '-i', '--rm', pkg.identifier || s.name] };
				} else {
					installConfig = { type: 'stdio', command: 'npx', args: ['-y', pkg.identifier || s.name] };
				}
				if (pkg.environmentVariables && pkg.environmentVariables.length > 0) {
					var env = {};
					pkg.environmentVariables.forEach(function(ev) {
						if (ev.name) env[ev.name] = ev.default || '';
					});
					if (Object.keys(env).length > 0) installConfig.env = env;
				}
			}

			return {
				id: s.name || '',
				name: (s.title || s.name || '').split('/').pop(),
				description: s.description || '',
				icon: '',
				stars: 0,
				url: (s.repository && s.repository.url) || s.websiteUrl || '',
				installType: installType,
				installConfig: installConfig
			};
		}

		var lastSearchQuery = '';

		function handleMarketplaceResponse(data, searchQuery) {
			// Parse entries from this response
			(data.servers || []).forEach(function(item) {
				var entry = parseRegistryEntry(item);
				if (entry) accumulatedRegistryResults.push(entry);
			});

			// For non-search (browse refresh), merge immediately
			if (!data._isSearch) {
				var topIds = topMcpServers.map(function(s) { return s.id; });
				var extra = accumulatedRegistryResults.filter(function(s) {
					return topIds.indexOf(s.id) < 0;
				});
				if (extra.length > 0) {
					renderMarketplace((marketplaceDisplayed || []).concat(extra));
				}
				return;
			}

			// For search, wait for all registries to respond
			pendingRegistryResponses--;
			if (pendingRegistryResponses > 0) return;

			// All responses received — dedupe, filter, rank, merge
			var deduped = {};
			var allResults = [];
			accumulatedRegistryResults.forEach(function(entry) {
				var key = entry.id + '@' + (entry.version || '0');
				if (!deduped[key]) {
					deduped[key] = true;
					allResults.push(entry);
				}
			});

			// Filter smithery when alternatives exist
			var hasNonSmithery = allResults.some(function(s) { return s.id.indexOf(SMITHERY_PREFIX) !== 0; });
			if (hasNonSmithery) {
				allResults = allResults.filter(function(s) { return s.id.indexOf(SMITHERY_PREFIX) !== 0; });
			}

			// Dedupe against local results
			var localIds = (marketplaceDisplayed || []).map(function(s) { return s.id; });
			var extra = allResults.filter(function(s) { return localIds.indexOf(s.id) < 0; });

			// Merge and rank the full list
			var merged = (marketplaceDisplayed || []).concat(extra);
			if (searchQuery) {
				merged.sort(function(a, b) {
					var diff = rankRegistryResult(searchQuery, b) - rankRegistryResult(searchQuery, a);
					if (diff !== 0) return diff;
					return (a.id || '').localeCompare(b.id || '');
				});
			}
			renderMarketplace(merged);
		}

		function renderMarketplace(servers, isLoading) {
			marketplaceDisplayed = servers;
			var grid = document.getElementById('marketplaceGrid');
			if ((!servers || servers.length === 0) && !isLoading) {
				grid.innerHTML = '<div class="marketplace-loading">No servers found.</div>';
				return;
			}
			var html = '';
			(servers || []).forEach(function(server) {
				var name = server.name || 'Unknown';
				var desc = escapeHtml(server.description || 'No description');
				var icon = server.icon || '';
				var stars = server.stars || 0;
				var installType = server.installType || '';
				var iconHtml = icon ? '<img src="' + escapeHtml(icon) + '" class="marketplace-item-icon" onerror="this.style.display=&quot;none&quot;" />' : '<div class="marketplace-item-icon-placeholder">' + escapeHtml(name.charAt(0).toUpperCase()) + '</div>';

				var starsHtml = stars > 0 ? '<span class="marketplace-item-stars">' + (stars >= 1000 ? (Math.round(stars / 100) / 10) + 'k' : stars) + ' &#9733;</span>' : '';
				var typeHtml = installType ? '<span class="marketplace-item-type">' + escapeHtml(installType) + '</span>' : '';

				var safeId = escapeHtml(server.id || name).replace(/'/g, '&#39;');
				html += '<div class="marketplace-item" data-server="' + safeId + '" onclick="showMarketplaceDetail(this.dataset.server)">' +
					'<div class="marketplace-item-header">' +
					iconHtml +
					'<div class="marketplace-item-info">' +
					'<div class="marketplace-item-name">' + escapeHtml(name) + (server.featured ? ' <span style="color:#f59e0b;font-size:10px;" title="Featured">&#9733;</span>' : '') + '</div>' +
					'<div class="marketplace-item-meta">' + starsHtml + typeHtml + '</div>' +
					'</div>' +
					'</div>' +
					'<div class="marketplace-item-desc">' + desc + '</div>' +
					'</div>';
			});
			if (isLoading) {
				html += '<div class="marketplace-loading" style="padding: 16px; text-align: center; opacity: 0.6; font-size: 12px;">Searching registries...</div>';
			} else if (servers && servers.length > 0) {
				var btnLabel = lastSearchQuery ? 'Search for more results' : 'Browse more servers';
				html += '<div style="padding: 12px; text-align: center;"><button onclick="focusMarketplaceSearch()" style="background: none; border: 1px solid var(--vscode-panel-border); color: var(--vscode-descriptionForeground); padding: 6px 16px; border-radius: 4px; cursor: pointer; font-size: 12px;">' + btnLabel + '</button></div>';
			}
			grid.innerHTML = html;
		}

		function searchMoreResults() {
			var query = lastSearchQuery;
			if (!query) return;
			pendingRegistryResponses = 2;
			accumulatedRegistryResults = [];
			renderMarketplace(marketplaceDisplayed, true);
			vscode.postMessage({ type: 'marketplaceFetch', url: 'https://mcp.agent-tooling.dev/api/v1/servers?version=latest&limit=100&search=' + encodeURIComponent(query), isSearch: true });
			vscode.postMessage({ type: 'marketplaceFetch', url: 'https://registry.modelcontextprotocol.io/v0.1/servers?version=latest&limit=100&search=' + encodeURIComponent(query), isSearch: true });
		}

		function focusMarketplaceSearch() {
			var input = document.getElementById('marketplaceSearch');
			if (input) {
				input.scrollIntoView({ behavior: 'smooth', block: 'center' });
				input.focus();
			}
		}

		function showMarketplaceDetail(serverId) {
			var server = (marketplaceDisplayed || []).find(function(s) { return s.id === serverId; }) ||
				(marketplaceCache || []).find(function(s) { return s.id === serverId; });
			if (!server) return;

			var name = server.name || 'Unknown';
			var desc = server.description || 'No description available.';
			var icon = server.icon || '';
			var stars = server.stars || 0;
			var url = server.url || '';
			var cfg = server.installConfig;

			var iconHtml = icon ? '<img src="' + escapeHtml(icon) + '" class="marketplace-detail-icon" onerror="this.style.display=&quot;none&quot;" />' : '<div class="marketplace-item-icon-placeholder" style="width:40px;height:40px;font-size:18px;">' + escapeHtml(name.charAt(0).toUpperCase()) + '</div>';

			var starsHtml = stars > 0 ? '<span class="marketplace-item-stars">' + (stars >= 1000 ? (Math.round(stars / 100) / 10) + 'k' : stars) + ' &#9733;</span>' : '';

			// Build install info from installConfig
			var installInfo = '';
			if (cfg) {
				installInfo = '<div class="marketplace-detail-section-title">Configuration</div>';
				if (cfg.type === 'stdio') {
					installInfo += '<div class="marketplace-detail-row"><span class="detail-label">Command:</span> <code>' + escapeHtml(cfg.command + ' ' + (cfg.args || []).join(' ')) + '</code></div>';
					installInfo += '<div class="marketplace-detail-row"><span class="detail-label">Type:</span> stdio</div>';
				} else {
					installInfo += '<div class="marketplace-detail-row"><span class="detail-label">URL:</span> <code>' + escapeHtml(cfg.url || '') + '</code></div>';
					installInfo += '<div class="marketplace-detail-row"><span class="detail-label">Type:</span> ' + escapeHtml(cfg.type || 'http') + '</div>';
				}
				if (cfg.env) {
					installInfo += '<div class="marketplace-detail-row"><span class="detail-label">Env vars:</span></div>';
					for (var envKey in cfg.env) {
						if (cfg.env.hasOwnProperty(envKey)) {
							installInfo += '<div class="marketplace-detail-env"><code>' + escapeHtml(envKey) + '</code></div>';
						}
					}
				}
			}

			var safeId = escapeHtml(serverId).replace(/'/g, '&#39;');

			var grid = document.getElementById('marketplaceGrid');
			var loadMoreBtn = document.getElementById('marketplaceLoadMore');
			if (loadMoreBtn) loadMoreBtn.style.display = 'none';

			grid.innerHTML = '<div class="marketplace-detail">' +
				'<button class="marketplace-back-btn" onclick="renderMarketplace(marketplaceDisplayed || marketplaceCache)">&#8592; Back</button>' +
				'<div class="marketplace-detail-header">' +
				iconHtml +
				'<div class="marketplace-detail-header-info">' +
				'<div class="marketplace-detail-name">' + escapeHtml(name) + '</div>' +
				'<div class="marketplace-detail-header-meta">' +
				starsHtml +
				(url ? '<a href="' + escapeHtml(url) + '" target="_blank" class="marketplace-detail-link">GitHub</a>' : '') +
				'</div>' +
				'</div>' +
				(cfg ? '<div style="display:flex;align-items:center;gap:8px;margin-left:auto;"><select id="mcpInstallScope" style="padding:4px 6px;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border);border-radius:4px;font-size:11px;"><option value="project">Project (.mcp.json)</option><option value="global">Global (~/.claude.json)</option></select><button class="btn marketplace-install-btn" data-server="' + safeId + '" onclick="installMarketplaceServer(this.dataset.server)">Install</button></div>' : '') +
				'</div>' +
				'<div class="marketplace-detail-desc">' + escapeHtml(desc) + '</div>' +
				(installInfo ? '<div class="marketplace-detail-config">' + installInfo + '</div>' : '') +
				(!cfg ? '<div class="marketplace-detail-row" style="color:var(--vscode-descriptionForeground)">No install config available.</div>' : '') +
				'</div>';
		}

		function installMarketplaceServer(serverId) {
			var server = (marketplaceDisplayed || []).find(function(s) { return s.id === serverId; }) ||
				(marketplaceCache || []).find(function(s) { return s.id === serverId; });
			if (!server || !server.installConfig) return;

			var cfg = server.installConfig;
			var displayName = server.name || serverId.split('/').pop() || serverId;

			// Get selected scope from detail view
			var scopeSelect = document.getElementById('mcpInstallScope');
			var selectedScope = scopeSelect ? scopeSelect.value : 'project';

			// Pre-fill the manual add form with the config
			showAddServerForm();
			var formScope = document.getElementById('serverScope');
			if (formScope) formScope.value = selectedScope;
			document.getElementById('serverName').value = displayName;
			document.getElementById('serverName').disabled = false;

			if (cfg.type === 'stdio') {
				document.getElementById('serverType').value = 'stdio';
				updateServerForm();
				document.getElementById('serverCommand').value = cfg.command || '';
				document.getElementById('serverArgs').value = (cfg.args || []).join('\\n');
				if (cfg.env) {
					var envLines = [];
					for (var k in cfg.env) {
						if (cfg.env.hasOwnProperty(k)) {
							envLines.push(k + '=' + cfg.env[k]);
						}
					}
					document.getElementById('serverEnv').value = envLines.join('\\n');
				}
			} else {
				document.getElementById('serverType').value = cfg.type === 'sse' ? 'sse' : 'http';
				updateServerForm();
				document.getElementById('serverUrl').value = cfg.url || '';
			}

			// Scroll to the form
			var form = document.getElementById('addServerForm');
			if (form) form.scrollIntoView({ behavior: 'smooth' });
		}

		function displayMCPServers(servers) {
			const serversList = document.getElementById('mcpServersList');
			serversList.innerHTML = '';

			if (Object.keys(servers).length === 0) {
				serversList.innerHTML = '<div class="no-servers">' +
					'<div class="no-servers-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="6" cy="6" r="1" fill="currentColor"/><circle cx="6" cy="18" r="1" fill="currentColor"/></svg></div>' +
					'<div class="no-servers-text">No MCP servers configured</div>' +
					'<button class="btn outlined no-servers-btn" onclick="showAddServerForm()">+ Add manually</button>' +
					'</div>';
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
				const serverScope = config._scope || 'project';
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

				const scopeLabel = serverScope === 'global' ? 'Global' : serverScope === 'project' ? 'Project' : 'Extension';

				serverItem.innerHTML = \`
					<div class="server-info">
						<div class="server-name">\${name} <span style="font-size:10px;opacity:0.5;font-weight:normal;">\${scopeLabel}</span></div>
						<div class="server-type">\${serverType.toUpperCase()}</div>
						<div class="server-config">\${configDisplay}</div>
					</div>
					<div class="server-actions">
						<button class="btn outlined server-edit-btn" onclick="editMCPServer('\${name}', \${JSON.stringify(config).replace(/"/g, '&quot;')})">Edit</button>
						<button class="btn outlined server-delete-btn" onclick="deleteMCPServer('\${name}', '\${serverScope}')">Delete</button>
					</div>
				\`;
				
				serversList.appendChild(serverItem);
			}

			// Add buttons at the bottom
			var actionsDiv = document.createElement('div');
			actionsDiv.className = 'mcp-add-server';
			actionsDiv.style.cssText = 'display: flex; gap: 8px; align-items: center;';
			actionsDiv.innerHTML = '<button class="btn outlined" onclick="showAddServerForm()">+ Add manually</button>' +
				'<span style="flex:1;"></span>' +
				'<span class="mcp-auth-btn" data-tooltip="Some MCPs may require authentication. Opens a terminal to log in." onclick="authenticateMCPs()">Authenticate</span>';
			serversList.appendChild(actionsDiv);
		}

		// Model selector functions
		let currentModel = 'opus'; // Default model
		let pendingModelSelection = null; // Model to activate after payment
		let hasOpenCreditsKey = false; // Whether OpenCredits key exists in env vars
		let openCreditsBalance = null; // OpenCredits account balance
		let envsDisabled = false; // Whether custom env vars are disabled
		let opencreditsEnabled = false; // Feature flag: whether OpenCredits is available in this region
		let hasSavedOpenCreditsKey = false; // Whether a key exists in encrypted storage

		// Recommended alternative models - loaded from recommended-models.json via window.__recommendedModels
		let creditsPricingData = null; // { referenceModel, models: [{ id, credits_per_request }], tokenAssumption }
		let openCreditsModels = (window.__recommendedModels || []).map(function(m) {
			return {
				id: m.id,
				name: m.name,
				provider: m.provider,
				quickLabel: m.quickLabel,
				credits_per_request: m.credits_per_request || null,
				tierModels: m.tierModels
			};
		});

		// Check if a model is a OpenCredits model (any model that's not a Claude model)
		function isOpenCreditsModel(modelId) {
			const claudeModels = ['opus', 'sonnet', 'default'];
			return !claudeModels.includes(modelId);
		}

		// Render quick select buttons from recommended models data
		function isModelMatch(modelId, candidate) {
			if (modelId === candidate) return true;
			// Check tier models
			var m = openCreditsModels.find(function(om) { return om.id === candidate; });
			if (m && m.tierModels) {
				var match = m.tierModels.sonnet === modelId || m.tierModels.opus === modelId || m.tierModels.haiku === modelId;
				return match;
			}
			return false;
		}

		function renderQuickButtons() {
			const container = document.getElementById('modelQuickSelect');
			if (!container) return;
			const selectorRow = container.closest('.model-selector-row');

			if (selectorRow) selectorRow.style.display = 'flex';
			container.innerHTML = '';

			var modelDropdown = document.getElementById('modelDropdownBtn');

			var moreBtn = document.getElementById('modelMoreBtn');

			if (!opencreditsEnabled && !hasOpenCreditsKey) {
				// No OpenCredits - hide promo button, quick select, and more btn; show model dropdown
				var mainBtn = document.getElementById('modelSelector');
				if (mainBtn) mainBtn.style.display = 'none';
				container.style.display = 'none';
				if (moreBtn) moreBtn.style.display = 'none';
				if (modelDropdown) modelDropdown.style.display = '';
				return;
			}

			// OpenCredits enabled - show promo button, quick buttons, and more btn; hide model dropdown
			var mainBtn = document.getElementById('modelSelector');
			if (mainBtn) mainBtn.style.display = '';
			container.style.display = '';
			if (moreBtn) moreBtn.style.display = '';
			if (modelDropdown) modelDropdown.style.display = 'none';

			openCreditsModels.forEach(function(model) {
				const btn = document.createElement('button');
				btn.className = 'model-quick-btn' + (isModelMatch(currentModel, model.id) ? ' selected' : '');
				btn.setAttribute('data-model', model.id);
				btn.textContent = model.quickLabel || model.name;
				btn.onclick = function() { selectModel(model.id); };
				container.appendChild(btn);
			});
		}
		renderQuickButtons();

		function getCreditsPricing(modelId) {
			var model = openCreditsModels.find(function(m) { return m.id === modelId; });
			if (model && model.credits_per_request) {
				return { id: model.id, credits_per_request: model.credits_per_request };
			}
			// Check live data for non-recommended models (e.g., reference model)
			if (creditsPricingData && creditsPricingData.models) {
				return creditsPricingData.models.find(function(m) { return m.id === modelId; }) || null;
			}
			return null;
		}

		function renderOpenCreditsModelCards() {
			const container = document.getElementById('opencreditsModelCards');
			if (!container) return;

			// Comparison header
			var headerHtml = '';
			// Claude Opus 4.6 via Anthropic API directly: $5/MTok input, $25/MTok output
			// At 2500 in + 2500 out = $0.075/request → $10 = ~133 requests
			var OPUS_DIRECT_COST_PER_REQUEST = 0.075;
			var OPUS_DIRECT_REQUESTS_PER_10 = Math.round(10 / OPUS_DIRECT_COST_PER_REQUEST); // 133

			headerHtml = '<div class="model-comparison-header">' +
				'Switch between any model with <strong>OpenCredits</strong>' +
			'</div>';

			// Sort by credits_per_request (cheapest first = highest savings)
			var sortedModels = openCreditsModels.slice().sort(function(a, b) {
				var aPricing = getCreditsPricing(a.id);
				var bPricing = getCreditsPricing(b.id);
				var aCost = aPricing ? aPricing.credits_per_request : 9999;
				var bCost = bPricing ? bPricing.credits_per_request : 9999;
				return aCost - bCost;
			});

			const modelCards = sortedModels.map(model => {
				const isSelected = isModelMatch(currentModel, model.id);
				const isPending = pendingModelSelection === model.id;

				// Calculate savings vs Claude Opus direct (Anthropic API)
				var badgeHtml = '';
				var modelPricing = getCreditsPricing(model.id);

				if (modelPricing && modelPricing.credits_per_request > 0) {
					// Convert credits to dollars: credits × $0.008 (credit value after markup)
					var modelCostPerRequest = modelPricing.credits_per_request * 0.008;
					var savingsPercent = Math.round((1 - modelCostPerRequest / OPUS_DIRECT_COST_PER_REQUEST) * 100);
					if (savingsPercent > 0) {
						badgeHtml = '<div class="savings-badge">Save ' + savingsPercent + '%</div>';
					}
				}

				return '<div class="model-card' + (isSelected ? ' selected' : '') + (isPending ? ' pending' : '') + '" data-model-id="' + model.id + '" data-provider="' + model.provider + '">' +
					badgeHtml +
					'<div class="model-card-provider">' + model.provider + '</div>' +
					'<div class="model-card-name">' + model.name + '</div>' +
				'</div>';
			}).join('');

			var browseCard = '<div class="model-card more-models-card" onclick="showAllModelsModal()">' +
				'<div class="model-card-provider">Browse All OpenCredits</div>' +
				'<div class="model-card-name">150+ Models</div>' +
			'</div>';

			var customCard;
			if (hasOpenCreditsKey) {
				customCard = '<div class="model-card more-models-card" onclick="showAdvancedModal()">' +
					'<div class="model-card-provider">Advanced Settings</div>' +
					'<div class="model-card-name">Configure Models</div>' +
				'</div>';
			} else {
				customCard = '<div class="model-card more-models-card" onclick="showCustomProviderModal()">' +
					'<div class="model-card-provider">Custom</div>' +
					'<div class="model-card-name">Your Provider</div>' +
				'</div>';
			}

			var headerContainer = document.getElementById('opencreditsComparisonHeader');
			if (headerContainer) headerContainer.innerHTML = headerHtml;
			container.innerHTML = modelCards + browseCard + customCard;

			// Add click handlers
			container.querySelectorAll('.model-card').forEach(card => {
				card.addEventListener('click', () => {
					const modelId = card.getAttribute('data-model-id');
					if (modelId) {
						if (hasOpenCreditsKey) {
							selectModel(modelId);
						} else {
							triggerOpenCreditsCheckout(modelId);
						}
					}
				});
			});
		}

		function updateOpenCreditsPromo() {
			const promo = document.getElementById('opencreditsPromo');
			if (!promo) return;

			// Hide promo entirely if OpenCredits is not enabled
			if (!opencreditsEnabled && !hasOpenCreditsKey) {
				promo.style.display = 'none';
				return;
			}
			promo.style.display = '';

			// Update envs label, toggle button, and list opacity
			var envsLabel = document.getElementById('envsLabel');
			var toggleBtn = document.getElementById('envsToggleBtn');
			var envList = document.getElementById('env-variables-list');
			var hasAnyEnvVars = document.querySelectorAll('.env-variable-row').length > 0;

			if (envsLabel) {
				if (envsDisabled) {
					envsLabel.textContent = 'Environment Variables (Disabled)';
					envsLabel.style.color = '#ef4444';
				} else {
					envsLabel.textContent = 'Environment Variables';
					envsLabel.style.color = 'var(--vscode-descriptionForeground)';
				}
			}
			if (toggleBtn) {
				if (hasAnyEnvVars) {
					toggleBtn.style.display = 'inline-block';
					toggleBtn.textContent = envsDisabled ? 'Enable' : 'Disable';
					toggleBtn.style.color = envsDisabled ? '#10b981' : 'var(--vscode-descriptionForeground)';
					toggleBtn.onclick = function() {
						envsDisabled = !envsDisabled;
						vscode.postMessage({ type: 'setEnvsDisabled', disabled: envsDisabled });
						if (!envsDisabled) {
							// Re-enabling: let settingsData handler restore hasOpenCreditsKey
						} else {
							hasOpenCreditsKey = false;
							openCreditsBalance = null;
							updateStatusWithTotals();
						}
						updateOpenCreditsPromo();
					};
				} else {
					toggleBtn.style.display = 'none';
				}
			}
			if (envList) {
				envList.style.opacity = envsDisabled ? '0.4' : '1';
				envList.style.pointerEvents = envsDisabled ? 'none' : 'auto';
			}

			const btnStyle = 'padding: 5px 12px; background: rgba(139, 92, 246, 0.15); color: #a78bfa; border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 500; white-space: nowrap;';
			const config = vscode.getState() || {};

			// Check if env vars exist but are disabled
			const hasEnvVars = !!(document.querySelectorAll('.env-variable-row .env-key').length > 0 ||
				hasOpenCreditsKey);

			if (hasOpenCreditsKey) {
				const balanceLine = openCreditsBalance !== null ? '<div style="font-size: 11px; color: #10b981; margin-top: 3px;">' + openCreditsBalance.toFixed(1) + ' credits</div>' : '';
				promo.innerHTML =
					'<div style="display: flex; align-items: center; justify-content: space-between;">' +
						'<div>' +
							'<div style="font-size: 12px; font-weight: 600; color: var(--vscode-foreground);">OpenCredits Connected</div>' +
							'<div style="font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 2px;">Access 150+ models via OpenCredits</div>' +
							balanceLine +
						'</div>' +
						'<button id="opencreditsPromoBtn" style="' + btnStyle + '">My Account</button>' +
					'</div>';
				document.getElementById('opencreditsPromoBtn').onclick = function() {
					OpenCredits.open();
				};
			} else if (hasSavedOpenCreditsKey) {
				promo.innerHTML =
					'<div style="display: flex; align-items: center; justify-content: space-between;">' +
						'<div>' +
							'<div style="font-size: 12px; font-weight: 600; color: var(--vscode-foreground);">OpenCredits Account Found</div>' +
							'<div style="font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 2px;">Your account is saved. Reconnect to use 150+ models.</div>' +
						'</div>' +
						'<button id="opencreditsPromoBtn" style="' + btnStyle + '">Reconnect</button>' +
					'</div>';
				document.getElementById('opencreditsPromoBtn').onclick = function() {
					vscode.postMessage({ type: 'restoreOpenCredits' });
				};
			} else {
				promo.innerHTML =
					'<div style="display: flex; align-items: center; justify-content: space-between;">' +
						'<div>' +
							'<div style="font-size: 12px; font-weight: 600; color: var(--vscode-foreground);">Use 100+ AI Models</div>' +
							'<div style="font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 2px;">Access GPT, Gemini, DeepSeek & more via OpenCredits. Pay-as-you-go.</div>' +
						'</div>' +
						'<button id="opencreditsPromoBtn" style="' + btnStyle + '">Browse Models</button>' +
					'</div>';
				document.getElementById('opencreditsPromoBtn').onclick = function() {
					hideSettingsModal();
					showModelSelector();
				};
			}
		}

		// Trigger checkout flow for OpenCredits
		function triggerOpenCreditsCheckout(modelId) {
			sendStats('Checkout started', { model: modelId });
			pendingModelSelection = modelId;
			hideModelModal();
			// Tell extension about pending model
			if (pendingModelSelection) {
				vscode.postMessage({
					type: 'setPendingModel',
					pendingModel: pendingModelSelection
				});
			}
			// Open OpenCredits checkout directly
			OpenCredits.open({ model: modelId });
		}

		function showModelSelector(fromModel) {
			sendStats('Model selector opened', fromModel ? { model: fromModel } : undefined);
			document.getElementById('modelModal').style.display = 'flex';

			const opencreditsSection = document.getElementById('opencreditsModelsSection');
			const claudeSection = document.getElementById('claudeCodeSection');
			const divider = document.getElementById('modelSectionDivider');

			// Always show Claude Code section
			claudeSection.style.display = 'block';

			// Show OpenCredits section only if feature flag enabled
			if (opencreditsEnabled || hasOpenCreditsKey) {
				opencreditsSection.style.display = 'block';
				divider.style.display = 'block';
			} else {
				opencreditsSection.style.display = 'none';
				divider.style.display = 'none';
			}
			renderOpenCreditsModelCards();

			// Update selected state
			updateModelSelection();
		}

		function updateModelSelection() {
			// Update Claude card selection
			document.querySelectorAll('.claude-card').forEach(card => {
				card.classList.toggle('selected', card.getAttribute('data-model') === currentModel);
			});

			// Update OpenCredits card selection
			document.querySelectorAll('.model-card').forEach(card => {
				card.classList.toggle('selected', card.getAttribute('data-model-id') === currentModel);
			});
		}

		function hideModelModal() {
			document.getElementById('modelModal').style.display = 'none';
		}

		// All models browser
		let allModelsCache = null;

		function showCustomProviderModal() {
			hideModelModal();
			document.getElementById('customProviderModal').style.display = 'flex';
		}

		function hideCustomProviderModal() {
			document.getElementById('customProviderModal').style.display = 'none';
		}

		function saveCustomProvider() {
			var baseUrl = document.getElementById('customProviderBaseUrl').value.trim();
			var authToken = document.getElementById('customProviderAuthToken').value.trim();
			var sonnetModel = document.getElementById('customProviderSonnet').value.trim();
			var opusModel = document.getElementById('customProviderOpus').value.trim();
			var haikuModel = document.getElementById('customProviderHaiku').value.trim();

			if (!baseUrl || !authToken) {
				return;
			}

			var envVars = {
				'ANTHROPIC_BASE_URL': baseUrl,
				'ANTHROPIC_AUTH_TOKEN': authToken
			};
			if (sonnetModel) envVars['ANTHROPIC_DEFAULT_SONNET_MODEL'] = sonnetModel;
			if (opusModel) envVars['ANTHROPIC_DEFAULT_OPUS_MODEL'] = opusModel;
			if (haikuModel) envVars['ANTHROPIC_DEFAULT_HAIKU_MODEL'] = haikuModel;

			vscode.postMessage({
				type: 'saveCustomProvider',
				envVars: envVars
			});

			hideCustomProviderModal();
		}

		// Model combo box component
		function initModelCombo(comboId) {
			var combo = document.getElementById(comboId);
			if (!combo) return;
			var input = combo.querySelector('.model-combo-input');
			var dropdown = combo.querySelector('.model-combo-dropdown');

			function renderDropdown(query) {
				var models = allModelsCache || [];
				var q = (query || '').toLowerCase();
				var filtered = q ? models.filter(function(m) {
					return m.id.toLowerCase().indexOf(q) !== -1 || (m.name || '').toLowerCase().indexOf(q) !== -1;
				}) : models;

				var html = filtered.slice(0, 50).map(function(m) {
					return '<div class="model-combo-option" data-id="' + m.id + '">' +
						'<div class="model-combo-option-name">' + (m.name || m.id) + '</div>' +
						'<div class="model-combo-option-id">' + m.id + '</div>' +
					'</div>';
				}).join('');

				if (q && filtered.length === 0) {
					html = '<div class="model-combo-custom" data-id="' + q + '">Use "' + q + '" as custom model</div>';
				} else if (q && !filtered.find(function(m) { return m.id === q; })) {
					html += '<div class="model-combo-custom" data-id="' + q + '">Use "' + q + '" as custom model</div>';
				}

				dropdown.innerHTML = html;

				dropdown.querySelectorAll('.model-combo-option, .model-combo-custom').forEach(function(opt) {
					opt.addEventListener('mousedown', function(e) {
						e.preventDefault();
						input.value = opt.getAttribute('data-id');
						combo.classList.remove('open');
					});
				});
			}

			input.addEventListener('focus', function() {
				// Clear to show all models, store current value
				input._prevValue = input.value;
				input.value = '';
				combo.classList.add('open');
				renderDropdown('');
			});

			input.addEventListener('input', function() {
				combo.classList.add('open');
				renderDropdown(input.value);
			});

			input.addEventListener('blur', function() {
				setTimeout(function() {
					combo.classList.remove('open');
					// Restore previous value if left empty
					if (!input.value && input._prevValue) {
						input.value = input._prevValue;
					}
				}, 150);
			});

			combo.setValue = function(id) { input.value = id || ''; };
			combo.getValue = function() { return input.value.trim(); };
		}

		var comboSonnet, comboOpus, comboHaiku;

		async function showAdvancedModal() {
			hideModelModal();
			document.getElementById('advancedModal').style.display = 'flex';

			// Fetch models if not cached
			if (!allModelsCache) {
				try {
					const response = await fetch(OPENCREDITS_API_URL + '/v1/models');
					const data = await response.json();
					allModelsCache = data.data || data;
				} catch (e) { /* ignore */ }
			}

			// Init combos
			if (!comboSonnet) {
				initModelCombo('comboSonnet');
				initModelCombo('comboOpus');
				initModelCombo('comboHaiku');
				comboSonnet = document.getElementById('comboSonnet');
				comboOpus = document.getElementById('comboOpus');
				comboHaiku = document.getElementById('comboHaiku');
			}

			// Request current env vars to populate
			vscode.postMessage({ type: 'getEnvVars' });
		}

		function hideAdvancedModal() {
			document.getElementById('advancedModal').style.display = 'none';
		}

		function saveAdvancedSettings() {
			var sonnetModel = comboSonnet ? comboSonnet.getValue() : '';
			var opusModel = comboOpus ? comboOpus.getValue() : '';
			var haikuModel = comboHaiku ? comboHaiku.getValue() : '';

			var envVars = {};
			envVars['ANTHROPIC_DEFAULT_SONNET_MODEL'] = sonnetModel;
			envVars['ANTHROPIC_DEFAULT_OPUS_MODEL'] = opusModel;
			envVars['ANTHROPIC_DEFAULT_HAIKU_MODEL'] = haikuModel;

			vscode.postMessage({
				type: 'saveCustomProvider',
				envVars: envVars
			});

			hideAdvancedModal();
		}

		async function showAllModelsModal() {
			const modal = document.getElementById('allModelsModal');
			const listContainer = document.getElementById('allModelsList');
			const searchInput = document.getElementById('allModelsSearch');

			modal.style.display = 'flex';
			hideModelModal();

			// Show loading state
			listContainer.innerHTML = '<div class="all-models-loading">Loading models...</div>';

			// Fetch models if not cached
			if (!allModelsCache) {
				try {
					const response = await fetch(OPENCREDITS_API_URL + '/v1/models');
					const data = await response.json();
					allModelsCache = data.data || data;
				} catch (error) {
					listContainer.innerHTML = '<div class="all-models-error">Failed to load models. Please try again.</div>';
					return;
				}
			}

			renderAllModels(allModelsCache);
			searchInput.value = '';
			searchInput.focus();
		}

		function hideAllModelsModal() {
			document.getElementById('allModelsModal').style.display = 'none';
		}

		function renderAllModels(models) {
			const listContainer = document.getElementById('allModelsList');

			if (!models || models.length === 0) {
				listContainer.innerHTML = '<div class="all-models-empty">No models found</div>';
				return;
			}

			listContainer.innerHTML = models.map(model => {
				const isSelected = currentModel === model.id;
				const contextLength = model.context_length ? Math.round(model.context_length / 1000) + 'K' : '';

				return '<div class="all-models-item' + (isSelected ? ' selected' : '') + '" data-model-id="' + model.id + '">' +
					'<div class="all-models-item-main">' +
						'<div class="all-models-item-name">' + (model.name || model.id) + '</div>' +
						'<div class="all-models-item-provider">' + (model.owned_by || '') + '</div>' +
					'</div>' +
					(contextLength ? '<div class="all-models-item-details"><span class="all-models-item-context">' + contextLength + '</span></div>' : '') +
				'</div>';
			}).join('');

			// Add click handlers
			listContainer.querySelectorAll('.all-models-item').forEach(item => {
				item.addEventListener('click', () => {
					const modelId = item.getAttribute('data-model-id');
					if (modelId) {
						if (hasOpenCreditsKey) {
							selectModel(modelId);
							hideAllModelsModal();
						} else {
							triggerOpenCreditsCheckout(modelId);
							hideAllModelsModal();
						}
					}
				});
			});
		}

		function filterAllModels() {
			const searchInput = document.getElementById('allModelsSearch');
			const query = searchInput.value.toLowerCase();

			if (!allModelsCache) return;

			const filtered = allModelsCache.filter(model => {
				const name = (model.name || model.id || '').toLowerCase();
				const provider = (model.owned_by || '').toLowerCase();
				return name.includes(query) || provider.includes(query);
			});

			renderAllModels(filtered);
		}

		// Helper function to get display name for a model
		function getModelDisplayName(modelId) {
			const claudeModels = {
				'opus': 'Claude Opus',
				'sonnet': 'Claude Sonnet',
				'default': 'Claude'
			};
			if (claudeModels[modelId]) return claudeModels[modelId];

			// Check OpenCredits models
			const openCreditsModel = openCreditsModels.find(m => m.id === modelId);
			if (openCreditsModel) return openCreditsModel.name;

			// Generate display name from model ID
			// Remove provider prefix (e.g., "deepseek/", "z-ai/")
			let name = modelId.includes('/') ? modelId.split('/').pop() : modelId;
			// Remove suffixes like ":thinking", ":free"
			name = name.split(':')[0];
			// Replace hyphens/underscores with spaces and capitalize words
			name = name.replace(/[-_]/g, ' ').replace(/\\b\\w/g, c => c.toUpperCase());
			return name;
		}

		// Update UI to reflect current model selection
		function updateModelSelectionUI() {
			// Update Claude cards
			document.querySelectorAll('.claude-card').forEach(card => {
				card.classList.toggle('selected', card.getAttribute('data-model') === currentModel);
			});
			// Update OpenCredits cards
			document.querySelectorAll('.model-card').forEach(card => {
				card.classList.toggle('selected', card.getAttribute('data-model-id') === currentModel);
			});
			// Update quick select buttons
			document.querySelectorAll('.model-quick-btn').forEach(btn => {
				btn.classList.toggle('selected', btn.getAttribute('data-model') === currentModel);
			});

			// Update current model indicator and selector button
			updateCurrentModelDisplay();
		}

		function updateCurrentModelDisplay() {
			const selectorText = document.getElementById('modelSelectorText');
			const selectorBadge = document.getElementById('modelSelectorBadge');
			const modelDropdown = document.getElementById('modelDropdownText');
			const predefinedModels = openCreditsModels.map(function(m) { return m.id; });

			// Update inline model dropdown
			if (modelDropdown) {
				if (currentModel === 'opus') {
					modelDropdown.textContent = 'Opus';
				} else if (currentModel === 'sonnet') {
					modelDropdown.textContent = 'Sonnet';
				} else if (currentModel === 'default') {
					modelDropdown.textContent = 'Model';
				} else {
					var displayName = getModelDisplayName(currentModel);
					var words = displayName.split(' ');
					modelDropdown.textContent = words.slice(0, 2).join(' ');
				}
			}

			if (currentModel === 'opus' || currentModel === 'sonnet') {
				// Claude model selected - show model name, hide badge
				const modelName = currentModel === 'opus' ? 'Claude Opus' : 'Claude Sonnet';
				selectorText.textContent = modelName;
				selectorBadge.style.display = 'none';
			} else if (currentModel === 'default' || predefinedModels.includes(currentModel)) {
				// Default or predefined OpenCredits model - show "Try other models" with NEW badge
				selectorText.textContent = 'Try other models';
				selectorBadge.style.display = '';
			} else {
				// Other OpenCredits model - show in button, hide badge
				const displayName = getModelDisplayName(currentModel);
				const words = displayName.split(' ');
				const shortName = words.slice(0, 2).join(' ');
				selectorText.textContent = shortName;
				selectorBadge.style.display = 'none';
			}
		}

		// Show toast notification
		function showToast(message) {
			// Remove any existing toast
			const existingToast = document.querySelector('.toast-notification');
			if (existingToast) existingToast.remove();

			const toast = document.createElement('div');
			toast.className = 'toast-notification';
			toast.textContent = message;
			document.body.appendChild(toast);

			setTimeout(() => {
				toast.classList.add('fade-out');
				setTimeout(() => toast.remove(), 300);
			}, 2500);
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
		function showInstallModal(installAttempted) {
			const modal = document.getElementById('installModal');
			const main = document.getElementById('installMain');
			const progress = document.getElementById('installProgress');
			const success = document.getElementById('installSuccess');
			const checkout = document.getElementById('installCheckout');

			if (modal) modal.style.display = 'flex';
			if (main) main.style.display = 'flex';
			if (progress) progress.style.display = 'none';
			if (success) success.style.display = 'none';
			if (checkout) checkout.style.display = 'none';

			// Show "Didn't work? Try with npm" only if user already attempted install once
			var retryOptions = document.getElementById('installRetryOptions');
			if (retryOptions) retryOptions.style.display = installAttempted ? 'block' : 'none';

			// Show sudo checkbox only on macOS/Linux
			var sudoLabel = document.getElementById('installSudoLabel');
			if (sudoLabel) sudoLabel.style.display = (installAttempted && !isWindows) ? 'inline-block' : 'none';

			sendStats('Install modal shown', installAttempted ? { retryShown: true } : undefined);
		}

		function startInstallationWithSudo() {
			var useSudo = document.getElementById('installUseSudo') && document.getElementById('installUseSudo').checked;
			if (useSudo) {
				sendStats('Install started', { method: 'npm-sudo' });
				vscode.postMessage({
					type: 'runTerminalCommand',
					command: 'sudo npm install -g @anthropic-ai/claude-code'
				});
				// Close the modal — user will complete install in terminal
				hideInstallModal();
			} else {
				startInstallation('npm');
			}
		}

		function showLoginOptionsModal() {
			var modal = document.getElementById('installModal');
			var main = document.getElementById('installMain');
			var progress = document.getElementById('installProgress');
			var success = document.getElementById('installSuccess');
			var checkout = document.getElementById('installCheckout');
			var funds = document.getElementById('installFunds');

			// Update text for login flow
			var successIcon = success ? success.querySelector('.install-success-icon') : null;
			var successText = success ? success.querySelector('.install-success-text') : null;
			var successHint = success ? success.querySelector('.install-success-hint') : null;
			if (successIcon) successIcon.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
			if (successText) successText.textContent = 'Login Required';
			if (successHint) successHint.textContent = 'How would you like to use Claude Code?';

			if (modal) modal.style.display = 'flex';
			if (main) main.style.display = 'none';
			if (progress) progress.style.display = 'none';
			if (success) success.style.display = 'flex';
			if (checkout) checkout.style.display = 'none';
			if (funds) funds.style.display = 'none';

			// Hide OpenCredits option if feature flag is disabled
			var ocOption = document.getElementById('installOpenCreditsOption');
			if (ocOption) ocOption.style.display = opencreditsEnabled ? '' : 'none';

			sendStats('Login options shown');
		}

		function hideInstallModal() {
			document.getElementById('installModal').style.display = 'none';
			// Clean up checkout iframe and timeout
			var iframe = document.getElementById('checkoutIframe');
			if (iframe) iframe.src = '';
			if (checkoutTimeoutId) {
				clearTimeout(checkoutTimeoutId);
				checkoutTimeoutId = null;
			}
		}

		function startInstallation(method) {
			sendStats('Install started', { method: method || 'installer' });

			// Hide main content, show progress
			document.getElementById('installMain').style.display = 'none';
			document.getElementById('installProgress').style.display = 'flex';

			// Extension handles platform detection and command selection
			vscode.postMessage({
				type: 'runInstallCommand',
				method: method || 'installer'
			});
		}

		function handleInstallProgress(p) {
			const progressEl = document.getElementById('installProgress');
			if (!progressEl || progressEl.style.display === 'none') return;
			const textEl = progressEl.querySelector('.install-progress-text');
			if (!textEl) return;

			const loaded = typeof p.loaded === 'number' && isFinite(p.loaded) ? p.loaded : 0;
			const total = typeof p.total === 'number' && isFinite(p.total) && p.total > 0 ? p.total : null;

			if (p.phase === 'resolving') {
				textEl.textContent = 'Looking up Claude Code...';
			} else if (p.phase === 'downloading') {
				if (total) {
					const pct = Math.min(100, Math.max(0, Math.floor((loaded / total) * 100)));
					textEl.textContent = 'Downloading Claude Code (' + pct + '%)';
				} else {
					textEl.textContent = 'Downloading Claude Code (' + (loaded / 1048576).toFixed(1) + ' MB)';
				}
			} else if (p.phase === 'verifying') {
				textEl.textContent = 'Verifying download...';
			} else if (p.phase === 'installing') {
				textEl.textContent = 'Installing...';
			} else if (p.phase === 'fallback') {
				textEl.textContent = 'Retrying via alternate source...';
			}
		}

		function handleInstallComplete(success, error, extra) {
			document.getElementById('installProgress').style.display = 'none';

			const successEl = document.getElementById('installSuccess');
			successEl.style.display = 'flex';

			// Hide OpenCredits option if feature flag is disabled
			const ocOption = document.getElementById('installOpenCreditsOption');
			if (ocOption) ocOption.style.display = opencreditsEnabled ? '' : 'none';

			if (success) {
				const baseProps = { source: extra && extra.source, version: extra && extra.version };
				if (extra && extra.configuredPath) {
					sendStats('Install auto configured path', Object.assign({ existingPathRespected: !!extra.existingPathRespected }, baseProps));
					successEl.querySelector('.install-success-text').textContent = 'Installed';
					successEl.querySelector('.install-success-hint').textContent = 'Configured automatically. Send a message to get started.';
				} else if (extra && extra.existingPathRespected) {
					sendStats('Install success', baseProps);
					successEl.querySelector('.install-success-text').textContent = 'Installed';
					successEl.querySelector('.install-success-hint').textContent =
						'Your existing executable.path setting was left unchanged. Send a message to get started.';
				} else {
					sendStats('Install success', baseProps);
					successEl.querySelector('.install-success-text').textContent = 'Installed';
					successEl.querySelector('.install-success-hint').textContent = 'Send a message to get started';
				}
			} else {
				const errorCode = extra && extra.errorCode;
				sendStats('Install failed', {
					errorCode: errorCode,
					npmCode: extra && extra.npmCode,
					cdnCode: extra && extra.cdnCode,
					error: (error || 'Unknown error').substring(0, 200)
				});
				successEl.querySelector('.install-success-icon').style.display = 'none';
				successEl.querySelector('.install-options').style.display = 'none';
				if (errorCode === 'UNSUPPORTED_PLATFORM') {
					successEl.querySelector('.install-success-text').textContent = 'Unsupported platform';
					successEl.querySelector('.install-success-hint').textContent =
						error || 'Your platform is not supported. Install Claude manually from https://code.claude.com.';
				} else {
					successEl.querySelector('.install-success-text').textContent = 'Installation failed';
					successEl.querySelector('.install-success-hint').textContent =
						error || 'Try installing manually from claude.ai/download';
				}
			}
		}

		function loginWithPlan() {
			hideInstallModal();
			vscode.postMessage({ type: 'openLoginTerminal' });
		}

		function showFundsSelection() {
			// Tell extension about pending model
			if (pendingModelSelection) {
				vscode.postMessage({
					type: 'setPendingModel',
					pendingModel: pendingModelSelection
				});
			}
			// Skip the custom amount picker — open OpenCredits checkout directly
			hideInstallModal();
			OpenCredits.open();
		}

		function showInstallOptions() {
			document.getElementById('installFunds').style.display = 'none';
			document.getElementById('installSuccess').style.display = 'flex';
		}

		var checkoutTimeoutId = null;
		var checkoutAmount = null;

		function showCheckoutError(msg) {
			document.getElementById('checkoutPreparing').style.display = 'none';
			document.getElementById('checkoutReady').style.display = 'none';
			document.getElementById('checkoutComplete').style.display = 'none';
			var errorEl = document.getElementById('checkoutError');
			errorEl.style.display = 'block';
			if (msg) {
				document.getElementById('checkoutErrorMsg').textContent = msg;
			}
			// Wire retry button to restart with same amount
			document.getElementById('checkoutRetryBtn').onclick = function() {
				if (checkoutAmount) {
					startCheckoutFlow(checkoutAmount);
				} else {
					showFundsSelection();
				}
			};
			// Clear timeout if any
			if (checkoutTimeoutId) {
				clearTimeout(checkoutTimeoutId);
				checkoutTimeoutId = null;
			}
		}

		function startCheckoutFlow(amount) {
			checkoutAmount = amount;

			// Tell extension about pending model
			if (pendingModelSelection) {
				vscode.postMessage({
					type: 'setPendingModel',
					pendingModel: pendingModelSelection
				});
			}

			// Hide the install modal — the SDK overlay handles everything
			hideInstallModal();

			// Open the OpenCredits SDK checkout overlay
			OpenCredits.open({ amount: amount || undefined });
		}

		function selectFundsAmount(amount) {
			startCheckoutFlow(amount);
		}

		function selectCustomAmount() {
			var input = document.getElementById('customAmountInput');
			var amount = parseInt(input.value);
			if (amount && amount >= 1 && amount <= 500) {
				startCheckoutFlow(amount);
			}
		}

		// OpenCredits checkout is handled by the SDK (inlined at top of script).
		// Callbacks are wired in OpenCredits.init() above.

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
			var intensityNames = ['Think', 'Think Hard', 'Think Harder', 'Ultrathink'];
			var modeName = intensityNames[intensityValue] || 'Think';
			var toggleLabel = document.getElementById('thinkingModeLabel');
			if (toggleLabel) {
				toggleLabel.textContent = modeName + ' Mode';
			}
			var thinkBtn = document.getElementById('thinkToggleBtn');
			if (thinkBtn) {
				thinkBtn.textContent = modeName;
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

		function showProviderChoice(model) {
			hideModelModal();
			var modal = document.getElementById('providerChoiceModal');
			var modelName = model.charAt(0).toUpperCase() + model.slice(1);
			document.getElementById('providerChoiceTitle').textContent = 'Use ' + modelName + ' via';
			modal.style.display = 'flex';

			document.getElementById('providerChoiceOpenCredits').onclick = function() {
				modal.style.display = 'none';
				// Re-enable envs if they were disabled
				if (envsDisabled) {
					envsDisabled = false;
					vscode.postMessage({ type: 'setEnvsDisabled', disabled: false });
				}
				selectModel(model, true);
				var modelInfo = openCreditsModels.find(function(m) { return m.id === model; });
				var msg = { type: 'selectModel', model: model };
				if (modelInfo && modelInfo.tierModels) { msg.tierModels = modelInfo.tierModels; }
				vscode.postMessage(msg);
			};

			document.getElementById('providerChoiceAnthropic').onclick = function() {
				modal.style.display = 'none';
				// Disable envs so Claude CLI uses Anthropic directly
				envsDisabled = true;
				hasOpenCreditsKey = false;
				openCreditsBalance = null;
				vscode.postMessage({ type: 'setEnvsDisabled', disabled: true });
				selectModel(model, true);
				vscode.postMessage({ type: 'selectModel', model: model });
				updateStatusWithTotals();
				updateOpenCreditsPromo();
			};
		}

		function selectModel(model, fromBackend = false) {
			// If clicking on already selected model, show modal
			if (model === currentModel && !fromBackend) {
				showModelSelector(model);
				return;
			}

			// Check if this is a OpenCredits model (not a standard Claude model)
			const claudeModels = ['opus', 'sonnet', 'default'];
			const isOpenCreditsModel = !claudeModels.includes(model);

			// If selecting a OpenCredits model and envs are disabled, re-enable them
			if (isOpenCreditsModel && envsDisabled && !fromBackend) {
				envsDisabled = false;
				hasOpenCreditsKey = true;
				vscode.postMessage({ type: 'setEnvsDisabled', disabled: false });
				updateStatusWithTotals();
				updateOpenCreditsPromo();
				// Fall through to select the model normally
			}

			// If selecting a OpenCredits model without a key, trigger checkout flow
			if (isOpenCreditsModel && !hasOpenCreditsKey && !fromBackend) {
				pendingModelSelection = model;
				showModelSelector(model);
				setTimeout(() => {
					const opencreditsSection = document.querySelector('.model-modal-section:last-child');
					if (opencreditsSection) {
						opencreditsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
					}
				}, 100);
				return;
			}

			// If selecting a Claude model and user has OpenCredits configured, ask which provider
			if (!isOpenCreditsModel && hasOpenCreditsKey && !fromBackend && !envsDisabled) {
				showProviderChoice(model);
				return;
			}

			currentModel = model;
			if (!fromBackend) {
				sendStats('Model selected', { model: model });
			}

			// Only send model selection to VS Code extension if not from backend
			if (!fromBackend) {
				// Look up tier-specific models if available
				const modelInfo = openCreditsModels.find(m => m.id === model);
				const msg = { type: 'selectModel', model: model };
				if (modelInfo && modelInfo.tierModels) {
					msg.tierModels = modelInfo.tierModels;
				}
				vscode.postMessage(msg);
			}

			// Update card selection states
			// Claude cards
			document.querySelectorAll('.claude-card').forEach(card => {
				card.classList.toggle('selected', card.getAttribute('data-model') === model);
			});
			// OpenCredits cards
			document.querySelectorAll('.model-card').forEach(card => {
				card.classList.toggle('selected', card.getAttribute('data-model-id') === model);
			});
			// Quick select buttons
			document.querySelectorAll('.model-quick-btn').forEach(btn => {
				btn.classList.toggle('selected', btn.getAttribute('data-model') === model);
			});

			// Update the model selector button text
			updateCurrentModelDisplay();

			hideModelModal();
		}

		// Initialize model
		currentModel = 'opus';
		// Set initial quick button selected state
		document.querySelectorAll('.model-quick-btn').forEach(btn => {
			btn.classList.toggle('selected', btn.getAttribute('data-model') === currentModel);
		});
		// Close model modal when clicking outside
		document.getElementById('modelModal').addEventListener('click', (e) => {
			if (e.target === document.getElementById('modelModal')) {
				hideModelModal();
			}
		});

		// Stop button functions
		function showStopButton() {
			document.getElementById('sendBtn').style.display = 'none';
			document.getElementById('stopInlineBtn').style.display = 'inline-flex';
		}

		function hideStopButton() {
			document.getElementById('sendBtn').style.display = '';
			document.getElementById('stopInlineBtn').style.display = 'none';
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
					
				case 'imageAttached':
					if (message.filePath && message.previewUri) {
						addAttachedImage(message.filePath, message.previewUri);
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

					// Show current request info if available (only for direct API users, not OpenCredits)
					if (!subscriptionType && !hasOpenCreditsKey && (message.data.currentCost || message.data.currentDuration)) {
						const currentCostStr = message.data.currentCost ? \`$\${message.data.currentCost.toFixed(4)}\` : 'N/A';
						const currentDurationStr = message.data.currentDuration ? \`\${message.data.currentDuration}ms\` : 'N/A';
						addMessage(\`Request completed - Cost: \${currentCostStr}, Duration: \${currentDurationStr}\`, 'system');
					}
					break;

				case 'accountInfo':
					// Store subscription type to determine cost vs plan display
					subscriptionType = message.data.subscriptionType || null;
					// Update status bar to reflect plan type
					updateStatusWithTotals();
					break;

				case 'modelSwitching':
					// Model is being switched (router restarting)
					currentModel = message.model;
					updateModelSelectionUI();
					break;

				case 'modelSwitched':
					// Model switch complete
					currentModel = message.model;
					updateModelSelectionUI();
					updateStatusWithTotals();
					break;

				case 'sessionResumed':
					showSessionInfo(message.data.sessionId);
					addMessage(\`📝 Resumed previous session\\n🆔 Session ID: \${message.data.sessionId}\\n💡 Your conversation history is preserved\`, 'system');
					break;
					
				case 'sessionCleared':
					// Clear all messages from UI
					messagesDiv.innerHTML = '';
					hideSessionInfo();
					addMessage('🆕 Started new session', 'system');
					// Reset totals
					totalCost = 0;
					totalTokensInput = 0;
					totalTokensOutput = 0;
					requestCount = 0;
					updateStatusWithTotals();
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
					updateStatusWithTotals();

					const preTokens = message.data.preTokens ? message.data.preTokens.toLocaleString() : 'unknown';
					addMessage('✅ Compacted (' + preTokens + ' tokens → summary)', 'system');
					break;

				case 'loginRequired':
					sendStats('Login required');
					addMessage('Login required. Please login in the terminal and then come back.', 'error');
					updateStatus('Login Required', 'error');
					break;
				case 'showLoginOptions':
					showLoginOptionsModal();
					break;

				case 'showInstallModal':
					sendStats('Claude not installed');
					showInstallModal(message.installAttempted);
					updateStatus('Claude Code not installed', 'error');
					break;

				case 'installComplete':
					handleInstallComplete(message.success, message.error, {
						configuredPath: message.configuredPath,
						existingPathRespected: message.existingPathRespected,
						source: message.source,
						version: message.version,
						errorCode: message.errorCode,
						npmCode: message.npmCode,
						cdnCode: message.cdnCode
					});
					if (message.success) {
						updateStatus('Ready', 'success');
					}
					break;

				case 'installProgress':
					handleInstallProgress({
						phase: message.phase,
						source: message.source,
						loaded: message.loaded,
						total: message.total,
						message: message.message
					});
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
					
				case 'imageAttached':
					if (message.filePath && message.previewUri) {
						addAttachedImage(message.filePath, message.previewUri);
					}
					break;

				case 'addFilesToInput':
					// Add file references to the textarea
					console.log('Received addFilesToInput:', message.files);
					const fileRefs = message.files.join(' ');
					const existingText = messageInput.value;
					const spaceBefore = existingText && !existingText.endsWith(' ') ? ' ' : '';
					messageInput.value = existingText + spaceBefore + fileRefs + ' ';
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
				case 'askUserQuestion':
					addAskUserQuestionMessage(message.data);
					break;
				case 'updateAskUserQuestionStatus':
					updateAskUserQuestionStatus(message.data.id, message.data.status, message.data.answers);
					break;
				case 'updatePermissionStatus':
					updatePermissionStatus(message.data.id, message.data.status);
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
				case 'marketplaceResponse':
					handleMarketplaceResponse(message.data, lastSearchQuery);
					break;
				case 'marketplaceError':
					if (pendingRegistryResponses > 0) {
						pendingRegistryResponses--;
						if (pendingRegistryResponses === 0) {
							// All registries failed or responded — render what we have
							handleMarketplaceResponse({ servers: [] }, lastSearchQuery);
						}
					} else {
						var grid = document.getElementById('marketplaceGrid');
						if (grid) grid.innerHTML = '<div class="marketplace-loading">Failed to load servers. Check your connection.</div>';
					}
					break;
				case 'skillsList':
					displaySkills(message.data);
					break;
				case 'skillSaved':
					loadInstalledSkills();
					break;
				case 'skillDeleted':
					loadInstalledSkills();
					break;
				case 'skillsSearchResponse':
					handleSkillsSearchResponse(message.data);
					break;
				case 'skillInstallFailed':
					break;
				case 'pluginsList':
					displayPlugins(message.data);
					break;
				case 'pluginInstalled':
				case 'pluginRemoved':
					loadInstalledPlugins();
					break;
			}
		});
		
		// Permission request functions
		function addPermissionRequestMessage(data) {
			const messagesDiv = document.getElementById('messages');
			const shouldScroll = shouldAutoScroll(messagesDiv);

			const messageDiv = document.createElement('div');
			messageDiv.className = 'message permission-request';
			messageDiv.id = \`permission-\${data.id}\`;
			messageDiv.dataset.status = data.status || 'pending';

			let toolName = data.tool || 'Unknown Tool';
			if (toolName === 'ExitPlanMode') toolName = 'Approve Plan';
			const status = data.status || 'pending';

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

			// Show different content based on status
			let contentHtml = '';
			if (status === 'pending') {
				contentHtml = \`
					<div class="permission-header">
						<span class="icon">🔐</span>
						<span>Permission Required</span>
						<div class="permission-menu">
							<button class="permission-menu-btn" onclick="togglePermissionMenu('\${data.id}')" title="More options">⋮</button>
							<div class="permission-menu-dropdown" id="permissionMenu-\${data.id}" style="display: none;">
								<button class="permission-menu-item" onclick="enableYoloMode('\${data.id}')">
									<span class="menu-icon">⚡</span>
									<div class="menu-content">
										<span class="menu-title">Enable YOLO Mode</span>
										<span class="menu-subtitle">Auto-allow all permissions</span>
									</div>
								</button>
							</div>
						</div>
					</div>
					<div class="permission-content">
						<p>\${data.tool === 'ExitPlanMode' ? 'Approve the plan above?' : 'Allow <strong>' + toolName + '</strong> to execute the tool call above?'}</p>
						<div class="permission-buttons">
							<button class="btn deny" onclick="respondToPermission('\${data.id}', false)">Deny</button>
							\${data.tool === 'ExitPlanMode' ? '' : '<button class="btn always-allow" onclick="respondToPermission(\\'' + data.id + '\\', true, true)" ' + alwaysAllowTooltip + '>' + alwaysAllowText + '</button>'}
							<button class="btn allow" onclick="respondToPermission('\${data.id}', true)">\${data.tool === 'ExitPlanMode' ? 'Approve' : 'Allow'}</button>
						</div>
					</div>
				\`;
			} else if (status === 'approved') {
				contentHtml = \`
					<div class="permission-header">
						<span class="icon">🔐</span>
						<span>Permission Required</span>
					</div>
					<div class="permission-content">
						<p>Allow <strong>\${toolName}</strong> to execute the tool call above?</p>
						<div class="permission-decision allowed">✅ You allowed this</div>
					</div>
				\`;
				messageDiv.classList.add('permission-decided', 'allowed');
			} else if (status === 'denied') {
				contentHtml = \`
					<div class="permission-header">
						<span class="icon">🔐</span>
						<span>Permission Required</span>
					</div>
					<div class="permission-content">
						<p>Allow <strong>\${toolName}</strong> to execute the tool call above?</p>
						<div class="permission-decision denied">❌ You denied this</div>
					</div>
				\`;
				messageDiv.classList.add('permission-decided', 'denied');
			} else if (status === 'cancelled' || status === 'expired') {
				contentHtml = \`
					<div class="permission-header">
						<span class="icon">🔐</span>
						<span>Permission Required</span>
					</div>
					<div class="permission-content">
						<p>Allow <strong>\${toolName}</strong> to execute the tool call above?</p>
						<div class="permission-decision expired">⏱️ This request expired</div>
					</div>
				\`;
				messageDiv.classList.add('permission-decided', 'expired');
			}

			messageDiv.innerHTML = contentHtml;
			messagesDiv.appendChild(messageDiv);
			scrollToBottomIfNeeded(messagesDiv, shouldScroll);
		}

		function updatePermissionStatus(id, status) {
			const permissionMsg = document.getElementById(\`permission-\${id}\`);
			if (!permissionMsg) return;

			permissionMsg.dataset.status = status;
			const permissionContent = permissionMsg.querySelector('.permission-content');
			const buttons = permissionMsg.querySelector('.permission-buttons');
			const menuDiv = permissionMsg.querySelector('.permission-menu');

			// Hide buttons and menu if present
			if (buttons) buttons.style.display = 'none';
			if (menuDiv) menuDiv.style.display = 'none';

			// Remove existing decision div if any
			const existingDecision = permissionContent.querySelector('.permission-decision');
			if (existingDecision) existingDecision.remove();

			// Add new decision div
			const decisionDiv = document.createElement('div');
			if (status === 'approved') {
				decisionDiv.className = 'permission-decision allowed';
				decisionDiv.innerHTML = '✅ You allowed this';
				permissionMsg.classList.add('permission-decided', 'allowed');
			} else if (status === 'denied') {
				decisionDiv.className = 'permission-decision denied';
				decisionDiv.innerHTML = '❌ You denied this';
				permissionMsg.classList.add('permission-decided', 'denied');
			} else if (status === 'cancelled' || status === 'expired') {
				decisionDiv.className = 'permission-decision expired';
				decisionDiv.innerHTML = '⏱️ This request expired';
				permissionMsg.classList.add('permission-decided', 'expired');
			}
			permissionContent.appendChild(decisionDiv);
		}

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

		// AskUserQuestion functions
		function addAskUserQuestionMessage(data) {
			const messagesDiv = document.getElementById('messages');
			const shouldScroll = shouldAutoScroll(messagesDiv);

			var status = data.status || 'pending';
			var isResolved = (status === 'answered' || status === 'expired' || status === 'cancelled');

			const messageDiv = document.createElement('div');
			messageDiv.className = 'message ask-user-question';
			messageDiv.id = 'ask-question-' + data.id;
			messageDiv.dataset.status = status;
			messageDiv.dataset.requestId = data.id;

			const questions = data.questions || [];

			let questionsHtml = '';
			questions.forEach(function(q, idx) {
				var header = q.header ? '<div class="question-header">' + escapeHtml(q.header) + '</div>' : '';
				var questionText = '<div class="question-text">' + escapeHtml(q.question) + '</div>';

				var optionsHtml = '';
				if (q.options && q.options.length > 0) {
					var inputType = q.multiSelect ? 'checkbox' : 'radio';
					var inputName = 'question-' + data.id + '-' + idx;
					optionsHtml = '<div class="question-options">';
					q.options.forEach(function(opt, optIdx) {
						var optId = 'opt-' + data.id + '-' + idx + '-' + optIdx;
						var disabled = isResolved ? ' disabled' : '';
						optionsHtml += '<label class="question-option" for="' + optId + '">' +
							'<input type="' + inputType + '" id="' + optId + '" name="' + inputName + '" value="' + escapeHtml(opt.label) + '"' + disabled + ' />' +
							'<div class="option-content">' +
							'<span class="option-label">' + escapeHtml(opt.label) + '</span>' +
							(opt.description ? '<span class="option-description">' + escapeHtml(opt.description) + '</span>' : '') +
							'</div></label>';
					});
					optionsHtml += '</div>';
				}

				var freeTextHtml = '<div class="question-freetext">' +
					'<input type="text" class="question-freetext-input" data-question-idx="' + idx + '" placeholder="Type your answer..."' + (isResolved ? ' disabled' : '') + ' />' +
					'</div>';

				questionsHtml += '<div class="question-block" data-question-idx="' + idx + '" data-question="' + escapeHtml(q.question) + '">' +
					header + questionText + optionsHtml + freeTextHtml + '</div>';
			});

			var buttonsHtml = isResolved ? '' :
				'<div class="ask-question-buttons">' +
				'<button class="btn allow" onclick="submitAskUserQuestionAnswers(\\'' + data.id + '\\')">Submit</button>' +
				'</div>';

			var decisionHtml = '';
			if (status === 'answered' && data.answers) {
				decisionHtml = '<div class="ask-question-decision allowed">';
				for (var question in data.answers) {
					if (data.answers.hasOwnProperty(question)) {
						decisionHtml += '<div><strong>' + escapeHtml(question) + '</strong>: ' + escapeHtml(data.answers[question]) + '</div>';
					}
				}
				decisionHtml += '</div>';
			} else if (status === 'expired' || status === 'cancelled') {
				decisionHtml = '<div class="ask-question-decision expired">This question expired</div>';
			}

			messageDiv.innerHTML = '<div class="ask-question-header">' +
				'<span class="icon">&#10067;</span>' +
				'<span>Claude has a question</span>' +
				'</div>' +
				'<div class="ask-question-content">' +
				questionsHtml +
				buttonsHtml +
				decisionHtml +
				'</div>';

			if (isResolved) {
				messageDiv.classList.add('ask-question-decided');
			}

			messagesDiv.appendChild(messageDiv);
			scrollToBottomIfNeeded(messagesDiv, shouldScroll);

			// Focus the first input only if pending
			if (!isResolved) {
				var firstInput = messageDiv.querySelector('.question-option input, .question-freetext-input');
				if (firstInput) firstInput.focus();
			}
		}

		function submitAskUserQuestionAnswers(requestId) {
			var container = document.getElementById('ask-question-' + requestId);
			if (!container) return;

			var questionBlocks = container.querySelectorAll('.question-block');
			var answers = {};

			questionBlocks.forEach(function(block) {
				var questionText = block.dataset.question;
				var freeTextInput = block.querySelector('.question-freetext-input');
				var freeText = freeTextInput ? freeTextInput.value.trim() : '';

				if (freeText) {
					answers[questionText] = freeText;
				} else {
					var checkedInputs = block.querySelectorAll('.question-options input:checked');
					if (checkedInputs.length > 0) {
						var labels = Array.from(checkedInputs).map(function(input) { return input.value; });
						answers[questionText] = labels.join(', ');
					}
				}
			});

			vscode.postMessage({
				type: 'askUserQuestionResponse',
				id: requestId,
				answers: answers
			});
		}

		function updateAskUserQuestionStatus(id, status, answers) {
			var container = document.getElementById('ask-question-' + id);
			if (!container) return;

			container.dataset.status = status;

			var content = container.querySelector('.ask-question-content');
			var buttons = container.querySelector('.ask-question-buttons');
			if (buttons) buttons.style.display = 'none';

			// Disable all inputs
			container.querySelectorAll('input').forEach(function(input) {
				input.disabled = true;
			});

			if (status === 'answered' && answers) {
				var summaryDiv = document.createElement('div');
				summaryDiv.className = 'ask-question-decision allowed';
				var summaryHtml = '';
				for (var question in answers) {
					if (answers.hasOwnProperty(question)) {
						summaryHtml += '<div><strong>' + escapeHtml(question) + '</strong>: ' + escapeHtml(answers[question]) + '</div>';
					}
				}
				summaryDiv.innerHTML = summaryHtml;
				content.appendChild(summaryDiv);
			} else if (status === 'cancelled') {
				var cancelDiv = document.createElement('div');
				cancelDiv.className = 'ask-question-decision expired';
				cancelDiv.innerHTML = 'This question expired';
				content.appendChild(cancelDiv);
			}

			container.classList.add('ask-question-decided');
		}

		window.submitAskUserQuestionAnswers = submitAskUserQuestionAnswers;

		// Session management functions
		function newSession() {
			sendStats('New chat');
			attachedImages = [];
			renderImagePreviews();

			vscode.postMessage({
				type: 'newSession'
			});
		}

		function restoreToCommit(commitSha) {
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


		function addAttachedImage(filePath, previewUri) {
			attachedImages.push({ filePath, previewUri });
			renderImagePreviews();
			messageInput.focus();
		}

		function removeAttachedImage(index) {
			attachedImages.splice(index, 1);
			renderImagePreviews();
		}

		function renderImagePreviews() {
			const container = document.getElementById('imagePreviewContainer');
			if (attachedImages.length === 0) {
				container.style.display = 'none';
				container.innerHTML = '';
				return;
			}
			container.style.display = 'flex';
			container.innerHTML = attachedImages.map((img, i) =>
				'<div class="image-preview-item">' +
					'<img src="' + img.previewUri + '" />' +
					'<button class="image-preview-remove" onclick="removeAttachedImage(' + i + ')">&times;</button>' +
				'</div>'
			).join('');
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

		function showSupportModal() {
			document.getElementById('supportModal').style.display = 'flex';
		}

		function hideSupportModal() {
			document.getElementById('supportModal').style.display = 'none';
		}

		async function submitSupport() {
			var type = document.getElementById('supportType').value;
			var email = document.getElementById('supportEmail').value.trim();
			var message = document.getElementById('supportMessage').value.trim();
			if (!message) { return; }

			sendStats('Support attempted', { type: type });
			var btn = document.getElementById('supportSubmitBtn');
			btn.textContent = 'Sending...';
			btn.disabled = true;

			try {
				var res = await fetch('https://claudecodechat.com/api/support', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ type: type, email: email, message: message })
				});
				if (res.ok) {
					btn.textContent = 'Sent!';
					sendStats('Support submitted', { type: type });
					setTimeout(function() {
						hideSupportModal();
						document.getElementById('supportMessage').value = '';
						document.getElementById('supportEmail').value = '';
						btn.textContent = 'Send';
						btn.disabled = false;
					}, 1500);
				} else {
					btn.textContent = 'Failed — try again';
					btn.disabled = false;
				}
			} catch (e) {
				btn.textContent = 'Failed — try again';
				btn.disabled = false;
			}
		}

		function updateSettings() {
			// Note: thinking intensity is now handled separately in the thinking intensity modal

			const wslEnabled = document.getElementById('wsl-enabled').checked;
			const wslDistro = document.getElementById('wsl-distro').value;
			const wslNodePath = document.getElementById('wsl-node-path').value;
			const wslClaudePath = document.getElementById('wsl-claude-path').value;
			const yoloMode = document.getElementById('yolo-mode').checked;
			const executablePath = document.getElementById('executable-path').value;
			const useRouter = document.getElementById('use-router')?.checked || false;

			// Collect environment variables from key-value UI
			const envVariables = getEnvVariablesFromUI();
			const windowsSound = document.getElementById('windows-sound').checked;
			const customSoundPath = document.getElementById('custom-sound-path').value;

			// Update WSL options visibility
			document.getElementById('wslOptions').style.display = wslEnabled ? 'block' : 'none';

			// Update OpenCredits state from current env vars
			const baseUrl = envVariables['ANTHROPIC_BASE_URL'] || '';
			const wasOpenCredits = hasOpenCreditsKey;
			hasOpenCreditsKey = !!(baseUrl && (baseUrl.includes('opencredits') || baseUrl.includes('localhost:8787')));
			if (!hasOpenCreditsKey) {
				openCreditsBalance = null;
				// If a OpenCredits model was selected, revert to default
				if (wasOpenCredits && isOpenCreditsModel(currentModel)) {
					selectModel('default');
				}
			}
			updateStatusWithTotals();
			updateOpenCreditsPromo();

			// Send settings to VS Code immediately
			sendStats('Settings changed', {
				wsl_enabled: wslEnabled,
				yolo_mode: yoloMode,
				router_enabled: useRouter,
				has_custom_envs: Object.keys(envVariables).length > 0,
				has_custom_executable: !!executablePath
			});
			vscode.postMessage({
				type: 'updateSettings',
				settings: {
					'wsl.enabled': wslEnabled,
					'wsl.distro': wslDistro || 'Ubuntu',
					'wsl.nodePath': wslNodePath,
					'wsl.claudePath': wslClaudePath || '/usr/local/bin/claude',
					'permissions.yoloMode': yoloMode,
					'executable.path': executablePath,
					'environment.variables': envVariables,
					'router.enabled': useRouter,
					'notifications.windowsSound': windowsSound,
					'notifications.customSoundPath': customSoundPath || ''
				}
			});
		}

		// Provider region filtering
		function applyProviderExclusion() {
			var enabled = document.getElementById('us-eu-providers-only').checked;
			var envVars = getEnvVariablesFromUI();

			if (enabled) {
				envVars['ANTHROPIC_CUSTOM_HEADERS'] = 'X-Only-Providers: US,EU';
			} else {
				delete envVars['ANTHROPIC_CUSTOM_HEADERS'];
			}

			vscode.postMessage({
				type: 'updateSettings',
				settings: {
					'environment.variables': envVars
				}
			});
		}

		// Environment variables key-value UI functions
		function getEnvVariablesFromUI() {
			const envVars = {};
			const rows = document.querySelectorAll('.env-variable-row');
			rows.forEach(row => {
				const keyInput = row.querySelector('.env-key');
				const valueInput = row.querySelector('.env-value');
				if (keyInput && valueInput && keyInput.value.trim()) {
					envVars[keyInput.value.trim()] = valueInput.value;
				}
			});
			return envVars;
		}

		function renderEnvVariables(envVars) {
			const container = document.getElementById('env-variables-list');
			container.innerHTML = '';

			const entries = Object.entries(envVars || {});
			if (entries.length === 0) {
				// Always show at least one empty row
				addEnvVariableRow('', '');
			} else {
				entries.forEach(([key, value]) => {
					addEnvVariableRow(key, value);
				});
			}
		}

		function addEnvVariable() {
			addEnvVariableRow('', '');
		}

		function addEnvVariableRow(key, value) {
			const container = document.getElementById('env-variables-list');
			const row = document.createElement('div');
			row.className = 'env-variable-row';
			row.innerHTML = '<input type="text" class="env-key" placeholder="KEY" value="' + (key || '') + '" onchange="updateSettings()">' +
				'<input type="text" class="env-value" placeholder="value" value="' + (value || '') + '" onchange="updateSettings()">' +
				'<button class="env-variable-remove" onclick="removeEnvVariable(this)" title="Remove">✕</button>';
			container.appendChild(row);
		}

		function removeEnvVariable(btn) {
			btn.closest('.env-variable-row').remove();
			updateSettings();
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
				document.getElementById('wsl-node-path').value = message.data['wsl.nodePath'] ?? '';
				document.getElementById('wsl-claude-path').value = message.data['wsl.claudePath'] || '/usr/local/bin/claude';
				document.getElementById('yolo-mode').checked = message.data['permissions.yoloMode'] || false;
				document.getElementById('windows-sound').checked = message.data['notifications.windowsSound'] || false;
				document.getElementById('custom-sound-path').value = message.data['notifications.customSoundPath'] || '';
				
				// Update yolo warning visibility
				updateYoloWarning();

				// Show/hide WSL options
				document.getElementById('wslOptions').style.display = message.data['wsl.enabled'] ? 'block' : 'none';

				// Update router checkbox
				const useRouterCheckbox = document.getElementById('use-router');
				if (useRouterCheckbox) {
					useRouterCheckbox.checked = message.data['router.enabled'] || false;
				}

				// Update Customize Claude Command settings
				document.getElementById('executable-path').value = message.data['executable.path'] || '';
				renderEnvVariables(message.data['environment.variables'] || {});

				// Detect OpenCredits and envs disabled state
				envsDisabled = !!(message.data['environment.disabled']);
				const envVars = message.data['environment.variables'] || {};
				const wasOpenCreditsSettings = hasOpenCreditsKey;
				hasOpenCreditsKey = !!(message.data['isOpenCredits'] || (!envsDisabled && envVars['ANTHROPIC_BASE_URL'] && (envVars['ANTHROPIC_BASE_URL'].includes('opencredits') || envVars['ANTHROPIC_BASE_URL'].includes('localhost:8787'))));

				// Show/hide provider exclusion based on OpenCredits
				var providerSection = document.getElementById('providerExclusionSection');
				if (providerSection) {
					providerSection.style.display = hasOpenCreditsKey ? '' : 'none';
				}
				var providerHint = document.getElementById('providerExclusionHint');
				if (providerHint) {
					providerHint.style.display = hasOpenCreditsKey ? '' : 'none';
				}
				// Restore provider region state from env vars
				var customHeaders = envVars['ANTHROPIC_CUSTOM_HEADERS'] || '';
				var usEuCheckbox = document.getElementById('us-eu-providers-only');
				if (usEuCheckbox) {
					usEuCheckbox.checked = customHeaders.indexOf('X-Only-Providers:') !== -1;
				}
				if (!hasOpenCreditsKey) {
					openCreditsBalance = null;
					// If a OpenCredits model was selected, revert to default
					if (wasOpenCreditsSettings && isOpenCreditsModel(currentModel)) {
						selectModel('default', true);
					}
				}
				// If the user manually changed the model env vars, reflect in the UI
				var envSonnetModel = envVars['ANTHROPIC_DEFAULT_SONNET_MODEL'];
				if (envSonnetModel && envSonnetModel !== currentModel) {
					// Check if it matches a known OpenCredits model
					var matchingModel = openCreditsModels.find(function(m) { return m.id === envSonnetModel; });
					if (matchingModel) {
						currentModel = envSonnetModel;
						updateModelSelectionUI();
					} else if (isOpenCreditsModel(envSonnetModel)) {
						// Custom model from env vars - update display
						currentModel = envSonnetModel;
						updateModelSelectionUI();
					}
				} else if (!envSonnetModel && !hasOpenCreditsKey && isOpenCreditsModel(currentModel)) {
					// OpenCredits was removed and model env var is gone — revert to default
					selectModel('default', true);
				}

				updateOpenCreditsPromo();
				updateStatusWithTotals();
			}

			if (message.type === 'openedExternalUrl') {
				const modal = document.getElementById('externalUrlModal');
				const btn = document.getElementById('externalUrlFallbackBtn');
				const urlDisplay = document.getElementById('externalUrlDisplay');
				const copyBtn = document.getElementById('externalUrlCopyBtn');
				urlDisplay.textContent = message.url;
				modal.style.display = 'flex';
				btn.onclick = () => {
					vscode.postMessage({ type: 'openExternalUrl', url: message.url });
					modal.style.display = 'none';
				};
				copyBtn.onclick = () => {
					navigator.clipboard.writeText(message.url);
					copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
					setTimeout(() => {
						copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';
					}, 1500);
				};
			}

			if (message.type === 'envVarsData' && message.data) {
				var d = message.data;
				if (comboSonnet && comboSonnet.setValue) comboSonnet.setValue(d['ANTHROPIC_DEFAULT_SONNET_MODEL'] || '');
				if (comboOpus && comboOpus.setValue) comboOpus.setValue(d['ANTHROPIC_DEFAULT_OPUS_MODEL'] || '');
				if (comboHaiku && comboHaiku.setValue) comboHaiku.setValue(d['ANTHROPIC_DEFAULT_HAIKU_MODEL'] || '');
			}

			if (message.type === 'opencreditsBalance') {
				openCreditsBalance = message.balance;
				updateStatusWithTotals();
				updateOpenCreditsPromo();
			}

			if (message.type === 'featureFlags') {
				opencreditsEnabled = !!message.opencredits_enabled;
				if (opencreditsEnabled) {
					sendStats('OpenCredits enabled');
				}
				renderQuickButtons();
				// Check if there's a saved key we can restore
				vscode.postMessage({ type: 'checkSavedOpenCredits' });
			}

			if (message.type === 'savedOpenCreditsStatus') {
				hasSavedOpenCreditsKey = !!message.hasSavedKey;
				updateOpenCreditsPromo();
			}

			if (message.type === 'updateRecommendedModels' && message.models) {
				openCreditsModels = message.models.map(function(m) {
					return {
						id: m.id,
						name: m.name,
						provider: m.provider,
						quickLabel: m.quickLabel,
						credits_per_request: m.credits_per_request || null,
						tierModels: m.tierModels
					};
				});
				// Update credits_per_request from live pricing data
				if (message.creditsPricing && message.creditsPricing.models) {
					var pricingById = {};
					message.creditsPricing.models.forEach(function(p) { pricingById[p.id] = p.credits_per_request; });
					openCreditsModels.forEach(function(m) {
						if (pricingById[m.id] != null) m.credits_per_request = pricingById[m.id];
					});
					// Store reference model pricing
					creditsPricingData = message.creditsPricing;
				}
				renderQuickButtons();
				renderOpenCreditsModelCards();
			}

			if (message.type === 'opencreditsKeyReceived') {
				hasOpenCreditsKey = true;
			}

			if (message.type === 'checkoutSaveError') {
				showCheckoutError(message.message || 'Failed to save credentials. Please try again.');
			}

			if (message.type === 'opencreditsActivated') {
				hasOpenCreditsKey = true;
				openCreditsBalance = message.balance;
				if (message.model) {
					selectModel(message.model, true);
				}
				updateStatusWithTotals();
			}

			if (message.type === 'platformInfo') {
				isWindows = !!message.data.isWindows;
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

	${getSkillsScript()}
	${getPluginsScript()}
	</script>`

export default getScript;
