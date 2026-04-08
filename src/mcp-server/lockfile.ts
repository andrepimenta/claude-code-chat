import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as os from 'os';
import { LOCKFILE_DIR, ILockfileData } from './types';

let registeredPort: number | null = null;

function lockfilePath(port: number): string {
  return path.join(LOCKFILE_DIR, `${port}.lock`);
}

/**
 * Detect IDE name from environment variables.
 * Matches Claude Code source env.ts detection chain.
 */
function detectIdeName(): string {
  // Cursor: CURSOR_TRACE_ID or CURSOR_CHANNEL, or askpass path contains 'cursor'
  if (process.env.CURSOR_TRACE_ID || process.env.CURSOR_CHANNEL) {
    return 'Cursor';
  }
  const askpass = process.env.VSCODE_GIT_ASKPASS_MAIN || '';
  if (askpass.toLowerCase().includes('cursor')) {
    return 'Cursor';
  }
  // Windsurf: askpass path contains 'windsurf'
  if (askpass.toLowerCase().includes('windsurf')) {
    return 'Windsurf';
  }
  return 'VS Code';
}

/**
 * Ensure diffTool is set to 'auto' in ~/.claude/config.json.
 * Without this, CLI will never show diffs in the IDE.
 * Only sets if not already configured (respects user preference).
 */
export async function ensureDiffToolConfig(): Promise<void> {
  const configPath = path.join(os.homedir(), '.claude', 'config.json');
  let config: Record<string, unknown> = {};

  try {
    const content = await fs.readFile(configPath, 'utf-8');
    config = JSON.parse(content);
  } catch {
    // File doesn't exist or invalid JSON — create it
  }

  if (!config.diffTool) {
    config.diffTool = 'auto';
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
    console.log('[MCP IDE Server] Set diffTool=auto in ~/.claude/config.json');
  }
}

export async function writeLockfile(
  port: number,
  workspaceFolders: string[],
  authToken: string
): Promise<void> {
  await fs.mkdir(LOCKFILE_DIR, { recursive: true });

  // Normalize paths to NFC for macOS compatibility (source uses .normalize('NFC'))
  const normalizedFolders = workspaceFolders.map(f => f.normalize('NFC'));

  const data: ILockfileData = {
    workspaceFolders: normalizedFolders,
    pid: process.pid,
    ideName: detectIdeName(),
    transport: 'ws',
    runningInWindows: process.platform === 'win32',
    authToken,
  };

  await fs.writeFile(lockfilePath(port), JSON.stringify(data, null, 2), 'utf-8');
}

export async function removeLockfile(port: number): Promise<void> {
  try {
    await fs.unlink(lockfilePath(port));
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      console.error('[MCP IDE Server] Failed to remove lockfile:', err);
    }
  }
}

function onExit() {
  if (registeredPort !== null) {
    try {
      // Synchronous removal on process exit
      require('fs').unlinkSync(lockfilePath(registeredPort));
    } catch {
      // best effort
    }
  }
}

export function installCrashGuard(port: number): void {
  registeredPort = port;
  process.on('exit', onExit);
  process.on('SIGINT', onExit);
  process.on('SIGTERM', onExit);
}

export function uninstallCrashGuard(): void {
  process.removeListener('exit', onExit);
  process.removeListener('SIGINT', onExit);
  process.removeListener('SIGTERM', onExit);
  registeredPort = null;
}
