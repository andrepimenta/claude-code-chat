# Change Log

All notable changes to the "claude-code-chat" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.2.1] - 2026-01-05

### 🚀 Features Added

#### **User Commands Discovery**
- Commands now discovered from both global (`~/.claude/commands/`) and project (`.claude/commands/`) folders
- Different icons distinguish command sources: 📂 for project commands, 👤 for global commands
- Project commands override global commands with the same name
- Duplicate detection with visual warning showing which commands exist in both locations

#### **Sync .claude Folder**
- New "Sync Now" button in Settings to refresh user commands
- Instantly re-scans both global and project `.claude/commands/` folders
- Visual feedback with success/error status messages

#### **AskUserQuestion Tool Support**
- Full UI support for Claude's `AskUserQuestion` tool
- Purple-themed question cards with multiple choice options
- Support for single and multi-select questions
- "Other" option with custom text input
- Smooth animations and visual feedback

#### **Plan Mode Improvements**
- Fixed plan mode state synchronization when ExitPlanMode is allowed
- UI toggle now correctly syncs to OFF when plan mode exits

#### **Version Badge**
- Extension version now displayed in header
- Easy visibility of current installed version

### 🐛 Bug Fixes
- **Critical**: Fixed `tool_use_id` field naming mismatch in control_response messages (was sending `toolUseID` instead of `tool_use_id`)
- Fixed plan mode toggle not syncing when Claude exits plan mode via ExitPlanMode tool

### 🔧 Technical Improvements
- Renamed "Custom Commands" section to "User Commands" to avoid confusion with user-created snippets
- Added cross-platform build script (`build.js`) with version prompting
- Improved command discovery with proper deduplication logic

## [1.1.0] - 2025-12-06

### 🚀 Features Added
- **Install Modal**: Added installation flow for users without Claude Code CLI
  - Auto-detects when Claude Code is not installed
  - One-click installation with progress indicator
  - Platform-specific installation commands
- **Diff Viewer Improvements**:
  - Show full diff in Edit, MultiEdit, and Write tool use messages
  - Add "Open Diff" button to open VS Code's native side-by-side diff editor
  - Add truncation with expand button for long diffs
  - Optimize diff storage and improve Open Diff button behavior
- **Processing Indicator**: New morphing orange dot animation while Claude is working
- **Subscription Detection**: Added usage badge to status bar showing plan type (Pro, Max) or API cost
- **Conversation Compacting**: Handle `/compact` command in chat with status messages and token reset
- **Permission System**: Migrated from MCP file-based to stdio-based permission prompts
- **Plan Mode**: Now uses native `--permission-mode plan` CLI flag for cleaner implementation

### 🐛 Bug Fixes
- Fixed diff line alignment by removing ::before pseudo-elements
- Fixed auto-scroll for diff tool results
- Strip tool_use_error tags from error messages
- Improved process termination handling

### 🔧 Technical Improvements
- Run /compact command in chat instead of spawning terminal
- Improved terminal and UI experience
- Updated diff icon colors

### 📊 Analytics
- Added Umami analytics events to track install flow (modal shown, started, success/failed)

## [1.0.7] - 2025-10-01

### 🚀 Features Added
- **Slash Commands Update**: Added 4 new slash commands to the commands modal
  - `/add-dir` - Add additional working directories
  - `/agents` - Manage custom AI subagents for specialized tasks
  - `/rewind` - Rewind the conversation and/or code
  - `/usage` - Show plan usage limits and rate limit status (subscription plans only)

### 📚 Documentation Updates
- Updated slash commands count from 19+ to 23+ built-in commands
- Enhanced command descriptions for better clarity:
  - `/config` - Now specifies "Open the Settings interface (Config tab)"
  - `/cost` - Added note about cost tracking guide for subscription-specific details
  - `/status` - Expanded description to mention version, model, account, and connectivity
  - `/terminal-setup` - Added clarification about iTerm2 and VSCode only support

## [1.0.6] - 2025-08-26

### 🐛 Bug Fixes
- Fixed typo in codebase
- Removed priority settings that were no longer needed

### 🔧 Technical Improvements
- Moved script to separate file for better code organization

## [1.0.5] - 2025-07-30

### 🚀 Features Added
- **MCP Integration**: Added claude-code-chat-permissions-mcp folder for enhanced permission management
- **Message Persistence**: Save message in text box for better user experience
- **UI Improvements**: Always display history and new chat options
- **Input Enhancement**: Removed maxlength limit for custom command prompt textarea

### 🐛 Bug Fixes
- Fixed new chat functionality
- Fixed request start time isProcessing issue
- Fixed close and open conversation behavior

### 🔄 Merged Pull Requests
- Merged PR #87 from horatio-sans-serif/main

## [1.0.4] - 2025-01-22

### 🐛 Bug Fixes
- Fixed input text area overflow issue by adding `box-sizing: border-box` to prevent padding from extending beyond container width
- Fixed command parameter handling for `claude-code-chat.openChat` to properly handle both ViewColumn and Uri parameters from different invocation contexts

### 🔧 Technical Improvements
- Enhanced `show()` method to accept optional ViewColumn parameter with ViewColumn.Two as default
- Added proper type checking for command parameters to handle context menu invocations
- Improved webview panel positioning with flexible column parameter support

### 🎨 UI/UX Improvements
- Resolved text input container sizing issues that caused visual overflow
- Better input field styling consistency across different VS Code themes

## [1.0.0] - 2025-01-15

### 🚀 Major Features Added

#### **Advanced Permissions Management System**
- Complete permissions framework with MCP integration for secure tool execution
- Interactive permission dialogs with detailed tool information and command previews
- "Always Allow" functionality with smart command pattern matching for common tools (npm, git, docker, etc.)
- YOLO mode for power users to skip all permission checks
- Comprehensive permissions settings UI with ability to add/remove specific permissions
- File system watcher for real-time permission request handling
- Workspace-specific permission storage and management

#### **MCP (Model Context Protocol) Server Management**
- Complete MCP server configuration interface
- Popular MCP servers gallery with one-click installation
- Custom MCP server creation with validation
- Server management (edit, delete, enable/disable)
- Automatic permissions server integration
- WSL path conversion for cross-platform compatibility

#### **Sidebar Integration & Multi-Panel Support**
- Native VS Code sidebar view with full chat functionality
- Smart panel management (auto-close main panel when sidebar opens)
- Persistent session state across panel switches
- Proper webview lifecycle management
- Activity bar integration with custom icon

#### **Image & Clipboard Enhancements**
- Drag-and-drop image support directly into chat
- Clipboard image paste functionality (Ctrl+V for screenshots)
- Multiple image selection with VS Code's native file picker
- Automatic image organization in `.claude/claude-code-chat-images/` folder
- Automatic `.gitignore` creation for image folders
- Support for PNG, JPG, JPEG, GIF, SVG, WebP, BMP formats

#### **Code Block & Syntax Improvements**
- Enhanced markdown parsing with proper code block detection
- Syntax highlighting for code blocks with language detection
- Copy-to-clipboard functionality for code blocks
- Improved inline code rendering
- Better handling of technical identifiers and underscores

### 🎨 UI/UX Improvements

#### **Settings & Configuration**
- Comprehensive settings modal with organized sections
- YOLO mode toggle with visual warnings and explanations
- Real-time settings synchronization between UI and VS Code config
- Better visual hierarchy and professional styling
- Smart configuration validation and error handling

#### **Message & Chat Interface**
- Improved message spacing and visual consistency
- Enhanced tool result display with better formatting
- Smart scrolling behavior (only auto-scroll if user is at bottom)
- Loading indicators and processing states
- Better error handling and user feedback

#### **YOLO Mode Visual Design**
- Less subtle YOLO mode section (increased opacity and size)
- Changed warning icon from ⚠️ to 🚀 for less intimidating appearance
- Soft tomato red styling that's noticeable but not scary
- Clear explanation of YOLO mode functionality

### 🔧 Technical Enhancements

#### **Session & State Management**
- Persistent session state across VS Code restarts
- Proper cleanup of resources and event listeners
- Better error handling for failed operations
- Improved memory management for large conversations

#### **Cross-Platform Compatibility**
- Enhanced WSL support with proper path conversion
- Windows-specific improvements and fixes
- Better handling of different operating system environments
- Improved subprocess management and cleanup

#### **Performance Optimizations**
- Reduced context usage with more efficient tool operations
- Better file search and workspace integration
- Optimized message handling and UI updates
- Improved extension activation and initialization times

#### **Developer Experience**
- Better error messages and debugging information
- Improved extension logging and troubleshooting
- Enhanced development workflow support
- Better TypeScript integration and type safety

### 🐛 Bug Fixes
- Fixed multiple permission prompts being sent simultaneously
- Resolved panel management issues with multiple webviews
- Fixed expand/collapse functionality for long content
- Corrected Unix timestamp parsing for usage limit messages
- Fixed WSL integration on Windows systems
- Resolved markdown parsing issues with underscores in code
- Fixed copy-paste functionality for images and code blocks
- Corrected file path handling across different platforms

### 🔄 Breaking Changes
- Permission system now requires explicit approval for tool execution (unless YOLO mode is enabled)
- Image files are now stored in `.claude/claude-code-chat-images/` instead of root directory
- MCP configuration moved to extension storage instead of global config

### 📚 Documentation & Community
- Updated README with comprehensive feature documentation
- Fixed GitHub issues link in repository
- Enhanced examples and usage guides
- Better onboarding experience for new users

## [0.1.3] - 2025-06-24

### 🚀 Features Added

#### **MultiEdit and Edit Tool Diff Display**
- Added comprehensive diff visualization for MultiEdit tool operations
- Shows file path with click-to-open functionality
- Displays multiple edits with numbered labels (Edit #1, Edit #2, etc.)
- Smart truncation handling - shows complete edits within line limits
- Expandable interface with "Show X more edits" button
- Visual separators between individual edits
- Consistent styling with existing Edit tool diff display

#### **Enhanced Tool Result Management**
- Added MultiEdit to hidden tool results list for cleaner interface
- Tool results for Read, Edit, TodoWrite, and MultiEdit now show loading states instead of uninteresting success messages
- Improved user experience by hiding redundant "Tool executed successfully" messages

### 🎨 UI/UX Improvements

#### **Thinking Intensity Modal Enhancement**
- Fixed bug where thinking mode toggle text changed before user confirmation
- Toggle text now only updates when user clicks "Confirm" button
- Preview selection highlighting still works during option exploration
- Improved user experience with proper confirmation workflow

#### **Consistent Message Spacing**
- Standardized spacing between tool messages and user/Claude messages
- Updated tool input padding from 12px to 8px to match message spacing
- Unified visual consistency across all message types

#### **Refined Visual Design**
- Changed MultiEdit edit number labels from purple to subtle professional styling
- Used VS Code theme colors for better integration
- Improved overall visual cohesion with more sober color palette

### 🔧 Technical Improvements
- Enhanced tool message formatting infrastructure
- Improved diff rendering performance for multiple edits
- Better error handling for malformed MultiEdit tool inputs
- Optimized truncation logic for complex multi-edit operations

## [0.1.2] - 2025-06-20

### 🐛 Bug Fixes
- Fixed markdown parsing bug where underscores in code identifiers (like "protein_id") were incorrectly converted to italic formatting
- Updated regex pattern to only apply italic formatting when underscores are surrounded by whitespace or at string boundaries
- Preserved proper formatting for code snippets and technical identifiers
- Always show New Chat button

## [0.1.0] - 2025-06-20

### 🚀 Major Features Added

#### **Interactive Thinking Mode with Intensity Control**
- Added configurable thinking mode with 4 intensity levels: Think, Think Hard, Think Harder, Ultrathink
- Beautiful slider interface in settings for intensity selection
- Clickable intensity labels for easy selection
- Different thinking prompts based on selected intensity level
- Higher intensities provide more detailed reasoning but consume more tokens
- Settings persist across sessions with VS Code configuration integration

#### **Plan First Mode**
- New toggle for "Plan First" mode that instructs Claude to plan before making changes
- Requires user approval before proceeding with implementation
- Safer experimentation workflow for complex changes
- Simple switch interface above the text input area

#### **Slash Commands Modal System**
- Type "/" to open beautiful slash commands modal with 19+ commands
- Complete Claude Code command integration: /bug, /clear, /compact, /config, /cost, /doctor, /help, /init, /login, /logout, /mcp, /memory, /model, /permissions, /pr_comments, /review, /status, /terminal-setup, /vim
- Custom command input field for executing any Claude Code command
- Session-aware command execution with automatic session resumption
- Commands open in VS Code terminal with proper WSL support
- Visual feedback and user guidance for terminal interaction

#### **Enhanced Model Configuration**
- Updated "Default" model to show "User configured" instead of "Smart allocation"
- Added "Configure" button next to Default model option
- Configure button opens terminal with `claude /model` command for easy model setup
- Session-aware model configuration with current session context
- Clear user messaging about terminal interaction and return workflow

#### **Advanced Settings Management**
- Restructured settings with better organization and grouping
- Added "Coming Soon" sections for Custom Slash Commands and MCP Configuration
- Consistent UI patterns across all settings sections
- Clean, professional design matching VS Code aesthetics

### 🎨 **UI/UX Improvements**
- Smaller, more subtle mode toggle switches (reduced by 2px)
- Clickable text labels for all toggle switches
- Improved slider positioning and label alignment
- Sober, clean interface design without unnecessary colors or decorations
- Better visual hierarchy in settings modal
- Responsive design improvements

### 🔧 **Technical Enhancements**
- Session ID now passed to all slash commands for context awareness
- Improved message handling between frontend and backend
- Better error handling and user feedback
- Enhanced WSL compatibility for all new features
- Modular code structure for easier maintenance

### 📚 **Documentation Updates**
- Updated keyboard shortcuts documentation
- Enhanced configuration examples
- Improved feature descriptions and usage examples

## [0.0.9] - 2025-06-19

### Added
- Model selector dropdown in the chat interface
  - Located to the left of the tools selector at the bottom of the chat box
  - Supports three models: Opus (most capable), Sonnet (balanced), and Default (smart allocation)
  - Model preference is saved and persists across sessions
  - Validates model selection to prevent invalid model names
  - Shows confirmation message when switching models

### Changed
- Reorganized input controls into left-controls and right-controls sections for better layout
- Claude command now includes the --model flag when a specific model is selected

## [0.0.8] - 2025-06-19

### Added
- WSL (Windows Subsystem for Linux) configuration support
  - New setting: `claudeCodeChat.wsl.enabled` to enable WSL integration
  - New setting: `claudeCodeChat.wsl.distro` to specify WSL distribution
  - New setting: `claudeCodeChat.wsl.nodePath` to configure Node.js path in WSL
  - New setting: `claudeCodeChat.wsl.claudePath` to configure Claude path in WSL
- Automatic detection of execution environment (native vs WSL)
- WSL support for Claude login terminal command

### Changed
- Claude execution now supports both native and WSL environments based on configuration
- Terminal login command adapts to WSL settings when enabled

## [0.0.7] - Previous Release

- Initial release