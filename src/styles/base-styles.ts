export const baseStyles = `
    body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        background-color: #1a1a1a;
        color: #cccccc;
        margin: 0;
        padding: 0;
        height: 100vh;
        display: flex;
        flex-direction: column;
    }

    .header {
        padding: 8px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        background-color: #1a1a1a;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .header h2 {
        margin: 0;
        font-size: 12px;
        font-weight: 400;
        color: #808080;
        letter-spacing: 0;
    }

    .controls {
        display: flex;
        gap: 6px;
        align-items: center;
    }

    .btn {
        background-color: transparent;
        color: #808080;
        border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 400;
        transition: all 0.15s ease;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .btn:hover {
        background-color: rgba(255, 255, 255, 0.05);
        color: #cccccc;
        border-color: rgba(255, 255, 255, 0.12);
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
`;