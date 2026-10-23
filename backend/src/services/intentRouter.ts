export type IntentType =
  | 'MULTI_TOOL_WORKFLOW'
  | 'APPROVE_SCHEDULE'
  | 'DIRECT_CALCULATION'       // e.g. 2+2?, 15*4, sqrt(16)
  | 'GREETING'                 // e.g. hi, hello, hey
  | 'FOLLOW_UP'                // e.g. "I don't understand your previous explanation", "Give me only the final answer", "What about in Java"
  | 'GENERAL_CONVERSATION'     // General factual & everyday queries (e.g. "What is the capital of France?")
  | 'GENERAL_ACADEMIC'         // Academic subjects (DBMS, OS, Networking, etc.)
  | 'PROBLEM_SOLVING_CODE'     // Code & DSA problems
  | 'EXAM_SPECIFIC'            // Explicitly requested GATE, UPSC, CAT exam strategy
  | 'DOCUMENT_GROUNDED_NOTES'  // Explicit queries targeting uploaded notes/PDFs
  | 'CURRENT_AFFAIRS_OFFICIAL' // Exam dates & official portal links
  | 'STUDY_PLAN_SCHEDULING'    // Tasks, study plans, schedules
  | 'QUIZ_GENERATION'          // Quizzes & mock assessments
  | 'PERFORMANCE_ANALYSIS'     // Accuracy & progress tracking
  | 'INTERVIEW_PREPARATION'    // AI placement & interview coach
  | 'GENERAL_INQUIRY';         // General capability queries

export interface RoutedIntent {
  type: IntentType;
  confidence: number;
  extractedTopic?: string;
  examMention?: string;
  isFollowUp: boolean;
  needsDocumentRetrieval: boolean;
  needsToolExecution: boolean;
  parameters: Record<string, any>;
}

export class IntentRouter {
  /**
   * Route user query into distinct intent paths with context awareness
   */
  static route(userText: string, recentHistory: Array<{ role: string; content: string }> = []): RoutedIntent {
    const textLower = userText.toLowerCase().trim();

    // 0. Primary E2E Demo Multi-Workflow
    const isMultiWorkflow =
      (textLower.includes('analyse') || textLower.includes('analyze') || textLower.includes('topics')) &&
      (textLower.includes('revision plan') || textLower.includes('schedule') || textLower.includes('study session')) &&
      (textLower.includes('quiz') || textLower.includes('exam'));

    if (isMultiWorkflow) {
      return {
        type: 'MULTI_TOOL_WORKFLOW',
        confidence: 0.99,
        isFollowUp: false,
        needsDocumentRetrieval: true,
        needsToolExecution: true,
        parameters: { userText }
      };
    }

    // 1. Schedule Approval
    if (textLower.includes('approve') && (textLower.includes('schedule') || textLower.includes('plan'))) {
      return {
        type: 'APPROVE_SCHEDULE',
        confidence: 0.98,
        isFollowUp: false,
        needsDocumentRetrieval: false,
        needsToolExecution: true,
        parameters: {}
      };
    }

    // 2. Direct Mathematical & Arithmetic Expressions (e.g. "2+2?", "15 * 4", "10 × 12", "sqrt(16)")
    const isArithmetic = this.isArithmeticQuery(textLower);
    if (isArithmetic) {
      return {
        type: 'DIRECT_CALCULATION',
        confidence: 0.99,
        isFollowUp: false,
        needsDocumentRetrieval: false,
        needsToolExecution: false,
        parameters: { query: userText }
      };
    }

    // 3. Check if this is an explicit follow-up / clarification / format constraint
    const isFollowUp = this.detectFollowUp(textLower, recentHistory);
    if (
      isFollowUp &&
      (textLower.includes('only the final answer') ||
        textLower.includes('final answer only') ||
        textLower.includes("don't understand") ||
        textLower.includes('dont understand') ||
        textLower.includes('explain that differently') ||
        textLower.includes('explain differently') ||
        textLower.includes('simpler') ||
        textLower.includes('in java') ||
        textLower.includes('in python'))
    ) {
      return {
        type: 'FOLLOW_UP',
        confidence: 0.96,
        isFollowUp: true,
        needsDocumentRetrieval: false,
        needsToolExecution: false,
        parameters: { query: userText }
      };
    }

    // 4. Pure Greetings (e.g. "hi", "hello", "hey", "good morning")
    if (
      textLower === 'hi' ||
      textLower === 'hello' ||
      textLower === 'hey' ||
      textLower === 'good morning' ||
      textLower === 'good afternoon' ||
      textLower === 'good evening' ||
      textLower === 'howdy' ||
      textLower === 'sup' ||
      textLower === "what's up" ||
      textLower === 'yo' ||
      textLower === 'hey nexus'
    ) {
      return {
        type: 'GREETING',
        confidence: 0.99,
        isFollowUp: false,
        needsDocumentRetrieval: false,
        needsToolExecution: false,
        parameters: {}
      };
    }

    // 5. Interview Preparation (Placement, Technical, HR Mock Rounds)
    if (
      textLower.includes('mock interview') ||
      textLower.includes('interview prep') ||
      textLower.includes('interview me') ||
      textLower.includes('practice interview') ||
      textLower.includes('behavioral interview') ||
      textLower.includes('technical interview') ||
      textLower.includes('hr interview') ||
      textLower.includes('star method') ||
      textLower.includes('take my mock') ||
      textLower.includes('prepare for my hr interview') ||
      (textLower.includes('interview') && (textLower.includes('question') || textLower.includes('practice') || textLower.includes('start') || textLower.includes('prepare')))
    ) {
      let category: 'technical' | 'hr' | 'behavioral' | 'role_specific' = 'technical';
      if (textLower.includes('hr')) category = 'hr';
      else if (textLower.includes('behavioral') || textLower.includes('star')) category = 'behavioral';
      else if (textLower.includes('role') || textLower.includes('google') || textLower.includes('amazon') || textLower.includes('meta')) category = 'role_specific';

      return {
        type: 'INTERVIEW_PREPARATION',
        confidence: 0.96,
        isFollowUp,
        needsDocumentRetrieval: textLower.includes('resume') || textLower.includes('my notes'),
        needsToolExecution: true,
        parameters: { category, rawText: userText }
      };
    }

    // 6. Explicit Notes / Document Grounding (Type D)
    const mentionsNotesExplicitly =
      textLower.includes('my note') ||
      textLower.includes('uploaded note') ||
      textLower.includes('in my notes') ||
      textLower.includes('from my notes') ||
      textLower.includes('uploaded document') ||
      textLower.includes('uploaded pdf') ||
      textLower.includes('this uploaded pdf') ||
      textLower.includes('according to my notes');

    if (mentionsNotesExplicitly) {
      const cleanTopic = userText.replace(/according to|in my notes|from my notes|my notes|uploaded notes|notes|what do|explain|this uploaded pdf|uploaded pdf/gi, '').trim();
      return {
        type: 'DOCUMENT_GROUNDED_NOTES',
        confidence: 0.95,
        extractedTopic: cleanTopic,
        isFollowUp,
        needsDocumentRetrieval: true,
        needsToolExecution: true,
        parameters: { query: cleanTopic }
      };
    }

    // 7. Study Plan Creation & Scheduling (Type F)
    if (
      (textLower.includes('plan') && (textLower.includes('revision') || textLower.includes('study') || textLower.includes('gate') || textLower.includes('exam') || textLower.includes('day') || textLower.includes('30'))) ||
      textLower.includes('reschedule') ||
      (textLower.includes('schedule') && (textLower.includes('session') || textLower.includes('tomorrow') || textLower.includes('create'))) ||
      (textLower.includes('task') && (textLower.includes('create') || textLower.includes('add') || textLower.includes('todo') || textLower.includes('pending')))
    ) {
      return {
        type: 'STUDY_PLAN_SCHEDULING',
        confidence: 0.93,
        isFollowUp,
        needsDocumentRetrieval: false,
        needsToolExecution: true,
        parameters: { userText }
      };
    }

    // 8. Quiz & Mock Test Generation (Type G)
    if (
      textLower.includes('quiz') ||
      textLower.includes('mock test') ||
      textLower.includes('practice question') ||
      textLower.includes('test on') ||
      textLower.includes('assessment') ||
      (textLower.includes('generate') && textLower.includes('question')) ||
      (textLower.includes('create') && textLower.includes('question'))
    ) {
      const topic = this.extractTopicFromQuizQuery(userText);
      return {
        type: 'QUIZ_GENERATION',
        confidence: 0.94,
        extractedTopic: topic,
        isFollowUp,
        needsDocumentRetrieval: textLower.includes('my note') || textLower.includes('uploaded'),
        needsToolExecution: true,
        parameters: { topic }
      };
    }

    // 9. Performance Analysis (Type H)
    if (
      textLower.includes('performance') ||
      textLower.includes('weak topic') ||
      textLower.includes('weak area') ||
      textLower.includes('accuracy') ||
      textLower.includes('my progress') ||
      textLower.includes('score trend') ||
      textLower.includes('what should i revise next') ||
      (textLower.includes('how') && textLower.includes('performing'))
    ) {
      return {
        type: 'PERFORMANCE_ANALYSIS',
        confidence: 0.95,
        isFollowUp,
        needsDocumentRetrieval: false,
        needsToolExecution: true,
        parameters: {}
      };
    }

    // 10. Current Affairs & Official Examination Info (Type E)
    if (
      textLower.includes('exam date') ||
      textLower.includes('examination date') ||
      textLower.includes('official date') ||
      textLower.includes('notification date') ||
      textLower.includes('admit card') ||
      textLower.includes('official website') ||
      textLower.includes('official portal') ||
      textLower.includes('when is upsc') ||
      textLower.includes('when is gate') ||
      textLower.includes('when is cat') ||
      textLower.includes('current affairs') ||
      textLower.includes('official notification')
    ) {
      return {
        type: 'CURRENT_AFFAIRS_OFFICIAL',
        confidence: 0.92,
        isFollowUp,
        needsDocumentRetrieval: false,
        needsToolExecution: false,
        parameters: { query: userText }
      };
    }

    // 11. Step-by-Step Problem Solving & Programming Code (Type B)
    if (
      textLower.includes('with code') ||
      textLower.includes('in python') ||
      textLower.includes('in c++') ||
      textLower.includes('in java') ||
      textLower.includes('step by step') ||
      textLower.includes('dsa problem') ||
      textLower.includes('solve this dsa') ||
      textLower.includes('binary search') ||
      textLower.includes('time complexity') ||
      textLower.includes('space complexity') ||
      textLower.includes('algorithm') ||
      textLower.includes('quantitative aptitude') ||
      textLower.includes('quant problem') ||
      textLower.includes('recursion') ||
      textLower.includes('recursive') ||
      textLower.includes('problem step by step')
    ) {
      return {
        type: 'PROBLEM_SOLVING_CODE',
        confidence: 0.92,
        isFollowUp,
        needsDocumentRetrieval: false,
        needsToolExecution: false,
        parameters: { query: userText }
      };
    }

    // 12. Explicit Exam-Specific Questions & Strategy (Type C)
    // Only when user explicitly mentions an exam keyword
    if (
      textLower.includes('upsc') ||
      textLower.includes('gate cs') ||
      textLower.includes('gate exam') ||
      textLower.includes('cat preparation') ||
      textLower.includes('cat exam') ||
      textLower.includes('ssc cgl') ||
      textLower.includes('banking exam') ||
      textLower.includes('syllabus for') ||
      textLower.includes('for upsc preparation') ||
      textLower.includes('for gate preparation') ||
      textLower.includes('for cat preparation')
    ) {
      return {
        type: 'EXAM_SPECIFIC',
        confidence: 0.91,
        isFollowUp,
        needsDocumentRetrieval: false,
        needsToolExecution: false,
        parameters: { query: userText }
      };
    }

    // 13. Academic Tutoring (Concepts: DBMS, OS, Deadlock, TCP/UDP, Networks, Data Structures)
    if (
      textLower.includes('normalization') ||
      textLower.includes('dbms') ||
      textLower.includes('database') ||
      textLower.includes('deadlock') ||
      textLower.includes('operating system') ||
      textLower.includes('process vs thread') ||
      textLower.includes('virtual memory') ||
      textLower.includes('paging') ||
      textLower.includes('tcp') ||
      textLower.includes('udp') ||
      textLower.includes('osi model') ||
      textLower.includes('router') ||
      textLower.includes('routing') ||
      textLower.includes('subnet') ||
      textLower.includes('dns') ||
      textLower.includes('http') ||
      textLower.includes('compiler') ||
      textLower.includes('computer networks')
    ) {
      return {
        type: 'GENERAL_ACADEMIC',
        confidence: 0.90,
        isFollowUp,
        needsDocumentRetrieval: false,
        needsToolExecution: false,
        parameters: { query: userText }
      };
    }

    // 14. General Inquiries (who are you, what can you do, help)
    if (
      textLower === 'help' ||
      textLower.includes('who are you') ||
      textLower.includes('what can you do')
    ) {
      return {
        type: 'GENERAL_INQUIRY',
        confidence: 0.95,
        isFollowUp: false,
        needsDocumentRetrieval: false,
        needsToolExecution: false,
        parameters: {}
      };
    }

    // 15. General Conversation and Direct Answers (Fallback for everyday/factual questions)
    return {
      type: 'GENERAL_CONVERSATION',
      confidence: 0.85,
      isFollowUp,
      needsDocumentRetrieval: false,
      needsToolExecution: false,
      parameters: { query: userText }
    };
  }

  /**
   * Helper to identify pure arithmetic or calculation questions
   */
  private static isArithmeticQuery(textLower: string): boolean {
    const cleaned = textLower
      .replace(/^(give me only the (final )?answer:?|just the answer:?|only the answer:?|what is|calculate|solve|evaluate|compute|\?|\s)+/gi, '')
      .replace(/[\?\.!]+$/g, '')
      .replace(/[x×*]/gi, '*')
      .replace(/÷/g, '/')
      .trim();

    if (/^sqrt\s*\(\s*\d+(?:\.\d+)?\s*\)$/i.test(cleaned)) {
      return true;
    }

    // Check if it's composed of digits and operators
    if (/^[0-9\s\+\-\*\/\^\%\(\)\.]+$/.test(cleaned) && /\d/.test(cleaned)) {
      // Must have at least one operator to be an arithmetic calculation
      return /[\+\-\*\/\^\%]/.test(cleaned);
    }

    return false;
  }

  /**
   * Helper to detect follow-up conversation turns
   */
  private static detectFollowUp(textLower: string, history: Array<{ role: string; content: string }>): boolean {
    if (history.length === 0) return false;
    const hasPriorAssistantTurn = history.some(m => m.role === 'assistant');
    if (!hasPriorAssistantTurn) return false;

    const followUpPhrases = [
      'another question about that',
      'about that explanation',
      'explain that further',
      'give an example of that',
      'what about in java',
      'what about in python',
      'in c++',
      'can you clarify',
      'more details',
      'and why',
      'what about that',
      'only the final answer',
      'just the answer',
      'final answer only',
      "don't understand",
      'dont understand',
      'explain that differently',
      'explain differently',
      'simpler',
      'simplify'
    ];

    if (followUpPhrases.some(p => textLower.includes(p))) return true;

    // Pronouns referring to previous turn
    if (textLower.startsWith('it') || textLower.startsWith('that') || textLower.startsWith('and how')) return true;

    return false;
  }

  /**
   * Helper to extract clean topic string from quiz queries
   */
  private static extractTopicFromQuizQuery(text: string): string {
    const cleaned = text
      .replace(/\b(create|generate|five|ten|\d+|practice|quiz|questions|test|on|about|a|an|the|for|with explanations)\b/gi, '')
      .replace(/[?.!]/g, '')
      .trim();

    return cleaned || 'Computer Networks';
  }
}
