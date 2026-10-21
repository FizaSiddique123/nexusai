# Nexus AI - Model Context Protocol (MCP) Testing Guide

This guide details how to verify the genuine MCP server implementation using the official TypeScript SDK, HTTP tools (like curl), and automated tests.

---

## 1. Protocol Specifications

- **Protocol Specification**: `2025-11-25`
- **Transport**: Streamable HTTP (`StreamableHTTPServerTransport`)
- **Endpoint**: `http://localhost:3001/mcp`
- **Session ID Header**: `mcp-session-id`

---

## 2. Automated Test Verification

Nexus AI includes a comprehensive automated test for the MCP server that boots an isolated HTTP server, connects a client via `StreamableHTTPClientTransport`, negotiates protocol version `2025-11-25`, discovers all 17 tools, invokes operations, and tests input schema rejection.

Run the test suite:
```bash
npm test
```
Or run the dedicated MCP integration test:
```bash
npm run test:mcp
```

Expected output:
```
--- Running MCP Integration Tests ---
MCP Test Server listening on http://127.0.0.1:XXXX/mcp
1. Connecting MCP Client via Streamable HTTP Transport...
   ✓ Connected. Session ID: ...
2. Discovering MCP Tools...
   ✓ Discovered 17 MCP tools.
   ✓ All 17 required MCP tools verified!
3. Testing MCP Tool Call: create_task...
   ✓ create_task executed successfully.
4. Testing MCP Tool Call: get_tasks...
   ✓ get_tasks returned XX tasks.
5. Testing MCP Tool Call: search_knowledge...
   ✓ search_knowledge returned 2 results.
6. Testing MCP Tool Call: generate_schedule...
   ✓ generate_schedule created proposed schedule.
7. Testing MCP Tool Call: retrieve_preferences...
   ✓ retrieve_preferences succeeded.
8. Testing MCP Input Validation Error Handling...
   ✓ Input validation properly rejected invalid enum argument.
--- All MCP Integration Tests Passed! ---
```

---

## 3. Testing with HTTP / Curl

### Step A: Initialize Session (Protocol Handshake)
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-11-25",
      "capabilities": {},
      "clientInfo": { "name": "terminal-test", "version": "1.0.0" }
    }
  }'
```
Response will return status `200` with header `mcp-session-id` and body:
```json
{
  "result": {
    "protocolVersion": "2025-11-25",
    "capabilities": {},
    "serverInfo": { "name": "nexus-ai", "version": "1.0.0" }
  },
  "jsonrpc": "2.0",
  "id": 1
}
```

### Step B: List Tools (`tools/list`)
Using the session ID returned in Step A:
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: <YOUR_SESSION_ID>" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }'
```

### Step C: Call Tool (`tools/call` - `search_knowledge`)
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: <YOUR_SESSION_ID>" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "search_knowledge",
      "arguments": {
        "query": "OSI 7-Layer"
      }
    }
  }'
```

### Step D: Call Tool (`tools/call` - `create_task`)
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: <YOUR_SESSION_ID>" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "create_task",
      "arguments": {
        "title": "Study BGP Path Vectors",
        "priority": "high",
        "estimated_duration": 45
      }
    }
  }'
```

---

## 4. Testing with TypeScript MCP Client

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const transport = new StreamableHTTPClientTransport(new URL('http://localhost:3001/mcp'));
const client = new Client({ name: 'developer-client', version: '1.0.0' }, { capabilities: {} });

await client.connect(transport);
const tools = await client.listTools();
console.log('Discovered tools:', tools.tools.map(t => t.name));

const result = await client.callTool({
  name: 'generate_schedule',
  arguments: { available_time: 180, status: 'proposed' }
});
console.log('Result:', result.content);

await client.close();
```
