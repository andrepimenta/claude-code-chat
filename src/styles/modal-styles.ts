export const modalStyles = `
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
        padding: 16px 20px;
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
`;