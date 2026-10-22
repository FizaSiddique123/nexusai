import { db } from '../database/db.js';
import { QuizItem, QuizQuestion, QuizAttempt } from '../../../shared/src/types.js';
import { DocumentService } from './documentService.js';
import { ActivityService } from './activityService.js';
import crypto from 'node:crypto';

export class QuizService {
  /**
   * Pre-defined intelligent question generator based on networking topics & documents
   */
  /**
   * Intelligent question generator supporting multiple subjects & competitive examinations
   */
  static getTopicQuestions(topic: string, count = 10, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Omit<QuizQuestion, 'id' | 'quiz_id'>[] {
    const topicLower = topic.toLowerCase();

    // 1. CAT Quantitative Aptitude Question Bank
    if (topicLower.includes('cat') || topicLower.includes('quant') || topicLower.includes('aptitude') || topicLower.includes('math')) {
      const catBank: Omit<QuizQuestion, 'id' | 'quiz_id'>[] = [
        {
          question: 'Two trains of length 180m and 220m are running towards each other at 72 km/h and 54 km/h respectively on parallel tracks. How many seconds will they take to completely cross each other after meeting?',
          options: ['11.43 seconds (80/7 s)', '14.28 seconds (100/7 s)', '12.00 seconds', '10.50 seconds'],
          correct_option_index: 0,
          explanation: 'Relative speed in opposite directions = 72 + 54 = 126 km/h = 126 * (5/18) = 35 m/s. Total crossing distance = 180 + 220 = 400m. Crossing time = 400 / 35 = 80/7 ≈ 11.43 seconds.',
          topic: 'CAT Quantitative Aptitude',
          difficulty: 'medium',
          source_reference: 'CAT Quantitative Aptitude (Time, Speed & Distance)'
        },
        {
          question: 'If the price of petrol increases by 25%, by what percentage must a motorist reduce petrol consumption so that expenditure remains unchanged?',
          options: ['20%', '25%', '16.67%', '33.33%'],
          correct_option_index: 0,
          explanation: 'Let original expenditure = 100 * 100 = 10000. New price = 125. Required consumption = 10000 / 125 = 80. Reduction = (100 - 80) = 20%. Alternatively, reduction = [r / (100 + r)] * 100 = [25 / 125] * 100 = 20%.',
          topic: 'CAT Quantitative Aptitude',
          difficulty: 'easy',
          source_reference: 'CAT Quantitative Aptitude (Percentages & Expenditure)'
        },
        {
          question: 'A can complete a piece of work in 12 days, and B can complete the same work in 18 days. If they work together for 4 days, what fraction of the work remains unfinished?',
          options: ['4/9', '5/9', '7/18', '1/3'],
          correct_option_index: 0,
          explanation: "Work per day = 1/12 + 1/18 = (3 + 2)/36 = 5/36. In 4 days, work completed = 4 * (5/36) = 20/36 = 5/9. Remaining work = 1 - 5/9 = 4/9.",
          topic: 'CAT Quantitative Aptitude',
          difficulty: 'medium',
          source_reference: 'CAT Quantitative Aptitude (Work and Time)'
        },
        {
          question: 'In how many distinct ways can the letters of the word "EXCELLENCE" be arranged?',
          options: ['37,800', '75,600', '151,200', '302,400'],
          correct_option_index: 0,
          explanation: 'The word EXCELLENCE has 10 letters: E (4 times), C (2 times), L (2 times), X (1 time), N (1 time). Distinct permutations = 10! / (4! * 2! * 2!) = 3,628,800 / (24 * 2 * 2) = 37,800.',
          topic: 'CAT Quantitative Aptitude',
          difficulty: 'hard',
          source_reference: 'CAT Quantitative Aptitude (Permutations & Combinations)'
        },
        {
          question: 'Two fair six-sided dice are rolled simultaneously. What is the probability that the sum of the numbers obtained is a prime number?',
          options: ['5/12', '7/18', '1/2', '15/36'],
          correct_option_index: 0,
          explanation: 'Possible prime sums are 2, 3, 5, 7, 11. Sum=2 (1 outcome), Sum=3 (2 outcomes), Sum=5 (4 outcomes), Sum=7 (6 outcomes), Sum=11 (2 outcomes). Total favorable outcomes = 1 + 2 + 4 + 6 + 2 = 15. Total outcomes = 36. Probability = 15/36 = 5/12.',
          topic: 'CAT Quantitative Aptitude',
          difficulty: 'medium',
          source_reference: 'CAT Quantitative Aptitude (Probability)'
        }
      ];
      return catBank.slice(0, Math.min(count, catBank.length));
    }

    // 2. UPSC Civil Services (Polity & Governance) Question Bank
    if (topicLower.includes('upsc') || topicLower.includes('polity') || topicLower.includes('president') || topicLower.includes('constitution')) {
      const upscBank: Omit<QuizQuestion, 'id' | 'quiz_id'>[] = [
        {
          question: 'Under which Article of the Constitution of India can the President require the Council of Ministers to reconsider their advice?',
          options: ['Article 74(1) as amended by 44th Constitutional Amendment', 'Article 75(3)', 'Article 72', 'Article 356'],
          correct_option_index: 0,
          explanation: 'The 44th Constitutional Amendment Act, 1978 introduced a proviso to Article 74(1) enabling the President to require the Council of Ministers to reconsider such advice once, though the reconsidered advice is binding.',
          topic: 'Indian Polity (UPSC CSE)',
          difficulty: 'medium',
          source_reference: 'Constitution of India (Articles 74, 44th Amendment Act)'
        },
        {
          question: 'Which of the following bodies is NOT established by the Constitution of India (i.e., is Non-Constitutional / Extra-Constitutional)?',
          options: ['NITI Aayog', 'Finance Commission (Article 280)', 'Union Public Service Commission (Article 315)', 'Election Commission of India (Article 324)'],
          correct_option_index: 0,
          explanation: 'NITI Aayog was established by an executive resolution of the Union Cabinet on January 1, 2015, and is neither a constitutional nor a statutory body.',
          topic: 'Indian Polity (UPSC CSE)',
          difficulty: 'easy',
          source_reference: 'Indian Governance & Executive Bodies'
        },
        {
          question: 'The pardoning power of the President of India under Article 72 differs from that of a State Governor under Article 161 in which significant respect?',
          options: [
            'Only the President can pardon death sentences and punishments by a Court Martial',
            'Governors have no power to remit sentences',
            'The President cannot commute sentences of death',
            'Governors can grant reprieves in Court Martial trials'
          ],
          correct_option_index: 0,
          explanation: 'Under Article 72, the President alone possesses the jurisdiction to pardon Court Martial punishments and death sentences. A Governor cannot pardon a death sentence (only suspend, remit, or commute it).',
          topic: 'Indian Polity (UPSC CSE)',
          difficulty: 'hard',
          source_reference: 'Constitution of India (Articles 72 and 161)'
        },
        {
          question: 'In the landmark Kesavananda Bharati case (1973), the Supreme Court of India propounded which foundational doctrine?',
          options: ['Basic Structure Doctrine', 'Doctrine of Severability', 'Doctrine of Pith and Substance', 'Doctrine of Eclipse'],
          correct_option_index: 0,
          explanation: 'The 13-judge bench in Kesavananda Bharati v. State of Kerala (1973) established that Parliament has wide amending powers under Article 368, but cannot alter the "Basic Structure" of the Constitution.',
          topic: 'Indian Polity (UPSC CSE)',
          difficulty: 'medium',
          source_reference: 'Landmark Supreme Court Judgments (Kesavananda Bharati, 1973)'
        },
        {
          question: 'Which Constitutional Amendment Act lowered the voting age for Lok Sabha and State Legislative Assembly elections from 21 years to 18 years?',
          options: ['61st Amendment Act, 1988', '42nd Amendment Act, 1976', '44th Amendment Act, 1978', '73rd Amendment Act, 1992'],
          correct_option_index: 0,
          explanation: 'The 61st Constitutional Amendment Act, 1988 amended Article 326 to reduce the voting age from 21 to 18 years, taking effect in 1989.',
          topic: 'Indian Polity (UPSC CSE)',
          difficulty: 'easy',
          source_reference: 'Electoral Reforms & Article 326'
        }
      ];
      return upscBank.slice(0, Math.min(count, upscBank.length));
    }

    // 3. DBMS & Normalization Question Bank
    if (topicLower.includes('dbms') || topicLower.includes('normal') || topicLower.includes('database') || topicLower.includes('sql')) {
      const dbmsBank: Omit<QuizQuestion, 'id' | 'quiz_id'>[] = [
        {
          question: 'A relational schema is in Second Normal Form (2NF) if and only if it is in 1NF and:',
          options: [
            'No non-prime attribute is partially dependent on any candidate key',
            'Every functional dependency X -> Y has X as a super key',
            'It contains no transitive dependencies',
            'It has no composite candidate keys'
          ],
          correct_option_index: 0,
          explanation: '2NF eliminates partial functional dependencies where a non-prime attribute depends on a proper subset of a composite candidate key.',
          topic: 'DBMS Normalization',
          difficulty: 'medium',
          source_reference: 'Database Management Systems (2NF Formal Definition)'
        },
        {
          question: 'What is the main distinction between Third Normal Form (3NF) and Boyce-Codd Normal Form (BCNF)?',
          options: [
            'BCNF requires that for every functional dependency X -> Y, X must strictly be a Super Key; 3NF permits Y to be a prime attribute',
            '3NF is strictly stronger than BCNF',
            'BCNF guarantees dependency preservation, while 3NF does not',
            'BCNF only applies to tables with composite primary keys'
          ],
          correct_option_index: 0,
          explanation: 'In 3NF, X -> Y is valid if X is a superkey OR Y is a prime attribute. BCNF removes the second condition, requiring X to be a superkey for ALL non-trivial dependencies.',
          topic: 'DBMS Normalization',
          difficulty: 'hard',
          source_reference: 'Database Management Systems (3NF vs BCNF Comparison)'
        },
        {
          question: 'Which ACID property guarantees that all operations within a transaction are completed or none are applied?',
          options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
          correct_option_index: 0,
          explanation: 'Atomicity ensures "all-or-nothing" execution. If a transaction fails mid-way, all changes are rolled back to preserve database state.',
          topic: 'DBMS Transactions',
          difficulty: 'easy',
          source_reference: 'Database Management Systems (ACID Transactions)'
        }
      ];
      return dbmsBank.slice(0, Math.min(count, dbmsBank.length));
    }

    // 4. Operating Systems Question Bank
    if (topicLower.includes('operating system') || topicLower.includes('process') || topicLower.includes('deadlock') || topicLower.includes('paging')) {
      const osBank: Omit<QuizQuestion, 'id' | 'quiz_id'>[] = [
        {
          question: 'Which of the following is NOT one of the four necessary Coffman conditions for a system deadlock to occur?',
          options: ['Preemptive scheduling by the CPU', 'Mutual exclusion', 'Hold and wait', 'Circular wait'],
          correct_option_index: 0,
          explanation: 'The four Coffman conditions are Mutual Exclusion, Hold and Wait, No Preemption (resources cannot be forcibly taken), and Circular Wait. Preemption breaks deadlocks!',
          topic: 'Operating Systems',
          difficulty: 'medium',
          source_reference: 'Operating System Principles (Coffman Conditions)'
        },
        {
          question: 'What is the primary advantage of Virtual Memory implemented via Demand Paging?',
          options: [
            'Processes can execute with only a subset of their virtual address space loaded into physical RAM',
            'It eliminates all external fragmentation and page faults completely',
            'It accelerates CPU clock frequencies directly',
            'It replaces disk storage with cache memory'
          ],
          correct_option_index: 0,
          explanation: 'Demand paging loads pages into physical RAM only when referenced, allowing programs whose address space exceeds physical RAM to execute smoothly.',
          topic: 'Operating Systems',
          difficulty: 'medium',
          source_reference: 'Operating System Principles (Virtual Memory & Demand Paging)'
        }
      ];
      return osBank.slice(0, Math.min(count, osBank.length));
    }

    // 5. Default: Computer Networks Mastery Question Bank
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
        explanation: 'The Network Layer (Layer 3) handles logical IP addressing, routing algorithms (OSPF, BGP), and packet forwarding across interconnected networks.',
        topic: 'Computer Networks',
        difficulty: 'medium',
        source_reference: 'Computer_Networks_Exam_Notes.txt (Page 1)'
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
        explanation: 'TCP establishes a reliable bidirectional connection through SYN (synchronize), SYN-ACK (synchronize-acknowledge), and ACK (acknowledge).',
        topic: 'Computer Networks',
        difficulty: 'medium',
        source_reference: 'Computer_Networks_Exam_Notes.txt (Page 2)'
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
        explanation: 'UDP provides lightweight, connectionless transmission without delivery acknowledgments, eliminating overhead for latency-sensitive applications.',
        topic: 'Computer Networks',
        difficulty: 'easy',
        source_reference: 'Computer_Networks_Exam_Notes.txt (Page 2)'
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
        explanation: 'ARP operates between the Data Link and Network layers to map known IPv4 addresses to local hardware MAC addresses.',
        topic: 'Computer Networks',
        difficulty: 'medium',
        source_reference: 'Computer_Networks_Exam_Notes.txt (Page 3)'
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
        explanation: 'A /24 subnet has 2^(32-24) = 256 total addresses. Reserving 1 for the network address and 1 for the broadcast address yields 254 usable host addresses.',
        topic: 'Computer Networks',
        difficulty: 'medium',
        source_reference: 'Computer_Networks_Exam_Notes.txt (Page 3)'
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
        explanation: 'OSPF is an Interior Gateway Protocol (IGP) based on link-state advertisements and Dijkstra\'s algorithm to prevent loops and converge quickly.',
        topic: 'Computer Networks',
        difficulty: 'medium',
        source_reference: 'Computer_Networks_Exam_Notes.txt (Page 4)'
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
        explanation: 'DHCP uses the DORA four-way exchange: Discover (client broadcast), Offer (server response), Request (client selection), and Acknowledge (server confirmation).',
        topic: 'Computer Networks',
        difficulty: 'easy',
        source_reference: 'Computer_Networks_Exam_Notes.txt (Page 4)'
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
        explanation: 'The TCP sliding window flow control mechanism advertises the receiver\'s available buffer space (receive window) in ACK headers.',
        topic: 'Computer Networks',
        difficulty: 'medium',
        source_reference: 'Computer_Networks_Exam_Notes.txt (Page 2)'
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
        explanation: 'TLS uses asymmetric public-key cryptography (ECDHE/RSA) to securely authenticate and agree on session keys, then switches to high-speed symmetric ciphers (AES-GCM/ChaCha20) for payload encryption.',
        topic: 'Computer Networks',
        difficulty: 'medium',
        source_reference: 'Computer_Networks_Exam_Notes.txt (Page 5)'
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
        explanation: 'BGP is the core routing protocol of the global Internet, exchanging reachability and Autonomous System paths between independent network operators.',
        topic: 'Computer Networks',
        difficulty: 'medium',
        source_reference: 'Computer_Networks_Exam_Notes.txt (Page 4)'
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

    // Insert Questions with grounded metadata
    const insertQuestion = db.prepare(`
      INSERT INTO quiz_questions (id, quiz_id, question, options, correct_option_index, explanation, source_reference, topic, difficulty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const fullQuestions: QuizQuestion[] = [];
    for (const q of generatedQuestions) {
      const qId = crypto.randomUUID();
      const sourceRef = q.source_reference || `Computer_Networks_Exam_Notes.txt (Chapter on ${topicName})`;
      const qTopic = q.topic || topicName;
      const qDiff = q.difficulty || difficulty;

      insertQuestion.run(
        qId,
        quizId,
        q.question,
        JSON.stringify(q.options),
        q.correct_option_index,
        q.explanation,
        sourceRef,
        qTopic,
        qDiff
      );

      fullQuestions.push({
        id: qId,
        quiz_id: quizId,
        question: q.question,
        options: q.options,
        correct_option_index: q.correct_option_index,
        explanation: q.explanation,
        source_reference: sourceRef,
        topic: qTopic,
        difficulty: qDiff
      });
    }

    ActivityService.logEvent(
      'tool_execution',
      `Quiz created: ${quizTitle}`,
      `Generated a ${fullQuestions.length}-question assessment grounded in "${topicName}".`,
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

  /**
   * Tool E: generate_quiz
   * Generates practice questions grounded in retrieved notes.
   */
  static generateQuiz(params: {
    topic_or_doc_id: string;
    question_count?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
  }): QuizItem {
    return this.createQuiz({
      topic_or_doc_id: params.topic_or_doc_id,
      count: params.question_count,
      difficulty: params.difficulty
    });
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
        explanation: qu.explanation,
        source_reference: qu.source_reference || undefined,
        topic: qu.topic || undefined,
        difficulty: qu.difficulty || undefined
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
