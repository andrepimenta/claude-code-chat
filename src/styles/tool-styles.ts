export const toolStyles = `
    .tool-icon {
        width: 14px;
        height: 14px;
        border-radius: 2px;
        background: rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        color: #999999;
        font-weight: 400;
        flex-shrink: 0;
        margin-left: 0;
    }

    .tool-info {
        font-weight: 400;
        font-size: 11px;
        color: #999999;
        opacity: 0.8;
        cursor: default; /* Ensure tool name is not clickable */
    }
    
    .clickable-filename {
        cursor: pointer;
        color: var(--vscode-textLink-foreground);
        text-decoration: underline;
        text-decoration-color: transparent;
        transition: all 0.2s ease;
        border-radius: 2px;
        padding: 1px 2px;
    }
    
    .clickable-filename:hover {
        color: var(--vscode-textLink-activeForeground);
        text-decoration-color: currentColor;
        background-color: var(--vscode-textLink-foreground);
        color: var(--vscode-editor-background);
    }

    .tool-input {
        padding: 0;
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

    /* Todo list styling */
    .tool-input-content span {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        font-size: 12px;
    }
    
    /* Completed todo strikethrough positioning */
    .tool-input-content span[style*="line-through"] {
        text-decoration-thickness: 1px;
        text-underline-offset: 0.2em;
        text-decoration-skip-ink: none;
    }
`;