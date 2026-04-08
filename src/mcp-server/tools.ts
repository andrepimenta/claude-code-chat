import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { IToolExecutor } from './types';

/**
 * Register all 6 IDE tools on an McpServer instance.
 * Tools delegate execution to the IToolExecutor (implemented by extension.ts).
 */
export function registerTools(server: McpServer, executor: IToolExecutor): void {
  // ── openDiff ──────────────────────────────────────────────────────────
  // Called by CLI internals to show file changes in a diff editor.
  // Returns FILE_SAVED (with new content), TAB_CLOSED, or DIFF_REJECTED.
  server.tool(
    'openDiff',
    'Open an interactive diff view for a file change',
    {
      old_file_path: z.string().describe('Path to the original file'),
      new_file_path: z.string().describe('Path for the new file version'),
      new_file_contents: z.string().describe('Proposed new file contents'),
      tab_name: z.string().describe('Unique tab identifier'),
    },
    async ({ old_file_path, new_file_path, new_file_contents, tab_name }) => {
      const result = await executor.executeDiff({ old_file_path, new_file_path, new_file_contents, tab_name });
      if (result.action === 'FILE_SAVED') {
        return {
          content: [
            { type: 'text' as const, text: 'FILE_SAVED' },
            { type: 'text' as const, text: result.newContent },
          ],
        };
      }
      return { content: [{ type: 'text' as const, text: result.action }] };
    }
  );

  // ── close_tab ─────────────────────────────────────────────────────────
  server.tool(
    'close_tab',
    'Close a specific diff tab by name',
    {
      tab_name: z.string().describe('Tab identifier to close'),
    },
    async ({ tab_name }) => {
      await executor.closeTab(tab_name);
      return { content: [{ type: 'text' as const, text: 'OK' }] };
    }
  );

  // ── closeAllDiffTabs ──────────────────────────────────────────────────
  server.tool(
    'closeAllDiffTabs',
    'Close all open diff tabs',
    {},
    async () => {
      await executor.closeAllDiffTabs();
      return { content: [{ type: 'text' as const, text: 'OK' }] };
    }
  );

  // ── openFile ──────────────────────────────────────────────────────────
  // Called by CLI internals to open/preview files with optional text selection.
  server.tool(
    'openFile',
    'Open a file in the IDE editor with optional text selection',
    {
      filePath: z.string().describe('File path to open'),
      preview: z.boolean().optional().describe('Open in preview mode'),
      startText: z.string().optional().describe('Text to search for start position'),
      endText: z.string().optional().describe('Text to search for end position'),
      selectToEndOfLine: z.boolean().optional().describe('Select to end of line'),
      makeFrontmost: z.boolean().optional().describe('Bring IDE window to foreground'),
    },
    async ({ filePath, preview, startText, endText, selectToEndOfLine, makeFrontmost }) => {
      await executor.openFile({ filePath, preview, startText, endText, selectToEndOfLine, makeFrontmost });
      return { content: [{ type: 'text' as const, text: 'OK' }] };
    }
  );

  // ── getDiagnostics ────────────────────────────────────────────────────
  // Exposed to AI model as mcp__ide__getDiagnostics.
  server.tool(
    'getDiagnostics',
    'Get language diagnostics (errors, warnings) from the IDE',
    {
      uri: z.string().optional().describe('File URI to get diagnostics for; omit for all files'),
    },
    async ({ uri }) => {
      const diagnostics = await executor.getDiagnostics(uri);
      return { content: [{ type: 'text' as const, text: JSON.stringify(diagnostics) }] };
    }
  );

  // ── executeCode ───────────────────────────────────────────────────────
  // Exposed to AI model as mcp__ide__executeCode.
  server.tool(
    'executeCode',
    'Execute code in the IDE environment',
    {
      code: z.string().describe('Code to execute'),
      language: z.string().optional().describe('Programming language'),
    },
    async ({ code, language }) => {
      const result = await executor.executeCode({ code, language });
      return { content: [{ type: 'text' as const, text: result }] };
    }
  );
}
