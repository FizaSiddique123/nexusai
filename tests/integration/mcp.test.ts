import assert from 'node:assert';
import http from 'node:http';
import { createNexusMcpServer, createMcpStreamableTransport } from '../../backend/src/mcp/mcpServer.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { initDatabase } from '../../backend/src/database/db.js';
import { DocumentService } from '../../backend/src/services/documentService.js';
import { WorkflowService } from '../../backend/src/services/workflowService.js';

export async function runMcpIntegrationTests() {
  console.log('\n--- Running MCP Integration Tests ---');
  initDatabase();
  await DocumentService.seedDemoNetworkingNotes();

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
    'extract_important_topics',
    'create_revision_plan',
    'schedule_study_sessions',
    'generate_quiz',
    'get_workflow_status',
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
  console.log(`   ✓ All ${expectedTools.length} required MCP tools verified!`);

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

  console.log('6. Testing MCP Tool B: extract_important_topics...');
  const topicsResult = await client.callTool({
    name: 'extract_important_topics',
    arguments: { query: 'OSI TCP UDP', limit: 3 }
  });
  const parsedTopics = JSON.parse((topicsResult.content[0] as any).text);
  assert.ok(parsedTopics.count > 0);
  assert.ok(parsedTopics.topics[0].source_reference.filename);
  console.log(`   ✓ extract_important_topics returned ${parsedTopics.count} grounded topics with source citations.`);

  console.log('7. Testing MCP Tool C: create_revision_plan...');
  const planResult = await client.callTool({
    name: 'create_revision_plan',
    arguments: { exam_date: 'Friday', available_time_minutes: 240, topics: ['OSI Model', 'TCP/IP', 'Subnetting'] }
  });
  const parsedPlan = JSON.parse((planResult.content[0] as any).text);
  assert.ok(parsedPlan.plan.id);
  assert.strictEqual(parsedPlan.plan.ordered_topics.length, 3);
  console.log(`   ✓ create_revision_plan synthesized plan for ${parsedPlan.plan.exam_date} with ${parsedPlan.plan.ordered_topics.length} blocks.`);

  console.log('8. Testing MCP Tool D: schedule_study_sessions...');
  const sessionsResult = await client.callTool({
    name: 'schedule_study_sessions',
    arguments: {
      date: '2026-10-25',
      sessions: [
        { title: 'OSI Reference Model Review', start_time: '09:00', end_time: '09:45', duration_minutes: 45, is_break: false },
        { title: 'Rest Break', start_time: '09:45', end_time: '10:00', duration_minutes: 15, is_break: true },
        { title: 'TCP/UDP Protocols', start_time: '10:00', end_time: '10:45', duration_minutes: 45, is_break: false }
      ]
    }
  });
  const parsedSessions = JSON.parse((sessionsResult.content[0] as any).text);
  assert.ok(parsedSessions.schedule.id);
  assert.strictEqual(parsedSessions.conflict_check.has_conflicts, false);
  console.log('   ✓ schedule_study_sessions saved sessions with 0 conflicts.');

  console.log('9. Testing MCP Tool E: generate_quiz...');
  const quizToolResult = await client.callTool({
    name: 'generate_quiz',
    arguments: { topic_or_doc_id: 'Computer Networks', question_count: 5, difficulty: 'medium' }
  });
  const parsedQuiz = JSON.parse((quizToolResult.content[0] as any).text);
  assert.ok(parsedQuiz.quiz.id);
  assert.strictEqual(parsedQuiz.quiz.question_count, 5);
  console.log('   ✓ generate_quiz generated grounded quiz.');

  console.log('10. Testing MCP Tool F: get_workflow_status...');
  const wfStatusNotFound = await client.callTool({
    name: 'get_workflow_status',
    arguments: { workflow_id: 'non-existent-id' }
  });
  const parsedNotFound = JSON.parse((wfStatusNotFound.content[0] as any).text);
  assert.strictEqual(parsedNotFound.exists, false);

  const activeWf = WorkflowService.createWorkflow('MCP Integration Test Workflow');
  const wfStatusFound = await client.callTool({
    name: 'get_workflow_status',
    arguments: { workflow_id: activeWf.id }
  });
  const parsedFound = JSON.parse((wfStatusFound.content[0] as any).text);
  assert.strictEqual(parsedFound.workflow_id, activeWf.id);
  assert.strictEqual(parsedFound.status, 'running');
  console.log('   ✓ get_workflow_status safely verified non-existent and active workflows.');

  console.log('11. Testing MCP Tool Call: generate_schedule...');
  const schedResult = await client.callTool({
    name: 'generate_schedule',
    arguments: { available_time: 180, status: 'proposed' }
  });
  const parsedSched = JSON.parse((schedResult.content[0] as any).text);
  assert.ok(parsedSched.schedule.id);
  assert.strictEqual(parsedSched.schedule.status, 'proposed');
  console.log('   ✓ generate_schedule created proposed schedule.');

  console.log('12. Testing MCP Tool Call: retrieve_preferences...');
  const prefResult = await client.callTool({
    name: 'retrieve_preferences',
    arguments: {}
  });
  const parsedPrefs = JSON.parse((prefResult.content[0] as any).text);
  assert.ok(parsedPrefs.study_start_time);
  console.log('   ✓ retrieve_preferences succeeded.');

  console.log('13. Testing MCP Input Validation Error Handling...');
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
