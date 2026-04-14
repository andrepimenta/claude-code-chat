const styles = `
<style>
    body {
        font-family: var(--vscode-font-family);
        background-color: var(--vscode-editor-background);
        color: var(--vscode-editor-foreground);
        margin: 0;
        padding: 0;
        height: 100vh;
        display: flex;
        flex-direction: column;
    }

    .header {
        padding: 14px 20px;
        border-bottom: 1px solid var(--vscode-panel-border);
        background-color: var(--vscode-panel-background);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .header h2 {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
        color: var(--vscode-foreground);
        letter-spacing: -0.3px;
    }

    @media (max-width: 385px) {
        .header h2 {
            display: none;
        }
    }

    .controls {
        display: flex;
        gap: 6px;
        align-items: center;
    }

    .btn {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: 1px solid var(--vscode-panel-border);
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 400;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 5px;
    }

    .btn:hover {
        background-color: var(--vscode-button-background);
        border-color: var(--vscode-focusBorder);
    }

    .btn.outlined {
        background-color: transparent;
        color: var(--vscode-foreground);
        border-color: var(--vscode-panel-border);
    }

    .btn.outlined:hover {
        background-color: var(--vscode-list-hoverBackground);
        border-color: var(--vscode-focusBorder);
    }

    .btn.stop {
        background-color: transparent;
        color: var(--vscode-descriptionForeground);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 12px;
        font-weight: 400;
        opacity: 0.7;
    }

    .btn.stop:hover {
        background-color: rgba(231, 76, 60, 0.1);
        color: #e74c3c;
        border-color: rgba(231, 76, 60, 0.3);
        opacity: 1;
    }

    /* Permission Request */
    .permission-request {
        margin: 4px 12px 20px 12px;
        background-color: rgba(252, 188, 0, 0.1);
        border: 1px solid rgba(252, 188, 0, 0.3);
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        animation: slideUp 0.3s ease;
    }

    .permission-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        font-weight: 600;
        color: var(--vscode-foreground);
    }

    .permission-header .icon {
        font-size: 16px;
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
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 16px;
        font-weight: bold;
        transition: all 0.2s ease;
        line-height: 1;
    }

    .permission-menu-btn:hover {
        background-color: var(--vscode-list-hoverBackground);
        color: var(--vscode-foreground);
    }

    .permission-menu-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        background-color: var(--vscode-menu-background);
        border: 1px solid var(--vscode-menu-border);
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        min-width: 220px;
        padding: 4px 0;
        margin-top: 4px;
    }

    .permission-menu-item {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 12px 16px;
        background: none;
        border: none;
        width: 100%;
        text-align: left;
        cursor: pointer;
        color: var(--vscode-foreground);
        transition: background-color 0.2s ease;
    }

    .permission-menu-item:hover {
        background-color: var(--vscode-list-hoverBackground);
    }

    .permission-menu-item .menu-icon {
        font-size: 16px;
        margin-top: 1px;
        flex-shrink: 0;
    }

    .permission-menu-item .menu-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .permission-menu-item .menu-title {
        font-weight: 500;
        font-size: 13px;
        line-height: 1.2;
    }

    .permission-menu-item .menu-subtitle {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        opacity: 0.8;
        line-height: 1.2;
    }

    .permission-content {
        font-size: 13px;
        line-height: 1.4;
        color: var(--vscode-descriptionForeground);
    }



    .permission-tool {
        font-family: var(--vscode-editor-font-family);
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        padding: 8px 10px;
        margin: 8px 0;
        font-size: 12px;
        color: var(--vscode-editor-foreground);
    }

    .permission-buttons {
        margin-top: 2px;
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        flex-wrap: wrap;
    }

    .permission-buttons .btn {
        font-size: 12px;
        padding: 6px 12px;
        min-width: 70px;
        text-align: center;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 28px;
        border-radius: 4px;
        border: 1px solid;
        cursor: pointer;
        transition: all 0.2s ease;
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
        background-color: rgba(0, 122, 204, 0.1);
        color: var(--vscode-charts-blue);
        border-color: rgba(0, 122, 204, 0.3);
        font-weight: 500;
        min-width: auto;
        padding: 6px 14px;
        height: 28px;
    }

    .permission-buttons .btn.always-allow:hover {
        background-color: rgba(0, 122, 204, 0.2);
        border-color: rgba(0, 122, 204, 0.5);
        transform: translateY(-1px);
    }

    .permission-buttons .btn.always-allow code {
        background-color: rgba(0, 0, 0, 0.2);
        padding: 2px 4px;
        border-radius: 3px;
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
        padding: 8px 12px;
        text-align: center;
        border-radius: 4px;
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

    .permission-decision.expired {
        background-color: rgba(128, 128, 128, 0.15);
        color: var(--vscode-descriptionForeground);
        border: 1px solid rgba(128, 128, 128, 0.3);
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

    .permission-decided.expired {
        border-color: var(--vscode-panel-border);
        background-color: rgba(128, 128, 128, 0.05);
    }

    /* AskUserQuestion */
    .ask-user-question {
        margin: 4px 12px 20px 12px;
        background-color: rgba(0, 122, 204, 0.08);
        border: 1px solid rgba(0, 122, 204, 0.3);
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        animation: slideUp 0.3s ease;
    }

    .ask-question-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        font-weight: 600;
        color: var(--vscode-foreground);
    }

    .ask-question-header .icon {
        font-size: 16px;
    }

    .ask-question-content {
        font-size: 13px;
        line-height: 1.4;
        color: var(--vscode-descriptionForeground);
    }

    .question-block {
        margin-bottom: 16px;
    }

    .question-block:last-of-type {
        margin-bottom: 12px;
    }

    .question-header {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--vscode-descriptionForeground);
        margin-bottom: 4px;
    }

    .question-text {
        font-size: 13px;
        font-weight: 500;
        color: var(--vscode-foreground);
        margin-bottom: 8px;
    }

    .question-options {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 6px;
    }

    .question-option {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 10px 12px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s ease;
        background-color: transparent;
    }

    .question-option:hover {
        background-color: var(--vscode-list-hoverBackground);
        border-color: var(--vscode-focusBorder);
    }

    /* Hide native radio/checkbox, use custom styling */
    .question-option input[type="radio"],
    .question-option input[type="checkbox"] {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border: 2px solid var(--vscode-descriptionForeground);
        background: transparent;
        cursor: pointer;
        flex-shrink: 0;
        margin: 1px 0 0 0;
        padding: 0;
        transition: all 0.15s ease;
    }

    .question-option input[type="radio"] {
        border-radius: 50%;
    }

    .question-option input[type="checkbox"] {
        border-radius: 3px;
    }

    .question-option input[type="radio"]:checked {
        border-color: var(--vscode-button-background);
        background: radial-gradient(circle, var(--vscode-button-background) 40%, transparent 44%);
    }

    .question-option input[type="checkbox"]:checked {
        border-color: var(--vscode-button-background);
        background-color: var(--vscode-button-background);
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='white'%3E%3Cpath d='M12.207 4.793a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L6.5 9.086l4.293-4.293a1 1 0 0 1 1.414 0z'/%3E%3C/svg%3E");
        background-size: 12px;
        background-position: center;
        background-repeat: no-repeat;
    }

    /* Selected option card highlight */
    .question-option:has(input:checked) {
        border-color: var(--vscode-button-background);
        background-color: rgba(0, 122, 204, 0.08);
    }

    .option-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .option-label {
        font-size: 13px;
        font-weight: 500;
        color: var(--vscode-foreground);
    }

    .option-description {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
    }

    .question-freetext {
        margin-top: 6px;
    }

    .question-freetext-input {
        width: 100%;
        padding: 6px 10px;
        font-size: 13px;
        font-family: var(--vscode-font-family);
        background-color: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-input-border, var(--vscode-panel-border));
        border-radius: 4px;
        outline: none;
        box-sizing: border-box;
    }

    .question-freetext-input:focus {
        border-color: var(--vscode-focusBorder);
    }

    .question-freetext-input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .ask-question-buttons {
        margin-top: 8px;
        display: flex;
        gap: 8px;
        justify-content: flex-end;
    }

    .ask-question-decision {
        font-size: 12px;
        padding: 8px 12px;
        border-radius: 4px;
        margin-top: 8px;
    }

    .ask-question-decision.allowed {
        background-color: rgba(0, 122, 204, 0.1);
        color: var(--vscode-foreground);
        border: 1px solid rgba(0, 122, 204, 0.2);
    }

    .ask-question-decision.expired {
        background-color: rgba(128, 128, 128, 0.15);
        color: var(--vscode-descriptionForeground);
        border: 1px solid rgba(128, 128, 128, 0.3);
    }

    .ask-question-decided {
        opacity: 0.7;
        pointer-events: none;
    }

    .ask-question-decided .ask-question-buttons {
        display: none;
    }

    /* Permissions Management */
    .permissions-list {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 6px;
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
        border-radius: 3px;
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
        border-radius: 3px;
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
        padding: 4px 8px;
        border-radius: 3px;
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
        padding: 16px;
        text-align: center;
        color: var(--vscode-descriptionForeground);
        font-style: italic;
        font-size: 13px;
    }

    .permissions-empty::before {
        content: "🔒";
        display: block;
        font-size: 16px;
        margin-bottom: 8px;
        opacity: 0.5;
    }

    /* Add Permission Form */
    .permissions-add-section {
        margin-top: 6px;
    }

    .permissions-show-add-btn {
        background-color: transparent;
        color: var(--vscode-descriptionForeground);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 3px;
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
        padding: 12px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 6px;
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
        border-radius: 3px;
        padding: 4px 8px;
        font-size: 12px;
        min-width: 100px;
        height: 24px;
        flex-shrink: 0;
    }

    .permissions-command-input {
        background-color: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 3px;
        padding: 4px 8px;
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
        border-radius: 3px;
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
        border-radius: 3px;
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

    .env-variables-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .env-variable-row {
        display: flex;
        gap: 8px;
        align-items: center;
    }

    .env-variable-row input {
        flex: 1;
        padding: 6px 8px;
        border: 1px solid var(--vscode-input-border, var(--vscode-panel-border));
        border-radius: 4px;
        background-color: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        font-size: 12px;
        font-family: monospace;
    }

    .env-variable-row input:focus {
        outline: none;
        border-color: var(--vscode-focusBorder);
    }

    .env-variable-row input::placeholder {
        color: var(--vscode-input-placeholderForeground);
    }

    .env-variable-row .env-key {
        flex: 0.4;
    }

    .env-variable-row .env-value {
        flex: 0.6;
    }

    .env-variable-remove {
        background: transparent;
        border: none;
        color: var(--vscode-descriptionForeground);
        cursor: pointer;
        padding: 4px 8px;
        font-size: 14px;
        opacity: 0.6;
        transition: opacity 0.15s ease;
    }

    .env-variable-remove:hover {
        opacity: 1;
        color: var(--vscode-errorForeground);
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
        gap: 10px;
        flex-shrink: 0;
    }

    .wsl-alert-actions .btn {
        padding: 6px 14px;
        font-size: 12px;
        border-radius: 6px;
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
        padding: 10px;
        overflow-y: auto;
        font-family: var(--vscode-editor-font-family);
        font-size: var(--vscode-editor-font-size);
        line-height: 1.4;
    }

    .message {
        margin-bottom: 10px;
        padding: 8px;
        border-radius: 4px;
    }

    .message.user {
        border: 1px solid rgba(64, 165, 255, 0.2);
        border-radius: 8px;
        color: var(--vscode-editor-foreground);
        font-family: var(--vscode-editor-font-family);
        position: relative;
        overflow: hidden;
    }

    .message.user::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: linear-gradient(180deg, #40a5ff 0%, #0078d4 100%);
    }

    .message.claude {
        border: 1px solid rgba(46, 204, 113, 0.1);
        border-radius: 8px;
        color: var(--vscode-editor-foreground);
        position: relative;
        overflow: hidden;
    }

    .message.claude::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: linear-gradient(180deg, #2ecc71 0%, #27ae60 100%);
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
        border: 1px solid rgba(120, 139, 237, 0.12);
        border-radius: 8px;
        color: var(--vscode-editor-foreground);
        position: relative;
        overflow: hidden;
    }

    .message.tool::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: linear-gradient(180deg, #7c8bed 0%, #5d6fe1 100%);
    }

    .message.tool-result {
        border: 1px solid rgba(28, 192, 140, 0.2);
        border-radius: 8px;
        color: var(--vscode-editor-foreground);
        font-family: var(--vscode-editor-font-family);
        white-space: pre-wrap;
        position: relative;
        overflow: hidden;
    }

    .message.tool-result::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: linear-gradient(180deg, #1cc08c 0%, #16a974 100%);
    }

    .message.thinking {
        border: 1px solid rgba(186, 85, 211, 0.2);
        border-radius: 8px;
        color: var(--vscode-editor-foreground);
        font-family: var(--vscode-editor-font-family);
        font-style: italic;
        opacity: 0.9;
        position: relative;
        overflow: hidden;
    }

    .message.thinking::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
        background: linear-gradient(180deg, #ba55d3 0%, #9932cc 100%);
    }

    .tool-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .tool-icon {
        width: 18px;
        height: 18px;
        border-radius: 4px;
        background: linear-gradient(135deg, #7c8bed 0%, #5d6fe1 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        color: white;
        font-weight: 600;
        flex-shrink: 0;
        margin-left: 6px;
    }

    .tool-info {
        font-weight: 500;
        font-size: 13px;
        color: var(--vscode-editor-foreground);
        opacity: 0.9;
    }

    .message-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        padding-bottom: 6px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        position: relative;
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
        width: 18px;
        height: 18px;
        border-radius: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        color: white;
        font-weight: 600;
        flex-shrink: 0;
        margin-left: 6px;
    }

    .message-icon.user {
        background: linear-gradient(135deg, #40a5ff 0%, #0078d4 100%);
    }

    .message-icon.claude {
        background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
    }

    .message-icon.system {
        background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
    }

    .message-icon.error {
        background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    }

    .message-label {
        font-weight: 500;
        font-size: 12px;
        opacity: 0.8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .message-content {
        padding-left: 6px;
    }

    /* Code blocks generated by markdown parser only */
    .message-content pre.code-block {
        background-color: var(--vscode-textCodeBlock-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        padding: 12px;
        margin: 8px 0;
        overflow-x: auto;
        font-family: var(--vscode-editor-font-family);
        font-size: 13px;
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
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        background-color: var(--vscode-textCodeBlock-background);
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
        background-color: var(--vscode-textCodeBlock-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 3px;
        padding: 2px 4px;
        font-family: var(--vscode-editor-font-family);
        font-size: 0.9em;
        color: var(--vscode-editor-foreground);
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

    .tool-input {
        padding: 6px;
        font-family: var(--vscode-editor-font-family);
        font-size: 12px;
        line-height: 1.4;
        white-space: pre-line;
    }

    .tool-input-label {
        color: var(--vscode-descriptionForeground);
        font-size: 11px;
        font-weight: 500;
        margin-bottom: 6px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .tool-input-content {
        color: var(--vscode-editor-foreground);
        opacity: 0.95;
    }

    .plan-content {
        font-size: 13px;
        line-height: 1.6;
    }

    .plan-content h1, .plan-content h2, .plan-content h3 {
        margin: 12px 0 6px;
        font-weight: 600;
    }

    .plan-content h1 { font-size: 16px; }
    .plan-content h2 { font-size: 14px; }
    .plan-content h3 { font-size: 13px; }

    .plan-content ul, .plan-content ol {
        padding-left: 20px;
        margin: 4px 0;
    }

    .plan-content code {
        font-family: var(--vscode-editor-font-family);
        font-size: 12px;
        background: rgba(127, 127, 127, 0.15);
        padding: 1px 4px;
        border-radius: 3px;
    }

    .plan-actions {
        margin-top: 12px;
        padding-top: 10px;
        border-top: 1px solid var(--vscode-panel-border);
    }

    .plan-actions-label {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        margin-bottom: 8px;
    }

    .plan-action-btn {
        display: inline-block;
        background: var(--vscode-button-secondaryBackground, rgba(128, 128, 128, 0.2));
        color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
        border: 1px solid var(--vscode-panel-border);
        padding: 5px 12px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        margin: 0 6px 6px 0;
    }

    .plan-action-btn:hover {
        background: var(--vscode-list-hoverBackground);
        border-color: var(--vscode-focusBorder);
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
        white-space: pre;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Courier New', monospace;
        font-size: 12px;
        line-height: 1.5;
    }

    .diff-line.context {
        color: var(--vscode-editor-foreground);
        opacity: 0.8;
    }

    .diff-line.removed {
        background-color: rgba(244, 67, 54, 0.1);
        color: var(--vscode-gitDecoration-deletedResourceForeground, rgba(244, 67, 54, 0.9));
    }

    .diff-line.added {
        background-color: rgba(76, 175, 80, 0.1);
        color: var(--vscode-gitDecoration-addedResourceForeground, rgba(76, 175, 80, 0.9));
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

    .diff-summary-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-top: 8px;
        padding: 6px 12px;
        border-top: 1px solid var(--vscode-panel-border);
        background-color: var(--vscode-editor-background);
    }

    .diff-summary {
        color: var(--vscode-descriptionForeground);
        font-size: 11px;
        font-weight: 500;
    }

    .diff-preview {
        padding: 4px 12px;
        color: var(--vscode-descriptionForeground);
        font-size: 12px;
        font-style: italic;
        opacity: 0.9;
    }

    /* File path display styles */
    .diff-file-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
    }

    .diff-file-path {
        padding: 8px 12px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        flex: 1;
    }

    .diff-file-path:hover {
        background-color: var(--vscode-list-hoverBackground);
        border-color: var(--vscode-focusBorder);
    }

    .diff-file-path:active {
        transform: translateY(1px);
    }

    .diff-open-btn {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: transparent;
        border: 1px solid var(--vscode-button-secondaryBorder, var(--vscode-panel-border));
        color: var(--vscode-foreground);
        padding: 4px 10px;
        border-radius: 3px;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
    }

    .diff-open-btn svg {
        flex-shrink: 0;
    }

    .diff-open-btn:hover {
        background: var(--vscode-button-secondaryHoverBackground, rgba(255, 255, 255, 0.1));
        border-color: var(--vscode-focusBorder);
        opacity: 1;
    }

    .diff-open-btn:active {
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
        transition: all 0.2s ease;
    }

    .expand-btn:hover {
        background: linear-gradient(135deg, rgba(64, 165, 255, 0.25) 0%, rgba(64, 165, 255, 0.15) 100%);
        border-color: rgba(64, 165, 255, 0.5);
        transform: translateY(-1px);
    }

    .expanded-content {
        margin-top: 8px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        position: relative;
    }

    .expanded-content::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: linear-gradient(180deg, #40a5ff 0%, #0078d4 100%);
        border-radius: 0 0 0 6px;
    }

    .expanded-content pre {
        margin: 0;
        white-space: pre-wrap;
        word-wrap: break-word;
    }

    .input-container {
        padding: 1px 10px 10px 10px;
        margin: 0;
        border-top: 1px solid var(--vscode-panel-border);
        background-color: var(--vscode-panel-background);
        display: flex;
        flex-direction: column;
        position: relative;
    }

    .model-selector-row {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 6px;
        margin-bottom: 6px;
        overflow: hidden;
    }

    .model-selector-new {
        font-size: 9px;
        font-weight: 700;
        color: #fff;
        background: linear-gradient(135deg, #f97316, #ea580c);
        padding: 2px 6px;
        border-radius: 4px;
        letter-spacing: 0.5px;
    }

    .model-selector-main {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        background: rgba(139, 92, 246, 0.1);
        border: 1px solid rgba(139, 92, 246, 0.3);
        border-radius: 20px;
        color: var(--vscode-foreground);
        font-size: 10px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
        white-space: nowrap;
    }

    .model-selector-main:hover {
        background: rgba(139, 92, 246, 0.18);
        border-color: rgba(139, 92, 246, 0.4);
    }

    #modelDropdownBtn {
        background: none;
        border-color: var(--vscode-panel-border);
    }

    #modelDropdownBtn:hover {
        background: rgba(128, 128, 128, 0.15);
        border-color: var(--vscode-focusBorder);
    }

    #modelDropdownBtn svg {
        color: var(--vscode-descriptionForeground);
        width: 8px;
        height: 8px;
    }

    .model-selector-main svg {
        color: #8b5cf6;
        width: 12px;
        height: 12px;
    }

    .model-quick-select {
        display: flex;
        align-items: center;
        gap: 4px;
        overflow-x: auto;
        overflow-y: hidden;
        flex: 1;
        min-width: 0;
        scrollbar-width: none;
        -ms-overflow-style: none;
    }

    .model-quick-select::-webkit-scrollbar {
        display: none;
    }

    .model-quick-btn {
        display: flex;
        align-items: center;
        gap: 3px;
        padding: 4px 8px;
        background: transparent;
        border: 1px solid rgba(139, 92, 246, 0.2);
        border-radius: 20px;
        color: var(--vscode-foreground);
        font-size: 10px;
        cursor: pointer;
        transition: all 0.15s ease;
        opacity: 0.8;
        white-space: nowrap;
    }

    .model-quick-btn:hover {
        background: rgba(139, 92, 246, 0.1);
        border-color: rgba(139, 92, 246, 0.3);
        opacity: 1;
    }

    .model-quick-btn.selected {
        background: rgba(139, 92, 246, 0.18);
        border-color: rgba(139, 92, 246, 0.4);
        opacity: 1;
    }

    .model-quick-icon {
        font-size: 10px;
    }

    .model-quick-select {
        mask-image: linear-gradient(to right, black calc(100% - 20px), transparent 100%);
        -webkit-mask-image: linear-gradient(to right, black calc(100% - 20px), transparent 100%);
    }

    .model-more-btn {
        display: flex;
        align-items: center;
        gap: 2px;
        padding: 4px 8px;
        background: transparent;
        border: 1px solid rgba(139, 92, 246, 0.2);
        border-radius: 20px;
        color: var(--vscode-foreground);
        font-size: 10px;
        cursor: pointer;
        transition: all 0.15s ease;
        white-space: nowrap;
        opacity: 0.7;
        flex-shrink: 0;
    }

    .model-more-btn:hover {
        background: rgba(139, 92, 246, 0.1);
        border-color: rgba(139, 92, 246, 0.3);
        opacity: 1;
    }

    .model-more-btn.model-dropdown-btn {
        padding: 4px 10px;
        font-size: 11px;
        border-color: var(--vscode-panel-border);
    }

    .model-more-btn.model-dropdown-btn:hover {
        background: var(--vscode-list-hoverBackground);
        border-color: var(--vscode-focusBorder);
    }

    .model-more-btn svg {
        width: 10px;
        height: 10px;
    }

    .input-modes {
        display: flex;
        gap: 16px;
        align-items: center;
        padding-bottom: 5px;
        font-size: 9.5px;
    }

    .mode-toggle {
        display: flex;
        align-items: center;
        gap: 5px;
        color: var(--vscode-foreground);
        opacity: 0.7;
        transition: opacity 0.2s ease;
        font-size: 10px;
    }

    .left-controls .mode-toggle {
        padding: 3px 0;
    }

    .left-controls .mode-toggle span {
        cursor: pointer;
    }

    .mode-toggle span {
        cursor: pointer;
        transition: opacity 0.2s ease;
    }

    .mode-toggle span:hover {
        opacity: 1;
    }

    .mode-toggle:hover {
        opacity: 1;
    }

    .mode-switch {
        position: relative;
        width: 26px;
        height: 14px;
        background-color: var(--vscode-panel-border);
        border-radius: 7px;
        cursor: pointer;
        transition: background-color 0.2s ease;
    }

    .mode-switch.active {
        background-color: var(--vscode-button-background);
    }

    .mode-switch::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 10px;
        height: 10px;
        background-color: var(--vscode-foreground);
        border-radius: 50%;
        transition: transform 0.2s ease;
    }

    .mode-switch.active::after {
        transform: translateX(10px);
        background-color: var(--vscode-button-foreground);
    }

    .textarea-container {
        display: flex;
        gap: 10px;
        align-items: flex-end;
    }

    .textarea-wrapper {
        flex: 1;
        background-color: var(--vscode-input-background);
        border: 1px solid var(--vscode-input-border);
        border-radius: 6px;
        overflow: visible;
    }

    .image-preview-container {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 8px 8px 0;
    }

    .image-preview-item {
        position: relative;
        width: 56px;
        height: 56px;
        border-radius: 6px;
        overflow: hidden;
        border: 1px solid var(--vscode-input-border);
    }

    .image-preview-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .image-preview-remove {
        position: absolute;
        top: 2px;
        right: 2px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: none;
        background: rgba(0, 0, 0, 0.6);
        color: #fff;
        font-size: 10px;
        line-height: 16px;
        text-align: center;
        cursor: pointer;
        padding: 0;
        display: none;
    }

    .image-preview-item:hover .image-preview-remove {
        display: block;
    }


    .textarea-wrapper:focus-within {
        border-color: var(--vscode-focusBorder);
    }

    .input-field {
        width: 100%;
        box-sizing: border-box;
        background-color: transparent;
        color: var(--vscode-input-foreground);
        border: none;
        padding: 12px;
        outline: none;
        font-family: var(--vscode-editor-font-family);
        min-height: 68px;
        line-height: 1.4;
        overflow-y: hidden;
        resize: none;
        border-radius: 6px 6px 0 0;
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
        padding: 2px 4px;
        border-top: 1px solid var(--vscode-panel-border);
        background-color: var(--vscode-input-background);
        border-radius: 0 0 6px 6px;
    }

    .left-controls {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .model-selector {
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(16, 185, 129, 0.15));
        color: var(--vscode-foreground);
        border: 1px solid rgba(139, 92, 246, 0.3);
        padding: 4px 10px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .model-selector:hover {
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(16, 185, 129, 0.25));
        border-color: rgba(139, 92, 246, 0.5);
    }

    .model-selector-label {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .model-selector-label #selectedModel {
        font-weight: 600;
        color: #a78bfa;
    }

    .model-selector-examples {
        font-size: 10px;
        opacity: 0.6;
        font-weight: 400;
    }

    .model-selector-badge {
        font-size: 8px;
        font-weight: 700;
        padding: 2px 5px;
        border-radius: 3px;
        background: linear-gradient(135deg, #f59e0b, #ea580c);
        color: white;
        text-transform: uppercase;
        letter-spacing: 0.3px;
    }

    .tools-btn {
        background-color: rgba(128, 128, 128, 0.15);
        color: var(--vscode-foreground);
        border: none;
        padding: 3px 7px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        transition: all 0.2s ease;
        opacity: 0.9;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .tools-btn:hover {
        background-color: rgba(128, 128, 128, 0.25);
        opacity: 1;
    }

    .plus-btn {
        background: none;
        border: none;
        color: var(--vscode-foreground);
        font-size: 16px;
        line-height: 1;
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 4px;
        opacity: 0.6;
        transition: all 0.2s ease;
    }

    .plus-btn:hover {
        opacity: 1;
        background-color: rgba(128, 128, 128, 0.2);
    }

    .input-dropdown-btn {
        display: flex;
        align-items: center;
        gap: 3px;
        background: none;
        border: none;
        color: var(--vscode-descriptionForeground);
        font-size: 12px;
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 4px;
        transition: all 0.15s ease;
    }

    .input-dropdown-btn:hover {
        color: var(--vscode-foreground);
        background-color: rgba(128, 128, 128, 0.15);
    }

    #connectBtn {
        color: var(--vscode-foreground);
        background-color: rgba(128, 128, 128, 0.12);
        padding: 3px 8px;
    }

    #connectBtn:hover {
        background-color: rgba(128, 128, 128, 0.25);
    }

    .input-dropdown-btn svg {
        opacity: 0.6;
    }


    .input-toggle-btn {
        display: flex;
        align-items: center;
        background: none;
        border: 1px solid transparent;
        color: var(--vscode-descriptionForeground);
        font-size: 12px;
        cursor: pointer;
        padding: 1px 5px;
        border-radius: 4px;
        transition: all 0.15s ease;
    }

    .input-toggle-btn:hover {
        color: var(--vscode-foreground);
        background-color: rgba(128, 128, 128, 0.15);
    }

    .input-toggle-btn.active {
        color: var(--vscode-button-background);
        background-color: rgba(0, 122, 204, 0.12);
        border-color: rgba(0, 122, 204, 0.3);
    }

    .connect-dropdown-wrapper {
        position: relative;
    }

    .connect-menu {
        position: absolute;
        bottom: 100%;
        left: 0;
        margin-bottom: 6px;
        background-color: var(--vscode-menu-background);
        border: 1px solid var(--vscode-menu-border);
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        min-width: 180px;
        padding: 6px 0;
        z-index: 1000;
    }

    .connect-menu-header {
        padding: 8px 14px 6px;
        font-size: 11px;
        font-weight: 600;
        color: var(--vscode-descriptionForeground);
    }

    .connect-menu-item {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 8px 14px;
        background: none;
        border: none;
        color: var(--vscode-foreground);
        font-size: 13px;
        cursor: pointer;
        text-align: left;
        transition: background-color 0.1s ease;
    }

    .connect-menu-item:hover {
        background-color: var(--vscode-list-hoverBackground);
    }

    .connect-menu-item svg {
        color: var(--vscode-descriptionForeground);
        flex-shrink: 0;
    }

    .slash-btn,
    .at-btn {
        background-color: transparent;
        color: var(--vscode-foreground);
        border: none;
        padding: 4px 6px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        transition: all 0.2s ease;
    }

    .slash-btn:hover,
    .at-btn:hover {
        background-color: var(--vscode-list-hoverBackground);
    }

    .image-btn {
        background-color: transparent;
        color: var(--vscode-foreground);
        border: none;
        padding: 4px;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        transition: all 0.2s ease;
        padding-top: 6px;
    }

    .image-btn:hover {
        background-color: var(--vscode-list-hoverBackground);
    }

    .send-btn {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        padding: 3px 7px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    .send-btn div {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2px;
    }

    .send-btn span {
        line-height: 1;
    }

    .send-btn:hover {
        background-color: var(--vscode-button-hoverBackground);
    }

    .send-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .stop-inline-btn {
        background-color: #ef4444;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        display: none;
        align-items: center;
        justify-content: center;
        gap: 2px;
        min-width: 39px;
        min-height: 11px;
        padding: 3px 7px;
        box-sizing: content-box;
    }

    .stop-inline-btn:hover {
        background-color: #dc2626;
    }

    .secondary-button {
        background-color: var(--vscode-button-secondaryBackground, rgba(128, 128, 128, 0.2));
        color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
        border: 1px solid var(--vscode-panel-border);
        padding: 6px 12px;
        border-radius: 4px;
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
        padding: 8px 12px;
        margin: 4px 4px;
        border-radius: 4px;
        animation: slideDown 0.3s ease;
    }

    .yolo-suggestion {
        margin-top: 12px;
        padding: 12px;
        background-color: rgba(0, 122, 204, 0.1);
        border: 1px solid rgba(0, 122, 204, 0.3);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
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
        border-radius: 4px;
        padding: 6px 12px;
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
        border-radius: 4px;
        width: 400px;
        max-height: 500px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .file-picker-header {
        padding: 12px;
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
        border-radius: 3px;
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
        padding: 8px 12px;
        cursor: pointer;
        border-radius: 3px;
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
        border-radius: 4px;
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
        background-color: rgba(0, 0, 0, 0.75);
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
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        overflow: hidden;
    }

    .tools-modal-header {
        padding: 16px 20px;
        border-bottom: 1px solid var(--vscode-panel-border);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(59, 130, 246, 0.08));
    }

    .tools-modal-body {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
    }

    .tools-modal-header span {
        font-weight: 600;
        font-size: 14px;
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
        padding: 12px 16px;
        background-color: var(--vscode-notifications-warningBackground);
        color: var(--vscode-notifications-warningForeground);
        font-size: 12px;
        border-bottom: 1px solid var(--vscode-panel-border);
    }

    .tools-list {
        padding: 20px;
        max-height: 400px;
        overflow-y: auto;
    }

    /* MCP Modal content area improvements */
    #mcpModal *,
    #skillsModal *,
    #pluginsModal * {
        box-sizing: border-box;
    }

    #mcpModal .tools-list,
    #skillsModal .tools-list,
    #pluginsModal .tools-list {
        padding: 24px;
        max-height: calc(90vh - 120px);
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
        padding: 12px;
    }

    .tool-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px 0;
        cursor: pointer;
        border-radius: 6px;
        transition: background-color 0.2s ease;
    }

    .tool-item:last-child {
        border-bottom: none;
    }

    .tool-item:hover {
        background-color: var(--vscode-list-hoverBackground);
        padding: 16px 12px;
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
        padding: 20px;
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

    /* Model modal styles */
    .model-modal-content {
        width: 520px;
        max-width: 90vw;
        max-height: 80vh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
    }

    .model-section {
        padding: 16px;
    }

    .model-section.opencredits-section {
        border-top: 1px solid var(--vscode-panel-border);
    }

    .model-section-header {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 14px;
    }

    .model-section-title {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1px;
        display: flex;
        align-items: center;
        gap: 8px;
        color: white;
    }

    .new-badge {
        font-size: 9px;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 4px;
        background: linear-gradient(135deg, #f59e0b, #ea580c);
        color: white;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
    }

    .beta-badge {
        font-size: 9px;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 4px;
        background: rgba(127, 127, 127, 0.25);
        color: var(--vscode-descriptionForeground);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-left: auto;
        cursor: default;
        position: relative;
    }

    .beta-badge:hover::after {
        content: attr(data-tooltip);
        position: absolute;
        top: calc(100% + 6px);
        right: 0;
        background: var(--vscode-editorHoverWidget-background, #1e1e1e);
        color: var(--vscode-editorHoverWidget-foreground, #ccc);
        border: 1px solid var(--vscode-editorHoverWidget-border, #454545);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 400;
        letter-spacing: 0;
        text-transform: none;
        white-space: nowrap;
        z-index: 100;
    }

    .model-section-subtitle {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
    }

    .model-section-divider {
        height: 1px;
        background: var(--vscode-panel-border);
        margin: 0 16px;
    }

    /* Flexible grid for model cards */
    .model-cards-container {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
    }

    @media (min-width: 600px) {
        .model-cards-container {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        }
    }

    .model-card {
        position: relative;
        padding: 12px;
        background: var(--vscode-input-background);
        border: 1px solid var(--vscode-panel-border);
        border-left: 3px solid #10b981;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.15s ease;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .model-card:hover {
        border-color: #10b981;
        border-left: 3px solid #10b981;
        background: rgba(16, 185, 129, 0.1);
    }

    .model-card.selected {
        border-color: #10b981;
        border-left: 3px solid #10b981;
        background: rgba(16, 185, 129, 0.15);
    }

    .model-card-name {
        font-size: 13px;
        font-weight: 600;
        color: var(--vscode-foreground);
        line-height: 1.3;
    }

    .model-card-provider {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
    }

    .model-card-price {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
        margin-top: 4px;
    }

    .model-card-requests {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
        margin-top: 4px;
    }

    .claude-card-requests {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
        margin-top: 4px;
    }

    .model-section-links {
        display: flex;
        justify-content: space-between;
        width: 100%;
        grid-column: 1 / -1;
    }

    .model-section-links a {
        font-size: 11px;
        color: var(--vscode-foreground);
        text-decoration: none;
    }

    .model-section-links a:hover {
        text-decoration: underline;
    }

    .custom-provider-field {
        margin-bottom: 12px;
        overflow: visible;
    }

    .custom-provider-field label {
        display: block;
        font-size: 11px;
        font-weight: 600;
        color: var(--vscode-foreground);
        margin-bottom: 4px;
    }

    .custom-provider-field input {
        width: 100%;
        padding: 8px 10px;
        font-size: 12px;
        font-family: inherit;
        color: var(--vscode-input-foreground);
        background: var(--vscode-input-background);
        border: 1px solid var(--vscode-input-border, rgba(255,255,255,0.1));
        border-radius: 4px;
        outline: none;
    }

    .custom-provider-field input:focus {
        border-color: var(--vscode-focusBorder);
    }

    .model-combo {
        position: relative;
        max-width: 100%;
        overflow: visible;
    }

    .model-combo-input {
        width: 100%;
        padding: 8px 28px 8px 10px;
        font-size: 12px;
        font-family: inherit;
        color: var(--vscode-input-foreground);
        background: var(--vscode-input-background);
        border: 1px solid var(--vscode-input-border, rgba(255,255,255,0.2));
        border-radius: 4px;
        outline: none;
        box-sizing: border-box;
    }

    .model-combo::after {
        content: '';
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 5px solid var(--vscode-descriptionForeground, #888);
        pointer-events: none;
    }

    .model-combo-input:focus {
        border-color: var(--vscode-focusBorder);
    }

    .model-combo-dropdown {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        max-height: 120px;
        overflow-y: auto;
        background: var(--vscode-dropdown-background, #1e1e1e);
        border: 1px solid var(--vscode-dropdown-border, rgba(255,255,255,0.2));
        border-radius: 4px;
        margin-top: 2px;
        z-index: 100;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }

    .model-combo.open .model-combo-dropdown {
        display: block;
    }

    .model-combo-option {
        padding: 6px 10px;
        font-size: 12px;
        cursor: pointer;
        color: var(--vscode-dropdown-foreground);
    }

    .model-combo-option:hover {
        background: var(--vscode-list-hoverBackground, rgba(255,255,255,0.05));
    }

    .model-combo-option .model-combo-option-name {
        font-weight: 500;
    }

    .model-combo-option .model-combo-option-id {
        font-size: 10px;
        opacity: 0.6;
    }

    .model-combo-custom {
        padding: 6px 10px;
        font-size: 12px;
        cursor: pointer;
        color: var(--vscode-textLink-foreground, #3794ff);
        border-top: 1px solid var(--vscode-dropdown-border, rgba(255,255,255,0.1));
    }

    .model-combo-custom:hover {
        background: var(--vscode-list-hoverBackground, rgba(255,255,255,0.05));
    }

    .model-comparison-header {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        margin-bottom: 10px;
        line-height: 1.5;
    }

    .model-card-unlock {
        font-size: 9px;
        color: #10b981;
        margin-top: 6px;
        font-weight: 500;
    }

    .model-card.pending {
        border-color: rgba(249, 115, 22, 0.5);
        background: rgba(249, 115, 22, 0.1);
    }

    .model-card-price-label {
        display: none;
    }

    .price-current {
        font-weight: 500;
    }

    .price-comparison {
        margin-left: 4px;
        opacity: 0.7;
    }

    .price-comparison s {
        text-decoration: line-through;
    }

    /* Savings badge */
    .savings-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        font-size: 9px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 3px;
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
        border: 1px solid rgba(16, 185, 129, 0.3);
    }

    /* More models card */
    .more-models-card {
        background: var(--vscode-button-secondaryBackground) !important;
        border-style: dashed !important;
    }

    .more-models-card:hover {
        background: var(--vscode-button-secondaryHoverBackground) !important;
    }

    .more-models-card .savings-badge {
        display: none;
    }

    /* All models browser */
    .all-models-search {
        padding: 12px 16px;
        border-bottom: 1px solid var(--vscode-panel-border);
    }

    .all-models-search input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid var(--vscode-input-border);
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border-radius: 4px;
        font-size: 13px;
        box-sizing: border-box;
    }

    .all-models-search input:focus {
        outline: none;
        border-color: var(--vscode-focusBorder);
    }

    .all-models-list {
        max-height: 400px;
        overflow-y: auto;
        padding: 4px 8px;
    }

    .all-models-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 16px;
        border-radius: 6px;
        cursor: pointer;
        margin-bottom: 2px;
        background: var(--vscode-list-hoverBackground);
    }

    .all-models-item:hover {
        background: var(--vscode-list-activeSelectionBackground);
    }

    .all-models-item.selected {
        background: var(--vscode-list-activeSelectionBackground);
        border: 1px solid var(--vscode-focusBorder);
    }

    .all-models-item-main {
        flex: 1;
        min-width: 0;
    }

    .all-models-item-name {
        font-size: 13px;
        font-weight: 500;
        color: var(--vscode-foreground);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .all-models-item-provider {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        margin-top: 2px;
    }

    .all-models-item-details {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-shrink: 0;
    }

    .all-models-item-context {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        background: var(--vscode-badge-background);
        padding: 2px 6px;
        border-radius: 3px;
    }

    .all-models-item-price {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
    }

    .all-models-loading,
    .all-models-error,
    .all-models-empty {
        text-align: center;
        padding: 40px 20px;
        color: var(--vscode-descriptionForeground);
    }

    .all-models-error {
        color: var(--vscode-errorForeground);
    }


    /* Claude Code model cards */
    .claude-cards-container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
    }

    .claude-card {
        padding: 12px;
        background: var(--vscode-input-background);
        border: 1px solid var(--vscode-panel-border);
        border-left: 3px solid #8b5cf6;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.15s ease;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .claude-card:hover {
        border-color: #8b5cf6;
        border-left: 3px solid #8b5cf6;
        background: rgba(139, 92, 246, 0.1);
    }

    .claude-card.selected {
        border-color: #8b5cf6;
        border-left: 3px solid #8b5cf6;
        background: rgba(139, 92, 246, 0.15);
    }

    .claude-card-name {
        font-size: 13px;
        font-weight: 600;
        color: var(--vscode-foreground);
    }

    .claude-card-desc {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
        line-height: 1.3;
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
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 400;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 5px;
    }

    .confirm-btn:hover {
        background-color: var(--vscode-button-background);
        border-color: var(--vscode-focusBorder);
    }

    /* Slash commands modal */
    .slash-commands-search {
        padding: 16px 20px;
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
        border-radius: 6px;
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
        border-radius: 4px 0 0 4px;
        border-right: 1px solid var(--vscode-input-border);
    }

    .slash-commands-search input {
        flex: 1;
        padding: 8px 12px;
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
        border-radius: 6px;
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
        border-radius: 4px 0 0 4px;
        border-right: 1px solid var(--vscode-input-border);
    }

    .slash-commands-section {
        margin-bottom: 32px;
    }

    .slash-commands-section:last-child {
        margin-bottom: 16px;
    }

    .slash-commands-section h3 {
        margin: 16px 20px 12px 20px;
        font-size: 14px;
        font-weight: 600;
        color: var(--vscode-foreground);
    }

    .slash-commands-info {
        padding: 12px 20px;
        background-color: rgba(255, 149, 0, 0.1);
        border: 1px solid rgba(255, 149, 0, 0.2);
        border-radius: 4px;
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
        border-radius: 6px;
        padding: 16px;
        margin: 8px 0;
        animation: slideDown 0.2s ease;
    }

    .add-snippet-form .form-group {
        margin-bottom: 12px;
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
        border-radius: 3px;
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
        border-radius: 3px;
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
        gap: 12px;
        padding: 10px 14px;
        border-radius: 4px;
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
        padding: 8px 12px;
        background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
        color: #e1e1e1;
        font-size: 12px;
        border-top: 1px solid var(--vscode-panel-border);
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
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
    }

    .support-btn {
        background: none;
        border: none;
        color: var(--vscode-descriptionForeground);
        cursor: pointer;
        padding: 2px 4px;
        opacity: 0.6;
        font-size: 11px;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .support-btn:hover {
        opacity: 1;
    }

    .status-text .usage-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: inherit;
        text-decoration: none;
        background: rgba(255, 255, 255, 0.08);
        padding: 2px 8px 2px 8px;
        border-radius: 10px;
        cursor: pointer;
        transition: background 0.15s, transform 0.1s;
    }

    .status-text .usage-badge:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: translateY(-1px);
    }

    .status-text .usage-badge:active {
        transform: translateY(0);
    }

    .status-text .usage-icon {
        width: 12px;
        height: 12px;
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
        padding: 4px 8px;
        border-radius: 12px;
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
        border-radius: 4px;
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

    .restore-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px
    }

    .restore-btn {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        padding: 4px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
    }

    .restore-btn.dark {
        background-color: #2d2d30;
        color: #999999;
    }

    .restore-btn:hover {
        background-color: var(--vscode-button-hoverBackground);
    }

    .restore-btn.dark:hover {
        background-color: #3e3e42;
    }

    .restore-date {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
        opacity: 0.8;
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
        padding: 12px 16px;
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
        padding: 12px;
        margin: 4px 0;
        border: 1px solid var(--vscode-widget-border);
        border-radius: 6px;
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
        padding: 16px 12px;
        display: flex;
        align-items: center;
        gap: 12px;
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
        padding: 8px 12px;
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
        gap: 12px;
        padding: 12px 16px;
        border: 1px solid var(--vscode-panel-border);
        border-radius: 8px;
        margin-bottom: 8px;
        background-color: var(--vscode-editor-background);
        transition: all 0.2s ease;
        flex-wrap: wrap;
    }

    .mcp-server-item:hover {
        border-color: var(--vscode-focusBorder);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .server-info {
        flex: 1;
        min-width: 0;
    }

    .server-name {
        font-weight: 600;
        font-size: 14px;
        color: var(--vscode-foreground);
        margin-bottom: 4px;
    }

    .server-type {
        display: inline-block;
        background-color: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        margin-bottom: 8px;
    }

    .server-config {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        opacity: 0.9;
        line-height: 1.4;
        word-break: break-all;
    }

    .server-delete-btn {
        padding: 4px 10px;
        font-size: 12px;
        color: var(--vscode-errorForeground);
        border-color: var(--vscode-errorForeground);
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
        font-size: 12px;
        color: var(--vscode-foreground);
        border-color: var(--vscode-panel-border);
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
        margin-bottom: 20px;
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
        padding: 8px 12px;
        border: 1px solid var(--vscode-input-border);
        border-radius: 4px;
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

    .mcp-add-server {
        margin-bottom: 0;
        padding: 0 4px;
    }

    .mcp-auth-btn {
        color: var(--vscode-textLink-foreground);
        font-size: 12px;
        cursor: pointer;
        position: relative;
    }

    .mcp-auth-btn:hover {
        text-decoration: underline;
    }

    .mcp-auth-btn:hover::after {
        content: attr(data-tooltip);
        position: absolute;
        bottom: calc(100% + 6px);
        right: 0;
        background: var(--vscode-editorHoverWidget-background, #1e1e1e);
        color: var(--vscode-editorHoverWidget-foreground, #ccc);
        border: 1px solid var(--vscode-editorHoverWidget-border, #454545);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        white-space: nowrap;
        z-index: 100;
    }

    .no-servers {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 20px 12px;
        color: var(--vscode-descriptionForeground);
    }

    .no-servers-icon {
        opacity: 0.4;
    }

    .no-servers-text {
        font-size: 13px;
    }

    .no-servers-btn {
        margin-top: 4px;
        font-size: 12px;
    }

    /* Popular MCP Servers */
    .mcp-popular-servers {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--vscode-panel-border);
    }

    .mcp-popular-servers h4 {
        margin: 0 0 16px 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--vscode-foreground);
        opacity: 0.9;
    }

    .skill-item-row {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
    }

    .skill-item-info {
        flex: 1;
        min-width: 0;
        overflow: hidden;
    }

    .skill-item-desc {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .popular-servers-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 12px;
    }

    .popular-server-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 6px;
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

    /* MCP Tabs */
    .mcp-tabs {
        display: flex;
        gap: 0;
    }

    .mcp-tab {
        background: none;
        border: none;
        color: var(--vscode-descriptionForeground);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        padding: 4px 12px;
        border-bottom: 2px solid transparent;
        transition: all 0.15s ease;
    }

    .mcp-tab:hover {
        color: var(--vscode-foreground);
    }

    .mcp-tab.active {
        color: var(--vscode-foreground);
        border-bottom-color: var(--vscode-button-background);
    }

    /* MCP Marketplace */
    .marketplace-search {
        padding: 0 0 12px 0;
    }

    .marketplace-search input {
        width: 100%;
        padding: 8px 12px;
        font-size: 13px;
        font-family: var(--vscode-font-family);
        background-color: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        border: 1px solid var(--vscode-input-border, var(--vscode-panel-border));
        border-radius: 6px;
        outline: none;
        box-sizing: border-box;
    }

    .marketplace-search input:focus {
        border-color: var(--vscode-focusBorder);
    }

    .marketplace-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 10px;
    }

    .marketplace-item {
        padding: 12px;
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .marketplace-item:hover {
        border-color: var(--vscode-focusBorder);
        background-color: var(--vscode-list-hoverBackground);
        transform: translateY(-1px);
    }

    .marketplace-item-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 6px;
    }

    .marketplace-item-icon {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        flex-shrink: 0;
        object-fit: cover;
    }

    .marketplace-item-icon-placeholder {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        flex-shrink: 0;
        background-color: rgba(128, 128, 128, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 600;
        color: var(--vscode-descriptionForeground);
    }

    .marketplace-item-info {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .marketplace-item-name {
        font-weight: 600;
        font-size: 13px;
        color: var(--vscode-foreground);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .marketplace-item-type {
        font-size: 9px;
        padding: 1px 5px;
        border-radius: 3px;
        background-color: rgba(128, 128, 128, 0.15);
        color: var(--vscode-descriptionForeground);
        flex-shrink: 0;
    }

    .marketplace-item-desc {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .marketplace-item-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 2px;
    }

    .marketplace-item-stars {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
    }

    .marketplace-item-lang {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
    }

    .lang-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
    }

    .marketplace-item-license {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
    }

    .marketplace-detail-meta {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
    }

    .marketplace-detail-link {
        color: var(--vscode-textLink-foreground);
        font-size: 12px;
        text-decoration: none;
    }

    .marketplace-detail-link:hover {
        text-decoration: underline;
    }

    .marketplace-detail-install {
        margin: 12px 0;
    }

    .marketplace-loading {
        text-align: center;
        padding: 24px;
        color: var(--vscode-descriptionForeground);
        font-size: 13px;
    }

    .marketplace-load-more {
        text-align: center;
        padding: 12px 0;
    }

    .marketplace-detail {
        padding: 4px 0;
    }

    .marketplace-back-btn {
        background: none;
        border: none;
        color: var(--vscode-textLink-foreground);
        font-size: 12px;
        cursor: pointer;
        padding: 0 0 12px 0;
        display: block;
    }

    .marketplace-back-btn:hover {
        text-decoration: underline;
    }

    .marketplace-detail-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 14px;
    }

    .marketplace-detail-icon {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        object-fit: cover;
    }

    .marketplace-detail-header-info {
        flex: 1;
        min-width: 0;
    }

    .marketplace-detail-header-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 2px;
    }

    .marketplace-detail-name {
        font-size: 15px;
        font-weight: 600;
        color: var(--vscode-foreground);
    }

    .marketplace-install-btn {
        flex-shrink: 0;
        align-self: center;
    }

    .marketplace-detail-desc {
        font-size: 13px;
        color: var(--vscode-descriptionForeground);
        line-height: 1.5;
        margin-bottom: 14px;
    }

    .marketplace-detail-config {
        background-color: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 6px;
        padding: 10px 12px;
    }

    .marketplace-detail-section-title {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--vscode-descriptionForeground);
        margin-bottom: 8px;
    }

    .marketplace-detail-row {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        margin-bottom: 4px;
    }

    .marketplace-detail-row code,
    .marketplace-detail-env code {
        background-color: var(--vscode-textCodeBlock-background);
        padding: 2px 6px;
        border-radius: 3px;
        font-family: var(--vscode-editor-font-family);
        font-size: 11px;
    }

    .detail-label {
        color: var(--vscode-foreground);
        font-weight: 500;
    }

    .marketplace-detail-env {
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        margin-left: 12px;
        margin-bottom: 2px;
    }

    /* Processing indicator - morphing orange dot */
    .processing-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 12px 0;
        margin-top: 8px;
    }

    .processing-indicator .morph-dot {
        width: 8px;
        height: 8px;
        background: linear-gradient(135deg, #ff9500 0%, #ff6b00 100%);
        box-shadow: 0 0 8px rgba(255, 149, 0, 0.5);
        animation: morphShape 3s ease-in-out infinite;
    }

    @keyframes morphShape {
        0%, 100% {
            border-radius: 50%;
            transform: scale(1) rotate(0deg);
        }
        15% {
            border-radius: 50%;
            transform: scale(1.3) rotate(0deg);
        }
        25% {
            border-radius: 20%;
            transform: scale(1) rotate(45deg);
        }
        40% {
            border-radius: 20%;
            transform: scale(1.2) rotate(90deg);
        }
        50% {
            border-radius: 50% 50% 50% 0%;
            transform: scale(1) rotate(135deg);
        }
        65% {
            border-radius: 0%;
            transform: scale(1.3) rotate(180deg);
        }
        75% {
            border-radius: 50% 0% 50% 0%;
            transform: scale(1) rotate(270deg);
        }
        85% {
            border-radius: 30%;
            transform: scale(1.2) rotate(315deg);
        }
    }

    /* Install Modal Styles */
    .install-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .install-modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(2px);
    }

    .install-modal-content {
        position: relative;
        background: var(--vscode-editor-background);
        border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
        border-radius: 12px;
        padding: 32px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        animation: installFadeIn 0.2s ease-out;
    }

    @keyframes installFadeIn {
        from { opacity: 0; transform: scale(0.95) translateY(-8px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
    }

    .install-close-btn {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 28px;
        height: 28px;
        background: none;
        border: none;
        color: var(--vscode-descriptionForeground);
        cursor: pointer;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.6;
        transition: all 0.15s;
    }

    .install-close-btn:hover {
        background: var(--vscode-toolbar-hoverBackground);
        opacity: 1;
    }

    .install-body {
        text-align: center;
        margin-top: 20px;
    }

    .install-main {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
    }

    .install-icon-wrapper {
        width: 64px;
        height: 64px;
        border-radius: 16px;
        background: var(--vscode-button-background);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .install-icon {
        color: var(--vscode-button-foreground);
    }

    .install-text {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .install-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--vscode-foreground);
    }

    .install-desc {
        margin: 0;
        font-size: 13px;
        color: var(--vscode-descriptionForeground);
        line-height: 1.4;
    }

    .install-btn {
        width: 100%;
        padding: 12px 24px;
        font-size: 14px;
        font-weight: 500;
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.15s;
    }

    .install-btn:hover {
        background: var(--vscode-button-hoverBackground);
        transform: translateY(-1px);
    }

    .install-btn:active {
        transform: translateY(0);
    }

    .install-link {
        font-size: 13px;
        color: var(--vscode-textLink-foreground);
        text-decoration: none;
        opacity: 0.9;
    }

    .install-link:hover {
        text-decoration: underline;
        opacity: 1;
    }

    .install-progress {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        padding: 20px 0;
    }

    .install-spinner {
        width: 32px;
        height: 32px;
        border: 2.5px solid var(--vscode-widget-border, var(--vscode-panel-border));
        border-top-color: var(--vscode-button-background);
        border-radius: 50%;
        animation: installSpin 0.8s linear infinite;
    }

    @keyframes installSpin {
        to { transform: rotate(360deg); }
    }

    .install-progress-text {
        margin: 0;
        font-size: 14px;
        font-weight: 500;
        color: var(--vscode-foreground);
    }

    .install-progress-hint {
        margin: 0;
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
    }

    .install-success {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 20px 0;
    }

    .install-success-icon {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: rgba(78, 201, 176, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .install-check {
        width: 28px;
        height: 28px;
        color: var(--vscode-testing-iconPassed, #4ec9b0);
    }

    .install-success-text {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--vscode-foreground);
    }

    .install-success-hint {
        margin: 0;
        font-size: 13px;
        color: var(--vscode-descriptionForeground);
    }

    .install-options {
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: 100%;
        margin-top: 8px;
    }

    .install-option {
        width: 100%;
        padding: 14px 16px;
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.15s;
        text-align: left;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .install-option:hover {
        background: var(--vscode-button-hoverBackground);
        transform: translateY(-1px);
    }

    .install-option-secondary {
        background: transparent;
        border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
        color: var(--vscode-foreground);
    }

    .install-option-secondary:hover {
        background: var(--vscode-list-hoverBackground);
        border-color: var(--vscode-focusBorder);
    }

    .install-option-title {
        font-size: 14px;
        font-weight: 500;
    }

    .install-option-desc {
        font-size: 12px;
        opacity: 0.8;
    }

    .install-funds {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        padding: 12px 0;
    }

    .install-funds-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--vscode-foreground);
        margin-bottom: 10px;
    }

    .install-funds-hint {
        margin: 0;
        font-size: 13px;
        color: var(--vscode-descriptionForeground);
        margin-bottom: 10px;
    }

    .install-amounts {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        width: 100%;
    }

    .install-amount {
        flex: 1 1 calc(33.333% - 6px);
        min-width: 60px;
        padding: 12px 8px;
        font-size: 14px;
        font-weight: 600;
        background: var(--vscode-input-background);
        color: var(--vscode-foreground);
        border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.15s;
    }

    .install-amount:hover {
        border-color: var(--vscode-focusBorder);
        background: var(--vscode-list-hoverBackground);
    }

    .install-custom-amount {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        margin-top: 4px;
    }

    .install-custom-currency {
        font-size: 14px;
        font-weight: 600;
        color: var(--vscode-descriptionForeground);
    }

    .install-custom-input {
        flex: 1;
        padding: 10px 12px;
        font-size: 14px;
        background: var(--vscode-input-background);
        color: var(--vscode-foreground);
        border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
        border-radius: 6px;
        outline: none;
    }

    .install-custom-input:focus {
        border-color: var(--vscode-focusBorder);
    }

    .install-custom-input::placeholder {
        color: var(--vscode-descriptionForeground);
    }

    .install-custom-btn {
        padding: 10px 16px;
        font-size: 13px;
        font-weight: 500;
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.15s;
    }

    .install-custom-btn:hover {
        background: var(--vscode-button-hoverBackground);
    }

    .install-powered-by {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        margin-top: 8px;
    }

    .install-powered-by a {
        color: var(--vscode-textLink-foreground);
        text-decoration: none;
    }

    .install-powered-by a:hover {
        text-decoration: underline;
    }

    .install-back-btn {
        background: none;
        border: none;
        color: var(--vscode-textLink-foreground);
        font-size: 13px;
        cursor: pointer;
        padding: 8px;
    }

    .install-back-btn:hover {
        text-decoration: underline;
    }

    /* Toast notifications */
    .toast-notification {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 500;
        z-index: 10000;
        animation: toastSlideUp 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .toast-notification.fade-out {
        opacity: 0;
        transform: translateX(-50%) translateY(10px);
        transition: all 0.3s ease;
    }

    @keyframes toastSlideUp {
        from {
            transform: translateX(-50%) translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }

    /* OpenCredits balance badge style */
    .opencredits-balance {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.15)) !important;
        color: #10b981 !important;
    }

</style>`

export default styles