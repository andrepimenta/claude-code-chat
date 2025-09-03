export const permissionStyles = `
    /* Permission Request */
    .permission-request {
        margin: 8px 16px;
        background-color: #242424;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        padding: 12px;
        animation: slideUp 0.2s ease;
    }

    .permission-header {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 8px;
        font-weight: 400;
        color: #cccccc;
        font-size: 12px;
    }

    .permission-header .icon {
        font-size: 12px;
        opacity: 0.6;
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
        font-size: 11px;
        line-height: 1.4;
        color: #808080;
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
        background-color: transparent;
        color: #808080;
        border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 400;
        transition: all 0.15s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        min-width: 50px;
        height: 26px;
        white-space: nowrap;
        box-sizing: border-box;
    }

    .permission-buttons .btn:hover {
        background-color: rgba(255, 255, 255, 0.05);
        color: #cccccc;
        border-color: rgba(255, 255, 255, 0.12);
    }

    .permission-buttons .btn.allow {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border-color: var(--vscode-button-background);
    }

    .permission-buttons .btn.allow:hover {
        background-color: var(--vscode-button-hoverBackground);
        border-color: var(--vscode-button-hoverBackground);
    }

    .permission-buttons .btn.deny {
        /* Uses base styles from above */
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
        display: none;
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

    /* Minimal Permission Request */
    .permission-request-minimal {
        margin: 3px 16px;
        background-color: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(100, 149, 237, 0.4);
        border-radius: 4px;
        padding: 6px 10px;
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
        animation: slideUp 0.15s ease;
    }

    .permission-minimal-content {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .permission-minimal-buttons {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 6px;
        align-self: flex-end;
        width: 100%;
    }

    .btn-minimal {
        background-color: transparent;
        color: #808080;
        border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 4px 6px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 400;
        transition: all 0.15s ease;
        height: 22px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        min-width: 40px;
    }

    .btn-minimal:hover {
        background-color: rgba(255, 255, 255, 0.05);
        color: #cccccc;
        border-color: rgba(255, 255, 255, 0.12);
    }

    .btn-minimal.allow {
        background-color: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border-color: var(--vscode-button-background);
    }

    .btn-minimal.allow:hover {
        background-color: var(--vscode-button-hoverBackground);
        border-color: var(--vscode-button-hoverBackground);
    }

    .btn-minimal.deny {
        /* Uses base styles from above */
    }

    .allow-button-group {
        position: relative;
        display: flex;
        align-items: center;
    }

    .allow-dropdown-btn {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-left: none;
        border-radius: 0 3px 3px 0;
        padding: 4px 3px;
        cursor: pointer;
        color: var(--vscode-descriptionForeground);
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
        margin-left: -1px;
    }

    .allow-dropdown-btn:hover {
        background-color: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.16);
        color: var(--vscode-foreground);
    }

    .allow-button-group .btn-minimal.allow {
        border-radius: 3px 0 0 3px;
    }

    .always-allow-dropdown {
        position: absolute;
        bottom: 100%;
        right: 0;
        background-color: var(--vscode-menu-background);
        border: 1px solid var(--vscode-menu-border);
        border-radius: 3px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        margin-bottom: 2px;
    }

    .always-allow-option {
        display: block;
        width: 100%;
        padding: 6px 10px;
        background: none;
        border: none;
        text-align: left;
        cursor: pointer;
        color: var(--vscode-foreground);
        font-size: 11px;
        transition: background-color 0.15s ease;
        white-space: nowrap;
    }

    .always-allow-option:hover {
        background-color: var(--vscode-list-hoverBackground);
    }

    .permission-minimal-decision {
        font-size: 11px;
        font-weight: 500;
        padding: 4px 8px;
        border-radius: 3px;
    }

    .permission-minimal-decision.allowed {
        color: var(--vscode-charts-blue);
        background-color: rgba(0, 122, 204, 0.1);
    }

    .permission-minimal-decision.denied {
        color: #e74c3c;
        background-color: rgba(231, 76, 60, 0.1);
    }
`;