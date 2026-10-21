import assert from 'node:assert';
import { initDatabase } from '../../backend/src/database/db.js';
import { TaskService } from '../../backend/src/services/taskService.js';
import { DocumentService } from '../../backend/src/services/documentService.js';
import { ScheduleService } from '../../backend/src/services/scheduleService.js';
import { QuizService } from '../../backend/src/services/quizService.js';
import { PreferenceService } from '../../backend/src/services/preferenceService.js';

export async function runUnitTests() {
  console.log('\n--- Running Unit Tests ---');
  initDatabase();

  // Test 1: Task Management
  console.log('1. Testing Task Management CRUD...');
  const task = TaskService.createTask({
    title: 'Unit Test Task',
    description: 'Testing task creation',
    priority: 'high',
    estimated_duration: 30
  });
  assert.strictEqual(task.title, 'Unit Test Task');
  assert.strictEqual(task.priority, 'high');
  assert.strictEqual(task.status, 'pending');

  const updated = TaskService.updateTask(task.id, { title: 'Updated Unit Test Task' });
  assert.strictEqual(updated.title, 'Updated Unit Test Task');

  const completed = TaskService.completeTask(task.id);
  assert.strictEqual(completed.status, 'completed');

  const stats = TaskService.getTaskStats();
  assert.ok(stats.total > 0);
  assert.ok(stats.completed > 0);
  console.log('   ✓ Task Service passed');

  // Test 2: Document Ingestion and FTS Search
  console.log('2. Testing Document & FTS5 Search...');
  const sampleDocText = `
    Advanced Network Routing Notes
    OSPF is a Link-State routing protocol based on Dijkstra's Shortest Path First algorithm.
    Border Gateway Protocol (BGP) is a Path-Vector routing protocol for Autonomous Systems.
  `;
  const doc = await DocumentService.processDocument(
    'routing_notes.txt',
    Buffer.from(sampleDocText, 'utf-8'),
    'text/plain'
  );
  assert.ok(doc.id);
  assert.ok(doc.chunk_count! > 0);

  const searchResults = DocumentService.searchKnowledge('Dijkstra OSPF');
  assert.ok(searchResults.length > 0, 'Expected to find search results for Dijkstra OSPF');
  assert.ok(searchResults[0].content.includes('OSPF'));
  console.log('   ✓ Document Ingestion & FTS5 Search passed');

  // Test 3: Schedule Generation & Conflict Detection
  console.log('3. Testing Schedule Generation & Conflicts...');
  const schedule = ScheduleService.generateSchedule({
    date: '2026-10-22',
    available_time: 120,
    task_ids: [task.id]
  });
  assert.ok(schedule.id);
  assert.strictEqual(schedule.status, 'proposed');
  assert.ok(schedule.sessions && schedule.sessions.length > 0);

  const conflictCheck = ScheduleService.checkScheduleConflicts([
    { start_time: '09:00', end_time: '10:00', title: 'Session A' },
    { start_time: '09:30', end_time: '10:30', title: 'Session B' }
  ]);
  assert.strictEqual(conflictCheck.has_conflicts, true);
  assert.ok(conflictCheck.conflicts.length > 0);

  const noConflictCheck = ScheduleService.checkScheduleConflicts([
    { start_time: '09:00', end_time: '10:00', title: 'Session A' },
    { start_time: '10:15', end_time: '11:00', title: 'Session B' }
  ]);
  assert.strictEqual(noConflictCheck.has_conflicts, false);

  const approved = ScheduleService.approveSchedule(schedule.id);
  assert.strictEqual(approved.status, 'approved');
  console.log('   ✓ Schedule Service & Conflict Detection passed');

  // Test 4: Quiz Generation & Scoring
  console.log('4. Testing Quiz Generation & Scoring...');
  const quiz = QuizService.createQuiz({
    topic_or_doc_id: 'Computer Networks',
    count: 5,
    difficulty: 'medium'
  });
  assert.ok(quiz.id);
  assert.strictEqual(quiz.questions?.length, 5);

  // Submit all correct answers
  const correctAnswers: Record<string, number> = {};
  quiz.questions!.forEach(q => {
    correctAnswers[q.id] = q.correct_option_index;
  });

  const submission = QuizService.submitQuizAnswers(quiz.id, correctAnswers);
  assert.strictEqual(submission.attempt.score, 5);
  assert.strictEqual(submission.attempt.percentage, 100);
  console.log('   ✓ Quiz Service & Scoring passed');

  // Test 5: Preferences
  console.log('5. Testing User Preferences...');
  PreferenceService.savePreference('test_pref', 'active');
  const val = PreferenceService.getPreference('test_pref');
  assert.strictEqual(val, 'active');
  console.log('   ✓ Preference Service passed');

  console.log('--- All Unit Tests Passed Successfully! ---\n');
}
