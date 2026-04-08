import * as vscode from 'vscode';
import * as http from 'http';
import type { AddressInfo } from 'net';
import { WebSocketServer, WebSocket } from 'ws';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebSocketServerTransport } from './ws-transport';
import { registerTools } from './tools';
import { generateAuthToken, validateAuthToken } from './auth';
import { writeLockfile, removeLockfile, installCrashGuard, uninstallCrashGuard } from './lockfile';
import type { IToolExecutor, McpIdeServer } from './types';
import { SERVER_NAME, SERVER_VERSION, AUTH_HEADER } from './types';

interface ConnectedClient {
  ws: WebSocket;
  transport: WebSocketServerTransport;
  mcpServer: McpServer;
}

/**
 * Start the WebSocket MCP IDE Server.
 * Creates an HTTP + WebSocket server, writes a lockfile for CLI discovery,
 * and handles MCP tool calls from connected Claude CLI instances.
 */
export async function startMcpServer(
  executor: IToolExecutor,
  workspaceFolders: string[]
): Promise<McpIdeServer> {
  const authToken = generateAuthToken();
  const clients = new Set<ConnectedClient>();

  // 1. Create HTTP server (WebSocket piggybacks on it)
  const httpServer = http.createServer((_req, res) => {
    res.writeHead(404);
    res.end();
  });

  // 2. Create WebSocket server with 'mcp' subprotocol
  const wss = new WebSocketServer({
    server: httpServer,
    handleProtocols(protocols) {
      if (protocols.has('mcp')) {
        return 'mcp';
      }
      return false;
    },
  });

  // 3. Handle new WebSocket connections
  wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
    // Validate auth token
    const receivedToken = req.headers[AUTH_HEADER] as string | undefined;
    if (!validateAuthToken(receivedToken, authToken)) {
      ws.close(1008, 'Unauthorized');
      return;
    }

    // Create per-client MCP server + transport
    const transport = new WebSocketServerTransport(ws);
    const mcpServer = new McpServer({
      name: SERVER_NAME,
      version: SERVER_VERSION,
    });

    registerTools(mcpServer, executor);

    const client: ConnectedClient = { ws, transport, mcpServer };
    clients.add(client);

    ws.on('close', () => {
      clients.delete(client);
    });

    // Intercept custom notifications from CLI before MCP SDK processes them.
    // MCP SDK handles standard methods; custom ones like ide_connected need manual handling.
    const wrapOnMessage = () => {
      const originalHandler = transport.onmessage;
      transport.onmessage = (message: any) => {
        // Notifications have no 'id' field
        if (!('id' in message) && message.method) {
          if (message.method === 'ide_connected') {
            const pid = message.params?.pid;
            console.log(`[MCP IDE Server] CLI connected (pid: ${pid})`);
            return;
          }
          if (message.method === 'file_updated') {
            // CLI notifies us when it edits a file — refresh in editor
            const filePath = message.params?.filePath;
            if (filePath) {
              const uri = vscode.Uri.file(filePath);
              vscode.workspace.fs.stat(uri).then(() => {
                vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer');
              }, () => {});
            }
            return;
          }
        }
        originalHandler?.(message);
      };
    };

    // Connect MCP server to the WebSocket transport, then wrap onmessage
    // to intercept custom notifications before MCP SDK sees them.
    mcpServer.connect(transport).then(() => {
      wrapOnMessage();
    }).catch((err: Error) => {
      console.error('[MCP IDE Server] Failed to connect MCP session:', err);
      ws.close(1011, 'MCP connection failed');
      clients.delete(client);
    });
  });

  // 4. Listen on random available port (127.0.0.1 only)
  await new Promise<void>((resolve, reject) => {
    httpServer.on('error', reject);
    httpServer.listen(0, '127.0.0.1', () => resolve());
  });

  const port = (httpServer.address() as AddressInfo).port;

  // 5. Write lockfile for CLI discovery
  try {
    await writeLockfile(port, workspaceFolders, authToken);
    installCrashGuard(port);
  } catch (err) {
    console.error('[MCP IDE Server] Failed to write lockfile:', err);
    // Server still works, just won't be auto-discovered
  }

  console.log(`[MCP IDE Server] Listening on ws://127.0.0.1:${port} (${clients.size} clients)`);

  // 6. Return control interface
  return {
    port,

    async dispose() {
      // Close all client connections
      for (const client of clients) {
        try {
          client.ws.close(1000, 'Server shutting down');
        } catch {}
      }
      clients.clear();

      // Close servers
      wss.close();
      httpServer.close();

      // Remove lockfile and crash guards
      await removeLockfile(port);
      uninstallCrashGuard();

      console.log('[MCP IDE Server] Shut down');
    },
  };
}
