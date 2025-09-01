# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VS Code extension that provides a chat interface for Claude Code within VS Code. It creates a webview-based chat UI in the sidebar and allows users to interact with Claude without using the terminal.

## Key Architecture

### Extension Structure
- **Main Entry**: `src/extension.ts` - Extension activation and command registration
- **Chat Provider**: `ClaudeChatProvider` class manages webview lifecycle and message handling
- **Webview UI**: `src/ui.ts` generates HTML, `src/script.ts` handles client-side logic
- **MCP Server**: `claude-code-chat-permissions-mcp/` contains permission management server

### Communication Pattern
- Extension host ↔ Webview: Message-based communication via `postMessage`
- MCP Server: Runs as separate Node.js process for tool permission management
- File references: Uses `@` syntax for context inclusion

## Development Commands

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch

# Run linter
npm run lint

# Test extension (opens new VS Code window)
# Press F5 in VS Code or run:
npm run test

# Build for publishing
npm run vscode:prepublish
```

## MCP Server Development

```bash
# Navigate to MCP directory
cd claude-code-chat-permissions-mcp

# Install MCP dependencies
npm install

# Compile MCP server
npx tsc mcp-permissions.ts

# Server is invoked automatically by the extension
```

## Testing the Extension

1. Open project in VS Code
2. Press F5 to launch Extension Development Host
3. Use Cmd/Ctrl+Shift+C to open Claude Code Chat
4. Test in sidebar by clicking the Claude icon in activity bar

## Important Configuration

### Extension Settings (package.json)
- `claude-code-chat.wslSupport`: Enable/disable WSL integration
- `claude-code-chat.thinkingLevel`: Set AI reasoning intensity (not_verbose, verbose, very_verbose)

### Key Bindings
- **Open Chat**: Ctrl+Shift+C (Windows/Linux) or Cmd+Shift+C (Mac)

## Code Conventions

### TypeScript Guidelines
- Target: ES2022, Module: Node16
- Strict type checking enabled
- Use VS Code API types from `@types/vscode`

### Message Protocol
Messages between extension and webview follow this pattern:
```typescript
webview.postMessage({ command: 'commandName', data: {...} })
```

### File Handling
- Always use VS Code URI for file paths
- Support WSL paths via `wslSupport` configuration
- Handle image data as base64 strings

## Common Tasks

### Adding New Commands
1. Register in `package.json` under `contributes.commands`
2. Add handler in `extension.ts` activate function
3. Update webview message handlers if needed

### Modifying UI
1. Edit HTML generation in `src/ui.ts`
2. Update styles in `src/ui-styles.ts`
3. Add client-side logic in `src/script.ts`

### Updating MCP Permissions
1. Modify `claude-code-chat-permissions-mcp/mcp-permissions.ts`
2. Recompile with `npx tsc`
3. Test permission changes through extension

## Debugging Tips

- Use VS Code's Extension Development Host for live debugging
- Check Output panel > "Claude Code Chat" for extension logs
- Webview console accessible via Developer Tools (Help > Toggle Developer Tools)
- MCP server logs visible in extension output channel