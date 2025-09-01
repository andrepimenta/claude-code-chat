import * as vscode from 'vscode';

export interface ConversationData {
	sessionId: string;
	startTime: string | undefined;
	endTime: string;
	messageCount: number;
	totalCost: number;
	totalTokens: {
		input: number;
		output: number;
	};
	messages: Array<{ timestamp: string, messageType: string, data: any }>;
	filename: string;
}

export interface ConversationIndexEntry {
	filename: string;
	sessionId: string;
	startTime: string;
	endTime: string;
	messageCount: number;
	totalCost: number;
	firstUserMessage: string;
	lastUserMessage: string;
}

export interface CommitInfo {
	id: string;
	sha: string;
	message: string;
	timestamp: string;
}

export interface TokenUsage {
	input_tokens?: number;
	output_tokens?: number;
	cache_creation_input_tokens?: number;
	cache_read_input_tokens?: number;
}

export interface WebviewMessage {
	type: string;
	data?: any;
	text?: string;
	planMode?: boolean;
	thinkingMode?: boolean;
	model?: string;
	command?: string;
	filename?: string;
	settings?: { [key: string]: any };
	searchTerm?: string;
	filePath?: string;
	imageData?: string;
	imageType?: string;
	id?: string;
	approved?: boolean;
	alwaysAllow?: boolean;
	toolName?: string;
	name?: string;
	config?: any;
	snippetId?: string;
	snippet?: any;
}

export interface PermissionRequest {
	id: string;
	tool: string;
	input: any;
	timestamp: string;
}

export interface PermissionResponse {
	id: string;
	approved: boolean;
	timestamp: string;
}

export interface Permissions {
	alwaysAllow: { [toolName: string]: boolean | string[] };
}

export interface MCPServerConfig {
	command: string;
	args: string[];
	env?: { [key: string]: string };
}

export interface WorkspaceFile {
	name: string;
	path: string;
	fsPath: string;
}

export interface ClaudeSettings {
	'thinking.intensity': string;
	'wsl.enabled': boolean;
	'wsl.distro': string;
	'wsl.nodePath': string;
	'wsl.claudePath': string;
	'permissions.yoloMode': boolean;
}

export interface PlatformInfo {
	platform: string;
	isWindows: boolean;
	wslAlertDismissed: boolean;
	wslEnabled: boolean;
}