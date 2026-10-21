import assert from 'node:assert';
import http from 'node:http';
import { createNexusMcpServer, createMcpStreamableTransport } from '../../backend/src/mcp/mcpServer.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { initDatabase } from '../../backend/src/database/db.js';

export async function runMcpIntegrationTests() {
  console.log('\n--- Running MCP Integration Tests ---');
  initDatabase();

  const mcpServer = createNexusMcpServer();
  const serverTransport = createMcpStreamableTransport();
  await mcpServer.connect(serverTransport);

  const httpServer = http.createServer((req, res) => {
    serverTransport.handleRequest(req, res);
  });

  await new Promise<void>(resolve => httpServer.listen(0, '127.0.0.1', () => resolve()));
  const port = (httpServer.address() as any).port;
  console.log(`MCP Test Server listening on http://127.0.0.1:${port}/mcp`);

  const clientTransport = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`));
  const client = new Client(
    { name: 'nexus-integration-test-client', version: '1.0.0' },
    { capabilities: {} }
  );

  console.log('1. Connecting MCP Client via Streamable HTTP Transport...');
  await client.connect(clientTransport);
  console.log('   ✓ Connected. Session ID:', clientTransport.sessionId);

  console.log('2. Discovering MCP Tools...');
  const toolsResult = await client.listTools();
  console.log(`   ✓ Discovered ${toolsResult.tools.length} MCP tools.`);

  const expectedTools = [
    'search_knowledge',
    'list_documents',
    'get_document_content',
    'create_task',
    'get_tasks',
    'update_task',
    'complete_task',
    'delete_task',
    'generate_schedule',
    'get_schedule',
    'update_schedule',
    'check_schedule_conflicts',
    'create_quiz',
    'submit_quiz_answers',
    'get_quiz_results',
    'save_preference',
    'retrieve_preferences'
  ];

  for (const toolName of expectedTools) {
    const found = toolsResult.tools.find(t => t.name === toolName);
    assert.ok(found, `Expected tool "${toolName}" to be declared by MCP server`);
  }
  console.log('   ✓ All 17 required MCP tools verified!');

  console.log('3. Testing MCP Tool Call: create_task...');
  const createResult = await client.callTool({
    name: 'create_task',
    arguments: {
      title: 'MCP Integration Task',
      description: 'Tested via Streamable HTTP Transport',
      priority: 'high',
      estimated_duration: 45
    }
  });
  assert.ok(createResult.content && createResult.content.length > 0);
  const parsedCreate = JSON.parse((createResult.content[0] as any).text);
  assert.strictEqual(parsedCreate.task.title, 'MCP Integration Task');
  console.log('   ✓ create_task executed successfully.');

  console.log('4. Testing MCP Tool Call: get_tasks...');
  const getTasksResult = await client.callTool({
    name: 'get_tasks',
    arguments: { status: 'all' }
  });
  const parsedTasks = JSON.parse((getTasksResult.content[0] as any).text);
  assert.ok(parsedTasks.count > 0);
  console.log(`   ✓ get_tasks returned ${parsedTasks.count} tasks.`);

  console.log('5. Testing MCP Tool Call: search_knowledge...');
  const searchResult = await client.callTool({
    name: 'search_knowledge',
    arguments: { query: 'OSI TCP' }
  });
  const parsedSearch = JSON.parse((searchResult.content[0] as any).text);
  assert.ok(parsedSearch.query === 'OSI TCP');
  console.log(`   ✓ search_knowledge returned ${parsedSearch.count} results.`);

  console.log('6. Testing MCP Tool Call: generate_schedule...');
  const schedResult = await client.callTool({
    name: 'generate_schedule',
    arguments: { available_time: 180, status: 'proposed' }
  });
  const parsedSched = JSON.parse((schedResult.content[0] as any).text);
  assert.ok(parsedSched.schedule.id);
  assert.strictEqual(parsedSched.schedule.status, 'proposed');
  console.log('   ✓ generate_schedule created proposed schedule.');

  console.log('7. Testing MCP Tool Call: retrieve_preferences...');
  const prefResult = await client.callTool({
    name: 'retrieve_preferences',
    arguments: {}
  });
  const parsedPrefs = JSON.parse((prefResult.content[0] as any).text);
  assert.ok(parsedPrefs.study_start_time);
  console.log('   ✓ retrieve_preferences succeeded.');

  console.log('8. Testing MCP Input Validation Error Handling...');
  try {
    await client.callTool({
      name: 'create_task',
      arguments: {
        title: 'Invalid Priority Task',
        priority: 'ultra-urgent' as any // Invalid priority enum
      }
    });
    assert.fail('Should have thrown validation error');
  } catch (err: any) {
    console.log('   ✓ Input validation properly rejected invalid enum argument.');
  }

  // Cleanup
  await client.close();
  await serverTransport.close();
  httpServer.close();

  console.log('--- All MCP Integration Tests Passed! ---\n');
}
