import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type WebSocket from 'ws';

/**
 * Server-side WebSocket transport for MCP SDK.
 * Bridges a ws.WebSocket connection to the MCP Transport interface.
 */
export class WebSocketServerTransport implements Transport {
  private _ws: WebSocket;

  onmessage?: (message: JSONRPCMessage) => void;
  onerror?: (error: Error) => void;
  onclose?: () => void;

  constructor(ws: WebSocket) {
    this._ws = ws;
  }

  async start(): Promise<void> {
    this._ws.on('message', (data: Buffer | string) => {
      try {
        const text = typeof data === 'string' ? data : data.toString('utf-8');
        const msg = JSON.parse(text) as JSONRPCMessage;
        this.onmessage?.(msg);
      } catch (err) {
        this.onerror?.(err instanceof Error ? err : new Error(String(err)));
      }
    });

    this._ws.on('close', () => {
      this.onclose?.();
    });

    this._ws.on('error', (err: Error) => {
      this.onerror?.(err);
    });
  }

  async send(message: JSONRPCMessage): Promise<void> {
    // ws.OPEN === 1
    if (this._ws.readyState === 1) {
      const json = JSON.stringify(message);
      this._ws.send(json);
    }
  }

  async close(): Promise<void> {
    this._ws.close();
  }
}
