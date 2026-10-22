export type IntentType =
  | 'MULTI_TOOL_WORKFLOW'
  | 'APPROVE_SCHEDULE'
  | 'GENERAL_ACADEMIC'         // A
  | 'PROBLEM_SOLVING_CODE'     // B
  | 'EXAM_SPECIFIC'            // C
  | 'DOCUMENT_GROUNDED_NOTES'  // D
  | 'CURRENT_AFFAIRS_OFFICIAL' // E
  | 'STUDY_PLAN_SCHEDULING'    // F
  | 'QUIZ_GENERATION'          // G
  | 'PERFORMANCE_ANALYSIS'     // H
  | 'INTERVIEW_PREPARATION'    // New AI Interview Coach
  | 'GENERAL_INQUIRY';         // I

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

    // 2. Check if this is a follow-up query referencing prior context
    const isFollowUp = this.detectFollowUp(textLower, recentHistory);

    // 2b. Interview Preparation (Placement & Mock Interviews)
    if (
      textLower.includes('mock interview') ||
      textLower.includes('interview prep') ||
      textLower.includes('interview me') ||
      textLower.includes('practice interview') ||
      textLower.includes('behavioral interview') ||
      textLower.includes('technical interview') ||
      textLower.includes('hr interview') ||
      textLower.includes('star method') ||
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

    // 3. Performance Analysis (Type H)
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

    // 4. Current Affairs & Official Examination Info (Type E)
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

    // 5. Quiz & Mock Test Generation (Type G)
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

    // 6. Study Plan Creation & Scheduling (Type F)
    if (
      (textLower.includes('plan') && (textLower.includes('revision') || textLower.includes('study') || textLower.includes('gate') || textLower.includes('exam'))) ||
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

    // 7. Explicit Notes Grounding (Type D)
    const mentionsNotesExplicitly =
      textLower.includes('my note') ||
      textLower.includes('uploaded note') ||
      textLower.includes('in my notes') ||
      textLower.includes('from my notes') ||
      textLower.includes('uploaded document') ||
      textLower.includes('according to my notes');

    if (mentionsNotesExplicitly) {
      const cleanTopic = userText.replace(/according to|in my notes|from my notes|my notes|uploaded notes|notes|what do|explain/gi, '').trim();
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

    // 8. Step-by-Step Problem Solving & Programming Code (Type B)
    if (
      textLower.includes('with code') ||
      textLower.includes('in python') ||
      textLower.includes('in c++') ||
      textLower.includes('in java') ||
      textLower.includes('step by step') ||
      textLower.includes('solve') ||
      textLower.includes('calculate') ||
      textLower.includes('binary search') ||
      textLower.includes('time complexity') ||
      textLower.includes('space complexity') ||
      textLower.includes('algorithm') ||
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

    // 9. Exam-Specific Questions & Strategy (Type C)
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

    // 10. General Inquiries / Greetings (Type I)
    if (
      textLower === 'hi' ||
      textLower === 'hello' ||
      textLower === 'hey' ||
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

    // 11. General Academic Question (Type A - Default Fallback for conceptual questions)
    // E.g., "What is normalization in DBMS?", "What is an operating system?", "Explain TCP vs UDP", etc.
    return {
      type: 'GENERAL_ACADEMIC',
      confidence: 0.88,
      isFollowUp,
      needsDocumentRetrieval: false,
      needsToolExecution: false,
      parameters: { query: userText }
    };
  }

  /**
   * Helper to detect follow-up conversation turns
   */
  private static detectFollowUp(textLower: string, history: Array<{ role: string; content: string }>): boolean {
    if (history.length === 0) return false;

    const followUpPhrases = [
      'another question about that',
      'about that explanation',
      'explain that further',
      'give an example of that',
      'what about in java',
      'what about in python',
      'can you clarify',
      'more details',
      'and why',
      'what about that'
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
