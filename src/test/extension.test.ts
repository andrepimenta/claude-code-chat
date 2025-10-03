import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Extension should be present', () => {
		assert.ok(vscode.extensions.getExtension('AndrePimenta.claude-code-chat'));
	});

	test('Extension should activate', async () => {
		const extension = vscode.extensions.getExtension('AndrePimenta.claude-code-chat');
		if (extension && !extension.isActive) {
			await extension.activate();
		}
		assert.ok(extension?.isActive);
	});

	test('Commands should be registered', async () => {
		const commands = await vscode.commands.getCommands(true);
		assert.ok(commands.includes('claude-code-chat.openChat'));
		assert.ok(commands.includes('claude-code-chat.loadConversation'));
	});
});
