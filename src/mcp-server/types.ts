import * as path from 'path';
import * as os from 'os';

// ── Lockfile ────────────────────────────────────────────────────────────────
// Matches Claude Code source ide.ts:73-80
export interface ILockfileData {
  workspaceFolders: string[];
  pid: number;
  ideName: string;
  transport: 'ws' | 'sse';
  runningInWindows: boolean;
  authToken?: string;
}

// ── Tool Inputs ─────────────────────────────────────────────────────────────

export interface OpenDiffInput {
  old_file_path: string;
  new_file_path: string;
  new_file_contents: string;
  tab_name: string;
}

export interface OpenFileInput {
  filePath: string;
  preview?: boolean;
  startText?: string;
  endText?: string;
  selectToEndOfLine?: boolean;
  makeFrontmost?: boolean;
}

export interface GetDiagnosticsInput {
  uri?: string;
}

export interface CloseTabInput {
  tab_name: string;
}

export interface ExecuteCodeInput {
  code: string;
  language?: string;
}

// ── Tool Outputs ────────────────────────────────────────────────────────────

export type DiffResult =
  | { action: 'FILE_SAVED'; newContent: string }
  | { action: 'TAB_CLOSED' }
  | { action: 'DIFF_REJECTED' };

// Matches Claude Code source diagnosticTracking.ts
export interface DiagnosticItem {
  message: string;
  severity: 'Error' | 'Warning' | 'Info' | 'Hint';
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
  source?: string;
  code?: string;
}

export interface DiagnosticEntry {
  uri: string;
  diagnostics: DiagnosticItem[];
}

// ── Tool Executor Interface ─────────────────────────────────────────────────
// extension.ts implements this to bridge MCP tools → VS Code APIs

export interface IToolExecutor {
  executeDiff(input: OpenDiffInput): Promise<DiffResult>;
  closeTab(tabName: string): Promise<void>;
  closeAllDiffTabs(): Promise<void>;
  openFile(input: OpenFileInput): Promise<void>;
  getDiagnostics(uri?: string): Promise<DiagnosticEntry[]>;
  executeCode(input: ExecuteCodeInput): Promise<string>;
}

// ── MCP Server Return Type ──────────────────────────────────────────────────

export interface McpIdeServer {
  port: number;
  dispose(): Promise<void>;
}

// ── Constants ───────────────────────────────────────────────────────────────

export const LOCKFILE_DIR = path.join(os.homedir(), '.claude', 'ide');
export const WS_SUBPROTOCOL = 'mcp';
export const AUTH_HEADER = 'x-claude-code-ide-authorization';
export const SERVER_NAME = 'claude-code-chat-ide';
export const SERVER_VERSION = '1.0.0';
