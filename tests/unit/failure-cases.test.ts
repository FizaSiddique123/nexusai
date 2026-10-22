import assert from 'node:assert';
import { initDatabase, db } from '../../backend/src/database/db.js';
import { DocumentService } from '../../backend/src/services/documentService.js';
import { ScheduleService } from '../../backend/src/services/scheduleService.js';
import { TaskService } from '../../backend/src/services/taskService.js';
import { QuizService } from '../../backend/src/services/quizService.js';
import { WorkflowService } from '../../backend/src/services/workflowService.js';
import { AgentEngine } from '../../backend/src/agent/agentEngine.js';

export async function runFailureCaseTests() {
  console.log('\n--- Running Failure & Edge Case Tests ---');
  initDatabase();

  // Test 1: Low-evidence / empty search handling
  console.log('1. Testing low-evidence & non-matching queries...');
  const emptySearch = DocumentService.searchKnowledge('XYZNonExistentKeyword98765');
  assert.strictEqual(emptySearch.length, 0, 'Should return empty array for non-matching queries without fabricating results');
  
  const generalResponse = await AgentEngine.processUserMessage('XYZNonExistentKeyword98765');
  assert.ok(generalResponse.message.content.length > 0);
  assert.ok(!generalResponse.message.content.includes('undefined'));
  console.log('   ✓ Low-evidence queries handled honestly without fabricated content.');

  // Test 2: Missing exam date in revision planning
  console.log('2. Testing missing exam date fallback...');
  const planWithoutDate = ScheduleService.createRevisionPlan({
    available_time_minutes: 180,
    topics: ['Algorithm Complexity']
  });
  assert.ok(planWithoutDate.id);
  assert.ok(planWithoutDate.exam_date, 'Should transparently assign default exam date');
  assert.ok(planWithoutDate.assumptions.some(a => a.includes('Target exam date resolved to')), 'Must state assumption');
  console.log(`   ✓ Missing exam date safely resolved to: ${planWithoutDate.exam_date} with explicit assumption.`);

  // Test 3: Schedule conflict detection with overlapping time ranges
  console.log('3. Testing schedule conflict detection with overlapping sessions...');
  const overlappingSessions = [
    { start_time: '10:00', end_time: '11:00', title: 'Deep Work: Algorithms' },
    { start_time: '10:30', end_time: '11:30', title: 'Overlapping Session' }
  ];
  const conflictResult = ScheduleService.checkScheduleConflicts(overlappingSessions);
  assert.strictEqual(conflictResult.has_conflicts, true);
  assert.ok(conflictResult.conflicts.length > 0);
  assert.ok(conflictResult.conflicts[0].includes('Overlap detected'));
  console.log('   ✓ Overlap properly flagged with actionable conflict message.');

  // Test 4: Invalid session time range (end_time before start_time)
  console.log('4. Testing invalid session range (end before start)...');
  const invalidRangeSessions = [
    { start_time: '14:00', end_time: '13:00', title: 'Time Traveling Session' }
  ];
  const invalidRangeCheck = ScheduleService.checkScheduleConflicts(invalidRangeSessions);
  assert.strictEqual(invalidRangeCheck.has_conflicts, true);
  assert.ok(invalidRangeCheck.conflicts[0].includes('invalid time range'));
  console.log('   ✓ Backward time ranges safely rejected.');

  // Test 5: Non-existent workflow artifact verification
  console.log('5. Testing non-existent workflow artifact verification...');
  const missingWfVerify = WorkflowService.verifyWorkflowArtifacts('non-existent-uuid-999');
  assert.strictEqual(missingWfVerify.verified, false);
  assert.strictEqual(missingWfVerify.details, 'Workflow record does not exist.');
  console.log('   ✓ Non-existent workflow verification safely returned verified: false.');

  // Test 6: Non-existent document / quiz retrieval
  console.log('6. Testing non-existent document & quiz lookups...');
  const missingDoc = DocumentService.getDocumentById('ghost-doc-id');
  assert.strictEqual(missingDoc, null);

  const missingQuiz = QuizService.getQuizById('ghost-quiz-id');
  assert.strictEqual(missingQuiz, null);
  console.log('   ✓ Missing records safely return null rather than crashing.');

  // Test 7: Non-existent task completion throws clear error
  console.log('7. Testing non-existent task completion error handling...');
  try {
    TaskService.completeTask('non-existent-task-id');
    assert.fail('Should have thrown an error for missing task');
  } catch (err: any) {
    assert.ok(err.message.includes('not found'));
    console.log('   ✓ Modifying non-existent task threw explicit not found error.');
  }

  console.log('--- All Failure & Edge Case Tests Passed Successfully! ---\n');
}
