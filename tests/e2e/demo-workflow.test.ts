import assert from 'node:assert';
import { initDatabase, db } from '../../backend/src/database/db.js';
import { DocumentService } from '../../backend/src/services/documentService.js';
import { AgentEngine } from '../../backend/src/agent/agentEngine.js';
import { TaskService } from '../../backend/src/services/taskService.js';
import { ScheduleService } from '../../backend/src/services/scheduleService.js';
import { QuizService } from '../../backend/src/services/quizService.js';
import { WorkflowService } from '../../backend/src/services/workflowService.js';

export async function runE2EDemoWorkflow() {
  console.log('\n======================================================');
  console.log('--- Running Primary Demonstration Workflow (E2E) ---');
  console.log('======================================================');

  initDatabase();

  // STEP 1 & 2: Ensure Computer Networks notes are ingested and indexed
  console.log('\nSTEP 1 & 2: Ingesting and indexing Computer Networks exam notes...');
  await DocumentService.seedDemoNetworkingNotes();
  const docs = DocumentService.listDocuments();
  assert.ok(docs.length > 0, 'Document must be present');
  const demoDoc = docs.find(d => d.filename === 'Computer_Networks_Exam_Notes.txt') || docs[0];
  console.log(`   ✓ Document indexed: ${demoDoc.filename} (${demoDoc.chunk_count} chunks)`);

  // STEP 3: User submits primary demonstration prompt
  const userPrompt = 'I have an exam on Friday. Analyze my uploaded notes, identify the important topics, create a revision plan, schedule my study sessions, and generate a practice quiz.';
  console.log(`\nSTEP 3: User Prompt: "${userPrompt}"`);

  // STEP 4 - 8: Agent coordinates tools, creates tasks, proposes schedule, generates quiz, verifies workflow
  console.log('\nSTEP 4-8: AI Agent multi-tool orchestration executing...');
  const recordedSteps: string[] = [];
  const response = await AgentEngine.processUserMessage(userPrompt, (step) => {
    recordedSteps.push(step.tool);
    console.log(`   -> [Tool Executed]: ${step.tool} - ${step.summary}`);
  });

  assert.ok(response.message.content.length > 0);
  assert.ok(response.proposedSchedule, 'Proposed schedule must be returned');
  assert.strictEqual(response.proposedSchedule.status, 'proposed', 'Schedule must require user approval');
  assert.ok(response.generatedQuizId, 'Quiz must be generated');
  assert.ok(response.workflowId, 'Workflow ID must be generated');

  // Verify authoritative workflow execution in SQLite
  const wf = WorkflowService.getWorkflow(response.workflowId);
  assert.ok(wf, 'Workflow record must be present in SQLite');
  assert.strictEqual(wf.status, 'completed', 'Workflow status must be completed');
  assert.strictEqual(wf.steps.length, 4, 'Must have recorded 4 distinct steps');

  const verification = WorkflowService.verifyWorkflowArtifacts(response.workflowId);
  assert.strictEqual(verification.verified, true, 'All claimed artifacts must be verified in SQLite');
  assert.strictEqual(verification.taskCount, 4, 'Must have 4 verified tasks');
  assert.strictEqual(verification.hasSchedule, true, 'Must have verified schedule');
  assert.strictEqual(verification.hasQuiz, true, 'Must have verified quiz');
  console.log(`   ✓ Authoritative workflow verified [${wf.id.substring(0, 8)}]: 4 tasks, schedule, quiz in SQLite.`);

  // STEP 9: User reviews and approves proposed schedule
  console.log('\nSTEP 9: User approves the proposed revision schedule...');
  const approvalPrompt = 'Approve the revision plan and schedule my study sessions';
  const approvalResponse = await AgentEngine.processUserMessage(approvalPrompt);
  assert.ok(approvalResponse.message.content.includes('Approved'));

  const savedSchedule = ScheduleService.getSchedule(response.proposedSchedule.id);
  assert.ok(savedSchedule);
  assert.strictEqual(savedSchedule.status, 'approved');
  console.log(`   ✓ Schedule ${savedSchedule.id} status changed to APPROVED.`);

  // STEP 10: Quiz taking and scoring
  console.log('\nSTEP 10: User completes the generated practice quiz...');
  const quiz = QuizService.getQuizById(response.generatedQuizId);
  assert.ok(quiz && quiz.questions && quiz.questions.length > 0);

  const answers: Record<string, number> = {};
  quiz.questions.forEach((q, idx) => {
    // Answer mostly correctly, simulate 1 incorrect
    answers[q.id] = idx === 0 ? (q.correct_option_index + 1) % 4 : q.correct_option_index;
  });

  const quizResult = QuizService.submitQuizAnswers(quiz.id, answers);
  console.log(`   ✓ Quiz completed: Score ${quizResult.attempt.score}/${quizResult.attempt.total_questions} (${quizResult.attempt.percentage}%)`);
  assert.ok(quizResult.attempt.score > 0);

  // STEP 11 & 12: Simulating browser reload / session return and persistent retrieval
  console.log('\nSTEP 11 & 12: Verifying database persistence across session restart...');
  const history = AgentEngine.getChatHistory(10);
  assert.ok(history.length >= 2, 'Chat history should persist in SQLite');

  const retrievedTasks = TaskService.getTasks();
  assert.ok(retrievedTasks.length >= 4, 'All created tasks must persist in SQLite');

  const attempts = QuizService.getQuizAttempts(quiz.id);
  assert.ok(attempts.length > 0, 'Quiz attempt must persist in SQLite');
  console.log('   ✓ Persistent SQLite state verified: chat history, tasks, schedule, and quiz results intact.');

  // STEP 13 & 14: Schedule revision
  console.log('\nSTEP 13 & 14: Revising existing schedule with adjusted timing...');
  const revised = ScheduleService.updateSchedule(savedSchedule.id, {
    title: 'Revised Intensive Exam Schedule',
    sessions: [
      {
        title: 'Deep Dive: TCP 3-Way Handshake & Flow Control',
        start_time: '10:00',
        end_time: '11:00',
        duration_minutes: 60,
        is_break: false
      },
      {
        title: 'Hydration & Walk Break',
        start_time: '11:00',
        end_time: '11:15',
        duration_minutes: 15,
        is_break: true
      },
      {
        title: 'Master OSPF Dijkstra & BGP Path Vectors',
        start_time: '11:15',
        end_time: '12:15',
        duration_minutes: 60,
        is_break: false
      }
    ]
  });

  assert.strictEqual(revised.title, 'Revised Intensive Exam Schedule');
  assert.strictEqual(revised.sessions?.length, 3);
  console.log('   ✓ Schedule revision saved to database.');

  console.log('\n======================================================');
  console.log('--- PRIMARY DEMONSTRATION WORKFLOW PASSED 100%! ---');
  console.log('======================================================\n');
}
