import { db } from '../database/db.js';
import { QuizItem, QuizQuestion, QuizAttempt } from '../../../shared/src/types.js';
import { DocumentService } from './documentService.js';
import { ActivityService } from './activityService.js';
import crypto from 'node:crypto';

export class QuizService {
  /**
   * Pre-defined intelligent question generator based on networking topics & documents
   */
  static getTopicQuestions(topic: string, count = 10, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Omit<QuizQuestion, 'id' | 'quiz_id'>[] {
    const questionBank: Omit<QuizQuestion, 'id' | 'quiz_id'>[] = [
      {
        question: 'Which OSI model layer is responsible for logical addressing (IP) and packet routing?',
        options: [
          'Data Link Layer (Layer 2)',
          'Network Layer (Layer 3)',
          'Transport Layer (Layer 4)',
          'Session Layer (Layer 5)'
        ],
        correct_option_index: 1,
        explanation: 'The Network Layer (Layer 3) handles logical IP addressing, routing algorithms (OSPF, BGP), and packet forwarding across interconnected networks.'
      },
      {
        question: 'What is the correct sequence of packets in the TCP Three-Way Handshake connection establishment?',
        options: [
          'SYN -> ACK -> SYN-ACK',
          'ACK -> SYN -> DATA',
          'SYN -> SYN-ACK -> ACK',
          'FIN -> ACK -> FIN-ACK'
        ],
        correct_option_index: 2,
        explanation: 'TCP establishes a reliable bidirectional connection through SYN (synchronize), SYN-ACK (synchronize-acknowledge), and ACK (acknowledge).'
      },
      {
        question: 'Which transport layer protocol is connectionless, minimizes latency, and is preferred for real-time VoIP and DNS lookups?',
        options: [
          'Transmission Control Protocol (TCP)',
          'User Datagram Protocol (UDP)',
          'Internet Control Message Protocol (ICMP)',
          'Border Gateway Protocol (BGP)'
        ],
        correct_option_index: 1,
        explanation: 'UDP provides lightweight, connectionless transmission without delivery acknowledgments, eliminating overhead for latency-sensitive applications.'
      },
      {
        question: 'What is the primary role of the Address Resolution Protocol (ARP)?',
        options: [
          'Translating domain names into 32-bit IP addresses',
          'Resolving 32-bit IPv4 addresses into 48-bit Ethernet MAC addresses',
          'Assigning dynamic IP addresses to new network hosts',
          'Encrypting transport payload via TLS 1.3'
        ],
        correct_option_index: 1,
        explanation: 'ARP operates between the Data Link and Network layers to map known IPv4 addresses to local hardware MAC addresses.'
      },
      {
        question: 'In IPv4 CIDR subnetting, how many usable host addresses are provided by a /24 subnet mask (255.255.255.0)?',
        options: [
          '256 usable hosts',
          '254 usable hosts (excluding Network ID and Broadcast address)',
          '128 usable hosts',
          '512 usable hosts'
        ],
        correct_option_index: 1,
        explanation: 'A /24 subnet has 2^(32-24) = 256 total addresses. Reserving 1 for the network address and 1 for the broadcast address yields 254 usable host addresses.'
      },
      {
        question: 'Which routing protocol is a Link-State protocol that utilizes Dijkstra\'s algorithm to compute shortest paths within an autonomous system?',
        options: [
          'Routing Information Protocol (RIP)',
          'Open Shortest Path First (OSPF)',
          'Border Gateway Protocol (BGP)',
          'Address Resolution Protocol (ARP)'
        ],
        correct_option_index: 1,
        explanation: 'OSPF is an Interior Gateway Protocol (IGP) based on link-state advertisements and Dijkstra\'s algorithm to prevent loops and converge quickly.'
      },
      {
        question: 'What are the four phases of dynamic host configuration in the DHCP protocol (DORA)?',
        options: [
          'Direct, Open, Route, Allocate',
          'Discover, Offer, Request, Acknowledge',
          'Dial, Obtain, Register, Authorize',
          'Disconnect, Operate, Rebind, Assign'
        ],
        correct_option_index: 1,
        explanation: 'DHCP uses the DORA four-way exchange: Discover (client broadcast), Offer (server response), Request (client selection), and Acknowledge (server confirmation).'
      },
      {
        question: 'What mechanism does TCP employ to prevent a sender from overwhelming the receiver\'s buffer capacity?',
        options: [
          'Sliding Window Flow Control',
          'Dijkstra\'s Shortest Path First',
          'CSMA/CD Collision Detection',
          'BGP Autonomous System Path Prepending'
        ],
        correct_option_index: 0,
        explanation: 'The TCP sliding window flow control mechanism advertises the receiver\'s available buffer space (receive window) in ACK headers.'
      },
      {
        question: 'Which cryptographic approach does HTTPS/TLS 1.3 use during connection security?',
        options: [
          'Purely symmetric encryption for everything including key exchange',
          'Asymmetric cryptography for key exchange/authentication, and fast symmetric encryption for session data',
          'Unencrypted plaintext with MD5 hash checksums',
          'Purely asymmetric RSA encryption for entire 1GB payload streams'
        ],
        correct_option_index: 1,
        explanation: 'TLS uses asymmetric public-key cryptography (ECDHE/RSA) to securely authenticate and agree on session keys, then switches to high-speed symmetric ciphers (AES-GCM/ChaCha20) for payload encryption.'
      },
      {
        question: 'Which protocol operates on the global Internet backbone as a path-vector Exterior Gateway Protocol (EGP) connecting Autonomous Systems?',
        options: [
          'Border Gateway Protocol (BGP)',
          'Routing Information Protocol (RIP)',
          'Dynamic Host Configuration Protocol (DHCP)',
          'Simple Network Management Protocol (SNMP)'
        ],
        correct_option_index: 0,
        explanation: 'BGP is the core routing protocol of the global Internet, exchanging reachability and Autonomous System paths between independent network operators.'
      }
    ];

    return questionBank.slice(0, Math.min(count, questionBank.length));
  }

  static createQuiz(params: {
    topic_or_doc_id: string;
    count?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
  }): QuizItem {
    const count = params.count || 10;
    const difficulty = params.difficulty || 'medium';
    let topicName = params.topic_or_doc_id;
    let docId: string | null = null;

    // Check if input is a document ID
    const doc = DocumentService.getDocumentById(params.topic_or_doc_id);
    if (doc) {
      docId = doc.id;
      topicName = doc.filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
    }

    const quizId = crypto.randomUUID();
    const now = new Date().toISOString();
    const quizTitle = `${topicName} Mastery Quiz (${difficulty.toUpperCase()})`;

    // Generate questions
    const generatedQuestions = this.getTopicQuestions(topicName, count, difficulty);

    // Insert Quiz
    const insertQuiz = db.prepare(`
      INSERT INTO quizzes (id, title, topic, difficulty, question_count, document_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertQuiz.run(quizId, quizTitle, topicName, difficulty, generatedQuestions.length, docId, now);

    // Insert Questions
    const insertQuestion = db.prepare(`
      INSERT INTO quiz_questions (id, quiz_id, question, options, correct_option_index, explanation)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const fullQuestions: QuizQuestion[] = [];
    for (const q of generatedQuestions) {
      const qId = crypto.randomUUID();
      insertQuestion.run(qId, quizId, q.question, JSON.stringify(q.options), q.correct_option_index, q.explanation);
      fullQuestions.push({
        id: qId,
        quiz_id: quizId,
        question: q.question,
        options: q.options,
        correct_option_index: q.correct_option_index,
        explanation: q.explanation
      });
    }

    ActivityService.logEvent(
      'tool_execution',
      `Quiz created: ${quizTitle}`,
      `Generated a ${fullQuestions.length}-question assessment for "${topicName}".`,
      { quizId, questionCount: fullQuestions.length }
    );

    return {
      id: quizId,
      title: quizTitle,
      topic: topicName,
      difficulty,
      question_count: fullQuestions.length,
      document_id: docId,
      created_at: now,
      questions: fullQuestions
    };
  }

  static getQuizById(id: string): QuizItem | null {
    const stmt = db.prepare('SELECT * FROM quizzes WHERE id = ?');
    const q = stmt.get(id) as any;
    if (!q) return null;

    const qStmt = db.prepare('SELECT * FROM quiz_questions WHERE quiz_id = ?');
    const questions = qStmt.all(id) as any[];

    return {
      id: q.id,
      title: q.title,
      topic: q.topic,
      difficulty: q.difficulty,
      question_count: q.question_count,
      document_id: q.document_id,
      created_at: q.created_at,
      questions: questions.map(qu => ({
        id: qu.id,
        quiz_id: qu.quiz_id,
        question: qu.question,
        options: JSON.parse(qu.options),
        correct_option_index: qu.correct_option_index,
        explanation: qu.explanation
      }))
    };
  }

  static listQuizzes(): QuizItem[] {
    const stmt = db.prepare('SELECT * FROM quizzes ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map(r => ({
      id: r.id,
      title: r.title,
      topic: r.topic,
      difficulty: r.difficulty,
      question_count: r.question_count,
      document_id: r.document_id,
      created_at: r.created_at
    }));
  }

  static submitQuizAnswers(quizId: string, submittedAnswers: Record<string, number>): {
    attempt: QuizAttempt;
    details: Array<{
      question_id: string;
      question: string;
      selected_index: number;
      correct_index: number;
      is_correct: boolean;
      explanation: string;
    }>;
  } {
    const quiz = this.getQuizById(quizId);
    if (!quiz || !quiz.questions) {
      throw new Error(`Quiz with id ${quizId} not found.`);
    }

    let score = 0;
    const details = quiz.questions.map(q => {
      const selected = submittedAnswers[q.id] !== undefined ? submittedAnswers[q.id] : -1;
      const isCorrect = selected === q.correct_option_index;
      if (isCorrect) score++;

      return {
        question_id: q.id,
        question: q.question,
        selected_index: selected,
        correct_index: q.correct_option_index,
        is_correct: isCorrect,
        explanation: q.explanation
      };
    });

    const total = quiz.questions.length;
    const percentage = Math.round((score / total) * 100);
    const attemptId = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertAttempt = db.prepare(`
      INSERT INTO quiz_attempts (id, quiz_id, score, total_questions, percentage, answers, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertAttempt.run(attemptId, quizId, score, total, percentage, JSON.stringify(submittedAnswers), now);

    const attempt: QuizAttempt = {
      id: attemptId,
      quiz_id: quizId,
      quiz_title: quiz.title,
      score,
      total_questions: total,
      percentage,
      answers: submittedAnswers,
      completed_at: now
    };

    ActivityService.logEvent(
      'quiz_taken',
      `Quiz completed: ${quiz.title}`,
      `Scored ${score}/${total} (${percentage}%) on ${quiz.title}`,
      { quizId, score, percentage, attemptId }
    );

    return { attempt, details };
  }

  static getQuizAttempts(quizId?: string): QuizAttempt[] {
    let sql = `
      SELECT a.*, q.title as quiz_title
      FROM quiz_attempts a
      JOIN quizzes q ON q.id = a.quiz_id
    `;
    const params: any[] = [];
    if (quizId) {
      sql += ' WHERE a.quiz_id = ?';
      params.push(quizId);
    }
    sql += ' ORDER BY a.completed_at DESC';

    const rows = db.prepare(sql).all(...params) as any[];
    return rows.map(r => ({
      id: r.id,
      quiz_id: r.quiz_id,
      quiz_title: r.quiz_title,
      score: r.score,
      total_questions: r.total_questions,
      percentage: r.percentage,
      answers: JSON.parse(r.answers),
      completed_at: r.completed_at
    }));
  }
}
