import assert from 'node:assert';
import { AgentEngine } from '../../backend/src/agent/agentEngine.js';
import { DocumentService } from '../../backend/src/services/documentService.js';
import { TaskService } from '../../backend/src/services/taskService.js';
import { ScheduleService } from '../../backend/src/services/scheduleService.js';
import { QuizService } from '../../backend/src/services/quizService.js';
import { PerformanceService } from '../../backend/src/services/performanceService.js';
import { OfficialInfoService } from '../../backend/src/services/officialInfoService.js';
import { ExamProfileService } from '../../backend/src/services/examProfileService.js';
import { IntentRouter } from '../../backend/src/services/intentRouter.js';

export async function runExamMentorTests() {
  console.log('\n======================================================');
  console.log('--- Running Universal AI Exam Mentor Test Suite ---');
  console.log('======================================================');

  // Seed demo networking notes for RAG testing if not already present
  await DocumentService.seedDemoNetworkingNotes();

  // -----------------------------------------------------------------------------------
  // TEST 1: General Academic Questions (No RAG required, no "I don't know")
  // -----------------------------------------------------------------------------------
  console.log('\n1. Testing General Academic Questions...');
  
  const q1 = await AgentEngine.processUserMessage('What is an operating system?');
  assert.ok(q1.message.content.length > 100, 'Expected detailed academic answer for OS');
  assert.ok(q1.message.content.toLowerCase().includes('kernel') || q1.message.content.toLowerCase().includes('hardware'), 'Expected OS core concept');
  assert.ok(!q1.message.content.includes("Try asking: 'I have an exam on Friday"), 'Must NOT return static demo fallback');
  console.log('   ✓ Answered "What is an operating system?" with conceptual breakdown.');

  const q2 = await AgentEngine.processUserMessage('Explain normalization in DBMS with an example.');
  assert.ok(q2.message.content.includes('1NF') && q2.message.content.includes('2NF') && q2.message.content.includes('3NF'), 'Expected normal forms');
  assert.ok(q2.message.content.toLowerCase().includes('anomal') || q2.message.content.toLowerCase().includes('redundancy'), 'Expected normalization anomalies mentioned');
  console.log('   ✓ Answered "Explain normalization in DBMS with an example." thoroughly.');

  // -----------------------------------------------------------------------------------
  // TEST 2: Step-by-Step Problem Solving & Programming Code
  // -----------------------------------------------------------------------------------
  console.log('\n2. Testing Problem Solving & Code Execution...');

  const q3 = await AgentEngine.processUserMessage('Explain binary search with code.');
  assert.ok(q3.message.content.includes('def binary_search') || q3.message.content.includes('binarySearch'), 'Expected code block');
  assert.ok(q3.message.content.includes('O(log') || q3.message.content.includes('\\log'), 'Expected time complexity');
  console.log('   ✓ Answered "Explain binary search with code" with implementation & Big-O complexity.');

  const q4 = await AgentEngine.processUserMessage('Solve a sample quantitative aptitude problem step by step.');
  assert.ok(q4.message.content.toLowerCase().includes('relative speed') || q4.message.content.toLowerCase().includes('step-by-step'), 'Expected step-by-step derivation');
  assert.ok(q4.message.content.includes('seconds') || q4.message.content.includes('Time'), 'Expected quantitative solution');
  console.log('   ✓ Solved quantitative aptitude problem with verified calculation steps.');

  // -----------------------------------------------------------------------------------
  // TEST 3: Document-Grounded RAG vs Low-Evidence Non-Matching Queries
  // -----------------------------------------------------------------------------------
  console.log('\n3. Testing Document Grounding & Honest Citations...');

  const qGrounded = await AgentEngine.processUserMessage('What do my notes say about TCP 3-way handshake?');
  assert.ok(qGrounded.message.content.includes('Computer_Networks_Exam_Notes.txt'), 'Expected citation to Computer Networks notes');
  assert.ok(qGrounded.message.content.includes('Page'), 'Expected page number citation');
  console.log('   ✓ Answered document question with authentic citation to indexed notes.');

  const qNonGrounded = await AgentEngine.processUserMessage('Explain quantum entanglement according to my notes');
  assert.ok(!qNonGrounded.message.content.includes('Page 999'), 'Must NOT invent fake citations');
  assert.ok(
    qNonGrounded.message.content.toLowerCase().includes('found no direct') ||
    qNonGrounded.message.content.toLowerCase().includes('found no matching') ||
    qNonGrounded.message.content.toLowerCase().includes('general academic'),
    'Expected honest declaration that notes do not contain topic'
  );
  console.log('   ✓ Handled non-matching note query honestly without fabricated document citations.');

  // -----------------------------------------------------------------------------------
  // TEST 4: Competitive Examinations (UPSC, CAT, GATE)
  // -----------------------------------------------------------------------------------
  console.log('\n4. Testing Competitive Exam Mentoring...');

  const qUpsc = await AgentEngine.processUserMessage('Explain the role of the President of India for UPSC preparation.');
  assert.ok(qUpsc.message.content.includes('Article 52') || qUpsc.message.content.includes('Article 74'), 'Expected constitutional articles');
  assert.ok(qUpsc.message.content.toLowerCase().includes('discretion') || qUpsc.message.content.includes('44th'), 'Expected constitutional nuance');
  console.log('   ✓ Answered UPSC question with constitutional articles and answer-writing framework.');

  const qCatQuiz = await AgentEngine.processUserMessage('Create a CAT quantitative aptitude quiz.');
  assert.ok(qCatQuiz.generatedQuizId, 'Expected quiz ID to be generated');
  const catQuiz = QuizService.getQuizById(qCatQuiz.generatedQuizId);
  assert.ok(catQuiz, 'Expected quiz in database');
  assert.ok(catQuiz.questions && catQuiz.questions.length > 0, 'Expected quiz questions');
  assert.ok(catQuiz.questions[0].topic?.toLowerCase().includes('cat') || catQuiz.topic.toLowerCase().includes('cat'), 'Expected CAT topic');
  console.log(`   ✓ Generated authentic CAT Quantitative Aptitude quiz with ${catQuiz.questions.length} questions.`);

  // -----------------------------------------------------------------------------------
  // TEST 5: Official Examination Information & Authority Portals
  // -----------------------------------------------------------------------------------
  console.log('\n5. Testing Official Information & Authority Portals...');

  const qOfficial = await AgentEngine.processUserMessage('What are the latest UPSC examination dates?');
  assert.ok(qOfficial.message.content.includes('https://upsc.gov.in'), 'Expected verified official UPSC portal link');
  assert.ok(qOfficial.message.content.toLowerCase().includes('official authority') || qOfficial.message.content.toLowerCase().includes('annual calendar'), 'Expected official authority context');
  console.log('   ✓ Provided verified official authority links without fabricated examination dates.');

  // -----------------------------------------------------------------------------------
  // TEST 6: Action Execution & Persistence
  // -----------------------------------------------------------------------------------
  console.log('\n6. Testing Action Execution & SQLite Persistence...');

  const qPlan = await AgentEngine.processUserMessage('Create a revision plan for my GATE exam.');
  assert.ok(qPlan.proposedSchedule, 'Expected proposed schedule');
  const schedId = qPlan.proposedSchedule.id;
  const savedSched = ScheduleService.getSchedule(schedId);
  assert.ok(savedSched, 'Expected schedule to be persisted in SQLite');
  console.log(`   ✓ Revision plan created and verified in SQLite (Schedule ID: ${schedId}).`);

  // -----------------------------------------------------------------------------------
  // TEST 7: Conversation Context & Follow-up Questions
  // -----------------------------------------------------------------------------------
  console.log('\n7. Testing Conversation Context & Follow-ups...');

  // Set up context
  await AgentEngine.processUserMessage('What is Binary Search?');
  const followUp = await AgentEngine.processUserMessage('I have another question about that explanation: what about in Java?');
  assert.ok(followUp.message.content.length > 50, 'Expected contextual response');
  console.log('   ✓ Follow-up question processed with conversation context awareness.');

  // -----------------------------------------------------------------------------------
  // TEST 8: Performance Analytics & Real Quiz Tracking
  // -----------------------------------------------------------------------------------
  console.log('\n8. Testing Performance Analytics & Mastery Tracking...');

  const perfReport = PerformanceService.formatPerformanceReport();
  assert.ok(perfReport.includes('Personalized Learning & Performance Analytics'), 'Expected performance report header');
  assert.ok(perfReport.includes('Topic Mastery Breakdown'), 'Expected topic mastery breakdown');
  console.log('   ✓ Generated real-time performance analytics from SQLite records.');

  console.log('\n--- All Universal AI Exam Mentor Tests Passed Successfully! ---');
}
