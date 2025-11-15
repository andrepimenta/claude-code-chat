const styles = `
<style>
    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', system-ui, sans-serif;
        background-color: var(--vscode-editor-background);
        color: var(--vscode-editor-foreground);
        margin: 0;
        padding: 0;
        height: 100vh;
        display: flex;
        flex-direction: column;
    }

    .header {
        padding: 10px 16px;
        border-bottom: 1px solid var(--vscode-panel-border);
        background-color: var(--vscode-editor-background);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
    }

    .header h2 {
        margin: 0;
        font-size: 13px;
        font-weight: 500;
        color: var(--vscode-foreground);
        letter-spacing: -0.01em;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', system-ui, sans-serif;
    }

    .controls {
        display: flex;
        gap: 6px;
        align-items: center;
    }

    .btn {
        background-color: transparent;
        color: var(--vscode-foreground);
        border: 1px solid var(--vscode-panel-border);
        padding: 5px 10px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 400;
        transition: all 0.15s ease;
        display: flex;
        align-items: center;
        gap: 6px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', system-ui, sans-serif;
    }

    .btn:hover {
        background-color: var(--vscode-list-hoverBackground);
        border-color: var(--vscode-panel-border);
    }

    .btn:active {
        opacity: 0.8;
    }

    .btn.outlined {
        background-color: transparent;
        color: var(--vscode-foreground);
        border: 1px solid var(--vscode-panel-border);
    }

    .btn.outlined:hover {
        background-color: var(--vscode-list-hoverBackground);
        border-color: var(--vscode-panel-border);
    }

    .btn.primary {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
    }

    .btn.primary:hover {
        background-color: var(--vscode-button-hoverBackground);
    }

    .stop-btn {
        background-color: var(--vscode-inputValidation-errorBackground);
        color: var(--vscode-inputValidation-errorForeground);
        border: 1px solid var(--vscode-inputValidation-errorBorder);
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-width: 70px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', system-ui, sans-serif;
    }

    .stop-btn svg {
        width: 14px;
        height: 14px;
        flex-shrink: 0;
    }

    .stop-btn span {
        line-height: 1;
        letter-spacing: 0.01em;
    }

    .stop-btn:hover {
        background-color: var(--vscode-inputValidation-errorForeground);
        color: var(--vscode-inputValidation-errorBackground);
        box-shadow: 0 2px 6px rgba(231, 76, 60, 0.3);
        transform: translateY(-1px);
    }

    .stop-btn:active {
        transform: translateY(0);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    /* Permission Request - Simple Design */
    .permission-request {
        margin: 8px 0;
        background-color: transparent;
        border: none;
        border-radius: 0;
        padding: 0;
        animation: none;
    }

    .permission-header {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 6px;
        font-weight: 500;
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        opacity: 0.6;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .permission-header .icon {
        font-size: 12px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .permission-header .icon svg {
        width: 12px;
        height: 12px;
        stroke-width: 2;
    }

    .permission-menu {
        position: relative;
        margin-left: auto;
    }

    .permission-menu-btn {
        background: none;
        border: none;
        color: var(--vscode-descriptionForeground);
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 0;
        font-size: 14px;
        font-weight: 400;
        transition: opacity 0.15s ease;
        line-height: 1;
        opacity: 0.6;
    }

    .permission-menu-btn:hover {
        background-color: transparent;
        color: var(--vscode-foreground);
        opacity: 1;
    }

    .permission-menu-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        background-color: var(--vscode-menu-background);
        border: 1px solid var(--vscode-menu-border);
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        min-width: 200px;
        padding: 4px 0;
        margin-top: 4px;
    }

    .permission-menu-item {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        padding: 6px 12px;
        background: none;
        border: none;
        width: 100%;
        text-align: left;
        cursor: pointer;
        color: var(--vscode-foreground);
        transition: background-color 0.15s ease;
    }

    .permission-menu-item:hover {
        background-color: var(--vscode-list-hoverBackground);
    }

    .permission-menu-item .menu-icon {
        font-size: 14px;
        margin-top: 1px;
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .permission-menu-item .menu-icon svg {
        width: 14px;
        height: 14px;
        stroke-width: 2;
    }

    .permission-menu-item .menu-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .permission-menu-item .menu-title {
        font-weight: 500;
        font-size: 12px;
        line-height: 1.2;
    }

    .permission-menu-item .menu-subtitle {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
        opacity: 0.7;
        line-height: 1.2;
    }

    .permission-content {
        font-size: 12px;
        line-height: 1.5;
        color: var(--vscode-foreground);
        opacity: 0.9;
        margin-top: 4px;
    }

    .permission-tool {
        font-family: var(--vscode-editor-font-family);
        background-color: transparent;
        border: none;
        border-radius: 0;
        padding: 0;
        margin: 0;
        font-size: 12px;
        color: var(--vscode-editor-foreground);
        opacity: 0.9;
    }

    .permission-buttons {
        margin-top: 8px;
        display: flex;
        gap: 6px;
        justify-content: flex-start;
        flex-wrap: wrap;
    }

    .permission-buttons .btn {
        font-size: 11px;
        padding: 4px 10px;
        min-width: 60px;
        text-align: center;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 24px;
        border-radius: 4px;
        border: 1px solid;
        cursor: pointer;
        transition: all 0.15s ease;
        white-space: nowrap;
        box-sizing: border-box;
    }

    .permission-buttons .btn.allow {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border-color: var(--vscode-button-background);
    }

    .permission-buttons .btn.allow:hover {
        background-color: var(--vscode-button-hoverBackground);
    }

    .permission-buttons .btn.deny {
        background-color: transparent;
        color: var(--vscode-foreground);
        border-color: var(--vscode-panel-border);
    }

    .permission-buttons .btn.deny:hover {
        background-color: var(--vscode-list-hoverBackground);
        border-color: var(--vscode-focusBorder);
    }

    .permission-buttons .btn.always-allow {
        background-color: transparent;
        color: var(--vscode-textLink-foreground);
        border-color: var(--vscode-textLink-foreground);
        font-weight: 400;
        min-width: auto;
        padding: 4px 10px;
        height: 24px;
    }

    .permission-buttons .btn.always-allow:hover {
        background-color: var(--vscode-textLink-foreground);
        color: var(--vscode-editor-background);
    }

    .permission-buttons .btn.always-allow code {
        background-color: rgba(0, 0, 0, 0.2);
        padding: 2px 4px;
        border-radius: 10px;
        font-family: var(--vscode-editor-font-family);
        font-size: 11px;
        color: var(--vscode-editor-foreground);
        margin-left: 4px;
        display: inline;
        line-height: 1;
        vertical-align: baseline;
    }

    .permission-decision {
        font-size: 13px;
        font-weight: 600;
        padding: 6px 16px;
        text-align: center;
        border-radius: 8px;
        margin-top: 8px;
    }

    .permission-decision.allowed {
        background-color: rgba(0, 122, 204, 0.15);
        color: var(--vscode-charts-blue);
        border: 1px solid rgba(0, 122, 204, 0.3);
    }

    .permission-decision.denied {
        background-color: rgba(231, 76, 60, 0.15);
        color: #e74c3c;
        border: 1px solid rgba(231, 76, 60, 0.3);
    }

    .permission-decided {
        opacity: 0.7;
        pointer-events: none;
    }

    .permission-decided .permission-buttons {
        display: none;
    }

    .permission-decided.allowed {
        border-color: var(--vscode-inputValidation-infoBackground);
        background-color: rgba(0, 122, 204, 0.1);
    }

    .permission-decided.denied {
        border-color: var(--vscode-inputValidation-errorBorder);
        background-color: var(--vscode-inputValidation-errorBackground);
    }

    /* Permissions Management */
    .permissions-list {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 10px;
        background-color: var(--vscode-input-background);
        margin-top: 8px;
    }

    .permission-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-left: 6px;
        padding-right: 6px;
        border-bottom: 1px solid var(--vscode-panel-border);
        transition: background-color 0.2s ease;
        min-height: 32px;
    }

    .permission-item:hover {
        background-color: var(--vscode-list-hoverBackground);
    }

    .permission-item:last-child {
        border-bottom: none;
    }

    .permission-info {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-grow: 1;
        min-width: 0;
    }

    .permission-tool {
        background-color: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
        padding: 3px 6px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        flex-shrink: 0;
        height: 18px;
        display: inline-flex;
        align-items: center;
        line-height: 1;
    }

    .permission-command {
        font-size: 12px;
        color: var(--vscode-foreground);
        flex-grow: 1;
    }

    .permission-command code {
        background-color: var(--vscode-textCodeBlock-background);
        padding: 3px 6px;
        border-radius: 10px;
        font-family: var(--vscode-editor-font-family);
        color: var(--vscode-textLink-foreground);
        font-size: 11px;
        height: 18px;
        display: inline-flex;
        align-items: center;
        line-height: 1;
    }

    .permission-desc {
        color: var(--vscode-descriptionForeground);
        font-size: 11px;
        font-style: italic;
        flex-grow: 1;
        height: 18px;
        display: inline-flex;
        align-items: center;
        line-height: 1;
    }

    .permission-remove-btn {
        background-color: transparent;
        color: var(--vscode-descriptionForeground);
        border: none;
        padding: 4px 10px;
        border-radius: 10px;
        cursor: pointer;
        font-size: 10px;
        transition: all 0.2s ease;
        font-weight: 500;
        flex-shrink: 0;
        opacity: 0.7;
    }

    .permission-remove-btn:hover {
        background-color: rgba(231, 76, 60, 0.1);
        color: var(--vscode-errorForeground);
        opacity: 1;
    }

    .permissions-empty {
        padding: 8px;
        text-align: center;
        color: var(--vscode-descriptionForeground);
        font-style: italic;
        font-size: 13px;
    }

    .permissions-empty::before {
        content: "";
        display: block;
        width: 24px;
        height: 24px;
        margin: 0 auto 8px auto;
        opacity: 0.5;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='11' width='18' height='11' rx='2' ry='2'%3E%3C/rect%3E%3Cpath d='M7 11V7a5 5 0 0 1 10 0v4'%3E%3C/path%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: center;
        background-size: contain;
    }

    /* Add Permission Form */
    .permissions-add-section {
        margin-top: 6px;
    }

    .permissions-show-add-btn {
        background-color: transparent;
        color: var(--vscode-descriptionForeground);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 10px;
        padding: 6px 8px;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: 400;
        opacity: 0.7;
    }

    .permissions-show-add-btn:hover {
        background-color: var(--vscode-list-hoverBackground);
        opacity: 1;
    }

    .permissions-add-form {
        margin-top: 8px;
        padding: 6px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 10px;
        background-color: var(--vscode-input-background);
        animation: slideDown 0.2s ease;
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .permissions-form-row {
        display: flex;
        gap: 8px;
        align-items: center;
        margin-bottom: 8px;
    }

    .permissions-tool-select {
        background-color: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 10px;
        padding: 4px 10px;
        font-size: 12px;
        min-width: 100px;
        height: 24px;
        flex-shrink: 0;
    }

    .permissions-command-input {
        background-color: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 10px;
        padding: 4px 10px;
        font-size: 12px;
        flex-grow: 1;
        height: 24px;
        font-family: var(--vscode-editor-font-family);
    }

    .permissions-command-input::placeholder {
        color: var(--vscode-input-placeholderForeground);
    }

    .permissions-add-btn {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        border-radius: 10px;
        padding: 4px 12px;
        font-size: 12px;
        cursor: pointer;
        transition: background-color 0.2s ease;
        height: 24px;
        font-weight: 500;
        flex-shrink: 0;
    }

    .permissions-add-btn:hover {
        background-color: var(--vscode-button-hoverBackground);
    }

    .permissions-add-btn:disabled {
        background-color: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        cursor: not-allowed;
        opacity: 0.5;
    }

    .permissions-cancel-btn {
        background-color: transparent;
        color: var(--vscode-foreground);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 10px;
        padding: 4px 12px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        height: 24px;
        font-weight: 500;
    }

    .permissions-cancel-btn:hover {
        background-color: var(--vscode-list-hoverBackground);
        border-color: var(--vscode-focusBorder);
    }

    .permissions-form-hint {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        font-style: italic;
        line-height: 1.3;
    }

    .yolo-mode-section {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 12px;
        opacity: 1;
        transition: opacity 0.2s ease;
    }

    .yolo-mode-section:hover {
        opacity: 1;
    }

    .yolo-mode-section input[type="checkbox"] {
        transform: scale(0.9);
        margin: 0;
    }

    .yolo-mode-section label {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        cursor: pointer;
        font-weight: 400;
    }

    /* WSL Alert */
    .wsl-alert {
        margin: 8px 12px;
        background-color: rgba(135, 206, 235, 0.1);
        border: 2px solid rgba(135, 206, 235, 0.3);
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(4px);
        animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .wsl-alert-content {
        display: flex;
        align-items: center;
        padding: 14px 18px;
        gap: 14px;
    }

    .wsl-alert-icon {
        font-size: 22px;
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .wsl-alert-icon svg {
        width: 22px;
        height: 22px;
        stroke-width: 2;
    }

    .wsl-alert-text {
        flex: 1;
        font-size: 13px;
        line-height: 1.4;
        color: var(--vscode-foreground);
    }

    .wsl-alert-text strong {
        font-weight: 600;
        color: var(--vscode-foreground);
    }

    .wsl-alert-actions {
        display: flex;
        gap: 6px;
        flex-shrink: 0;
    }

    .wsl-alert-actions .btn {
        padding: 6px 14px;
        font-size: 12px;
        border-radius: 10px;
    }

    .wsl-alert-actions .btn:first-child {
        background-color: rgba(135, 206, 235, 0.2);
        border-color: rgba(135, 206, 235, 0.4);
    }

    .wsl-alert-actions .btn:first-child:hover {
        background-color: rgba(135, 206, 235, 0.3);
        border-color: rgba(135, 206, 235, 0.6);
    }

    .chat-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .messages {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', system-ui, sans-serif;
        font-size: 14px;
        line-height: 1.6;
        max-width: 100%;
        margin: 0;
        width: 100%;
        box-sizing: border-box;
    }

    @media (max-width: 768px) {
        .messages {
            padding: 12px;
        }
        
        .message.user,
        .message.claude {
            padding: 12px;
        }
    }

    @media (min-width: 1200px) {
        .messages {
            max-width: 800px;
            margin: 0 auto;
        }
    }

    .message {
        margin-bottom: 24px;
        padding: 0;
        border-radius: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', system-ui, sans-serif;
        line-height: 1.6;
        font-size: 14px;
        transition: none;
        backdrop-filter: none;
    }

    .message.user {
        background-color: transparent;
        border: none;
        border-radius: 0;
        padding: 0;
        color: var(--vscode-foreground);
        margin-bottom: 24px;
        max-width: 100%;
        box-sizing: border-box;
        word-wrap: break-word;
        overflow-wrap: break-word;
    }

    .message.claude {
        background-color: transparent;
        border: none;
        border-radius: 0;
        padding: 0;
        color: var(--vscode-foreground);
        margin-bottom: 24px;
        max-width: 100%;
        box-sizing: border-box;
        word-wrap: break-word;
        overflow-wrap: break-word;
    }

    .message.error {
        background-color: transparent;
        border: none;
        color: rgba(231, 76, 60, 0.9);
        padding: 0;
        margin-bottom: 12px;
    }

    .message.system {
        background-color: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        font-size: 12px;
        padding: 0;
        margin-bottom: 10px;
    }

    .message.tool {
        background-color: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        padding: 0;
        margin-bottom: 12px;
    }


    .message.tool-result {
        background-color: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.8);
        font-family: var(--vscode-editor-font-family);
        white-space: pre-wrap;
        padding: 0;
        margin-bottom: 12px;
        margin-top: 4px;
    }

    .message.tool-result.success {
        color: rgba(46, 204, 113, 0.9);
    }

    .message.tool-result.success .message-header::before {
        background-color: rgba(46, 204, 113, 0.8);
    }

    /* Terminal Output Styling - Real Terminal Look */
    .message.terminal-output {
        background-color: rgba(0, 0, 0, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 6px;
        padding: 0;
        margin-bottom: 16px;
        margin-top: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        overflow: hidden;
    }

    .message.terminal-output.error {
        border-color: rgba(244, 67, 54, 0.4);
        box-shadow: 0 4px 12px rgba(244, 67, 54, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }

    .message.terminal-output .message-header {
        background: linear-gradient(180deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.95) 100%);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding: 8px 12px;
        margin: 0;
    }

    .message.terminal-output .message-header::before {
        background-color: rgba(33, 150, 243, 0.8);
        width: 3px;
    }

    .message.terminal-output.error .message-header::before {
        background-color: rgba(244, 67, 54, 0.8);
    }

    .message.terminal-output .message-label {
        color: rgba(255, 255, 255, 0.95);
        font-weight: 600;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .message.terminal-output .message-icon.terminal {
        background: linear-gradient(135deg, rgba(33, 150, 243, 0.2) 0%, rgba(33, 150, 243, 0.1) 100%);
        color: rgba(33, 150, 243, 0.9);
    }

    .terminal-content {
        padding: 12px 14px;
        background-color: rgba(0, 0, 0, 0.4);
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'Courier New', 'Fira Code', monospace;
        font-size: 13px;
        line-height: 1.6;
        color: rgba(255, 255, 255, 0.9);
        white-space: pre-wrap;
        word-wrap: break-word;
        overflow-x: auto;
        max-height: 600px;
        overflow-y: auto;
        margin: 0;
    }

    .terminal-output-text {
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'Courier New', 'Fira Code', monospace !important;
        color: rgba(255, 255, 255, 0.95) !important;
        background: transparent !important;
        padding: 0 !important;
        margin: 0 !important;
        white-space: pre-wrap !important;
        word-wrap: break-word !important;
        line-height: 1.6 !important;
    }

    /* Terminal scrollbar styling */
    .terminal-content::-webkit-scrollbar,
    .file-write-streaming::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }

    .terminal-content::-webkit-scrollbar-track,
    .file-write-streaming::-webkit-scrollbar-track {
        background: var(--vscode-scrollbarSlider-background);
        border-radius: 4px;
    }

    .terminal-content::-webkit-scrollbar-thumb,
    .file-write-streaming::-webkit-scrollbar-thumb {
        background: var(--vscode-scrollbarSlider-hoverBackground);
        border-radius: 4px;
    }

    .terminal-content::-webkit-scrollbar-thumb:hover,
    .file-write-streaming::-webkit-scrollbar-thumb:hover {
        background: var(--vscode-scrollbarSlider-activeBackground);
    }

    /* Terminal Container - Simple Design */
    .message.terminal-container {
        background-color: transparent;
        border: none;
        border-radius: 0;
        padding: 0;
        margin-bottom: 12px;
        margin-top: 8px;
        overflow: visible;
        transition: none;
        box-shadow: none;
    }

    .message.terminal-container:hover {
        border-color: transparent;
        box-shadow: none;
    }

    .message.terminal-container.error {
        border-color: transparent;
        background-color: transparent;
    }

    .message.terminal-container .tool-header {
        background-color: transparent;
        border-bottom: none;
        padding: 0;
        margin: 0 0 6px 0;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .message.terminal-container .tool-header.error {
        border-bottom-color: transparent;
    }

    .message.terminal-container .tool-icon {
        background-color: transparent;
        color: var(--vscode-descriptionForeground);
        width: 14px;
        height: 14px;
        border-radius: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        opacity: 0.6;
    }

    .message.terminal-container .tool-info {
        font-size: 11px;
        font-weight: 500;
        color: var(--vscode-descriptionForeground);
        opacity: 0.6;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .message.terminal-container .terminal-content {
        padding: 0;
        background-color: var(--vscode-textCodeBlock-background);
        font-family: var(--vscode-editor-font-family);
        font-size: 12px;
        line-height: 1.5;
        color: var(--vscode-editor-foreground);
        white-space: pre-wrap;
        word-wrap: break-word;
        overflow-x: auto;
        max-height: 400px;
        overflow-y: auto;
        margin: 0;
        border-radius: 4px;
        border: 1px solid var(--vscode-panel-border);
        padding: 8px 10px;
    }

    .terminal-command-line {
        margin-bottom: 8px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--vscode-panel-border);
        display: flex;
        align-items: center;
        gap: 6px;
        padding-top: 0;
    }

    .terminal-prompt {
        color: var(--vscode-descriptionForeground);
        font-weight: 500;
        font-size: 12px;
        user-select: none;
        font-family: var(--vscode-editor-font-family);
        opacity: 0.7;
    }

    .terminal-command {
        color: var(--vscode-editor-foreground);
        font-weight: 400;
        font-size: 12px;
        flex: 1;
        font-family: var(--vscode-editor-font-family);
        word-break: break-all;
    }

    .terminal-output-area {
        color: var(--vscode-editor-foreground);
        white-space: pre-wrap;
        word-wrap: break-word;
        min-height: 20px;
        font-size: 12px;
        line-height: 1.5;
    }

    .terminal-cursor {
        display: inline-block;
        background-color: var(--vscode-editor-foreground);
        width: 2px;
        height: 14px;
        margin-left: 2px;
        animation: terminal-blink 1s infinite;
        vertical-align: middle;
        opacity: 0.8;
    }

    @keyframes terminal-blink {
        0%, 50% { opacity: 0.8; }
        51%, 100% { opacity: 0.2; }
    }

    /* File Write Container - Streaming Code Display */
    .message.file-write-container {
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 8px;
        padding: 0;
        margin-bottom: 20px;
        margin-top: 12px;
        overflow: hidden;
        transition: all 0.2s ease;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .message.file-write-container:hover {
        border-color: var(--vscode-focusBorder);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }

    .message.file-write-container .tool-header {
        background-color: var(--vscode-editor-background);
        border-bottom: 1px solid var(--vscode-panel-border);
        padding: 10px 14px;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .message.file-write-container .tool-icon {
        background-color: var(--vscode-textLink-foreground);
        color: var(--vscode-editor-background);
        width: 20px;
        height: 20px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .message.file-write-container .tool-info {
        font-size: 13px;
        font-weight: 500;
        color: var(--vscode-foreground);
        opacity: 0.9;
    }

    .file-write-content {
        padding: 12px 14px;
        background-color: var(--vscode-editor-background);
    }

    .file-write-path {
        margin-bottom: 10px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--vscode-panel-border);
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .file-write-label {
        color: var(--vscode-descriptionForeground);
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.6;
    }

    .file-write-path-text {
        color: var(--vscode-textLink-foreground);
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.15s ease;
        padding: 0;
        border-radius: 0;
        margin-left: 0;
        font-family: var(--vscode-editor-font-family);
    }

    .file-write-path-text:hover {
        background-color: transparent;
        color: var(--vscode-textLink-activeForeground);
        text-decoration: underline;
    }

    .file-write-streaming {
        background-color: var(--vscode-textCodeBlock-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        padding: 10px 12px;
        overflow-x: auto;
        max-height: 400px;
        overflow-y: auto;
        margin-top: 6px;
    }

    .file-write-code {
        font-family: var(--vscode-editor-font-family);
        font-size: 12px;
        line-height: 1.5;
        color: var(--vscode-editor-foreground);
        margin: 0;
        white-space: pre-wrap;
        word-wrap: break-word;
        background: transparent;
        border: none;
        padding: 0;
    }

    .file-write-cursor {
        display: inline-block;
        background-color: var(--vscode-editor-foreground);
        width: 2px;
        height: 16px;
        margin-left: 2px;
        animation: file-write-blink 1s infinite;
        vertical-align: middle;
        opacity: 0.8;
    }

    @keyframes file-write-blink {
        0%, 50% { opacity: 0.8; }
        51%, 100% { opacity: 0.2; }
    }

    .message.thinking {
        border: none;
        border-radius: 0;
        color: rgba(186, 85, 211, 0.7);
        font-family: var(--vscode-editor-font-family);
        font-style: italic;
        opacity: 0.7;
        position: relative;
        overflow: visible;
        padding: 0;
    }

    .message.thinking::before {
        display: none;
    }

    .tool-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        padding-bottom: 0;
        border-bottom: none;
        opacity: 0.8;
        font-size: 12px;
        position: relative;
        font-weight: 500;
    }

    .tool-header::before {
        content: '';
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
        background-color: rgba(46, 204, 113, 0.8);
    }

    .tool-icon {
        width: 14px;
        height: 14px;
        border-radius: 3px;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        color: rgba(124, 139, 237, 0.7);
        font-weight: 500;
        flex-shrink: 0;
        margin-left: 0;
        opacity: 0.6;
    }

    .tool-icon svg {
        width: 12px;
        height: 12px;
        stroke-width: 2;
    }

    .tool-info {
        font-weight: 500;
        font-size: 13px;
        color: var(--vscode-editor-foreground);
        opacity: 0.8;
    }

    .message-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        padding-bottom: 0;
        border-bottom: none;
        position: relative;
        opacity: 0.7;
    }

    .message.user .message-header {
        opacity: 1;
        margin-bottom: 8px;
        padding-bottom: 0;
        border-bottom: none;
    }

    /* Status dot indicator */
    .message-header::before {
        content: '';
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
        background-color: var(--vscode-descriptionForeground);
        opacity: 0.5;
    }

    .message.user .message-header::before {
        background-color: var(--vscode-button-background);
        opacity: 1;
    }

    .message.claude .message-header {
        opacity: 1;
        margin-bottom: 8px;
        padding-bottom: 0;
        border-bottom: none;
    }

    .message.claude .message-header::before {
        display: none;
    }

    .message.error .message-header::before {
        background-color: rgba(231, 76, 60, 0.8);
    }

    .message.tool .message-header::before {
        background-color: rgba(46, 204, 113, 0.8);
    }

    .message.thinking .message-header::before {
        background-color: rgba(255, 255, 255, 0.4);
    }

    .message-action-buttons {
        display: flex;
        align-items: center;
        gap: 2px;
        opacity: 0;
        transition: opacity 0.2s ease;
    }

    .message:hover .message-action-buttons {
        opacity: 0.7;
    }

    /* User Restore Box - Only shows restore button for user messages */
    .user-restore-box {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        margin-bottom: 16px;
    }

    .user-restore-btn {
        background-color: var(--vscode-input-background);
        border: 1px solid var(--vscode-panel-border);
        color: var(--vscode-foreground);
        cursor: pointer;
        padding: 6px 12px;
        border-radius: 6px;
        transition: all 0.15s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 400;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', system-ui, sans-serif;
    }

    .user-restore-btn:hover {
        background-color: var(--vscode-list-hoverBackground);
        border-color: var(--vscode-focusBorder);
    }

    .user-restore-btn .restore-icon {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .user-restore-btn .restore-icon svg {
        width: 14px;
        height: 14px;
    }

    .user-restore-btn .restore-text {
        line-height: 1;
    }

    .restore-btn,
    .branch-btn {
        background: transparent;
        border: none;
        color: var(--vscode-descriptionForeground);
        cursor: pointer;
        padding: 1px;
        border-radius: 4px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
    }

    .restore-btn svg,
    .branch-btn svg {
        width: 12px;
        height: 12px;
    }

    .restore-btn:hover,
    .branch-btn:hover {
        opacity: 1;
        background-color: var(--vscode-list-hoverBackground);
    }

    .copy-btn {
        background: transparent;
        border: none;
        color: var(--vscode-descriptionForeground);
        cursor: pointer;
        padding: 2px;
        border-radius: 10px;
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
        width: 20px;
        height: 20px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        margin-left: 0;
        position: relative;
        opacity: 0.9;
    }

    .message.user .message-icon {
        opacity: 1;
    }

    .message-icon svg {
        width: 14px;
        height: 14px;
        stroke-width: 2;
    }

    .message-icon.user {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
    }

    .message-icon.claude {
        background-color: transparent;
        color: transparent;
        border-radius: 0;
        padding: 0;
        width: auto;
        height: auto;
    }

    .message-icon.system {
        background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
        color: white;
    }

    .message-icon.error {
        background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
        color: white;
    }

    .message-icon.success {
        background: linear-gradient(135deg, #1cc08c 0%, #16a974 100%);
        color: white;
    }

    /* Status Badge Styles */
    .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        line-height: 1;
    }

    .status-badge svg {
        width: 12px;
        height: 12px;
        stroke-width: 2.5;
        flex-shrink: 0;
    }

    .status-badge.success {
        background: rgba(28, 192, 140, 0.15);
        color: #1cc08c;
        border: 1px solid rgba(28, 192, 140, 0.3);
    }

    .status-badge.error {
        background: rgba(231, 76, 60, 0.15);
        color: #e74c3c;
        border: 1px solid rgba(231, 76, 60, 0.3);
    }

    .status-badge.info {
        background: rgba(64, 165, 255, 0.15);
        color: #40a5ff;
        border: 1px solid rgba(64, 165, 255, 0.3);
    }

    .status-badge.warning {
        background: rgba(255, 149, 0, 0.15);
        color: #ff9500;
        border: 1px solid rgba(255, 149, 0, 0.3);
    }

    .message-label {
        font-weight: 500;
        font-size: 13px;
        opacity: 0.8;
        text-transform: none;
        letter-spacing: 0;
    }

    .message.user .message-label {
        opacity: 1;
    }

    .message-content {
        padding-left: 0;
        margin-top: 0;
        color: var(--vscode-foreground);
    }

    .message.user .message-content {
        padding-left: 0;
        margin-top: 0;
    }

    .message-content p {
        margin: 0.5em 0;
    }

    .message-content p:first-child {
        margin-top: 0;
    }

    .message-content p:last-child {
        margin-bottom: 0;
    }

    /* Code blocks generated by markdown parser only */
    .message-content pre.code-block {
        background-color: var(--vscode-textCodeBlock-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 6px;
        padding: 12px;
        margin: 12px 0;
        overflow-x: auto;
        font-family: var(--vscode-editor-font-family);
        font-size: 13px;
        line-height: 1.5;
        white-space: pre;
        color: var(--vscode-editor-foreground);
    }

    /* Code blocks in user messages */
    .message.user .message-content pre.code-block {
        background-color: var(--vscode-textCodeBlock-background);
        border: 1px solid var(--vscode-panel-border);
    }

    /* Code blocks in AI/claude messages */
    .message.claude .message-content pre.code-block {
        background-color: var(--vscode-textCodeBlock-background);
        border: 1px solid var(--vscode-panel-border);
    }

    .message-content pre.code-block code {
        background: none;
        border: none;
        padding: 0;
        color: inherit;
        font-family: inherit;
    }

    /* Terminal/Command display styling */
    .tool-input-content code,
    .message-content code:not(.code-block code) {
        background-color: var(--vscode-textCodeBlock-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        padding: 2px 6px;
        font-family: var(--vscode-editor-font-family);
        font-size: 13px;
        color: var(--vscode-editor-foreground);
        display: inline-block;
        word-break: break-all;
        max-width: 100%;
        box-sizing: border-box;
    }

    .code-line {
        white-space: pre-wrap;
        word-break: break-word;
    }

    /* Code block container and header */
    .code-block-container {
        margin: 10px 0;
        border: none;
        border-radius: 0;
        background-color: rgba(255, 255, 255, 0.03);
        overflow: hidden;
        padding: 0;
    }

    .code-block-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 10px;
        background-color: transparent;
        border-bottom: none;
        font-size: 11px;
        margin-bottom: 0;
        opacity: 0.7;
        cursor: pointer;
        transition: opacity 0.2s ease;
    }

    .code-block-header:hover {
        opacity: 1;
    }

    .code-block-container.collapsed .code-block {
        display: none;
    }

    .code-block-container.collapsed .code-block-header::after {
        content: '▶';
        margin-left: 8px;
        font-size: 10px;
        opacity: 0.6;
    }

    .code-block-container:not(.collapsed) .code-block-header::after {
        content: '▼';
        margin-left: 8px;
        font-size: 10px;
        opacity: 0.6;
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
        border-radius: 10px;
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
        padding: 8px 12px;
        max-height: 400px;
        overflow-y: auto;
        max-width: 100%;
        box-sizing: border-box;
        word-wrap: break-word;
        overflow-wrap: break-word;
    }

    /* Code block containers in user messages - use boxes */
    .message.user .code-block-container {
        background-color: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(64, 165, 255, 0.3);
        border-left: 3px solid rgba(64, 165, 255, 0.6);
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    /* Code block containers in AI/claude messages - no boxes */
    .message.claude .code-block-container {
        background-color: transparent;
        border: none;
        border-left: none;
        border-radius: 0;
        box-shadow: none;
    }

    /* IN/OUT code block sections */
    .code-block-section {
        margin: 4px 0;
    }

    .code-block-section-label {
        font-size: 10px;
        font-weight: 500;
        opacity: 0.6;
        margin-bottom: 2px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .code-block-section-content {
        font-family: var(--vscode-editor-font-family);
        font-size: 12px;
        padding: 4px 0;
        opacity: 0.9;
    }

    /* Inline code - only for short inline snippets */
    .message-content code:not(pre code) {
        background-color: var(--vscode-textCodeBlock-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 3px;
        padding: 2px 6px;
        font-family: var(--vscode-editor-font-family);
        font-size: 0.9em;
        color: var(--vscode-editor-foreground);
    }

    .priority-badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 8px;
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

    .tool-input {
        padding: 0;
        font-family: var(--vscode-editor-font-family);
        font-size: 13px;
        line-height: 1.5;
        white-space: pre-line;
        margin-top: 8px;
        max-width: 100%;
        box-sizing: border-box;
    }

    .tool-input.collapsed .tool-input-content {
        display: none;
    }

    .tool-input-label {
        color: var(--vscode-descriptionForeground);
        font-size: 11px;
        font-weight: 500;
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.7;
        cursor: pointer;
        user-select: none;
        display: flex;
        align-items: center;
        gap: 5px;
    }

    .tool-input-label::before {
        content: '▶';
        font-size: 9px;
        opacity: 0.6;
        transition: transform 0.2s ease;
    }

    .tool-input:not(.collapsed) .tool-input-label::before {
        content: '▼';
    }

    .tool-input-content {
        color: var(--vscode-editor-foreground);
        opacity: 0.85;
        margin-left: 0;
        max-height: 300px;
        overflow-y: auto;
        max-width: 100%;
        box-sizing: border-box;
        word-wrap: break-word;
        overflow-wrap: break-word;
    }

    /* Better command/terminal display in tool inputs */
    .tool-input-content strong {
        color: rgba(255, 255, 255, 0.95);
        font-weight: 600;
    }

    .tool-input-content .diff-file-path {
        font-family: var(--vscode-editor-font-family);
        font-size: 12px;
        padding: 0;
        background-color: transparent;
        border: none;
        border-radius: 0;
        margin: 0 0 6px 0;
        word-break: break-all;
        max-width: 100%;
        box-sizing: border-box;
        color: var(--vscode-textLink-foreground);
        font-weight: 500;
    }

    /* Diff display styles for Edit tool - Slim and Simple */
    .diff-container {
        border: none;
        border-radius: 0;
        overflow: visible;
        margin-top: 4px;
        margin-bottom: 0;
    }

    .diff-container.collapsed > div:not(.diff-header):not(.diff-expand-container) {
        display: none;
    }

    .diff-container.collapsed .diff-expand-container {
        display: block;
    }

    .diff-header {
        background-color: transparent;
        padding: 2px 0;
        font-size: 11px;
        font-weight: 500;
        color: var(--vscode-descriptionForeground);
        border-bottom: none;
        opacity: 0.6;
        margin-bottom: 4px;
        cursor: pointer;
        user-select: none;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .diff-header::before {
        content: '▶';
        font-size: 8px;
        opacity: 0.5;
    }

    .diff-container:not(.collapsed) .diff-header::before {
        content: '▼';
    }

    .diff-removed,
    .diff-added {
        font-family: var(--vscode-editor-font-family);
        font-size: 12px;
        line-height: 1.4;
    }

    .diff-line {
        padding: 0;
        white-space: pre-wrap;
        word-break: break-word;
        line-height: 1.5;
        font-size: 12px;
        margin: 0;
        display: flex;
        align-items: flex-start;
        gap: 8px;
    }

    .diff-line.removed {
        background-color: transparent;
        color: var(--vscode-errorForeground);
        padding-left: 0;
        margin: 0;
    }

    .diff-line.added {
        background-color: transparent;
        color: var(--vscode-textLink-foreground);
        padding-left: 0;
        margin: 0;
    }

    .diff-line.removed::before {
        content: '-';
        color: var(--vscode-errorForeground);
        font-weight: 600;
        flex-shrink: 0;
        width: 12px;
        opacity: 0.7;
    }

    .diff-line.added::before {
        content: '+';
        color: var(--vscode-textLink-foreground);
        font-weight: 600;
        flex-shrink: 0;
        width: 12px;
        opacity: 0.7;
    }

    .diff-expand-container {
        padding: 6px 0 2px 0;
        text-align: left;
        border-top: none;
        background-color: transparent;
        display: none;
    }

    .diff-container.collapsed .diff-expand-container {
        display: block;
    }

    .diff-expand-btn {
        background: transparent;
        border: none;
        color: var(--vscode-textLink-foreground);
        padding: 0;
        border-radius: 0;
        cursor: pointer;
        font-size: 11px;
        font-weight: 400;
        transition: opacity 0.2s ease;
        text-decoration: none;
        opacity: 0.7;
    }

    .diff-expand-btn:hover {
        background: transparent;
        border: none;
        opacity: 1;
        text-decoration: underline;
    }

    .diff-expand-btn:active {
        transform: none;
    }

    /* MultiEdit specific styles - Slim */
    .single-edit {
        margin-bottom: 8px;
    }

    .single-edit:last-child {
        margin-bottom: 0;
    }

    .edit-number {
        background: transparent;
        border: none;
        color: var(--vscode-descriptionForeground);
        padding: 0;
        border-radius: 0;
        font-size: 10px;
        font-weight: 500;
        margin-top: 0;
        margin-bottom: 4px;
        display: inline-block;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.5;
    }

    .diff-edit-separator {
        height: 0;
        background: transparent;
        margin: 8px 0;
    }

    /* File path display styles */
    .diff-file-path {
        padding: 0;
        border: none;
        border-radius: 0;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.15s ease;
        opacity: 0.8;
        margin-bottom: 6px;
        display: inline-block;
        font-family: var(--vscode-editor-font-family);
        color: var(--vscode-textLink-foreground);
        font-weight: 500;
    }

    .diff-file-path:hover {
        background-color: transparent;
        border: none;
        opacity: 1;
        color: var(--vscode-textLink-activeForeground);
        text-decoration: underline;
    }

    .diff-file-path:active {
        transform: none;
    }

    .file-path-short,
    .file-path-truncated {
        font-family: var(--vscode-editor-font-family);
        color: inherit;
        font-weight: inherit;
        background-color: rgba(255, 255, 255, 0.05);
        padding: 2px 6px;
        border-radius: 3px;
        display: inline-block;
    }

    .file-path-truncated {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        cursor: pointer;
        transition: opacity 0.2s ease;
        padding: 0;
        border-radius: 0;
        opacity: 0.7;
    }

    .file-path-truncated .file-icon {
        font-size: 11px;
        opacity: 0.6;
        transition: opacity 0.2s ease;
    }

    .file-path-truncated:hover {
        color: var(--vscode-textLink-foreground);
        background-color: transparent;
        opacity: 1;
    }

    .file-path-truncated:hover .file-icon {
        opacity: 0.8;
    }

    .file-path-truncated:active {
        transform: none;
    }

    .expand-btn {
        background: transparent;
        border: none;
        color: rgba(64, 165, 255, 0.7);
        padding: 0;
        border-radius: 0;
        cursor: pointer;
        font-size: 11px;
        font-weight: 400;
        margin-left: 4px;
        display: inline-block;
        transition: opacity 0.2s ease;
        text-decoration: underline;
        opacity: 0.7;
    }

    .expand-btn:hover {
        background: transparent;
        border: none;
        opacity: 1;
        transform: none;
    }

    .expanded-content {
        margin-top: 4px;
        padding: 0;
        background: transparent;
        border: none;
        border-radius: 0;
        position: relative;
    }

    .expanded-content::before {
        display: none;
    }

    .expanded-content pre {
        margin: 0;
        white-space: pre-wrap;
        word-wrap: break-word;
        opacity: 0.8;
    }

    .input-container {
        padding: 12px 16px;
        border-top: 1px solid var(--vscode-panel-border);
        background-color: var(--vscode-editor-background);
        display: flex;
        flex-direction: column;
        position: relative;
        flex-shrink: 0;
    }

    .input-modes {
        display: flex;
        gap: 12px;
        align-items: center;
        padding-bottom: 8px;
        font-size: 12px;
    }

    .mode-toggle {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--vscode-foreground);
        opacity: 0.9;
        transition: opacity 0.15s ease;
    }

    .mode-toggle span {
        cursor: pointer;
        transition: opacity 0.15s ease;
        font-size: 12px;
    }

    .mode-toggle span:hover {
        opacity: 1;
    }

    .mode-toggle:hover {
        opacity: 1;
    }

    .mode-switch {
        position: relative;
        width: 32px;
        height: 18px;
        background-color: var(--vscode-panel-border);
        border-radius: 9px;
        cursor: pointer;
        transition: background-color 0.15s ease;
    }

    .mode-switch.active {
        background-color: var(--vscode-button-background);
    }

    .mode-switch::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 14px;
        height: 14px;
        background-color: var(--vscode-foreground);
        border-radius: 50%;
        transition: transform 0.15s ease;
    }

    .mode-switch.active::after {
        transform: translateX(14px);
        background-color: var(--vscode-button-foreground);
    }

    .textarea-container {
        display: flex;
        gap: 6px;
        align-items: flex-end;
    }

    .textarea-wrapper {
        flex: 1;
        background-color: var(--vscode-input-background);
        border: 1px solid var(--vscode-input-border);
        border-radius: 8px;
        overflow: hidden;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .textarea-wrapper:focus-within {
        border-color: var(--vscode-focusBorder);
        box-shadow: 0 0 0 1px var(--vscode-focusBorder);
    }

    .input-field {
        width: 100%;
        box-sizing: border-box;
        background-color: transparent;
        color: var(--vscode-input-foreground);
        border: none;
        padding: 10px 12px;
        outline: none;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', system-ui, sans-serif;
        min-height: 44px;
        max-height: 200px;
        line-height: 1.5;
        overflow-y: auto;
        resize: none;
        font-size: 14px;
    }

    .input-field:focus {
        border: none;
        outline: none;
    }

    .input-field::placeholder {
        color: var(--vscode-input-placeholderForeground);
        border: none;
        outline: none;
    }

    .input-controls {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 8px 4px 0 4px;
        border-top: none;
        background-color: transparent;
    }

    .left-controls {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .model-selector {
        background-color: transparent;
        color: var(--vscode-foreground);
        border: 1px solid var(--vscode-panel-border);
        padding: 4px 8px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 400;
        transition: all 0.15s ease;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .model-selector:hover {
        background-color: var(--vscode-list-hoverBackground);
    }

    .tools-btn {
        background-color: transparent;
        color: var(--vscode-foreground);
        border: 1px solid var(--vscode-panel-border);
        padding: 4px 8px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 400;
        transition: all 0.15s ease;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .tools-btn:hover {
        background-color: var(--vscode-list-hoverBackground);
    }

    .slash-btn,
    .at-btn {
        background-color: transparent;
        color: var(--vscode-foreground);
        border: none;
        padding: 6px 8px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.15s ease;
    }

    .slash-btn:hover,
    .at-btn:hover {
        background-color: var(--vscode-list-hoverBackground);
    }

    .image-btn {
        background-color: transparent;
        color: var(--vscode-foreground);
        border: none;
        padding: 6px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        transition: all 0.15s ease;
    }

    .image-btn:hover {
        background-color: var(--vscode-list-hoverBackground);
    }

    .send-btn {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        padding: 10px 18px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-width: 80px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', system-ui, sans-serif;
    }

    .send-btn svg {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
        stroke-width: 2.5;
    }

    .send-btn span {
        line-height: 1;
        letter-spacing: 0.01em;
    }

    .send-btn:hover {
        background-color: var(--vscode-button-hoverBackground);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        transform: translateY(-1px);
    }

    .send-btn:active {
        transform: translateY(0);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .send-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }

    .send-btn:disabled:hover {
        transform: none;
        box-shadow: none;
    }

    .secondary-button {
        background-color: var(--vscode-button-secondaryBackground, rgba(128, 128, 128, 0.2));
        color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
        border: 1px solid var(--vscode-panel-border);
        padding: 4px 10px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        transition: all 0.2s ease;
        white-space: nowrap;
    }

    .secondary-button:hover {
        background-color: var(--vscode-button-secondaryHoverBackground, rgba(128, 128, 128, 0.3));
        border-color: var(--vscode-focusBorder);
    }

    .right-controls {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .yolo-warning {
        font-size: 12px;
        color: var(--vscode-foreground);
        text-align: center;
        font-weight: 500;
        background-color: rgba(255, 99, 71, 0.08);
        border: 1px solid rgba(255, 99, 71, 0.2);
        padding: 6px 16px;
        margin: 4px 4px;
        border-radius: 8px;
        animation: slideDown 0.3s ease;
    }

    .yolo-suggestion {
        margin-top: 12px;
        padding: 6px;
        background-color: rgba(0, 122, 204, 0.1);
        border: 1px solid rgba(0, 122, 204, 0.3);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
    }

    .yolo-suggestion-text {
        font-size: 12px;
        color: var(--vscode-foreground);
        flex-grow: 1;
    }

    .yolo-suggestion-btn {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        border-radius: 8px;
        padding: 4px 10px;
        font-size: 11px;
        cursor: pointer;
        transition: background-color 0.2s ease;
        font-weight: 500;
        flex-shrink: 0;
    }

    .yolo-suggestion-btn:hover {
        background-color: var(--vscode-button-hoverBackground);
    }

    .file-picker-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .file-picker-content {
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 8px;
        width: 400px;
        max-height: 500px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .file-picker-header {
        padding: 6px;
        border-bottom: 1px solid var(--vscode-panel-border);
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .file-picker-header span {
        font-weight: 500;
        color: var(--vscode-foreground);
    }

    .file-search-input {
        background-color: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-input-border);
        padding: 6px 8px;
        border-radius: 10px;
        outline: none;
        font-size: 13px;
    }

    .file-search-input:focus {
        border-color: var(--vscode-focusBorder);
    }

    .file-list {
        max-height: 400px;
        overflow-y: auto;
        padding: 4px;
    }

    .file-item {
        display: flex;
        align-items: center;
        padding: 6px 16px;
        cursor: pointer;
        border-radius: 10px;
        font-size: 13px;
        gap: 8px;
    }

    .file-item:hover {
        background-color: var(--vscode-list-hoverBackground);
    }

    .file-item.selected {
        background-color: var(--vscode-list-activeSelectionBackground);
        color: var(--vscode-list-activeSelectionForeground);
    }

    .file-icon {
        font-size: 16px;
        flex-shrink: 0;
    }

    .file-info {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .file-name {
        font-weight: 500;
    }

    .file-path {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
    }

    .file-thumbnail {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        overflow: hidden;
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .thumbnail-img {
        max-width: 100%;
        max-height: 100%;
        object-fit: cover;
    }

    .tools-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .tools-modal-content {
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 8px;
        width: 700px;
        max-width: 90vw;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        overflow: hidden;
    }

    .tools-modal-header {
        padding: 8px 20px;
        border-bottom: 1px solid var(--vscode-panel-border);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
    }

    .tools-modal-body {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
    }

    .tools-modal-header span {
        font-weight: 600;
        font-size: 12px;
        color: var(--vscode-foreground);
    }

    .tools-close-btn {
        background: none;
        border: none;
        color: var(--vscode-foreground);
        cursor: pointer;
        font-size: 16px;
        padding: 4px;
    }

    .tools-beta-warning {
        padding: 6px 16px;
        background-color: var(--vscode-notifications-warningBackground);
        color: var(--vscode-notifications-warningForeground);
        font-size: 12px;
        border-bottom: 1px solid var(--vscode-panel-border);
    }

    .tools-list {
        padding: 6px;
        max-height: 400px;
        overflow-y: auto;
    }

    /* MCP Modal content area improvements */
    #mcpModal * {
        box-sizing: border-box;
    }

    #mcpModal .tools-list {
        padding: 24px;
        max-height: calc(80vh - 120px);
        overflow-y: auto;
        width: 100%;
    }

    #mcpModal .mcp-servers-list {
        padding: 0;
    }

    #mcpModal .mcp-add-server {
        padding: 0;
    }

    #mcpModal .mcp-add-form {
        padding: 6px;
    }

    .tool-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 8px 0;
        cursor: pointer;
        border-radius: 10px;
        transition: background-color 0.2s ease;
    }

    .tool-item:last-child {
        border-bottom: none;
    }

    .tool-item:hover {
        background-color: var(--vscode-list-hoverBackground);
        padding: 8px 12px;
        margin: 0 -12px;
    }

    .tool-item input[type="checkbox"], 
    .tool-item input[type="radio"] {
        margin: 0;
        margin-top: 2px;
        flex-shrink: 0;
    }

    .tool-item label {
        color: var(--vscode-foreground);
        font-size: 13px;
        cursor: pointer;
        flex: 1;
        line-height: 1.4;
    }

    .tool-item input[type="checkbox"]:disabled + label {
        opacity: 0.7;
    }

    /* Model selection specific styles */
    .model-explanatory-text {
        padding: 6px;
        padding-bottom: 0px;
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        line-height: 1.4;
    }

    .model-title {
        font-weight: 600;
        margin-bottom: 4px;
    }

    .model-description {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        line-height: 1.3;
    }

    .model-option-content {
        flex: 1;
    }

    .default-model-layout {
        cursor: pointer;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        width: 100%;
    }

    .configure-button {
        margin-left: 12px;
        flex-shrink: 0;
        align-self: flex-start;
    }

    /* Thinking intensity slider */
    .thinking-slider-container {
        position: relative;
        padding: 0px 16px;
        margin: 12px 0;
    }

    .thinking-slider {
        width: 100%;
        height: 4px;
        -webkit-appearance: none;
        appearance: none;
        background: var(--vscode-panel-border);
        outline: none !important;
        border: none;
        cursor: pointer;
        border-radius: 2px;
    }

    .thinking-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        background: var(--vscode-foreground);
        cursor: pointer;
        border-radius: 50%;
        transition: transform 0.2s ease;
    }

    .thinking-slider::-webkit-slider-thumb:hover {
        transform: scale(1.2);
    }

    .thinking-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background: var(--vscode-foreground);
        cursor: pointer;
        border-radius: 50%;
        border: none;
        transition: transform 0.2s ease;
    }

    .thinking-slider::-moz-range-thumb:hover {
        transform: scale(1.2);
    }

    .slider-labels {
        display: flex;
        justify-content: space-between;
        margin-top: 12px;
        padding: 0 8px;
    }

    .slider-label {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        opacity: 0.7;
        transition: all 0.2s ease;
        text-align: center;
        width: 100px;
        cursor: pointer;
    }

    .slider-label:hover {
        opacity: 1;
        color: var(--vscode-foreground);
    }

    .slider-label.active {
        opacity: 1;
        color: var(--vscode-foreground);
        font-weight: 500;
    }

    .slider-label:first-child {
        margin-left: -50px;
    }

    .slider-label:last-child {
        margin-right: -50px;
    }

    .settings-group {
        padding-bottom: 20px;
        margin-bottom: 40px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .settings-group h3 {
        margin: 0 0 12px 0;
        font-size: 13px;
        font-weight: 600;
        color: var(--vscode-foreground);
    }


    /* Thinking intensity modal */
    .thinking-modal-description {
        padding: 0px 20px;
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        line-height: 1.5;
        text-align: center;
        margin: 20px;
        margin-bottom: 0px;
    }

    .thinking-modal-actions {
        padding-top: 20px;
        text-align: right;
        border-top: 1px solid var(--vscode-widget-border);
    }

    .confirm-btn {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: 1px solid var(--vscode-panel-border);
        padding: 4px 10px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 400;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }

    .confirm-btn:hover {
        background-color: var(--vscode-button-background);
        border-color: var(--vscode-focusBorder);
    }

    /* Slash commands modal */
    .slash-commands-search {
        padding: 8px 20px;
        border-bottom: 1px solid var(--vscode-panel-border);
        position: sticky;
        top: 0;
        background-color: var(--vscode-editor-background);
        z-index: 10;
    }

    .search-input-wrapper {
        display: flex;
        align-items: center;
        border: 1px solid var(--vscode-input-border);
        border-radius: 10px;
        background-color: var(--vscode-input-background);
        transition: all 0.2s ease;
        position: relative;
    }

    .search-input-wrapper:focus-within {
        border-color: var(--vscode-focusBorder);
        box-shadow: 0 0 0 1px var(--vscode-focusBorder);
    }

    .search-prefix {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 32px;
        height: 32px;
        background-color: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        font-size: 13px;
        font-weight: 600;
        border-radius: 8px 0 0 4px;
        border-right: 1px solid var(--vscode-input-border);
    }

    .slash-commands-search input {
        flex: 1;
        padding: 6px 16px;
        border: none !important;
        background: transparent;
        color: var(--vscode-input-foreground);
        font-size: 13px;
        outline: none !important;
        box-shadow: none !important;
    }

    .slash-commands-search input:focus {
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
    }

    .slash-commands-search input::placeholder {
        color: var(--vscode-input-placeholderForeground);
    }

    .command-input-wrapper {
        display: flex;
        align-items: center;
        border: 1px solid var(--vscode-input-border);
        border-radius: 10px;
        background-color: var(--vscode-input-background);
        transition: all 0.2s ease;
        width: 100%;
        position: relative;
    }

    .command-input-wrapper:focus-within {
        border-color: var(--vscode-focusBorder);
        box-shadow: 0 0 0 1px var(--vscode-focusBorder);
    }

    .command-prefix {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 32px;
        height: 32px;
        background-color: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        font-size: 12px;
        font-weight: 600;
        border-radius: 8px 0 0 4px;
        border-right: 1px solid var(--vscode-input-border);
    }

    .slash-commands-section {
        margin-bottom: 32px;
    }

    .slash-commands-section:last-child {
        margin-bottom: 8px;
    }

    .slash-commands-section h3 {
        margin: 16px 20px 12px 20px;
        font-size: 12px;
        font-weight: 600;
        color: var(--vscode-foreground);
    }

    .slash-commands-info {
        padding: 6px 20px;
        background-color: rgba(255, 149, 0, 0.1);
        border: 1px solid rgba(255, 149, 0, 0.2);
        border-radius: 8px;
        margin: 0 20px 16px 20px;
    }

    .slash-commands-info p {
        margin: 0;
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        text-align: center;
        opacity: 0.9;
    }

    .prompt-snippet-item {
        border-left: 2px solid var(--vscode-charts-blue);
        background-color: rgba(0, 122, 204, 0.03);
    }

    .prompt-snippet-item:hover {
        background-color: rgba(0, 122, 204, 0.08);
    }

    .add-snippet-item {
        border-left: 2px solid var(--vscode-charts-green);
        background-color: rgba(0, 200, 83, 0.03);
        border-style: dashed;
    }

    .add-snippet-item:hover {
        background-color: rgba(0, 200, 83, 0.08);
        border-style: solid;
    }

    .add-snippet-form {
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 10px;
        padding: 8px;
        margin: 8px 0;
        animation: slideDown 0.2s ease;
    }

    .add-snippet-form .form-group {
        margin-bottom: 6px;
    }

    .add-snippet-form label {
        display: block;
        margin-bottom: 4px;
        font-weight: 500;
        font-size: 12px;
        color: var(--vscode-foreground);
    }

    .add-snippet-form textarea {
        width: 100%;
        padding: 6px 8px;
        border: 1px solid var(--vscode-input-border);
        border-radius: 10px;
        background-color: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        font-size: 12px;
        font-family: var(--vscode-font-family);
        box-sizing: border-box;
    }

    .add-snippet-form .command-input-wrapper input {
        flex: 1;
        padding: 6px 8px;
        border: none !important;
        background: transparent;
        color: var(--vscode-input-foreground);
        font-size: 12px;
        font-family: var(--vscode-font-family);
        outline: none !important;
        box-shadow: none !important;
    }

    .add-snippet-form .command-input-wrapper input:focus {
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
    }

    .add-snippet-form textarea:focus {
        outline: none;
        border-color: var(--vscode-focusBorder);
    }

    .add-snippet-form input::placeholder,
    .add-snippet-form textarea::placeholder {
        color: var(--vscode-input-placeholderForeground);
    }

    .add-snippet-form textarea {
        resize: vertical;
        min-height: 60px;
    }

    .add-snippet-form .form-buttons {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        margin-top: 12px;
    }

    .custom-snippet-item {
        position: relative;
    }

    .snippet-actions {
        display: flex;
        align-items: center;
        opacity: 0;
        transition: opacity 0.2s ease;
        margin-left: 8px;
    }

    .custom-snippet-item:hover .snippet-actions {
        opacity: 1;
    }

    .snippet-delete-btn {
        background: none;
        border: none;
        color: var(--vscode-descriptionForeground);
        cursor: pointer;
        padding: 4px;
        border-radius: 10px;
        font-size: 12px;
        transition: all 0.2s ease;
        opacity: 0.7;
    }

    .snippet-delete-btn:hover {
        background-color: rgba(231, 76, 60, 0.1);
        color: var(--vscode-errorForeground);
        opacity: 1;
    }

    .slash-commands-list {
        display: grid;
        gap: 6px;
        padding: 0 20px;
    }

    .slash-command-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 14px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.15s ease;
        border: 1px solid transparent;
        background-color: transparent;
    }

    .slash-command-item:hover {
        background-color: var(--vscode-list-hoverBackground);
        border-color: var(--vscode-list-hoverBackground);
    }

    .slash-command-icon {
        font-size: 16px;
        min-width: 20px;
        text-align: center;
        opacity: 0.8;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .slash-command-icon svg {
        width: 16px;
        height: 16px;
        stroke-width: 2;
    }

    .slash-command-content {
        flex: 1;
    }

    .slash-command-title {
        font-size: 13px;
        font-weight: 500;
        color: var(--vscode-foreground);
        margin-bottom: 2px;
    }

    .slash-command-description {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        opacity: 0.7;
        line-height: 1.3;
    }

    /* Quick command input */
    .custom-command-item {
        cursor: default;
    }

    .custom-command-item .command-input-wrapper {
        margin-top: 4px;
        max-width: 200px;
    }

    .custom-command-item .command-input-wrapper input {
        flex: 1;
        padding: 4px 6px;
        border: none !important;
        background: transparent;
        color: var(--vscode-input-foreground);
        font-size: 11px;
        font-family: var(--vscode-editor-font-family);
        outline: none !important;
        box-shadow: none !important;
    }

    .custom-command-item .command-input-wrapper input:focus {
        border: none !important;
        outline: none !important;
        box-shadow: none !important;
    }

    .custom-command-item .command-input-wrapper input::placeholder {
        color: var(--vscode-input-placeholderForeground);
        opacity: 0.7;
    }

    .status {
        padding: 10px 16px;
        background-color: var(--vscode-editor-background);
        color: var(--vscode-foreground);
        font-size: 12px;
        border-top: 1px solid var(--vscode-panel-border);
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 400;
        flex-shrink: 0;
        min-height: 40px;
    }

    .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
    }

    .status.ready .status-indicator {
        background-color: #00d26a;
        box-shadow: 0 0 6px rgba(0, 210, 106, 0.5);
    }

    .status.processing .status-indicator {
        background-color: #ff9500;
        box-shadow: 0 0 6px rgba(255, 149, 0, 0.5);
        animation: pulse 1.5s ease-in-out infinite;
    }

    .status.error .status-indicator {
        background-color: #ff453a;
        box-shadow: 0 0 6px rgba(255, 69, 58, 0.5);
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.1); }
    }

    .status-text {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .status .stop-btn {
        margin-left: auto;
        flex-shrink: 0;
    }

    pre {
        white-space: pre-wrap;
        word-wrap: break-word;
        margin: 0;
    }

    .session-badge {
        margin-left: 16px;
        background-color: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: background-color 0.2s, transform 0.1s;
    }

    .session-badge:hover {
        background-color: var(--vscode-button-hoverBackground);
        transform: scale(1.02);
    }

    .session-icon {
        font-size: 10px;
    }

    .session-label {
        opacity: 0.8;
        font-size: 10px;
    }

    .session-status {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        padding: 2px 6px;
        border-radius: 8px;
        background-color: var(--vscode-badge-background);
        border: 1px solid var(--vscode-panel-border);
    }

    .session-status.active {
        color: var(--vscode-terminal-ansiGreen);
        background-color: rgba(0, 210, 106, 0.1);
        border-color: var(--vscode-terminal-ansiGreen);
    }

    /* Markdown content styles */
    .message h1, .message h2, .message h3, .message h4 {
        margin: 0.8em 0 0.4em 0;
        font-weight: 600;
        line-height: 1.3;
    }

    .message h1 {
        font-size: 1.5em;
        border-bottom: 2px solid var(--vscode-panel-border);
        padding-bottom: 0.3em;
    }

    .message h2 {
        font-size: 1.3em;
        border-bottom: 1px solid var(--vscode-panel-border);
        padding-bottom: 0.2em;
    }

    .message h3 {
        font-size: 1.1em;
    }

    .message h4 {
        font-size: 1.05em;
    }

    .message strong {
        font-weight: 600;
        color: var(--vscode-terminal-ansiBrightWhite);
    }

    .message em {
        font-style: italic;
    }

    .message ul, .message ol {
        margin: 0.6em 0;
        padding-left: 1.5em;
    }

    .message li {
        margin: 0.3em 0;
        line-height: 1.4;
    }

    .message ul li {
        list-style-type: disc;
    }

    .message ol li {
        list-style-type: decimal;
    }

    .message p {
        margin: 0.5em 0;
        line-height: 1.6;
    }

    .message p:first-child {
        margin-top: 0;
    }

    .message p:last-child {
        margin-bottom: 0;
    }

    .message br {
        line-height: 1.2;
    }

    /* Todo List Styles - Slim and Simple */
    .todo-list-container {
        margin: 8px 0;
        background-color: transparent;
        border: none;
        border-radius: 0;
        padding: 0;
    }

    .todo-list-header {
        display: none;
    }

    .todo-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .todo-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 4px 0;
        border-radius: 0;
        background-color: transparent;
        border: none;
        transition: opacity 0.15s ease;
        line-height: 1.4;
        font-size: 12px;
    }

    .todo-item:hover {
        background-color: transparent;
        opacity: 0.8;
    }

    .todo-item.pending {
        border-left: none;
    }

    .todo-item.in-progress {
        border-left: none;
    }

    .todo-item.completed {
        border-left: none;
        opacity: 0.5;
    }

    .todo-checkbox-wrapper {
        width: 14px;
        height: 14px;
        min-width: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        margin-top: 2px;
        border-radius: 0;
        transition: opacity 0.15s ease;
    }

    .todo-checkbox-wrapper svg {
        width: 14px;
        height: 14px;
    }

    .todo-item.pending .todo-checkbox-wrapper {
        border: none;
        background-color: transparent;
        color: var(--vscode-descriptionForeground);
        opacity: 0.6;
    }

    .todo-item.in-progress .todo-checkbox-wrapper {
        border: none;
        background-color: transparent;
        color: var(--vscode-textLink-foreground);
        opacity: 0.8;
    }

    .todo-item.completed .todo-checkbox-wrapper {
        border: none;
        background-color: transparent;
        color: var(--vscode-terminal-ansiGreen);
        opacity: 0.7;
    }

    .todo-content-wrapper {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
        min-width: 0;
    }

    .todo-content {
        flex: 1;
        color: var(--vscode-foreground);
        font-size: 12px;
        line-height: 1.4;
        min-width: 0;
    }

    .todo-item.completed .todo-content {
        text-decoration: line-through;
        opacity: 0.5;
        color: var(--vscode-descriptionForeground);
    }

    .todo-item.in-progress .todo-content {
        color: var(--vscode-foreground);
        font-weight: 400;
    }

    .todo-priority {
        font-size: 10px;
        font-weight: 500;
        padding: 1px 4px;
        border-radius: 2px;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        flex-shrink: 0;
        line-height: 1.2;
        opacity: 0.7;
    }

    .todo-priority.priority-high {
        background-color: transparent;
        color: var(--vscode-errorForeground);
        border: none;
    }

    .todo-priority.priority-medium {
        background-color: transparent;
        color: var(--vscode-descriptionForeground);
        border: none;
    }

    .todo-priority.priority-low {
        background-color: transparent;
        color: var(--vscode-descriptionForeground);
        border: none;
        opacity: 0.5;
    }

    /* Checkpoint Card - Minimalist Apple-inspired Design */
    .checkpoint-card {
        background-color: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        padding: 8px 10px;
        margin: 8px 0;
        transition: background-color 0.2s ease, border-color 0.2s ease;
    }

    .checkpoint-card:hover {
        background-color: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.12);
    }

    .checkpoint-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
    }

    .checkpoint-label {
        font-size: 10px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.5);
        letter-spacing: 0.3px;
        text-transform: uppercase;
    }

    .checkpoint-sha {
        font-size: 10px;
        font-family: -apple-system, BlinkMacSystemFont, 'SF Mono', 'Segoe UI Mono', monospace;
        color: rgba(255, 255, 255, 0.4);
        font-weight: 500;
    }

    .checkpoint-info {
        margin-bottom: 8px;
    }

    .checkpoint-message {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.9);
        font-weight: 400;
        line-height: 1.4;
        margin-bottom: 4px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    }

    .checkpoint-time {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.4);
        font-weight: 400;
    }

    .checkpoint-restore-btn {
        background-color: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.9);
        border: none;
        padding: 5px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        width: 100%;
        transition: background-color 0.2s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    }

    .checkpoint-restore-btn:hover {
        background-color: rgba(255, 255, 255, 0.15);
    }

    .checkpoint-restore-btn:active {
        background-color: rgba(255, 255, 255, 0.08);
    }

    /* Undo Card - Minimalist Design */
    .checkpoint-undo-card {
        background-color: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        padding: 6px 10px;
        margin: 8px 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
    }

    .undo-message {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.6);
        flex: 1;
        line-height: 1.4;
        font-weight: 400;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    }

    .checkpoint-undo-btn {
        background-color: transparent;
        color: rgba(255, 255, 255, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.15);
        padding: 4px 10px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        transition: all 0.2s ease;
        white-space: nowrap;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    }

    .checkpoint-undo-btn:hover {
        background-color: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2);
        color: rgba(255, 255, 255, 0.9);
    }

    .checkpoint-undo-btn:active {
        background-color: rgba(255, 255, 255, 0.05);
    }

    .conversation-history {
        position: absolute;
        top: 60px;
        left: 0;
        right: 0;
        bottom: 60px;
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-widget-border);
        z-index: 1000;
    }

    .conversation-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 16px;
        border-bottom: 1px solid var(--vscode-widget-border);
    }

    .conversation-header h3 {
        margin: 0;
        font-size: 16px;
    }

    .conversation-list {
        padding: 8px;
        overflow-y: auto;
        height: calc(100% - 60px);
    }

    .conversation-item {
        padding: 6px;
        margin: 4px 0;
        border: 1px solid var(--vscode-widget-border);
        border-radius: 10px;
        cursor: pointer;
        background-color: var(--vscode-list-inactiveSelectionBackground);
    }

    .conversation-item:hover {
        background-color: var(--vscode-list-hoverBackground);
    }

    .conversation-title {
        font-weight: 500;
        margin-bottom: 4px;
    }

    .conversation-meta {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        margin-bottom: 4px;
    }

    .conversation-preview {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        opacity: 0.8;
    }

    /* Tool loading animation */
    .tool-loading {
        padding: 8px 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        background-color: var(--vscode-panel-background);
        border-top: 1px solid var(--vscode-panel-border);
    }

    .loading-spinner {
        display: flex;
        gap: 4px;
    }

    .loading-ball {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: var(--vscode-button-background);
        animation: bounce 1.4s ease-in-out infinite both;
    }

    .loading-ball:nth-child(1) { animation-delay: -0.32s; }
    .loading-ball:nth-child(2) { animation-delay: -0.16s; }
    .loading-ball:nth-child(3) { animation-delay: 0s; }

    @keyframes bounce {
        0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.5;
        }
        40% {
            transform: scale(1);
            opacity: 1;
        }
    }

    .loading-text {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        font-style: italic;
    }

    /* Tool completion indicator */
    .tool-completion {
        padding: 6px 16px;
        display: flex;
        align-items: center;
        gap: 6px;
        background-color: rgba(76, 175, 80, 0.1);
        border-top: 1px solid rgba(76, 175, 80, 0.2);
        font-size: 12px;
    }

    .completion-icon {
        color: #4caf50;
        font-weight: bold;
    }

    .completion-text {
        color: var(--vscode-foreground);
        opacity: 0.8;
    }

    /* MCP Servers styles */
    .mcp-servers-list {
        padding: 4px;
    }

    .mcp-server-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 24px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 8px;
        margin-bottom: 8px;
        background-color: var(--vscode-editor-background);
        transition: all 0.2s ease;
    }

    .mcp-server-item:hover {
        border-color: var(--vscode-focusBorder);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .server-info {
        flex: 1;
    }

    .server-name {
        font-weight: 600;
        font-size: 16px;
        color: var(--vscode-foreground);
        margin-bottom: 8px;
    }

    .server-type {
        display: inline-block;
        background-color: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 500;
        margin-bottom: 8px;
    }

    .server-config {
        font-size: 13px;
        color: var(--vscode-descriptionForeground);
        opacity: 0.9;
        line-height: 1.4;
    }

    .server-delete-btn {
        padding: 4px 10px;
        font-size: 13px;
        color: var(--vscode-errorForeground);
        border-color: var(--vscode-errorForeground);
        min-width: 80px;
        justify-content: center;
    }

    .server-delete-btn:hover {
        background-color: var(--vscode-inputValidation-errorBackground);
        border-color: var(--vscode-errorForeground);
    }

    .server-actions {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-shrink: 0;
    }

    .server-edit-btn {
        padding: 4px 10px;
        font-size: 13px;
        color: var(--vscode-foreground);
        border-color: var(--vscode-panel-border);
        min-width: 80px;
        transition: all 0.2s ease;
        justify-content: center;
    }

    .server-edit-btn:hover {
        background-color: var(--vscode-list-hoverBackground);
        border-color: var(--vscode-focusBorder);
    }

    .mcp-add-server {
        text-align: center;
        margin-bottom: 24px;
        padding: 0 4px;
    }

    .mcp-add-form {
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 8px;
        padding: 24px;
        margin-top: 20px;
        box-sizing: border-box;
        width: 100%;
    }

    .form-group {
        margin-bottom: 10px;
        box-sizing: border-box;
        width: 100%;
    }

    .form-group label {
        display: block;
        margin-bottom: 6px;
        font-weight: 500;
        font-size: 13px;
        color: var(--vscode-foreground);
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
        width: 100%;
        max-width: 100%;
        padding: 6px 16px;
        border: 1px solid var(--vscode-input-border);
        border-radius: 8px;
        background-color: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        font-size: 13px;
        font-family: var(--vscode-font-family);
        box-sizing: border-box;
        resize: vertical;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: var(--vscode-focusBorder);
        box-shadow: 0 0 0 1px var(--vscode-focusBorder);
    }

    .form-group textarea {
        resize: vertical;
        min-height: 60px;
    }

    .form-buttons {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        margin-top: 20px;
    }

    .no-servers {
        text-align: center;
        color: var(--vscode-descriptionForeground);
        font-style: italic;
        padding: 40px 20px;
    }

    /* Popular MCP Servers */
    .mcp-popular-servers {
        margin-top: 32px;
        padding-top: 24px;
        border-top: 1px solid var(--vscode-panel-border);
    }

    .mcp-popular-servers h4 {
        margin: 0 0 16px 0;
        font-size: 12px;
        font-weight: 600;
        color: var(--vscode-foreground);
        opacity: 0.9;
    }

    .popular-servers-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 8px;
    }

    .popular-server-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 16px;
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .popular-server-item:hover {
        border-color: var(--vscode-focusBorder);
        background-color: var(--vscode-list-hoverBackground);
        transform: translateY(-1px);
    }

    .popular-server-icon {
        font-size: 24px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .popular-server-icon svg {
        width: 24px;
        height: 24px;
        stroke-width: 2;
    }

    .popular-server-info {
        flex: 1;
        min-width: 0;
    }

    .popular-server-name {
        font-weight: 600;
        font-size: 13px;
        color: var(--vscode-foreground);
        margin-bottom: 2px;
    }

    .popular-server-desc {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        opacity: 0.8;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>`

export default styles