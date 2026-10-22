import { db } from '../database/db.js';
import {
  InterviewSession,
  InterviewQuestion,
  InterviewAnswer,
  InterviewEvaluation,
  InterviewReport,
  InterviewCategory,
  InterviewDifficulty,
  InterviewMode,
  ResumeAnalysisResult
} from '../../../shared/src/types.js';
import { DocumentService } from './documentService.js';
import { ActivityService } from './activityService.js';
import crypto from 'node:crypto';

export interface CreateInterviewParams {
  category?: InterviewCategory;
  target_company?: string;
  target_role?: string;
  experience_level?: 'beginner' | 'intermediate' | 'advanced';
  programming_language?: string;
  difficulty?: InterviewDifficulty;
  mode?: InterviewMode;
  total_questions?: number;
  resume_doc_id?: string;
  job_description?: string;
}

export class InterviewService {
  /**
   * Question repository for realistic placement & competitive exam interviews
   */
  private static questionBank: Array<{
    category: InterviewCategory;
    type: InterviewQuestion['question_type'];
    difficulty: InterviewDifficulty;
    question: string;
    expectedConcepts: string[];
    starterCode?: string;
    hints: string[];
    sampleStrongAnswer: string;
  }> = [
    // ---------------------------------------------------------------------------------
    // TECHNICAL DSA: Two Sum / Hash Map
    // ---------------------------------------------------------------------------------
    {
      category: 'technical',
      type: 'technical_dsa',
      difficulty: 'easy',
      question: `Given an array of integers 'nums' and an integer 'target', return indices of the two numbers such that they add up to 'target'.

Constraints:
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- Exactly one valid answer exists.
- You may not use the same element twice.

Example:
Input: nums = [2, 7, 11, 15], target = 9
Output: [0, 1] (because nums[0] + nums[1] == 9)

Explain your approach, analyze the time & space complexity, and write the solution code.`,
      expectedConcepts: [
        'Hash Map / Dictionary for O(1) lookup',
        'Single-pass complement search (target - current)',
        'Time Complexity: O(n)',
        'Space Complexity: O(n)',
        'Avoiding brute-force O(n^2) nested loops'
      ],
      starterCode: `def two_sum(nums: list[int], target: int) -> list[int]:\n    # Write your solution here\n    pass`,
      hints: [
        'Think about storing elements you have already seen in a hash map.',
        'For each number x, what value do you need to find? How quickly can you check if that complement exists?'
      ],
      sampleStrongAnswer: `To solve Two Sum in optimal O(n) time, we maintain a hash map mapping each visited value to its index. As we iterate through 'nums', for each element x, we compute its complement: complement = target - x. If the complement is already in our map, we immediately return [map[complement], current_index]. Otherwise, we store x in the map and continue. This achieves O(n) time and O(n) space.`
    },

    // ---------------------------------------------------------------------------------
    // TECHNICAL DSA: Valid Parentheses / Stack
    // ---------------------------------------------------------------------------------
    {
      category: 'technical',
      type: 'technical_dsa',
      difficulty: 'medium',
      question: `Given a string 's' containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

Example 1: s = "()[]{}" -> True
Example 2: s = "(]" -> False
Example 3: s = "([)]" -> False

Explain your approach and time/space complexity.`,
      expectedConcepts: [
        'Stack LIFO (Last-In-First-Out) principle',
        'Push opening brackets or matching closing brackets',
        'Empty stack check at termination',
        'Time Complexity: O(n)',
        'Space Complexity: O(n)'
      ],
      starterCode: `def is_valid_parentheses(s: str) -> bool:\n    # Implement stack solution\n    pass`,
      hints: [
        'A Stack is the ideal data structure because the most recently opened bracket must be closed first.',
        'Check edge cases: an odd-length string is always invalid.'
      ],
      sampleStrongAnswer: `We use a stack to track unmatched opening brackets. For each character, if it is an opening bracket ('(', '{', '['), we push it onto the stack. If it is a closing bracket, we check if the stack is non-empty and whether the top matches. If not, return False. At the end, return True only if the stack is completely empty. Time complexity is O(n) and space complexity is O(n).`
    },

    // ---------------------------------------------------------------------------------
    // TECHNICAL CORE: DBMS Normalization & Transactions
    // ---------------------------------------------------------------------------------
    {
      category: 'technical',
      type: 'dbms_os_networks',
      difficulty: 'medium',
      question: `Explain the ACID properties in relational databases with a banking funds-transfer example. What happens if the server crashes between deducting funds from Account A and crediting Account B?`,
      expectedConcepts: [
        'Atomicity: All-or-nothing execution with write-ahead logging (WAL) / rollback',
        'Consistency: Preserving database invariants and constraints',
        'Isolation: Concurrent transactions do not interfere (isolation levels / locking)',
        'Durability: Committed transactions persist even across power failures',
        'Crash scenario: Transaction rollback via undo logs'
      ],
      hints: [
        'Focus on Atomicity and Durability for the crash scenario.',
        'Mention transaction log mechanisms (WAL, undo/redo logs).'
      ],
      sampleStrongAnswer: `ACID stands for Atomicity, Consistency, Isolation, and Durability. In a $100 transfer from Account A to Account B:
1. Atomicity ensures both debit and credit occur together; if a crash occurs after debiting A, the database recovery engine uses Write-Ahead Logging (WAL) to undo the partial update, restoring A's balance.
2. Consistency maintains total money invariant.
3. Isolation prevents a third-party audit from seeing the transient missing $100.
4. Durability guarantees committed changes survive system reboot.`
    },

    // ---------------------------------------------------------------------------------
    // TECHNICAL SYSTEM DESIGN: URL Shortener / Scalability
    // ---------------------------------------------------------------------------------
    {
      category: 'technical',
      type: 'system_design',
      difficulty: 'hard',
      question: `Design a high-scale URL Shortener service (like TinyURL or Bitly).
Requirements:
- Given a long URL, generate a short alias (e.g. 7 characters).
- Clicking the short URL redirects with HTTP 301/302.
- High availability, low latency redirect (< 15ms), scale to 100M URLs per month.

Walk through API design, short key generation (Base62 vs Hashing), database schema, and caching layer.`,
      expectedConcepts: [
        'Base62 encoding (a-z, A-Z, 0-9) yielding 62^7 ≈ 3.5 trillion URLs',
        'Unique ID generator (Snowflake / Auto-increment distributed counter)',
        'HTTP 301 (Permanent cache) vs 302 (Temporary, enables click analytics)',
        'In-memory caching (Redis / Memcached) for top 20% read URLs',
        'Database choice: NoSQL Key-Value (DynamoDB/Cassandra) or Partitioned SQL'
      ],
      hints: [
        'Discuss why MD5/SHA256 has collision risks without truncation handling.',
        'Explain why 302 redirect is preferred if the platform needs to track click metrics.'
      ],
      sampleStrongAnswer: `We design the URL shortener with:
1. Shortening Strategy: Generate a 64-bit unique ID via distributed sequence (Twitter Snowflake) and convert it to Base62 (62^7 = 3.5T unique combinations).
2. Storage: Key-value store (e.g. Redis for hot caching, DynamoDB or PostgreSQL partitioned by short_hash).
3. Redirection: Return HTTP 302 to track analytics and geolocation.
4. Caching: 80-20 rule—store the most active 20% URLs in Redis cluster with LRU eviction for sub-10ms latency.`
    },

    // ---------------------------------------------------------------------------------
    // HR & BEHAVIORAL: Tell Me About Yourself
    // ---------------------------------------------------------------------------------
    {
      category: 'hr',
      type: 'hr_behavioral',
      difficulty: 'easy',
      question: `Tell me about yourself. Walk me through your academic background, technical interests, and why you are interested in this role.`,
      expectedConcepts: [
        'Present-Past-Future structure',
        'Current academic focus & strong technical skills',
        '1-2 key projects or achievements',
        'Clear connection to the target role/company',
        'Concise delivery (90 to 120 seconds)'
      ],
      hints: [
        'Avoid reciting your resume line-by-line.',
        'Use the Present-Past-Future formula: where you are now, relevant past projects, and why this specific role excites you.'
      ],
      sampleStrongAnswer: `I am a final-year Computer Science student passionate about full-stack systems and cloud computing. During my coursework and internships, I focused heavily on building scalable web APIs and algorithmic data structures. Recently, I built an AI-powered study planner using TypeScript, SQLite, and the Model Context Protocol that helped students optimize their revision. I am excited about this role because your engineering team solves complex distributed systems challenges where I can contribute my backend skills.`
    },

    // ---------------------------------------------------------------------------------
    // HR & BEHAVIORAL: Conflict / Disagreement (STAR)
    // ---------------------------------------------------------------------------------
    {
      category: 'behavioral',
      type: 'hr_behavioral',
      difficulty: 'medium',
      question: `Describe a situation where you had a disagreement with a team member or project partner. How did you handle it, and what was the outcome?`,
      expectedConcepts: [
        'STAR Method: Situation, Task, Action, Result',
        'Professionalism & active listening without personal animosity',
        'Data-driven or prototype-based decision making',
        'Positive collaborative resolution and project delivery'
      ],
      hints: [
        'Structure your response using STAR: Situation (context), Task (goal), Action (what you did), Result (measurable outcome).',
        'Highlight objective criteria over subjective opinions.'
      ],
      sampleStrongAnswer: `Situation: During our capstone engineering project, my teammate and I disagreed on whether to use MongoDB or PostgreSQL for our user transactions.
Task: We needed a reliable database that wouldn't lose records while meeting our 2-week sprint deadline.
Action: Rather than arguing, I proposed benchmarking both. I set up a quick 1-hour prototype demonstrating ACID transactions for our schema in PostgreSQL, showing that relational constraints prevented duplicate entries. We discussed the findings collaboratively and agreed PostgreSQL was safer.
Result: We finished the module ahead of schedule with zero transaction bugs during our live evaluation.`
    },

    // ---------------------------------------------------------------------------------
    // BEHAVIORAL: Handling Failure
    // ---------------------------------------------------------------------------------
    {
      category: 'behavioral',
      type: 'hr_behavioral',
      difficulty: 'medium',
      question: `Tell me about a time you made a mistake or failed to meet a deadline. What happened, how did you take responsibility, and what did you learn?`,
      expectedConcepts: [
        'Genuine accountability without blaming others',
        'Immediate proactive communication and mitigation',
        'Root-cause analysis',
        'Long-term process improvement or lesson learned'
      ],
      hints: [
        'Choose a real mistake with a clear lesson learned.',
        'Focus heavily on the Action and Result—what systematic guardrails you instituted afterward.'
      ],
      sampleStrongAnswer: `In a previous hackathon project, I deployed an API update directly to production right before our team presentation without running automated integration tests. A database migration failed, causing the login endpoint to 500.
I immediately took ownership, rolled back the deployment within 3 minutes, and informed our team lead.
Afterward, I set up a pre-commit hook and automated CI test runner to ensure no code could be deployed without passing all unit and migration checks. The presentation succeeded, and I learned never to bypass testing rigor under time pressure.`
    }
  ];

  /**
   * Create and persist an interview session
   */
  static createSession(params: CreateInterviewParams): InterviewSession {
    const sessionId = crypto.randomUUID();
    const now = new Date().toISOString();

    const category: InterviewCategory = params.category || 'technical';
    const targetRole = params.target_role || 'Software Engineer';
    const difficulty: InterviewDifficulty = params.difficulty || 'medium';
    const mode: InterviewMode = params.mode || 'practice';
    const totalQuestions = Math.min(Math.max(params.total_questions || 5, 2), 10);
    const company = params.target_company || (category === 'role_specific' ? 'Tech Corporation' : undefined);
    const expLevel = params.experience_level || 'beginner';
    const language = params.programming_language || 'Python';

    const title = `${company ? `${company} ` : ''}${targetRole} ${category.toUpperCase()} Mock Interview`;

    const stmt = db.prepare(`
      INSERT INTO interview_sessions (
        id, user_id, title, category, target_company, target_role, experience_level,
        programming_language, difficulty, mode, status, resume_doc_id,
        job_description, current_question_index, total_questions, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      sessionId,
      params.user_id || null,
      title,
      category,
      company || null,
      targetRole,
      expLevel,
      language,
      difficulty,
      mode,
      'in_progress',
      params.resume_doc_id || null,
      params.job_description || null,
      0,
      totalQuestions,
      now,
      now
    );

    ActivityService.logEvent(
      'tool_execution',
      'Interview Session Created',
      `Started ${mode} mode interview for "${title}" (${totalQuestions} questions).`,
      { sessionId, category, targetRole }
    );

    // Generate Question 1
    const firstQuestion = this.generateNextQuestion(sessionId, 0);

    const session: InterviewSession = {
      id: sessionId,
      title,
      category,
      target_company: company,
      target_role: targetRole,
      experience_level: expLevel,
      programming_language: language,
      difficulty,
      mode,
      status: 'in_progress',
      resume_doc_id: params.resume_doc_id,
      job_description: params.job_description,
      current_question_index: 0,
      total_questions: totalQuestions,
      created_at: now,
      updated_at: now,
      questions: firstQuestion ? [firstQuestion] : []
    };

    return session;
  }

  /**
   * Generate next question adapted to category, role, resume, or previous evaluation
   */
  static generateNextQuestion(sessionId: string, nextIndex?: number): InterviewQuestion | null {
    const session = this.getSession(sessionId);
    if (!session) return null;

    const idx = nextIndex !== undefined ? nextIndex : session.current_question_index;
    if (idx >= session.total_questions) {
      // Session reached limit, complete and generate final report
      this.completeSession(sessionId);
      return null;
    }

    // Check if question already generated for this index
    const existingStmt = db.prepare('SELECT id FROM interview_questions WHERE session_id = ? AND question_index = ?');
    const existing = existingStmt.get(sessionId, idx) as { id: string } | undefined;
    if (existing) {
      return this.getQuestionById(existing.id);
    }

    // Check if a resume is linked and can produce a project-grounded question
    let questionData: (typeof InterviewService.questionBank)[0] | undefined;

    if (session.resume_doc_id && (idx === 1 || idx === 2)) {
      const resumeDoc = DocumentService.getDocumentById(session.resume_doc_id);
      if (resumeDoc) {
        const analysis = this.analyzeResume(resumeDoc.extracted_text, session.job_description);
        if (analysis.projects.length > 0) {
          const proj = analysis.projects[0];
          questionData = {
            category: session.category,
            type: 'resume_project',
            difficulty: session.difficulty,
            question: `In your resume, you listed the project "${proj.title}". Walk me through the system architecture, your individual engineering contributions, the key trade-offs you made, and how you validated performance under load.`,
            expectedConcepts: [
              'Clear system architecture overview',
              'Specific technologies and why they were selected',
              'Personal individual contribution vs team scope',
              'Challenges encountered and engineering solutions',
              'Performance metrics or user impact'
            ],
            hints: [
              'Use the STAR method to describe a technical hurdle in this project.',
              'Explain why you chose this specific stack over alternatives.'
            ],
            sampleStrongAnswer: `In "${proj.title}", I led the backend API architecture. We implemented the service using TypeScript and SQLite with WAL mode to ensure reliable ACID transactions. The primary challenge was indexing high-frequency queries; I introduced compound indexes which reduced p95 latency from 140ms to 12ms. If I were to redesign it today, I would introduce asynchronous queue workers for non-critical jobs.`
          };
        }
      }
    }

    if (!questionData) {
      // Filter bank by matching category or difficulty
      const matches = this.questionBank.filter(q => {
        if (session.category === 'behavioral') {
          return q.category === 'behavioral';
        }
        if (session.category === 'hr') {
          return q.category === 'hr';
        }
        if (session.category === 'role_specific') {
          return q.category === 'role_specific' || q.category === 'technical';
        }
        if (session.category === 'competitive_exam') {
          return q.category === 'competitive_exam';
        }
        return q.category === 'technical';
      });

      const pool = matches.length > 0 ? matches : this.questionBank;
      const selected = pool[idx % pool.length];
      questionData = selected;
    }

    const qId = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertQ = db.prepare(`
      INSERT INTO interview_questions (
        id, session_id, question_index, question_text, question_type,
        expected_concepts, starter_code, hints, sample_strong_answer, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertQ.run(
      qId,
      sessionId,
      idx,
      questionData.question,
      questionData.type,
      JSON.stringify(questionData.expectedConcepts),
      questionData.starterCode || null,
      JSON.stringify(questionData.hints),
      questionData.sampleStrongAnswer,
      now
    );

    return {
      id: qId,
      session_id: sessionId,
      question_index: idx,
      question_text: questionData.question,
      question_type: questionData.type,
      expected_concepts: questionData.expectedConcepts,
      starter_code: questionData.starterCode,
      hints: questionData.hints,
      sample_strong_answer: questionData.sampleStrongAnswer,
      created_at: now
    };
  }

  /**
   * Submit student's answer and perform transparent rubric evaluation
   */
  static submitAndEvaluateAnswer(params: {
    sessionId: string;
    questionId: string;
    answerText: string;
    submittedCode?: string;
    durationSeconds?: number;
    session_id?: string;
    question_id?: string;
    answer_text?: string;
    submitted_code?: string;
    duration_seconds?: number;
    user_id?: string;
  }): {
    answer: InterviewAnswer;
    evaluation: InterviewEvaluation;
    nextQuestion?: InterviewQuestion;
    report?: InterviewReport;
  } {
    const sessionId = params.sessionId || params.session_id;
    const questionId = params.questionId || params.question_id;
    const rawAnswer = params.answerText || params.answer_text;
    const submittedCode = params.submittedCode || params.submitted_code;
    const durationSeconds = params.durationSeconds ?? params.duration_seconds ?? 0;

    if (!sessionId) {
      throw new Error('Interview session ID is required.');
    }

    if (!rawAnswer || !rawAnswer.trim()) {
      throw new Error('Answer text cannot be empty. Please provide your explanation or code solution.');
    }

    const answerText = rawAnswer.trim();

    const session = this.getSession(sessionId);
    if (!session) throw new Error(`Interview session "${sessionId}" not found.`);

    const question = this.getQuestionById(questionId || '');
    if (!question) throw new Error(`Question "${questionId}" not found.`);

    // 1. Record Answer
    const answerId = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertAns = db.prepare(`
      INSERT INTO interview_answers (
        id, question_id, session_id, answer_text, submitted_code, duration_seconds, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertAns.run(answerId, question.id, sessionId, answerText, submittedCode || null, durationSeconds, now);

    // 2. Perform Transparent Rubric Evaluation
    const evaluation = this.evaluateAnswer(question, answerText, submittedCode);

    const evalId = crypto.randomUUID();
    const insertEval = db.prepare(`
      INSERT INTO interview_evaluations (
        id, answer_id, question_id, session_id, score, rubric_breakdown,
        strengths, missing_concepts, improvement_suggestions, follow_up_question,
        strong_example_answer, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertEval.run(
      evalId,
      answerId,
      questionId,
      sessionId,
      evaluation.score,
      JSON.stringify(evaluation.rubric_breakdown),
      JSON.stringify(evaluation.strengths),
      JSON.stringify(evaluation.missing_concepts),
      JSON.stringify(evaluation.improvement_suggestions),
      evaluation.follow_up_question || null,
      evaluation.strong_example_answer || null,
      now
    );

    // 3. Advance Session Index
    const nextIdx = question.question_index + 1;
    db.prepare('UPDATE interview_sessions SET current_question_index = ?, updated_at = ? WHERE id = ?')
      .run(nextIdx, now, sessionId);

    // 4. Check if session completed or generate next question
    let nextQuestion: InterviewQuestion | undefined;
    let report: InterviewReport | undefined;

    if (nextIdx < session.total_questions) {
      nextQuestion = this.generateNextQuestion(sessionId, nextIdx) || undefined;
    } else {
      report = this.completeSession(sessionId);
    }

    const recordedAnswer: InterviewAnswer = {
      id: answerId,
      question_id: questionId,
      session_id: sessionId,
      answer_text: answerText,
      submitted_code: submittedCode,
      duration_seconds: durationSeconds,
      created_at: now,
      evaluation: {
        id: evalId,
        answer_id: answerId,
        question_id: questionId,
        session_id: sessionId,
        score: evaluation.score,
        rubric_breakdown: evaluation.rubric_breakdown,
        strengths: evaluation.strengths,
        missing_concepts: evaluation.missing_concepts,
        improvement_suggestions: evaluation.improvement_suggestions,
        follow_up_question: evaluation.follow_up_question,
        strong_example_answer: evaluation.strong_example_answer,
        created_at: now
      }
    };

    return {
      answer: recordedAnswer,
      evaluation: recordedAnswer.evaluation!,
      nextQuestion,
      report
    };
  }

  /**
   * Internal deterministic rubric evaluator
   */
  private static evaluateAnswer(
    question: InterviewQuestion,
    answerText: string,
    submittedCode?: string
  ): {
    score: number;
    rubric_breakdown: InterviewEvaluation['rubric_breakdown'];
    strengths: string[];
    missing_concepts: string[];
    improvement_suggestions: string[];
    follow_up_question?: string;
    strong_example_answer: string;
  } {
    const textLower = (answerText + ' ' + (submittedCode || '')).toLowerCase();
    const expected = question.expected_concepts;

    // Check matched vs missing concepts
    const matched: string[] = [];
    const missing: string[] = [];

    for (const concept of expected) {
      const keywords = concept.toLowerCase().split(/[\s/(),-]+/).filter(w => w.length > 3);
      const hit = keywords.some(k => textLower.includes(k));
      if (hit) {
        matched.push(concept);
      } else {
        missing.push(concept);
      }
    }

    const hasSituation = textLower.includes('situation');
    const hasTask = textLower.includes('task');
    const hasAction = textLower.includes('action');
    const hasResult = textLower.includes('result');
    const isFullStar = hasSituation && hasTask && hasAction && hasResult;
    const isPartialStar = (hasSituation ? 1 : 0) + (hasAction ? 1 : 0) + (hasResult ? 1 : 0) >= 2;

    const isTechnical = question.question_type === 'technical_dsa' || question.question_type === 'system_design' || question.question_type === 'dbms_os_networks';

    const matchRatio = expected.length > 0 ? matched.length / expected.length : 0.8;
    const isShortAnswer = answerText.trim().split(/\s+/).length < 20;

    let baseScore = Math.round(matchRatio * 75 + (isShortAnswer ? 5 : 20));
    baseScore = Math.min(Math.max(baseScore, 25), 96);

    // Compute Specialized Rubric Breakdown
    const technicalCorrectness = isTechnical
      ? Math.round(baseScore * (matchRatio > 0.4 ? 1.0 : 0.7))
      : Math.round(baseScore * 0.85);

    const conceptualUnderstanding = isFullStar
      ? 90
      : Math.round(baseScore * 0.95);

    const problemSolving = submittedCode || textLower.includes('algorithm') || textLower.includes('approach') || isFullStar
      ? (isFullStar ? 92 : baseScore)
      : Math.round(baseScore * 0.8);

    const communication = isShortAnswer ? 60 : 92;

    const structureStar = isFullStar
      ? 96
      : (isPartialStar ? 86 : (textLower.includes('situation') || textLower.includes('result') || textLower.includes('because') ? 78 : 65));

    const evidence = textLower.includes('example') || textLower.includes('for instance') || submittedCode || isFullStar
      ? (isFullStar ? 94 : 85)
      : 70;

    const finalScore = isTechnical
      ? Math.round((technicalCorrectness * 0.4) + (problemSolving * 0.3) + (conceptualUnderstanding * 0.2) + (communication * 0.1))
      : Math.round((structureStar * 0.4) + (communication * 0.25) + (evidence * 0.2) + (conceptualUnderstanding * 0.15));

    const strengths: string[] = [];
    if (isFullStar) {
      strengths.push('Exemplary application of the STAR method (Situation, Task, Action, Result) with clear personal accountability and measurable impact.');
    }
    if (matched.length > 0) {
      strengths.push(`Identified key foundational concepts: ${matched.slice(0, 2).join('; ')}.`);
    }
    if (submittedCode && submittedCode.trim().length > 30) {
      strengths.push('Provided concrete code implementation demonstrating programmatic syntax.');
    } else if (!isShortAnswer && !isFullStar) {
      strengths.push('Structured response with explanatory context rather than a one-word answer.');
    }
    if (strengths.length === 0) {
      strengths.push('Demonstrated initial attempt at articulating the solution.');
    }

    const improvementSuggestions: string[] = [];
    if (missing.length > 0) {
      improvementSuggestions.push(`Deepen your discussion on: ${missing.slice(0, 2).join('; ')}.`);
    }
    if (question.question_type === 'technical_dsa' && !textLower.includes('o(') && !textLower.includes('complexity')) {
      improvementSuggestions.push('Always state Time & Space Complexity explicitly using Big-O notation.');
    }
    if ((question.question_type === 'hr_behavioral' || question.question_type === 'role_scenario') && !textLower.includes('result')) {
      improvementSuggestions.push('Use the STAR method: explicitly conclude with the measurable **Result** or lesson learned.');
    }
    if (isShortAnswer) {
      improvementSuggestions.push('Elaborate with practical trade-offs or a specific project example to demonstrate depth.');
    }

    // Follow-up question tailored to missing concepts
    let followUp: string | undefined;
    if (missing.length > 0) {
      followUp = `Could you explain how ${missing[0]} would impact performance or scalability in this scenario?`;
    } else {
      followUp = 'What edge cases would you test, and how would you optimize this if inputs scale by 100x?';
    }

    return {
      score: finalScore,
      rubric_breakdown: {
        technical_correctness: technicalCorrectness,
        conceptual_understanding: conceptualUnderstanding,
        problem_solving: problemSolving,
        communication,
        structure_star: structureStar,
        evidence_and_examples: evidence
      },
      strengths,
      missing_concepts: missing.length > 0 ? missing : ['None. Excellent conceptual coverage.'],
      improvement_suggestions: improvementSuggestions,
      follow_up_question: followUp,
      strong_example_answer: question.sample_strong_answer || 'See model response guidelines.'
    };
  }

  /**
   * Complete interview session and generate final performance report
   */
  static completeSession(sessionId: string, userId?: string): InterviewReport {
    const session = this.getSession(sessionId, userId);
    if (!session) throw new Error(`Interview session "${sessionId}" not found.`);

    const now = new Date().toISOString();

    // Query all evaluations for this session
    const evalStmt = db.prepare(`
      SELECT e.*, q.question_type, q.question_text
      FROM interview_evaluations e
      JOIN interview_questions q ON e.question_id = q.id
      WHERE e.session_id = ?
    `);
    const evals = evalStmt.all(sessionId) as any[];

    let overallScore = 75;
    if (evals.length > 0) {
      overallScore = Math.round(evals.reduce((sum, e) => sum + e.score, 0) / evals.length);
    }

    let readinessTier = 'Competent (Good fundamentals; ready for placement practice)';
    if (overallScore >= 85) readinessTier = 'High Placement Readiness (Ready for Top Tech / Tier-1 Interviews)';
    else if (overallScore >= 70) readinessTier = 'Proficient (Strong core; minor optimization & STAR refinement needed)';
    else if (overallScore < 55) readinessTier = 'Foundational (Review core CS data structures and practice STAR responses)';

    // Aggregate category scores
    const categoryScores: Record<string, number> = {
      'Technical Mastery': overallScore,
      'Communication & Structure': Math.min(overallScore + 4, 98),
      'Problem Solving Approach': Math.max(overallScore - 3, 50)
    };

    const topStrengths: string[] = [];
    const criticalWeaknesses: string[] = [];
    const recommendations: string[] = [];

    evals.forEach(e => {
      const str = JSON.parse(e.strengths || '[]');
      const imp = JSON.parse(e.improvement_suggestions || '[]');
      if (str.length > 0 && topStrengths.length < 3) topStrengths.push(str[0]);
      if (imp.length > 0 && criticalWeaknesses.length < 3) criticalWeaknesses.push(imp[0]);
    });

    if (topStrengths.length === 0) topStrengths.push('Demonstrated positive approach to challenging problem statements.');
    if (criticalWeaknesses.length === 0) criticalWeaknesses.push('Edge-case coverage under extreme constraint scaling.');

    recommendations.push(`Revise ${session.category.toUpperCase()} high-frequency questions for ${session.target_role}.`);
    recommendations.push('Structure behavioral answers strictly using Situation -> Task -> Action -> Result.');
    recommendations.push('State Big-O Time & Space complexity before writing code implementation.');

    const reportId = crypto.randomUUID();
    const insertReport = db.prepare(`
      INSERT INTO interview_reports (
        id, session_id, overall_score, readiness_assessment, category_scores,
        top_strengths, critical_weaknesses, recommended_preparation, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET
        overall_score = excluded.overall_score,
        readiness_assessment = excluded.readiness_assessment,
        category_scores = excluded.category_scores,
        top_strengths = excluded.top_strengths,
        critical_weaknesses = excluded.critical_weaknesses,
        recommended_preparation = excluded.recommended_preparation
    `);

    insertReport.run(
      reportId,
      sessionId,
      overallScore,
      readinessTier,
      JSON.stringify(categoryScores),
      JSON.stringify(topStrengths),
      JSON.stringify(criticalWeaknesses),
      JSON.stringify(recommendations),
      now
    );

    db.prepare('UPDATE interview_sessions SET status = ?, overall_score = ?, updated_at = ? WHERE id = ?')
      .run('completed', overallScore, now, sessionId);

    ActivityService.logEvent(
      'tool_execution',
      'Interview Session Completed',
      `Completed interview for "${session.title}" with score ${overallScore}% (${readinessTier}).`,
      { sessionId, overallScore, readinessTier }
    );

    return {
      id: reportId,
      session_id: sessionId,
      overall_score: overallScore,
      readiness_assessment: readinessTier,
      category_scores: categoryScores,
      top_strengths: topStrengths,
      critical_weaknesses: criticalWeaknesses,
      recommended_preparation: recommendations,
      created_at: now
    };
  }

  /**
   * Resume and Job Description RAG Analyzer
   */
  static analyzeResume(resumeText: string, jobDescription?: string): ResumeAnalysisResult {
    const textLower = resumeText.toLowerCase();

    // 1. Extract Education
    const education: string[] = [];
    if (textLower.includes('b.tech') || textLower.includes('bachelor') || textLower.includes('b.e.')) {
      education.push('Bachelor of Technology (Computer Science & Engineering)');
    }
    if (textLower.includes('master') || textLower.includes('m.tech') || textLower.includes('mca')) {
      education.push('Master of Computer Applications / Technology');
    }
    if (education.length === 0) education.push('Undergraduate Degree in Engineering / Technology');

    // 2. Extract Skills
    const knownSkills = [
      'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Express',
      'Java', 'C++', 'SQL', 'PostgreSQL', 'SQLite', 'MongoDB',
      'Docker', 'Kubernetes', 'AWS', 'Git', 'Data Structures', 'Algorithms',
      'Operating Systems', 'Computer Networks', 'Machine Learning', 'GraphQL'
    ];
    const skills = knownSkills.filter(s => textLower.includes(s.toLowerCase()));

    // 3. Extract Projects (Parsing numbered lists, bullet points, and headings)
    const projects: ResumeAnalysisResult['projects'] = [];
    const lines = resumeText.split(/\r?\n/);
    let inProjectsSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.toLowerCase().startsWith('project') || line.toLowerCase().includes('projects:')) {
        inProjectsSection = true;
        continue;
      }

      // Check for numbered item e.g. "1. Distributed Task Scheduler: Built ..."
      const numberedMatch = line.match(/^(\d+[\.\)]|\*|\-|\•)\s*([^:\-\n]+)[:\-]?\s*(.*)$/);
      if (numberedMatch) {
        const title = numberedMatch[2].trim();
        const desc = numberedMatch[3].trim() || lines[i + 1]?.trim() || 'Engineering implementation with modular architecture.';
        if (title.length >= 3 && !title.toLowerCase().includes('certification') && !title.toLowerCase().includes('skill')) {
          projects.push({
            title,
            description: desc,
            tech_stack: skills.filter(s => line.toLowerCase().includes(s.toLowerCase()) || desc.toLowerCase().includes(s.toLowerCase()))
          });
          if (projects.length >= 4) break;
          continue;
        }
      }

      // Or bullet/heading inside project section
      if (inProjectsSection && (line.includes(':') || line.includes('-')) && line.length > 5 && line.length < 100) {
        const parts = line.split(/[:\-]/);
        const title = parts[0].replace(/^[\*\-\•\d\.]+\s*/, '').trim();
        const desc = parts.slice(1).join(':').trim() || lines[i + 1]?.trim() || 'Software development project.';
        if (title.length >= 3 && !title.toLowerCase().includes('certification') && !title.toLowerCase().includes('skill')) {
          projects.push({
            title,
            description: desc,
            tech_stack: skills.slice(0, 3)
          });
          if (projects.length >= 4) break;
        }
      }
    }

    if (projects.length === 0) {
      projects.push({
        title: 'Full-Stack Systems Application',
        description: 'Designed and deployed modular microservices with persistent storage and REST endpoints.',
        tech_stack: skills.slice(0, 3)
      });
    }

    if (projects.length === 0) {
      projects.push({
        title: 'Full-Stack Web & AI Application',
        description: 'Engineered responsive full-stack system with persistent SQLite database and REST endpoints.',
        tech_stack: ['TypeScript', 'React', 'Node.js']
      });
    }

    // 4. Job Description Match Comparison
    let jdMatch: ResumeAnalysisResult['job_description_match'] | undefined;
    if (jobDescription && jobDescription.trim().length > 10) {
      const jdLower = jobDescription.toLowerCase();
      const matchingSkills: string[] = [];
      const missingSkills: string[] = [];

      knownSkills.forEach(skill => {
        const inJd = jdLower.includes(skill.toLowerCase());
        const inResume = textLower.includes(skill.toLowerCase());
        if (inJd && inResume) {
          matchingSkills.push(skill);
        } else if (inJd && !inResume) {
          missingSkills.push(skill);
        }
      });

      const totalJdSkills = matchingSkills.length + missingSkills.length;
      const matchScore = totalJdSkills > 0 ? Math.round((matchingSkills.length / totalJdSkills) * 100) : 75;

      const projectQuestions = projects.map(p =>
        `Can you describe the architectural decisions and key bottlenecks you solved in "${p.title}"?`
      );

      jdMatch = {
        match_score: matchScore,
        matching_skills: matchingSkills,
        missing_skills: missingSkills,
        recommended_study_topics: missingSkills.map(s => `Review ${s} fundamentals and common placement interview questions`),
        generated_project_questions: projectQuestions
      };
    }

    return {
      education,
      skills,
      projects,
      experience: ['Undergraduate academic coursework & hands-on development projects'],
      certifications: ['Academic Coursework in Data Structures, Algorithms, and System Design'],
      job_description_match: jdMatch
    };
  }

  /**
   * Get single session with questions, answers, evaluations, and report
   */
  static getSession(sessionId: string, userId?: string): InterviewSession | null {
    const sStmt = db.prepare('SELECT * FROM interview_sessions WHERE id = ?');
    const s = sStmt.get(sessionId) as any;
    if (!s) return null;

    if (userId && s.user_id && s.user_id !== userId) {
      return null;
    }

    const qStmt = db.prepare('SELECT * FROM interview_questions WHERE session_id = ? ORDER BY question_index ASC');
    const questions = qStmt.all(sessionId) as any[];

    const fullQuestions: InterviewQuestion[] = [];
    for (const q of questions) {
      const ansStmt = db.prepare('SELECT * FROM interview_answers WHERE question_id = ?');
      const ans = ansStmt.get(q.id) as any;

      let recordedAnswer: InterviewAnswer | undefined;
      if (ans) {
        const evalStmt = db.prepare('SELECT * FROM interview_evaluations WHERE answer_id = ?');
        const ev = evalStmt.get(ans.id) as any;

        recordedAnswer = {
          id: ans.id,
          question_id: ans.question_id,
          session_id: ans.session_id,
          answer_text: ans.answer_text,
          submitted_code: ans.submitted_code || undefined,
          duration_seconds: ans.duration_seconds || 0,
          created_at: ans.created_at,
          evaluation: ev ? {
            id: ev.id,
            answer_id: ev.answer_id,
            question_id: ev.question_id,
            session_id: ev.session_id,
            score: ev.score,
            rubric_breakdown: JSON.parse(ev.rubric_breakdown || '{}'),
            strengths: JSON.parse(ev.strengths || '[]'),
            missing_concepts: JSON.parse(ev.missing_concepts || '[]'),
            improvement_suggestions: JSON.parse(ev.improvement_suggestions || '[]'),
            follow_up_question: ev.follow_up_question || undefined,
            strong_example_answer: ev.strong_example_answer || undefined,
            created_at: ev.created_at
          } : undefined
        };
      }

      fullQuestions.push({
        id: q.id,
        session_id: q.session_id,
        question_index: q.question_index,
        question_text: q.question_text,
        question_type: q.question_type,
        expected_concepts: JSON.parse(q.expected_concepts || '[]'),
        starter_code: q.starter_code || undefined,
        hints: JSON.parse(q.hints || '[]'),
        sample_strong_answer: q.sample_strong_answer || undefined,
        created_at: q.created_at,
        answer: recordedAnswer
      });
    }

    const rStmt = db.prepare('SELECT * FROM interview_reports WHERE session_id = ?');
    const rep = rStmt.get(sessionId) as any;

    let report: InterviewReport | undefined;
    if (rep) {
      report = {
        id: rep.id,
        session_id: rep.session_id,
        overall_score: rep.overall_score,
        readiness_assessment: rep.readiness_assessment,
        category_scores: JSON.parse(rep.category_scores || '{}'),
        top_strengths: JSON.parse(rep.top_strengths || '[]'),
        critical_weaknesses: JSON.parse(rep.critical_weaknesses || '[]'),
        recommended_preparation: JSON.parse(rep.recommended_preparation || '[]'),
        created_at: rep.created_at
      };
    }

    return {
      id: s.id,
      title: s.title,
      category: s.category,
      target_company: s.target_company || undefined,
      target_role: s.target_role,
      experience_level: s.experience_level,
      programming_language: s.programming_language || undefined,
      difficulty: s.difficulty,
      mode: s.mode,
      status: s.status,
      resume_doc_id: s.resume_doc_id || undefined,
      job_description: s.job_description || undefined,
      current_question_index: s.current_question_index,
      total_questions: s.total_questions,
      overall_score: s.overall_score || undefined,
      summary: s.summary || undefined,
      created_at: s.created_at,
      updated_at: s.updated_at,
      questions: fullQuestions,
      report
    };
  }

  /**
   * List all interview sessions (filtered by user_id if provided)
   */
  static listSessions(userId?: string): InterviewSession[] {
    let rows: any[];
    if (userId) {
      const stmt = db.prepare('SELECT * FROM interview_sessions WHERE user_id = ? ORDER BY created_at DESC');
      rows = stmt.all(userId) as any[];
    } else {
      const stmt = db.prepare('SELECT * FROM interview_sessions ORDER BY created_at DESC');
      rows = stmt.all() as any[];
    }
    return rows.map(s => ({
      id: s.id,
      title: s.title,
      category: s.category,
      target_company: s.target_company || undefined,
      target_role: s.target_role,
      experience_level: s.experience_level,
      programming_language: s.programming_language || undefined,
      difficulty: s.difficulty,
      mode: s.mode,
      status: s.status,
      resume_doc_id: s.resume_doc_id || undefined,
      job_description: s.job_description || undefined,
      current_question_index: s.current_question_index,
      total_questions: s.total_questions,
      overall_score: s.overall_score || undefined,
      summary: s.summary || undefined,
      created_at: s.created_at,
      updated_at: s.updated_at
    }));
  }

  private static getQuestionById(id: string): InterviewQuestion | null {
    const stmt = db.prepare('SELECT * FROM interview_questions WHERE id = ?');
    const q = stmt.get(id) as any;
    if (!q) return null;
    return {
      id: q.id,
      session_id: q.session_id,
      question_index: q.question_index,
      question_text: q.question_text,
      question_type: q.question_type,
      expected_concepts: JSON.parse(q.expected_concepts || '[]'),
      starter_code: q.starter_code || undefined,
      hints: JSON.parse(q.hints || '[]'),
      sample_strong_answer: q.sample_strong_answer || undefined,
      created_at: q.created_at
    };
  }
}
