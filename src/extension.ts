import * as vscode from 'vscode';
import { ClaudeChatProvider } from './providers/ClaudeChatProvider';
import { ClaudeChatWebviewProvider } from './providers/ClaudeChatWebviewProvider';

export function activate(context: vscode.ExtensionContext) {
	console.log('Claude Code Chat extension is being activated!');
	const provider = new ClaudeChatProvider(context.extensionUri, context);

	const disposable = vscode.commands.registerCommand('claude-code-chat.openChat', (column?: vscode.ViewColumn) => {
		console.log('Claude Code Chat command executed!');
		provider.show(column);
	});

	const loadConversationDisposable = vscode.commands.registerCommand('claude-code-chat.loadConversation', (filename: string) => {
		provider.loadConversation(filename);
	});

	// Register webview view provider for sidebar chat (using shared provider instance)
	const webviewProvider = new ClaudeChatWebviewProvider(context.extensionUri, context, provider);
	vscode.window.registerWebviewViewProvider('claude-code-chat.chat', webviewProvider);

	// Listen for configuration changes
	const configChangeDisposable = vscode.workspace.onDidChangeConfiguration(event => {
		if (event.affectsConfiguration('claudeCodeChat.wsl')) {
			console.log('WSL configuration changed, starting new session');
			provider.newSessionOnConfigChange();
		}
	});

	// Create status bar item
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusBarItem.text = "Claude";
	statusBarItem.tooltip = "Open Claude Code Chat (Ctrl+Shift+C)";
	statusBarItem.command = 'claude-code-chat.openChat';
	statusBarItem.show();

	context.subscriptions.push(disposable, loadConversationDisposable, configChangeDisposable, statusBarItem);
	console.log('Claude Code Chat extension activation completed successfully!');
}

export function deactivate() { }