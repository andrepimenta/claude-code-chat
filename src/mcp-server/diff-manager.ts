import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import type { OpenDiffInput, DiffResult } from './types';

/** Default diff timeout in ms (10 minutes). */
const DIFF_TIMEOUT_MS = 10 * 60 * 1000;

interface TrackedDiff {
  tabName: string;
  tempFileUri: vscode.Uri;
  originalUri: vscode.Uri;
  resolve: (result: DiffResult) => void;
  resolved: boolean;
  disposables: vscode.Disposable[];
  timeoutHandle: ReturnType<typeof setTimeout> | null;
}

/**
 * Manages interactive diff tabs for the MCP IDE Server.
 * Opens editable diffs and returns user action (FILE_SAVED, TAB_CLOSED, DIFF_REJECTED).
 * Does NOT write files to disk — the CLI handles file persistence.
 */
export class DiffManager {
  private _activeDiffs = new Map<string, TrackedDiff>();
  private _tempDir: string;

  constructor() {
    this._tempDir = path.join(os.tmpdir(), 'claude-code-chat-diffs');
  }

  async openInteractiveDiff(input: OpenDiffInput): Promise<DiffResult> {
    // Close existing diff with same tab_name if any
    if (this._activeDiffs.has(input.tab_name)) {
      await this.closeTab(input.tab_name);
    }

    // Ensure temp directory
    await fs.mkdir(this._tempDir, { recursive: true });

    // Read original file content (left side)
    let originalContent = '';
    try {
      originalContent = await fs.readFile(input.old_file_path, 'utf-8');
    } catch {
      // New file — left side is empty
    }

    // Write proposed content to a temp file (right side, editable)
    const safeName = path.basename(input.new_file_path).replace(/[^a-zA-Z0-9._-]/g, '_');
    const tempFileName = `${Date.now()}-${safeName}`;
    const tempFilePath = path.join(this._tempDir, tempFileName);
    await fs.writeFile(tempFilePath, input.new_file_contents, 'utf-8');

    const tempFileUri = vscode.Uri.file(tempFilePath);
    const originalUri = vscode.Uri.file(input.old_file_path);

    return new Promise<DiffResult>(async (resolve) => {
      const disposables: vscode.Disposable[] = [];

      const tracked: TrackedDiff = {
        tabName: input.tab_name,
        tempFileUri,
        originalUri,
        resolve,
        resolved: false,
        disposables,
        timeoutHandle: null,
      };

      this._activeDiffs.set(input.tab_name, tracked);

      const safeResolve = (result: DiffResult) => {
        if (tracked.resolved) { return; }
        tracked.resolved = true;
        if (tracked.timeoutHandle) { clearTimeout(tracked.timeoutHandle); }
        this._cleanup(input.tab_name);
        resolve(result);
      };

      // Timeout: auto-close after 10 minutes to prevent indefinite blocking
      tracked.timeoutHandle = setTimeout(() => {
        safeResolve({ action: 'TAB_CLOSED' });
      }, DIFF_TIMEOUT_MS);

      // Listen for save on the temp file → FILE_SAVED
      // CLI handles writing to the actual file; we only return the content.
      const saveDisposable = vscode.workspace.onDidSaveTextDocument((doc) => {
        if (doc.uri.fsPath === tempFilePath) {
          const newContent = doc.getText();
          safeResolve({ action: 'FILE_SAVED', newContent });
        }
      });
      disposables.push(saveDisposable);

      // Listen for tab close → TAB_CLOSED
      const closeDisposable = vscode.workspace.onDidCloseTextDocument((doc) => {
        if (doc.uri.fsPath === tempFilePath) {
          // Delay to let save handler fire first if both events come together
          setTimeout(() => {
            safeResolve({ action: 'TAB_CLOSED' });
          }, 500);
        }
      });
      disposables.push(closeDisposable);

      // Open the diff editor
      try {
        await vscode.commands.executeCommand(
          'vscode.diff',
          originalUri,
          tempFileUri,
          input.tab_name
        );

        // Show reject action — user can click "Reject" to explicitly reject the diff
        vscode.window.showInformationMessage(
          `Review diff: ${path.basename(input.old_file_path)}`,
          'Accept (Save)',
          'Reject'
        ).then((choice) => {
          if (choice === 'Reject') {
            safeResolve({ action: 'DIFF_REJECTED' });
          } else if (choice === 'Accept (Save)') {
            // Trigger save on the temp file, which will fire the save handler
            const editor = vscode.window.visibleTextEditors.find(
              e => e.document.uri.fsPath === tempFilePath
            );
            if (editor) {
              editor.document.save();
            }
          }
          // If dismissed (undefined), do nothing — wait for save/close/timeout
        });
      } catch (err) {
        safeResolve({ action: 'TAB_CLOSED' });
      }
    });
  }

  async closeTab(tabName: string): Promise<void> {
    const tracked = this._activeDiffs.get(tabName);
    if (!tracked) { return; }

    // Close the editor tab
    for (const tabGroup of vscode.window.tabGroups.all) {
      for (const tab of tabGroup.tabs) {
        if (tab.label === tabName) {
          await vscode.window.tabGroups.close(tab);
          break;
        }
      }
    }

    // resolve as TAB_CLOSED if still pending
    if (!tracked.resolved) {
      tracked.resolved = true;
      if (tracked.timeoutHandle) { clearTimeout(tracked.timeoutHandle); }
      this._cleanup(tabName);
      tracked.resolve({ action: 'TAB_CLOSED' });
    }
  }

  async closeAllDiffTabs(): Promise<void> {
    const tabNames = [...this._activeDiffs.keys()];
    await Promise.all(tabNames.map((name) => this.closeTab(name)));
  }

  private _cleanup(tabName: string): void {
    const tracked = this._activeDiffs.get(tabName);
    if (!tracked) { return; }

    // Dispose listeners
    for (const d of tracked.disposables) {
      d.dispose();
    }

    // Remove temp file (best effort)
    fs.unlink(tracked.tempFileUri.fsPath).catch(() => {});

    this._activeDiffs.delete(tabName);
  }

  dispose(): void {
    for (const tabName of [...this._activeDiffs.keys()]) {
      const tracked = this._activeDiffs.get(tabName);
      if (tracked?.timeoutHandle) { clearTimeout(tracked.timeoutHandle); }
      this._cleanup(tabName);
    }
    // Clean temp dir (best effort)
    fs.rm(this._tempDir, { recursive: true, force: true }).catch(() => {});
  }
}
