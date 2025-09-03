export const inputStyles = `
    .input-container {
        padding: 0;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        background-color: #1a1a1a;
        display: flex;
        flex-direction: column;
        position: relative;
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
        gap: 6px;
        color: var(--vscode-foreground);
        opacity: 0.8;
        transition: opacity 0.2s ease;
        font-size: 12px;
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
        width: 22px;
        height: 12px;
        background-color: var(--vscode-panel-border);
        border-radius: 6px;
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
        width: 8px;
        height: 8px;
        background-color: var(--vscode-foreground);
        border-radius: 50%;
        transition: transform 0.2s ease;
    }

    .mode-switch.active::after {
        transform: translateX(8px);
        background-color: var(--vscode-button-foreground);
    }

    .textarea-container {
        display: flex;
        gap: 10px;
        align-items: flex-end;
        padding: 6px 16px 12px 16px;
    }

    .textarea-wrapper {
        flex: 1;
        background-color: #242424;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        overflow: hidden;
    }

    .textarea-wrapper:focus-within {
        border-color: rgba(255, 255, 255, 0.12);
        background-color: #282828;
    }

    .input-field {
        width: 100%;
        box-sizing: border-box;
        background-color: transparent;
        color: #cccccc;
        border: none;
        padding: 10px;
        outline: none;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        min-height: 60px;
        line-height: 1.5;
        overflow-y: hidden;
        resize: none;
    }

    .input-field:focus {
        border: none;
        outline: none;
    }

    .input-field::placeholder {
        color: #606060;
        border: none;
        outline: none;
    }

    .input-controls {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        padding: 4px 6px;
        border-top: 1px solid rgba(255, 255, 255, 0.03);
        background-color: transparent;
        flex-wrap: nowrap;
        min-height: 32px;
    }

    .left-controls {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: nowrap;
        flex-shrink: 0;
    }

    .right-controls {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: nowrap;
        flex-shrink: 0;
    }

    .model-selector {
        background-color: transparent;
        color: #606060;
        border: none;
        padding: 3px 6px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 10px;
        font-weight: 400;
        transition: all 0.15s ease;
        opacity: 0.8;
        display: flex;
        align-items: center;
        gap: 3px;
    }

    .model-selector:hover {
        background-color: rgba(255, 255, 255, 0.04);
        color: #999999;
        opacity: 1;
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

    .slash-btn,
    .at-btn {
        background-color: transparent;
        color: #606060;
        border: none;
        padding: 3px 5px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 400;
        transition: all 0.15s ease;
        opacity: 0.8;
    }

    .slash-btn:hover,
    .at-btn:hover {
        background-color: rgba(255, 255, 255, 0.04);
        color: #999999;
        opacity: 1;
    }

    .image-btn {
        background-color: transparent;
        color: #606060;
        border: none;
        padding: 3px;
        border-radius: 3px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        transition: all 0.15s ease;
        opacity: 0.8;
    }

    .image-btn:hover {
        background-color: rgba(255, 255, 255, 0.04);
        color: #999999;
        opacity: 1;
    }

    .send-btn {
        background-color: rgba(255, 255, 255, 0.06);
        color: #999999;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 400;
        transition: all 0.15s ease;
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
        background-color: rgba(255, 255, 255, 0.08);
        color: #cccccc;
    }

    .send-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }

    .send-btn.stop-mode {
        background-color: rgba(255, 99, 71, 0.1);
        color: #ff6347;
        border: 1px solid rgba(255, 99, 71, 0.2);
    }

    .send-btn.stop-mode:hover {
        background-color: rgba(255, 99, 71, 0.2);
        color: #ff6347;
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
`;