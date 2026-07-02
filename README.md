# 🚀 Claude Code Chat - Beautiful Claude Code Chat Interface for VS Code

[![VS Code Extension](https://img.shields.io/badge/VS%20Code-Extension-blue?style=for-the-badge&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=andrepimenta.claude-code-chat)
[![Claude Code](https://img.shields.io/badge/Powered%20by-Claude%20Code-orange?style=for-the-badge)](https://claude.ai/code)
[![TypeScript](https://img.shields.io/badge/Built%20with-TypeScript-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

> **No more terminal commands. Chat with Claude Code through a beautiful, intuitive interface right inside VS Code.**

Ditch the command line and experience Claude Code like never before. This extension brings a stunning chat interface directly into your editor, making AI assistance accessible, visual, and enjoyable.

🤖 **Built using Claude Code for Claude Code** - This extension was entirely developed using Claude Code itself. Claude Code created its own chat interface!

---

## ✨ **Why Choose Claude Code Chat?**

🖥️ **No Terminal Required** - Beautiful chat interface replaces command-line interactions  
⏪ **Restore Checkpoints** - Undo changes and restore code to any previous state  
🔌 **MCP, Skills & Plugins** - Browse, search, and install from curated marketplaces  
💾 **Conversation History** - Automatic conversation history and session management  
🎨 **VS Code & Cursor** - Works in VS Code, Cursor, and other compatible editors  
🧠 **Plan and Ultrathink modes** - Plan First and Ultrathink modes  
⚡ **Smart Context** - Reference files, paste images, and create custom commands  
🐧 **Windows/WSL Support** - Full native Windows and WSL support

![Claude Code Chat 1 0 0](https://github.com/user-attachments/assets/5954a74c-eff7-4205-8482-6a1c9de6e102)


---

## 🌟 **Key Features**

### 💬 **Beautiful Chat Graphical Interface**
- No terminal required - everything through the UI
- Real-time streaming responses with typing indicators
- One-click message copying with visual feedback
- Enhanced markdown support with syntax highlighting
- Auto-resizing input that grows with your content
- Copy-to-clipboard for code blocks

### ⏪ **Checkpoint & Session Management**
- **Restore Checkpoints** - Instantly undo changes and restore to any previous state
- Automatic Git-based backup system for safe experimentation
- Browse and restore from any conversation checkpoint
- Automatic conversation saving and restoration
- Real-time cost and token tracking
- Session statistics and performance metrics

### 📝 **Inline Diff Viewer**
- **Full Diff Display** - See complete file changes directly in Edit, MultiEdit, and Write messages
- **Open in VS Code Diff** - One-click button to open VS Code's native side-by-side diff editor
- **Smart Truncation** - Long diffs are truncated with an expand button for better readability
- **Syntax Highlighting** - Proper code highlighting in diff views
- **Visual Change Indicators** - Clear green/red highlighting for additions and deletions

### 🔌 **MCP, Skills & Plugins Marketplace** ⭐ **NEW IN V2.0**
- **MCP Servers** - Browse 30+ featured servers (GitHub, Slack, Stripe, Notion, etc.) with dual registry search
- **Skills** - Browse and install curated skills from skills.sh with project or global scope
- **Plugins** - Browse and install plugins to extend Claude Code
- **Smart Search** - Search across add-mcp curated and official Anthropic registries with relevance ranking
- **Project or Global Install** - Install MCP servers to `.mcp.json` or `~/.claude.json`, skills to `.claude/skills/`
- **One-Click Install** - Pre-filled configuration with env vars, headers, and OAuth authentication

### 🖼️ **Image Preview & Attachments** ⭐ **NEW IN V2.0**
- **Paste Images** - Paste images with thumbnail preview before sending
- **File Picker** - Select images through VS Code's native file picker
- **Preview Strip** - See attached images above the text box with remove buttons
- **Inline Detection** - Image paths in messages are automatically detected and sent as base64
- **Multiple Images** - Attach multiple images to a single message

### 🔒 **Advanced Permissions System**
- **Interactive Permission Dialogs** - Detailed tool information with command previews
- **Always Allow Functionality** - Smart command pattern matching for common tools (npm, git, docker)
- **YOLO Mode** - Skip all permission checks for power users
- **Workspace Permissions** - Granular control over what tools can execute
- **Real-time Permission Management** - Add/remove permissions through intuitive UI

### 📱 **Sidebar Integration**
- **Native VS Code Sidebar** - Full chat functionality in the sidebar panel
- **Smart Panel Management** - Automatic switching between main and sidebar views
- **Persistent Sessions** - State maintained across panel switches
- **Activity Bar Integration** - Quick access from VS Code's activity bar

### 📁 **Smart File Integration**
- Type `@` to instantly search and reference workspace files
- Image attachments via file browser and copy-paste screenshots
- Lightning-fast file search across your entire project
- Seamless context preservation for multi-file discussions

### 🛠️ **Tool Management**
- Visual dashboard showing all available Claude Code tools
- Real-time tool execution with formatted results
- Inline stop button replaces send during processing
- Smart permission system for secure tool execution

### 🎨 **VS Code Integration**
- Native theming that matches your editor
- Status bar with support button
- Activity bar panel for quick access
- Responsive design for any screen size

### 🤖 **Model Selection**
- **Quick Buttons** - GPT, Gemini, MiniMax, Kimi, GLM, DeepSeek above the text box
- **Opus** - Most capable model for complex tasks requiring deep reasoning
- **Sonnet** - Balanced model offering great performance for most use cases
- **Default** - Uses your configured model setting
- **150+ OpenCredits Models** - Browse and switch to any available model
- Model preference persists across sessions
- Provider choice (OpenCredits vs Anthropic) for Claude models

### ⚡ **Slash Commands Integration**
- **Slash Commands Modal** - Type "/" to access all Claude Code commands instantly
- **23+ Built-in Commands** - /agents, /cost, /config, /memory, /review, and more
- **Custom Command Support** - Execute any Claude Code command with session context
- **Session-Aware Execution** - All commands run with current conversation context
- **Terminal Integration** - Commands open directly in VS Code terminal with WSL support

### 🧠 **Advanced AI Modes**
- **Plan First Mode** - Toggle to make Claude plan before implementing changes
- **Thinking Mode** - Configurable intensity levels (Think, Think Hard, Think Harder, Ultrathink)
- **Mode Toggles** - Simple switches above the text input area
- **Intelligent Prompting** - Different prompts based on selected thinking intensity
- **Token Awareness** - Higher thinking levels consume more tokens but provide deeper reasoning

### 💬 **Support & Feedback** ⭐ **NEW IN V2.0**
- **In-App Support** - Click "Support" in the status bar to send feedback
- **Bug Reports & Feature Requests** - Submit directly from the extension
- **Optional Email** - Include your email for follow-up

---

## 🚀 **Getting Started**

### Prerequisites
- **VS Code 1.80+** or **Cursor** - Latest version recommended
- **Claude Code CLI** - [Install from Anthropic](https://claude.ai/code)
- **Active Claude API or subscription** - API or Pro/Max plan
- **Node.js 18+** - Required for installation

### Installation

1. **Install from VS Code Marketplace**
   ```
   ext install claude-code-chat
   ```

2. **Or install manually**
   - Download the `.vsix` file from releases
   - Run `code --install-extension claude-code-chat-x.x.x.vsix`

3. **Open Claude Code Chat**
   - Press `Ctrl+Shift+C` (or `Cmd+Shift+C` on Mac)
   - Or click the Claude icon in your status bar
   - Or use Command Palette: `Claude Code: Open Chat`

---

## 💡 **Usage Examples**

### 🔥 **Code Review & Refactoring**
```
You: @src/components/UserProfile.tsx Can you review this component and suggest improvements?

Claude: I'll analyze your UserProfile component. Looking at the code, here are my recommendations:

1. **Performance Optimization**: Add React.memo() to prevent unnecessary re-renders
2. **TypeScript Enhancement**: The props interface could be more specific
3. **Accessibility**: Missing ARIA labels for screen readers

[Detailed analysis with code examples follows...]
```

### 📊 **Project Analysis**
```
You: Analyze the overall architecture of my project and identify potential issues

Claude: I'll examine your project structure and identify areas for improvement:

🏗️ **Architecture Overview**
- React frontend with TypeScript
- Node.js backend with Express
- MongoDB database layer

⚠️ **Identified Issues**
- Missing error boundaries in React components
- Database queries lack proper indexing
- API routes missing input validation

[Detailed recommendations with implementation examples...]
```

### 🐛 **Debugging Assistant**
```
You: I'm getting a strange error in my API. Here's the stack trace: [paste error]

Claude: Looking at this stack trace, the issue appears to be a race condition in your async middleware. Here's what's happening:

1. **Root Cause**: Multiple requests are modifying shared state
2. **Solution**: Implement proper request isolation
3. **Prevention**: Add comprehensive error handling

[Step-by-step debugging guide follows...]
```

### ⏪ **Safe Experimentation with Checkpoints**
```
You: Can you refactor this entire component to use hooks instead of class components?

Claude: I'll refactor your component to use React hooks. Don't worry - I'll create a checkpoint first so you can easily restore if needed.

[Creates automatic checkpoint]

Here's the refactored component using hooks:
[Shows the new implementation]

If you want to revert these changes, just click "Restore Checkpoint" to go back to your original code instantly.
```

---

## ⚙️ **Configuration**

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+C` | Open Claude Code Chat |
| `Enter` | Send message |
| `@` | Open file picker |
| `/` | Open slash commands modal |

### WSL Configuration (Windows Users)
If you're using Claude Code through WSL (Windows Subsystem for Linux), you can configure the extension to use WSL:

1. Open VS Code Settings (`Ctrl+,` or `Cmd+,`)
2. Search for "Claude Code Chat"
3. Configure these settings:
   - **Claude Code Chat: WSL Enabled** - Enable WSL integration
   - **Claude Code Chat: WSL Distro** - Your WSL distribution name (e.g., `Ubuntu`, `Debian`)
   - **Claude Code Chat: WSL Node Path** - Path to Node.js in WSL (default: `/usr/bin/node`)
   - **Claude Code Chat: WSL Claude Path** - Path to Claude in WSL (default: `/usr/local/bin/claude`)

Example configuration in `settings.json`:
```json
{
  "claudeCodeChat.wsl.enabled": true,
  "claudeCodeChat.wsl.distro": "Ubuntu",
  "claudeCodeChat.wsl.nodePath": "/usr/bin/node",
  "claudeCodeChat.wsl.claudePath": "/usr/local/bin/claude"
}
```

---

## 🎯 **Pro Tips & Tricks**

### 🔥 **File Context Magic**
- Type `@` followed by your search term to quickly reference files
- Use `@src/` to narrow down to specific directories
- Reference multiple files in one message for cross-file analysis
- Paste images directly with preview thumbnails before sending
- Paste screenshots with Ctrl+V for instant visual communication

### ⚡ **Productivity Boosters**
- **Creates checkpoints automatically** before changes for safe experimentation
- **Restore instantly** if changes don't work out as expected
- Permission system prevents accidental tool execution
- YOLO mode for power users who want speed over safety
- Inline stop button to cancel long-running operations
- Copy message contents to reuse Claude's responses
- Open history panel to reference previous conversations
- Sidebar integration for multi-panel workflow
- **Plan mode** and **Ultrathink** toggles above the text box

### 🎨 **Interface Customization**
- The UI automatically adapts to your VS Code theme
- Messages are color-coded: Green for you, Blue for Claude
- Hover over messages to reveal the copy button
- Enhanced code block rendering with syntax highlighting
- Copy-to-clipboard functionality for code blocks

---

## 🔧 **Advanced Features**

### 🛠️ **Tool Integration**
Claude Code Chat provides secure access to all Claude Code tools:
- **Bash** - Execute shell commands with permission controls
- **File Operations** - Read, write, and edit files
- **Search** - Grep and glob pattern matching across workspace
- **Web** - Fetch and search web content
- **Multi-edit** - Batch file modifications
- **MCP Servers** - Extend functionality with Model Context Protocol servers
- **Permissions System** - Granular control over tool execution for security

### 📊 **Analytics & Monitoring**
- **Real-time cost tracking** - Monitor your API usage
- **Token consumption** - See input/output token counts
- **Response timing** - Track performance metrics
- **Session statistics** - Comprehensive usage analytics

### ⏪ **Checkpoint System**
- **Instant restoration** - One-click restore to any previous state
- **Conversation checkpoints** - Every change creates a restore point
- **Visual timeline** - See and navigate through all your project states

### 🔄 **Conversation History**
- **Automatic saving** - Every conversation is preserved
- **Smart restoration** - Resume exactly where you left off
- **Switch between chats** - Easily check and switch to previous conversations

---

## 🤝 **Contributing**

We welcome contributions! Here's how you can help:

1. **🐛 Report Bugs** - Use our issue tracker
2. **💡 Suggest Features** - Share your ideas
3. **🔧 Submit PRs** - Help us improve the codebase
4. **📚 Improve Docs** - Make the documentation better

### Development Setup
```bash
git clone https://github.com/andrepimenta/claude-code-chat
cd claude-code-chat
npm install

Click "F5" to run the extension or access the "Run and Debug" section in VSCode
```

---

## 📝 **License**

See the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- **Anthropic** - For creating the amazing Claude AI and more specifically the Claude Code SDK
- **VS Code Team** - For the incredible extension platform
- **Our Community** - For feedback, suggestions, and contributions

---

## 📞 **Support**

Need help? We've got you covered:

- 💬 **In-App** - Click "Support" in the status bar to send feedback directly
- 🐛 **Issues**: [GitHub Issues](https://github.com/andrepimenta/claude-code-chat/issues)

---

<div align="center">

**⭐ Star us on GitHub if this project helped you!**

[**Download Now**](https://marketplace.visualstudio.com/items?itemName=andrepimenta.claude-code-chat)

</div>
