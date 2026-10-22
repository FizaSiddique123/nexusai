export interface ExamProfile {
  id: string;
  name: string;
  category: 'university' | 'competitive';
  targetLevel: string;
  subjects: string[];
  syllabusTopics: string[];
  questionFormats: string[];
  difficultyScale: 'Standard' | 'Challenging' | 'Advanced';
  officialReferenceUrl: string;
  officialAuthority: string;
  scoringRules: string;
  preparationStrategy: string;
  disclaimer: string;
}

export class ExamProfileService {
  private static profiles: Record<string, ExamProfile> = {
    'gate-cs': {
      id: 'gate-cs',
      name: 'GATE (Computer Science & Information Technology)',
      category: 'competitive',
      targetLevel: 'Postgraduate Admissions & PSU Recruitments',
      subjects: [
        'Engineering Mathematics & Discrete Math',
        'Digital Logic & Computer Organization',
        'Data Structures & Algorithms',
        'Theory of Computation & Compiler Design',
        'Operating Systems',
        'Databases (DBMS)',
        'Computer Networks',
        'General Aptitude'
      ],
      syllabusTopics: [
        'Relational Algebra, SQL, Normalization (1NF to BCNF), Transactions & Concurrency (Serializability, 2PL)',
        'Process Management, CPU Scheduling, Synchronization (Semaphores), Deadlocks, Memory Management (Paging, Virtual Memory)',
        'OSI & TCP/IP stacks, IPv4 Subnetting, Routing (Distance Vector, Link State), TCP Congestion Control, DNS/HTTP',
        'Asymptotic Notations, Recurrences, Sorting, Graph Traversals (BFS, DFS), Dynamic Programming, Greedy',
        'DFA, NFA, Regular Expressions, Context-Free Grammars, Turing Machines, Decidability',
        'Boolean Algebra, Combinational/Sequential Circuits, Pipeline Hazards, Cache Memory Mapping'
      ],
      questionFormats: ['Multiple Choice Questions (MCQ)', 'Multiple Select Questions (MSQ)', 'Numerical Answer Type (NAT)'],
      difficultyScale: 'Advanced',
      officialReferenceUrl: 'https://gate2026.iitg.ac.in',
      officialAuthority: 'Organizing IIT / Indian Institute of Science (IISc)',
      scoringRules: 'MCQs have 1/3 negative marking for 1-mark questions and 2/3 for 2-mark questions. MSQ and NAT have NO negative marking.',
      preparationStrategy: 'Prioritize conceptual clarity and high-weightage topics: DSA (15%), OS (8-10%), DBMS (7-9%), Networks (8-10%), and Engineering Math + Aptitude (28%). Practice previous years questions (PYQs) extensively.',
      disclaimer: 'Official syllabus and organizing institute rotate annually. Verify details on the official organizing IIT portal.'
    },

    'upsc-cse': {
      id: 'upsc-cse',
      name: 'UPSC Civil Services Examination (IAS / IPS / IFS)',
      category: 'competitive',
      targetLevel: 'Union Civil Services of India',
      subjects: [
        'General Studies I (History, Art & Culture, Geography, Society)',
        'General Studies II (Polity, Governance, Constitution, Social Justice, IR)',
        'General Studies III (Economy, Science & Tech, Environment, Internal Security, Disaster Mgmt)',
        'General Studies IV (Ethics, Integrity, and Aptitude)',
        'CSAT (Civil Services Aptitude Test - Paper II)',
        'Essay Paper & Optional Subjects'
      ],
      syllabusTopics: [
        'Indian Constitution, Historical Underpinnings, Fundamental Rights, DPSP, Parliament & State Legislatures',
        'Executive: President of India, Prime Minister, Cabinet, Governor, Emergency Provisions',
        'Judiciary: Supreme Court, Judicial Review, Judicial Activism, Basic Structure Doctrine',
        'Indian Economy: Monetary & Fiscal Policy, Inflation, Budgeting, Inclusive Growth, Banking Reforms',
        'Environment & Ecology: Biodiversity, Climate Change conventions (UNFCCC, COP), Protected Areas',
        'Current Events of National and International Importance'
      ],
      questionFormats: ['Objective Prelims (MCQs with 0.33 negative marking)', 'Subjective Mains Descriptive Essays & Answers', 'Personality Test (Interview)'],
      difficultyScale: 'Challenging',
      officialReferenceUrl: 'https://upsc.gov.in',
      officialAuthority: 'Union Public Service Commission (UPSC)',
      scoringRules: 'Prelims GS-I decides cutoff; CSAT requires 33% qualifying mark. Mains (1750 marks) + Interview (275 marks) determine final merit.',
      preparationStrategy: 'Interlink static concepts with contemporary governance issues. Use Article numbers, constitutional landmark judgments, Supreme Court precedents, and data from authentic government reports (Economic Survey, NITI Aayog).',
      disclaimer: 'Examination calendar and official notifications are issued by UPSC at upsc.gov.in. Verify notification dates directly on the commission portal.'
    },

    'cat-mba': {
      id: 'cat-mba',
      name: 'CAT (Common Admission Test for IIMs & Top B-Schools)',
      category: 'competitive',
      targetLevel: 'MBA Admissions (IIMs & Top Management Institutes)',
      subjects: [
        'Quantitative Aptitude (QA)',
        'Data Interpretation & Logical Reasoning (DILR)',
        'Verbal Ability & Reading Comprehension (VARC)'
      ],
      syllabusTopics: [
        'Arithmetic: Percentages, Profit & Loss, Simple/Compound Interest, Time Speed Distance, Time & Work, Averages & Mixtures',
        'Algebra: Linear/Quadratic Equations, Functions, Logarithms, Progressions (AP/GP), Inequalities',
        'Geometry & Mensuration: Triangles, Circles, Coordinate Geometry, Trigonometry',
        'Modern Math: Permutations & Combinations, Probability, Set Theory',
        'DILR: Tables, Bar/Pie Charts, Route Networks, Matrix arrangements, Tournaments, Games',
        'VARC: Reading Comprehension passages, Para Jumbles, Para Summary, Sentence Completion'
      ],
      questionFormats: ['Multiple Choice Questions (MCQs)', 'Type In The Answer (TITA) Non-MCQ'],
      difficultyScale: 'Challenging',
      officialReferenceUrl: 'https://iimcat.ac.in',
      officialAuthority: 'Indian Institutes of Management (IIMs)',
      scoringRules: '+3 for correct answer, -1 for incorrect MCQ. Zero penalty for incorrect TITA questions.',
      preparationStrategy: 'Master mental arithmetic and fast elimination techniques. Focus on question selection accuracy rather than attempting all questions.',
      disclaimer: 'CAT convenor IIM changes each year. Consult iimcat.ac.in for authoritative eligibility, application dates, and scoring updates.'
    },

    'ssc-cgl': {
      id: 'ssc-cgl',
      name: 'SSC Combined Graduate Level (CGL)',
      category: 'competitive',
      targetLevel: 'Staff Selection Commission - Group B & C Central Govt Posts',
      subjects: [
        'General Intelligence & Reasoning',
        'General Awareness',
        'Quantitative Aptitude',
        'English Comprehension'
      ],
      syllabusTopics: [
        'Arithmetic & Advanced Maths: Number Systems, Algebra, Geometry, Mensuration, Trigonometry',
        'Reasoning: Analogies, Syllogisms, Coding-Decoding, Non-Verbal Series',
        'General Awareness: History, Polity, Geography, Static GK, Current Affairs',
        'English: Grammar, Idioms, One-Word Substitutions, Reading Comprehension'
      ],
      questionFormats: ['Computer-Based Objective MCQs (Tier I and Tier II)'],
      difficultyScale: 'Standard',
      officialReferenceUrl: 'https://ssc.gov.in',
      officialAuthority: 'Staff Selection Commission (SSC)',
      scoringRules: 'Tier-I: 100 questions, 200 marks, -0.50 negative marking per wrong answer.',
      preparationStrategy: 'Speed and calculation accuracy are critical. Memorize tables up to 30, squares up to 50, and cubes up to 25.',
      disclaimer: 'Refer to ssc.gov.in for the official annual examination calendar and zone-wise vacancies.'
    },

    'banking-ibps-sbi': {
      id: 'banking-ibps-sbi',
      name: 'Banking Examinations (IBPS PO/Clerk & SBI PO)',
      category: 'competitive',
      targetLevel: 'Public Sector Banks Probationary Officer / Clerical Cadres',
      subjects: [
        'Quantitative Aptitude & Data Analysis',
        'Reasoning Ability & Computer Aptitude',
        'English Language',
        'General, Economy & Banking Awareness'
      ],
      syllabusTopics: [
        'Simplification, Approximations, Quadratic Comparisons, Number Series, Data Interpretation',
        'Puzzles, Floor/Box Arrangements, Seating Arrangements, Syllogisms, Direction Sense',
        'Banking Terminology: RBI Policy, Repo/Reverse Repo, CRR/SLR, NPA, Basel Norms, Financial Inclusion'
      ],
      questionFormats: ['Online Objective Multiple Choice Questions with sectional timing'],
      difficultyScale: 'Standard',
      officialReferenceUrl: 'https://ibps.in',
      officialAuthority: 'Institute of Banking Personnel Selection (IBPS) & State Bank of India (SBI)',
      scoringRules: '0.25 negative marking for each incorrect answer; sectional cutoffs apply.',
      preparationStrategy: 'Sectional time management (20 mins per section in Prelims) requires high speed on puzzles and DI.',
      disclaimer: 'Official notices, dates, and scorecards are released on ibps.in and sbi.co.in/careers.'
    },

    'university-cs': {
      id: 'university-cs',
      name: 'University Computer Science & Engineering Degree',
      category: 'university',
      targetLevel: 'B.Tech / B.E. / B.Sc / MCA Computer Science & IT',
      subjects: [
        'Data Structures & Algorithms',
        'Operating Systems',
        'Database Management Systems (DBMS)',
        'Computer Networks',
        'Software Engineering & Design Patterns',
        'Object-Oriented Programming (Java, C++, Python)',
        'Discrete Mathematics & Statistics',
        'Artificial Intelligence & Machine Learning'
      ],
      syllabusTopics: [
        'Arrays, Linked Lists, Stacks, Queues, Binary Trees, BST, Heaps, Hashing, Graph Algorithms',
        'Process Synchronization, CPU Scheduling, Virtual Memory, Inverted Page Tables, File Systems',
        'Entity-Relationship Modeling, Relational Schema, SQL DDL/DML, 1NF/2NF/3NF/BCNF, ACID properties, Indexing',
        'OSI 7 Layers, TCP/IP Model, Flow & Error Control, CSMA/CD, Subnetting, Socket Programming',
        'OOP Principles: Encapsulation, Inheritance, Polymorphism, Abstraction, SOLID principles'
      ],
      questionFormats: ['Short Theory Definitions (2-3 marks)', 'Analytical & Comparison Questions (5-7 marks)', 'Comprehensive Worked Problems & Derivations (10-15 marks)', 'Programming Code Implementation'],
      difficultyScale: 'Standard',
      officialReferenceUrl: 'https://www.aicte-india.org',
      officialAuthority: 'University Academic Councils & AICTE Model Curriculum',
      scoringRules: 'Semester end examination with internal assessments, practical labs, and theoretical finals.',
      preparationStrategy: 'Combine theoretical definitions with clean code snippets, diagrams, and time complexity derivations.',
      disclaimer: 'Curriculum specifics follow your university syllabus regulations (e.g. AICTE, ABET, Autonomous college scheme).'
    }
  };

  /**
   * Get all supported exam profiles
   */
  static getAllProfiles(): ExamProfile[] {
    return Object.values(this.profiles);
  }

  /**
   * Get a profile by ID
   */
  static getProfile(id: string): ExamProfile | undefined {
    return this.profiles[id];
  }

  /**
   * Match or detect an exam from user text or preference string
   */
  static detectExam(text: string): ExamProfile {
    const t = text.toLowerCase();
    if (t.includes('upsc') || t.includes('civil services') || t.includes('ias') || t.includes('ips') || t.includes('polity')) {
      return this.profiles['upsc-cse'];
    }
    if (t.includes('gate') || t.includes('psu') || t.includes('mtech') || t.includes('engineering math')) {
      return this.profiles['gate-cs'];
    }
    if (t.includes('cat') || t.includes('iim') || t.includes('mba') || t.includes('dilr') || t.includes('varc') || t.includes('quantitative aptitude')) {
      return this.profiles['cat-mba'];
    }
    if (t.includes('ssc') || t.includes('cgl') || t.includes('chsl') || t.includes('staff selection')) {
      return this.profiles['ssc-cgl'];
    }
    if (t.includes('bank') || t.includes('ibps') || t.includes('sbi') || t.includes('rbi')) {
      return this.profiles['banking-ibps-sbi'];
    }
    return this.profiles['university-cs'];
  }
}
