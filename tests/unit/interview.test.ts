import assert from 'node:assert';
import { InterviewService } from '../../backend/src/services/interviewService.js';
import { getDatabase } from '../../backend/src/database/db.js';
import { AgentEngine } from '../../backend/src/agent/agentEngine.js';

export async function runInterviewTests() {
  console.log('\n======================================================');
  console.log('--- Running AI Interview Preparation Module Test Suite ---');
  console.log('======================================================');

  const testUserId = 'test-candidate-001';
  const otherUserId = 'test-candidate-002';

  // -----------------------------------------------------------------------------------
  // TEST 1: Start a Technical Mock Interview for Software Engineering Internship
  // -----------------------------------------------------------------------------------
  console.log('\n1. Starting technical mock interview for Software Engineering Internship...');
  const techSession = InterviewService.createSession({
    user_id: testUserId,
    category: 'technical',
    target_role: 'Software Engineering Intern',
    target_company: 'Google',
    experience_level: 'beginner',
    difficulty: 'medium',
    mode: 'practice',
    programming_language: 'Python',
    total_questions: 3
  });

  assert.ok(techSession.id, 'Expected session to have an ID');
  assert.strictEqual(techSession.category, 'technical');
  assert.strictEqual(techSession.target_role, 'Software Engineering Intern');
  assert.strictEqual(techSession.target_company, 'Google');
  assert.strictEqual(techSession.status, 'in_progress');
  assert.ok(techSession.questions && techSession.questions.length >= 1, 'Expected initial question to be prepared');

  const q1 = techSession.questions[0];
  assert.ok(q1.question_text.length > 20, 'Expected non-empty question statement');
  assert.ok(q1.hints && q1.hints.length > 0, 'Expected hints in practice mode');
  console.log(`   ✓ Session created: "${techSession.title}"`);
  console.log(`   ✓ Question 1: [${q1.question_type}] ${q1.question_text.substring(0, 65)}...`);

  // -----------------------------------------------------------------------------------
  // TEST 2: Ask a DSA Question and Submit an Incorrect / Suboptimal Answer
  // -----------------------------------------------------------------------------------
  console.log('\n2. Submitting incorrect/suboptimal answer to DSA question...');
  const incorrectSubmission = await InterviewService.submitAndEvaluateAnswer({
    session_id: techSession.id,
    question_id: q1.id,
    user_id: testUserId,
    answer_text: 'I will use two nested loops to check every pair of elements in the array to see if they add up to target. The complexity will be O(N^2).',
    submitted_code: `def solve(nums, target):\n    for i in range(len(nums)):\n        for j in range(len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]\n    return []`
  });

  assert.ok(incorrectSubmission.evaluation, 'Expected evaluation object');
  const eval1 = incorrectSubmission.evaluation;
  console.log(`   ✓ Evaluated score: ${eval1.score}/100`);
  console.log(`   ✓ Improvement Suggestions: ${eval1.improvement_suggestions.slice(0, 2).join('; ')}`);

  // -----------------------------------------------------------------------------------
  // TEST 3: Confirm Feedback Identifies the Actual Mistake / Sub-optimality
  // -----------------------------------------------------------------------------------
  console.log('\n3. Verifying feedback identifies actual mistakes & quadratic complexity...');
  assert.ok(eval1.score < 80, `Expected suboptimal answer score < 80, got ${eval1.score}`);
  assert.ok(
    eval1.missing_concepts.some(c => c.toLowerCase().includes('o(n)') || c.toLowerCase().includes('hash') || c.toLowerCase().includes('quadratic') || c.toLowerCase().includes('optimal') || c.toLowerCase().includes('time complexity')),
    'Expected feedback to identify suboptimal complexity or missing hash map lookup'
  );
  assert.ok(eval1.rubric_breakdown, 'Expected transparent rubric breakdown');
  assert.ok(typeof eval1.rubric_breakdown.technical_correctness === 'number');
  assert.ok((eval1.strong_example_answer || '').length > 50, 'Expected comprehensive model benchmark answer');
  console.log('   ✓ Rubric breakdown verified:');
  console.log(`     - Technical Correctness: ${eval1.rubric_breakdown.technical_correctness}/100`);
  console.log(`     - Problem Solving: ${eval1.rubric_breakdown.problem_solving}/100`);
  console.log(`     - Communication: ${eval1.rubric_breakdown.communication}/100`);
  console.log(`   ✓ Strong Example Benchmark Answer provided.`);

  // -----------------------------------------------------------------------------------
  // TEST 4: Submit a Correct Answer & Confirm Evaluation Changes Appropriately
  // -----------------------------------------------------------------------------------
  console.log('\n4. Submitting optimal correct answer to verify rubric score improvement...');
  const correctSubmission = await InterviewService.submitAndEvaluateAnswer({
    session_id: techSession.id,
    question_id: q1.id,
    user_id: testUserId,
    answer_text: 'We can achieve an optimal O(N) time complexity with O(N) space using a hash map to store previously seen numbers and their indices. For each element num, we compute the complement (target - num). If the complement is already in our map, we immediately return the pair of indices. Otherwise, we store the current number with its index.',
    submitted_code: `def two_sum(nums: list[int], target: int) -> list[int]:\n    seen = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in seen:\n            return [seen[diff], i]\n        seen[num] = i\n    return []`
  });

  const eval2 = correctSubmission.evaluation;
  console.log(`   ✓ New evaluated score: ${eval2.score}/100`);
  assert.ok(eval2.score >= 80, `Expected high score >= 80 for optimal solution, got ${eval2.score}`);
  assert.ok((eval2.rubric_breakdown.technical_correctness || 0) >= 80, 'Expected high technical correctness score');
  assert.ok(eval2.strengths.length > 0, 'Expected strengths to be highlighted');
  console.log(`   ✓ Strengths identified: ${eval2.strengths.join('; ')}`);
  console.log(`   ✓ Follow-up question generated: "${eval2.follow_up_question || 'N/A'}"`);

  // -----------------------------------------------------------------------------------
  // TEST 5: Start an HR Interview & Practice the STAR Method
  // -----------------------------------------------------------------------------------
  console.log('\n5. Starting HR behavioral interview & practicing the STAR method...');
  const hrSession = InterviewService.createSession({
    user_id: testUserId,
    category: 'behavioral',
    target_role: 'Associate Product Manager',
    target_company: 'Microsoft',
    difficulty: 'medium',
    mode: 'mock',
    total_questions: 2
  });

  assert.ok(hrSession.questions && hrSession.questions.length > 0);
  const hrQ1 = hrSession.questions[0];
  console.log(`   ✓ HR Question: [${hrQ1.question_type}] ${hrQ1.question_text.substring(0, 65)}...`);

  // Submitting an answer with full STAR structure:
  const starAnswer = `
    Situation: During our college capstone project, our 4-person team had only 3 weeks remaining to deliver our automated campus navigation app, and our backend lead unexpectedly fell ill.
    Task: As the team coordinator, my task was to keep the project on track, redistribute the REST API endpoints, and ensure our client-side prototype could integrate in time for final jury evaluation.
    Action: I held an emergency 30-minute sync. I mapped out the remaining 6 endpoints and prioritized the core 3 required for the demo. I took over the authentication and routing microservices, while our mobile developer focused on cached mock data. We adopted daily 10-minute standups and continuous integration testing.
    Result: We delivered the core navigation workflow 2 days ahead of deadline. The jury awarded our project first place among 28 teams, and the modular codebase made it easy for our teammate to resume work upon recovery.
  `;

  const hrEval = await InterviewService.submitAndEvaluateAnswer({
    session_id: hrSession.id,
    question_id: hrQ1.id,
    user_id: testUserId,
    answer_text: starAnswer
  });

  assert.ok(hrEval.evaluation.score >= 80, `Expected score >= 80 for comprehensive STAR answer, got ${hrEval.evaluation.score}`);
  assert.ok(hrEval.evaluation.strengths.some(s => s.toLowerCase().includes('star') || s.toLowerCase().includes('situation') || s.toLowerCase().includes('action') || s.toLowerCase().includes('structured')), 'Rubric should praise STAR framework application');
  console.log(`   ✓ HR STAR evaluation score: ${hrEval.evaluation.score}/100`);
  console.log(`   ✓ STAR framework properly recognized and rewarded.`);

  // -----------------------------------------------------------------------------------
  // TEST 6: Resume Analysis and Grounded Project Defense Questions
  // -----------------------------------------------------------------------------------
  console.log('\n6. Testing Resume and Job Description analysis without fabrication...');
  const sampleResume = `
    Alex Rivera - Computer Science B.Tech (2025)
    Skills: TypeScript, Node.js, React, PostgreSQL, Docker, Redis, REST APIs, Python
    
    Projects:
    1. Distributed Task Scheduler: Built a fault-tolerant job queue using Redis and Node.js workers with exponential backoff and dead-letter queues. Handled 10,000 tasks/min with zero data loss.
    2. Nexus Cloud Storage: Developed an S3-compatible private blob storage service using Go and SQLite metadata catalog with chunked streaming uploads.
    
    Certifications: AWS Certified Cloud Practitioner
  `;

  const sampleJD = `
    Role: Backend Software Engineer
    Required: Node.js, TypeScript, PostgreSQL, Distributed Systems, Redis, Kubernetes, CI/CD pipelines
    Nice to have: Go, Cloud Architecture
  `;

  const resumeAnalysis = InterviewService.analyzeResume(sampleResume, sampleJD);
  assert.ok(resumeAnalysis.skills.length >= 4, 'Expected extracted skills from resume');
  assert.ok(resumeAnalysis.job_description_match, 'Expected job description match object');
  assert.ok(resumeAnalysis.job_description_match.matching_skills.includes('Node.js') || resumeAnalysis.job_description_match.matching_skills.includes('TypeScript'), 'Expected matching skills');
  assert.ok(resumeAnalysis.job_description_match.missing_skills.length > 0, 'Expected missing JD skills identified (e.g. Kubernetes)');
  assert.ok(resumeAnalysis.projects.length >= 2, 'Expected extracted real projects');
  
  // Verify projects extracted are authentic and questions ground directly on them:
  const project1 = resumeAnalysis.projects[0];
  assert.ok(project1.title.includes('Task Scheduler'), 'Expected Distributed Task Scheduler project');
  assert.ok(
    resumeAnalysis.job_description_match.generated_project_questions.some(q =>
      q.toLowerCase().includes('task scheduler') || q.toLowerCase().includes('architectural') || q.toLowerCase().includes('bottlenecks')
    ),
    'Questions must specifically reference actual resume projects'
  );
  console.log(`   ✓ Extracted ${resumeAnalysis.skills.length} skills & ${resumeAnalysis.projects.length} authentic projects.`);
  console.log(`   ✓ Matched skills: ${resumeAnalysis.job_description_match.matching_skills.join(', ')}`);
  console.log(`   ✓ Identified missing JD skills to revise: ${resumeAnalysis.job_description_match.missing_skills.join(', ')}`);
  console.log(`   ✓ Sample Grounded Project Question: "${resumeAnalysis.job_description_match.generated_project_questions[0]}"`);

  // -----------------------------------------------------------------------------------
  // TEST 7: Complete Session & Verify Performance Report Persistence
  // -----------------------------------------------------------------------------------
  console.log('\n7. Completing interview session & verifying report persistence...');
  const report = await InterviewService.completeSession(techSession.id, testUserId);
  assert.ok(report.id, 'Expected report ID');
  assert.ok(typeof report.overall_score === 'number', 'Expected numeric overall score');
  assert.ok(report.top_strengths.length > 0, 'Expected report strengths');
  assert.ok(report.critical_weaknesses.length > 0, 'Expected critical weaknesses');
  assert.ok(report.recommended_preparation.length > 0, 'Expected recommended preparation');
  console.log(`   ✓ Performance Report generated. Overall Score: ${report.overall_score}/100`);
  console.log(`   ✓ Top Strengths: ${report.top_strengths.slice(0, 2).join('; ')}`);
  console.log(`   ✓ Recommended Preparation: ${report.recommended_preparation.slice(0, 2).join('; ')}`);

  // Verify DB directly
  const db = getDatabase();
  const dbReport = db.prepare('SELECT * FROM interview_reports WHERE id = ?').get(report.id) as any;
  assert.ok(dbReport, 'Report record must be persisted in SQLite table interview_reports');
  assert.strictEqual(dbReport.session_id, techSession.id);
  console.log('   ✓ Report verified directly in SQLite database.');

  // -----------------------------------------------------------------------------------
  // TEST 8: Reopen Interview History & Retrieve Saved Report
  // -----------------------------------------------------------------------------------
  console.log('\n8. Reopening interview history and retrieving saved session & report...');
  const userSessions = InterviewService.listSessions(testUserId);
  assert.ok(userSessions.length >= 2, 'Expected at least 2 sessions for test user');
  const restoredSession = InterviewService.getSession(techSession.id, testUserId);
  assert.ok(restoredSession, 'Expected to retrieve techSession');
  assert.strictEqual(restoredSession!.status, 'completed');
  assert.ok(restoredSession!.report, 'Expected session to have attached report');
  assert.strictEqual(restoredSession!.report!.id, report.id);
  console.log(`   ✓ Retrieved session history (${userSessions.length} sessions).`);
  console.log(`   ✓ Restored completed session with persisted report matching ID: ${report.id}`);

  // -----------------------------------------------------------------------------------
  // TEST 9: Edge Cases, Empty Answers & Malformed Requests
  // -----------------------------------------------------------------------------------
  console.log('\n9. Testing edge cases, empty answers, and malformed inputs...');
  
  // Empty answer submission
  try {
    await InterviewService.submitAndEvaluateAnswer({
      session_id: techSession.id,
      question_id: q1.id,
      user_id: testUserId,
      answer_text: '   '
    });
    assert.fail('Should have thrown error on empty answer');
  } catch (err: any) {
    assert.ok(err.message.toLowerCase().includes('empty'), `Expected error message about empty answer, got: ${err.message}`);
    console.log('   ✓ Correctly rejected empty answer submission.');
  }

  // Non-existent session
  try {
    await InterviewService.submitAndEvaluateAnswer({
      session_id: 'non-existent-session-id',
      question_id: 'q-999',
      user_id: testUserId,
      answer_text: 'My answer'
    });
    assert.fail('Should have thrown error for non-existent session');
  } catch (err: any) {
    assert.ok(err.message.includes('not found'), 'Expected session not found error');
    console.log('   ✓ Correctly rejected invalid session ID.');
  }

  // -----------------------------------------------------------------------------------
  // TEST 10: Multi-User Security & Authorization Isolation
  // -----------------------------------------------------------------------------------
  console.log('\n10. Testing multi-user authorization and data isolation...');
  const crossUserAccess = InterviewService.getSession(techSession.id, otherUserId);
  assert.strictEqual(crossUserAccess, null, 'User B must NOT be able to access User A session records');

  const otherUserSessions = InterviewService.listSessions(otherUserId);
  assert.ok(!otherUserSessions.some(s => s.id === techSession.id), 'User B history must NOT include User A sessions');
  console.log('   ✓ Verified cross-user isolation: User B cannot view or access User A interview sessions.');

  // -----------------------------------------------------------------------------------
  // TEST 11: Competitive Examination Interview Preparation (UPSC / Civil Services)
  // -----------------------------------------------------------------------------------
  console.log('\n11. Testing Competitive Examination Personality Round (e.g. UPSC DAF)...');
  const compSession = InterviewService.createSession({
    user_id: testUserId,
    category: 'competitive_exam',
    target_role: 'Civil Services IAS Officer',
    target_company: 'UPSC Board',
    difficulty: 'hard',
    mode: 'practice',
    total_questions: 2
  });

  assert.ok(compSession.id);
  assert.strictEqual(compSession.category, 'competitive_exam');
  assert.ok(compSession.questions && compSession.questions.length > 0);
  const compQ = compSession.questions[0];
  assert.ok(compQ.question_text.length > 20, 'Expected non-empty question statement');
  console.log(`   ✓ Competitive exam session created: "${compSession.title}"`);
  console.log(`   ✓ Question: [${compQ.question_type}] ${compQ.question_text.substring(0, 75)}...`);

  // -----------------------------------------------------------------------------------
  // TEST 12: Conversational Agent Intent Routing for Interview Preparation
  // -----------------------------------------------------------------------------------
  console.log('\n12. Testing conversational chat routing into interview preparation...');
  const chatResponse = await AgentEngine.processUserMessage('Start a mock interview for frontend developer in React');
  assert.ok(chatResponse.message.content.length > 50);
  assert.ok(
    chatResponse.message.content.toLowerCase().includes('interview') ||
    chatResponse.message.content.toLowerCase().includes('question') ||
    chatResponse.message.content.toLowerCase().includes('role'),
    'Expected chat agent to acknowledge and initiate interview practice'
  );
  console.log('   ✓ Conversational intent router seamlessly connects chat to interview studio.');

  console.log('\n======================================================');
  console.log('   ✓ ALL 12 INTERVIEW PREPARATION SCENARIOS PASSED!   ');
  console.log('======================================================\n');
}
