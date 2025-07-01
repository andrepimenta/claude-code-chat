# 🚀 Claude Code Chat - Beautiful Claude Code Chat Interface for VS Code

[![VS Code Extension](https://img.shields.io/badge/VS%20Code-Extension-blue?style=for-the-badge&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=andrepimenta.claude-code-chat)
[![Claude Code](https://img.shields.io/badge/Powered%20by-Claude%20Code-orange?style=for-the-badge)](https://claude.ai/code)
[![TypeScript](https://img.shields.io/badge/Built%20with-TypeScript-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

> **No more terminal commands. Chat with Claude Code through a beautiful, intuitive interface right inside VS Code.**

Ditch the command line and experience Claude Code like never before. This extension brings a stunning chat interface directly into your editor, making AI assistance accessible, visual, and enjoyable.

🤖 **Built by Claude Code for Claude Code** - This extension was entirely developed using Claude Code itself. Claude Code created its own chat interface!

---

## ✨ **Why Choose Claude Code Chat?**

🖥️ **No Terminal Required** - Beautiful chat interface replaces command-line interactions  
⏪ **Restore Checkpoints** - Undo changes and restore code to any previous state  
💾 **Conversation History** - Automatic conversation history and session management  
🎨 **VS Code Native** - Claude Code integrated directly into VS Code with native theming  
🧠 **Plan and Thinking modes** - Plan First and configurable Thinking modes for better results  
⚡ **Smart File Context and Commands** - Reference any file with simple @ mentions and / for commands  
🤖 **Model Selection** - Choose between Opus, Sonnet, or Default based on your needs  
🐧 **WSL Support** - Full Windows Subsystem for Linux integration and compatibility

![Claude Code Chat Cut](https://github.com/user-attachments/assets/d4ded28f-a4ed-4862-9766-c1ff89947775)


---

## 🌟 **Key Features**

### 💬 **Beautiful Chat Graphical Interface**
- No terminal required - everything through the UI
- Real-time streaming responses with typing indicators
- One-click message copying with visual feedback
- Rich markdown support for code blocks and formatting
- Auto-resizing input that grows with your content

### ⏪ **Checkpoint & Session Management**
- **Restore Checkpoints** - Instantly undo changes and restore to any previous state
- Automatic Git-based backup system for safe experimentation
- Browse and restore from any conversation checkpoint
- Automatic conversation saving and restoration
- Real-time cost and token tracking
- Session statistics and performance metrics

### 📁 **Smart File Integration**
- Type `@` to instantly search and reference workspace files
- Image attachments via file browser
- Lightning-fast file search across your entire project
- Seamless context preservation for multi-file discussions

### 🛠️ **Tool Management**
- Visual dashboard showing all available Claude Code tools
- Real-time tool execution with formatted results
- Process control - start, stop, and monitor operations

### 🎨 **VS Code Integration**
- Native theming that matches your editor
- Status bar integration with connection status
- Activity bar panel for quick access
- Responsive design for any screen size

### 🤖 **Model Selection**
- **Opus** - Most capable model for complex tasks requiring deep reasoning
- **Sonnet** - Balanced model offering great performance for most use cases
- **Default** - Uses your configured model setting
- Model preference persists across sessions and is saved automatically
- Easy switching via dropdown selector in the chat interface
- Visual confirmation when switching between models
- One-click model configuration through integrated terminal

### ⚡ **Slash Commands Integration**
- **Slash Commands Modal** - Type "/" to access all Claude Code commands instantly
- **19+ Built-in Commands** - /cost, /status, /config, /help, /memory, /review, and more
- **Custom Command Support** - Execute any Claude Code command with session context
- **Session-Aware Execution** - All commands run with current conversation context
- **Terminal Integration** - Commands open directly in VS Code terminal with WSL support

### 🧠 **Advanced AI Modes**
- **Plan First Mode** - Toggle to make Claude plan before implementing changes
- **Thinking Mode** - Configurable intensity levels (Think, Think Hard, Think Harder, Ultrathink)
- **Mode Toggles** - Simple switches above the text input area
- **Intelligent Prompting** - Different prompts based on selected thinking intensity
- **Token Awareness** - Higher thinking levels consume more tokens but provide deeper reasoning

---

## 🚀 **Getting Started**

### Prerequisites
- **VS Code 1.80+** - Latest version recommended
- **Claude Code CLI** - [Install from Anthropic](https://claude.ai/code)
- **Active Claude API or subscription** - API or Pro/Max plan

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

### ⚡ **Productivity Boosters**
- **Creates checkpoints automatically** before changes for safe experimentation
- **Restore instantly** if changes don't work out as expected
- Use the stop button to cancel long-running operations
- Copy message contents to reuse Claude's responses
- Open history panel to reference previous conversations

### 🎨 **Interface Customization**
- The UI automatically adapts to your VS Code theme
- Messages are color-coded: Green for you, Blue for Claude
- Hover over messages to reveal the copy button

---

## 🔧 **Advanced Features**

### 🛠️ **Tool Integration**
Claude Code Chat provides full access to all Claude Code tools:
- **Bash** - Execute shell commands
- **File Operations** - Read, write, and edit files
- **Search** - Grep and glob pattern matching
- **Web** - Fetch and search web content
- **Multi-edit** - Batch file modifications
- **While in Beta, all tools are enabled by default, use at your own risk!**

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

- 🐛 **Issues**: [GitHub Issues](https://github.com/andrepimenta/claude-code-chat/issues)

---

<div align="center">

**⭐ Star us on GitHub if this project helped you!**

[**Download Now**](https://marketplace.visualstudio.com/items?itemName=andrepimenta.claude-code-chat)

</div>
