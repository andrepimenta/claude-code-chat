export const chatStyles = `
    .chat-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .messages {
        flex: 1;
        padding: 12px 16px;
        overflow-y: auto;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
        font-size: 12px;
        line-height: 1.6;
    }

    .message {
        margin-bottom: 12px;
        padding: 12px;
        border-radius: 6px;
    }

    .message.user {
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        color: #e0e0e0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        position: relative;
        overflow: hidden;
        background-color: #242424;
        padding: 14px;
    }

    .message.user::before {
        display: none;
    }

    .message.claude {
        border: none;
        border-radius: 0;
        color: #d4d4d4;
        position: relative;
        overflow: hidden;
        background-color: transparent;
        padding: 4px 0;
        font-size: 13px;
        line-height: 1.5;
        font-weight: 400;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }

    .message.claude::before {
        display: none;
    }

    .message.error {
        border: 1px solid rgba(231, 76, 60, 0.3);
        border-radius: 8px;
        color: var(--vscode-editor-foreground);
        position: relative;
        overflow: hidden;
    }

    .message.error::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: linear-gradient(180deg, #e74c3c 0%, #c0392b 100%);
    }

    .message.system {
        background-color: var(--vscode-panel-background);
        color: var(--vscode-descriptionForeground);
        font-style: italic;
    }

    .message.tool {
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 6px;
        color: #999999;
        position: relative;
        overflow: hidden;
        background-color: #212121;
        padding: 12px;
        font-size: 11px;
        margin-bottom: 8px;
    }

    .message.tool::before {
        display: none;
    }

    .message.tool-result {
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 6px;
        color: #cccccc;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
        white-space: pre-wrap;
        position: relative;
        overflow: hidden;
        background-color: #212121;
        padding: 12px;
        font-size: 12px;
        margin-bottom: 8px;
    }

    .message.tool-result::before {
        display: none;
    }

    .message.thinking {
        border: none;
        border-radius: 0;
        color: #999999;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-style: italic;
        opacity: 0.8;
        position: relative;
        overflow: hidden;
        background-color: transparent;
        padding: 4px 0;
        font-size: 13px;
    }

    .message.thinking::before {
        content: 'thinking... ';
        color: #808080;
        font-style: normal;
        font-weight: 400;
    }

    .message.thinking::before {
        display: none;
    }

    .message-header {
        display: none;
    }
    
    .message.user .message-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
        opacity: 0;
        transition: opacity 0.2s ease;
    }
    
    .message.user:hover .message-header {
        opacity: 1;
    }
    
    .message.claude .message-header {
        display: none;
    }

    .copy-btn {
        background: transparent;
        border: none;
        color: var(--vscode-descriptionForeground);
        cursor: pointer;
        padding: 2px;
        border-radius: 3px;
        opacity: 0;
        transition: opacity 0.2s ease;
        margin-left: auto;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .message:hover .copy-btn {
        opacity: 0.7;
    }

    .copy-btn:hover {
        opacity: 1;
        background-color: var(--vscode-list-hoverBackground);
    }

    .message-icon {
        width: 16px;
        height: 16px;
        border-radius: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 9px;
        color: #808080;
        font-weight: 400;
        flex-shrink: 0;
        margin-left: 0;
    }

    .message-icon.user {
        background: rgba(255, 255, 255, 0.06);
    }

    .message-icon.claude {
        background: transparent;
    }

    .message-icon.system {
        background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
    }

    .message-icon.error {
        background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    }

    .message-label {
        font-weight: 400;
        font-size: 11px;
        opacity: 0.5;
        text-transform: none;
        letter-spacing: 0;
        color: #606060;
    }

    .message-content {
        padding-left: 6px;
    }

    /* Code blocks generated by markdown parser only */
    .message-content pre.code-block {
        background-color: #242424;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        padding: 12px;
        margin: 8px 0;
        overflow-x: auto;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
        font-size: 12px;
        line-height: 1.5;
        white-space: pre;
    }

    .message-content pre.code-block code {
        background: none;
        border: none;
        padding: 0;
        color: var(--vscode-editor-foreground);
    }

    .code-line {
        white-space: pre-wrap;
        word-break: break-word;
    }

    /* Code block container and header */
    .code-block-container {
        margin: 8px 0;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        background-color: #242424;
        overflow: hidden;
    }

    .code-block-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 6px;
        background-color: var(--vscode-editor-background);
        border-bottom: 1px solid var(--vscode-panel-border);
        font-size: 10px;
    }

    .code-block-language {
        color: var(--vscode-descriptionForeground);
        font-family: var(--vscode-editor-font-family);
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .code-copy-btn {
        background: none;
        border: none;
        color: var(--vscode-descriptionForeground);
        cursor: pointer;
        padding: 4px;
        border-radius: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        opacity: 0.7;
    }

    .code-copy-btn:hover {
        background-color: var(--vscode-list-hoverBackground);
        opacity: 1;
    }

    .code-block-container .code-block {
        margin: 0;
        border: none;
        border-radius: 0;
        background: none;
    }

    /* Inline code */
    .message-content code {
        background-color: rgba(255, 255, 255, 0.06);
        border: none;
        border-radius: 3px;
        padding: 2px 4px;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
        font-size: 0.9em;
        color: #cccccc;
    }

    .priority-badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-left: 6px;
    }

    .priority-badge.high {
        background: rgba(231, 76, 60, 0.15);
        color: #e74c3c;
        border: 1px solid rgba(231, 76, 60, 0.3);
    }

    .priority-badge.medium {
        background: rgba(243, 156, 18, 0.15);
        color: #f39c12;
        border: 1px solid rgba(243, 156, 18, 0.3);
    }

    .priority-badge.low {
        background: rgba(149, 165, 166, 0.15);
        color: #95a5a6;
        border: 1px solid rgba(149, 165, 166, 0.3);
    }

    /* Diff display styles for Edit tool */
    .diff-container {
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        overflow: hidden;
    }

    .diff-header {
        background-color: var(--vscode-panel-background);
        padding: 6px 12px;
        font-size: 11px;
        font-weight: 600;
        color: var(--vscode-foreground);
        border-bottom: 1px solid var(--vscode-panel-border);
    }

    .diff-removed,
    .diff-added {
        font-family: var(--vscode-editor-font-family);
        font-size: 12px;
        line-height: 1.4;
    }

    .diff-line {
        padding: 2px 12px;
        white-space: pre-wrap;
        word-break: break-word;
    }

    .diff-line.removed {
        background-color: rgba(244, 67, 54, 0.1);
        border-left: 3px solid rgba(244, 67, 54, 0.6);
        color: var(--vscode-foreground);
    }

    .diff-line.added {
        background-color: rgba(76, 175, 80, 0.1);
        border-left: 3px solid rgba(76, 175, 80, 0.6);
        color: var(--vscode-foreground);
    }

    .diff-line.removed::before {
        content: '';
        color: rgba(244, 67, 54, 0.8);
        font-weight: 600;
        margin-right: 8px;
    }

    .diff-line.added::before {
        content: '';
        color: rgba(76, 175, 80, 0.8);
        font-weight: 600;
        margin-right: 8px;
    }

    .diff-expand-container {
        padding: 8px 12px;
        text-align: center;
        border-top: 1px solid var(--vscode-panel-border);
        background-color: var(--vscode-editor-background);
    }

    .diff-expand-btn {
        background: linear-gradient(135deg, rgba(64, 165, 255, 0.15) 0%, rgba(64, 165, 255, 0.1) 100%);
        border: 1px solid rgba(64, 165, 255, 0.3);
        color: #40a5ff;
        padding: 4px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    .diff-expand-btn:hover {
        background: linear-gradient(135deg, rgba(64, 165, 255, 0.25) 0%, rgba(64, 165, 255, 0.15) 100%);
        border-color: rgba(64, 165, 255, 0.5);
    }

    .diff-expand-btn:active {
        transform: translateY(1px);
    }

    /* MultiEdit specific styles */
    .single-edit {
        margin-bottom: 12px;
    }

    .edit-number {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: var(--vscode-descriptionForeground);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        margin-top: 6px;
        display: inline-block;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .diff-edit-separator {
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        margin: 12px 0;
    }

    /* File path display styles */
    .diff-file-path {
        padding: 8px 12px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .diff-file-path:hover {
        background-color: var(--vscode-list-hoverBackground);
        border-color: var(--vscode-focusBorder);
    }

    .diff-file-path:active {
        transform: translateY(1px);
    }

    .file-path-short,
    .file-path-truncated {
        font-family: var(--vscode-editor-font-family);
        color: var(--vscode-foreground);
        font-weight: 500;
    }

    .file-path-truncated {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        padding: 2px 4px;
        border-radius: 3px;
    }

    .file-path-truncated .file-icon {
        font-size: 14px;
        opacity: 0.7;
        transition: opacity 0.2s ease;
    }

    .file-path-truncated:hover {
        color: var(--vscode-textLink-foreground);
        background-color: var(--vscode-list-hoverBackground);
    }

    .file-path-truncated:hover .file-icon {
        opacity: 1;
    }

    .file-path-truncated:active {
        transform: translateY(1px);
    }

    .expand-btn {
        background: linear-gradient(135deg, rgba(64, 165, 255, 0.15) 0%, rgba(64, 165, 255, 0.1) 100%);
        border: 1px solid rgba(64, 165, 255, 0.3);
        color: #40a5ff;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        margin-left: 6px;
        display: inline-block;
    }

    /* Conversation History Styles */
    #conversationHistory {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background-color: var(--vscode-editor-background);
        height: 100%;
        min-height: 0;
    }

    .history-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 16px;
        overflow: hidden;
        height: 100%;
        min-height: 0;
    }

    .history-content h3 {
        margin: 0 0 16px 0;
        color: var(--vscode-foreground);
        font-size: 16px;
        font-weight: 600;
        flex-shrink: 0;
    }

    #conversationList {
        flex: 1;
        overflow-y: auto;
        min-height: 0;
        height: 0;
        padding-bottom: 16px;
    }

`;