#!/usr/bin/env node
/**
 * A minimal MCP server over stdio, used as an E2E fixture.
 *
 * Deliberately NOT `npx -y some-package`: that needs network, takes seconds to
 * cold-start, and makes a test failure ambiguous between "our MCP wiring is
 * broken" and "the registry was slow". This is ~40 lines, offline, instant, and
 * fails for exactly one reason.
 *
 * Speaks just enough of the protocol to complete a handshake and advertise one
 * tool, which is all that is needed for the CLI to report it as connected.
 */
const TOOL = {
	name: 'probe_echo',
	description: 'Echoes back the text it is given. Exists only for E2E tests.',
	inputSchema: {
		type: 'object',
		properties: { text: { type: 'string' } },
		required: ['text']
	}
};

function send(msg) { process.stdout.write(JSON.stringify(msg) + '\n'); }

function reply(id, result) { send({ jsonrpc: '2.0', id, result }); }

let buffer = '';
process.stdin.on('data', (chunk) => {
	buffer += chunk.toString();
	let nl;
	while ((nl = buffer.indexOf('\n')) !== -1) {
		const line = buffer.slice(0, nl).trim();
		buffer = buffer.slice(nl + 1);
		if (!line) { continue; }

		let msg;
		try { msg = JSON.parse(line); } catch { continue; }

		switch (msg.method) {
			case 'initialize':
				reply(msg.id, {
					// Echo the client's version back rather than pinning one, so this
					// fixture does not rot when the protocol moves on.
					protocolVersion: msg.params?.protocolVersion || '2024-11-05',
					capabilities: { tools: {} },
					serverInfo: { name: 'ccc-e2e-probe', version: '1.0.0' }
				});
				break;
			case 'tools/list':
				reply(msg.id, { tools: [TOOL] });
				break;
			case 'tools/call':
				reply(msg.id, {
					content: [{ type: 'text', text: `PROBE_ECHO:${msg.params?.arguments?.text ?? ''}` }]
				});
				break;
			case 'resources/list':
				reply(msg.id, { resources: [] });
				break;
			case 'prompts/list':
				reply(msg.id, { prompts: [] });
				break;
			default:
				// Notifications (no id) get no response, by design.
				if (msg.id !== undefined) { reply(msg.id, {}); }
		}
	}
});

process.stdin.on('end', () => process.exit(0));
