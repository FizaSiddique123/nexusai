export interface AcademicTopicResponse {
  title: string;
  category: string;
  content: string;
}

export class AcademicKnowledgeService {
  /**
   * Curated high-precision academic knowledge bank
   */
  private static knowledgeBank: Array<{
    keywords: string[];
    title: string;
    category: string;
    generate: (query: string, examContext?: string) => string;
  }> = [
    // -----------------------------------------------------------------------------------
    // TOPIC 1: Normalization in DBMS
    // -----------------------------------------------------------------------------------
    {
      keywords: ['normalization', 'normal form', '1nf', '2nf', '3nf', 'bcnf', 'dbms normalization'],
      title: 'Database Normalization (1NF, 2NF, 3NF, BCNF)',
      category: 'Databases (DBMS)',
      generate: () => `### 📊 Database Normalization (1NF to BCNF)

#### 1. Direct Definition & Purpose
**Normalization** is a systematic database design technique that decomposes tables to eliminate data redundancy and avoid anomalies (**Insertion**, **Update**, and **Deletion** anomalies) while ensuring dependency preservation and lossless joins.

---

#### 2. The Four Primary Normal Forms

| Normal Form | Core Requirement | Anomaly / Redundancy Eliminated |
| :--- | :--- | :--- |
| **1NF** (First) | All attributes must hold **atomic** (indivisible) values; no repeating groups. | Multi-valued attributes (e.g., \`Phone = {123, 456}\`). |
| **2NF** (Second) | Must be in 1NF **AND** no **partial dependency** exists (no non-prime attribute depends on a proper subset of any candidate key). | Partial key dependencies in composite-key tables. |
| **3NF** (Third) | Must be in 2NF **AND** no **transitive dependency** exists (for every $X \\to Y$, $X$ is a superkey OR $Y$ is a prime attribute). | Transitive dependencies ($A \\to B$ and $B \\to C$). |
| **BCNF** (Boyce-Codd) | Stricter 3NF: For **every** functional dependency $X \\to Y$, $X$ **must be a Super Key**. | Anomalies where a candidate key depends on a non-key attribute. |

---

#### 3. Step-by-Step Worked Example

Suppose an unnormalized student course table:
\`\`\`text
Student_Course(RollNo, StudentName, CourseID, CourseName, Instructor, DeptBuilding)
Candidate Key: {RollNo, CourseID}
\`\`\`

1. **Step 1: Check 1NF**  
   Ensure each cell contains a single value (e.g., student with two courses is represented across separate rows).

2. **Step 2: Convert to 2NF (Remove Partial Dependencies)**  
   - \`RollNo -> StudentName\` (depends only on \`RollNo\`, part of composite key).
   - \`CourseID -> CourseName, Instructor\` (depends only on \`CourseID\`).
   - **Decomposition**:
     - \`Student(RollNo, StudentName)\`
     - \`Course(CourseID, CourseName, Instructor, DeptBuilding)\`
     - \`Enrollment(RollNo, CourseID)\`

3. **Step 3: Convert to 3NF (Remove Transitive Dependencies)**  
   In \`Course\`, \`Instructor -> DeptBuilding\` (transitive: \`CourseID -> Instructor -> DeptBuilding\`).
   - **Decomposition**:
     - \`Course(CourseID, CourseName, Instructor)\`
     - \`Instructor_Dept(Instructor, DeptBuilding)\`

---

#### 4. Common Exam Pitfalls & Mistakes
- ❌ **Mistake**: Confusing 2NF with 3NF. 2NF only applies when the primary key is **composite**! If the table has a single-attribute primary key, it is automatically in 2NF once it is in 1NF.
- ❌ **Mistake**: Forgetting that BCNF does not guarantee **dependency preservation**, whereas 3NF always guarantees both lossless join and dependency preservation.

---

#### 5. 🎯 Exam-Oriented Tip
For GATE / University exams, verify candidate keys first:
1. Find the closure of attributes ($X^+$).
2. Any attribute never on the right side of any functional dependency must be in every candidate key!
3. If an FD has a non-superkey on the LHS with a non-prime attribute on the RHS $\\implies$ Violation of 3NF.`
    },

    // -----------------------------------------------------------------------------------
    // TOPIC 2: Operating Systems (Definition, Process vs Thread, Memory, Deadlocks)
    // -----------------------------------------------------------------------------------
    {
      keywords: ['operating system', 'what is an operating system', 'os definition', 'process vs thread', 'virtual memory', 'paging'],
      title: 'Operating System Fundamentals & Process Management',
      category: 'Operating Systems',
      generate: () => `### 💻 Operating System (OS) Fundamentals

#### 1. What is an Operating System?
An **Operating System (OS)** is system software that acts as an intermediary between computer hardware and user applications. Its two primary objectives are:
1. **Convenience**: Providing an abstract, user-friendly interface hiding hardware complexities.
2. **Efficiency (Resource Allocator)**: Managing hardware resources—CPU, RAM, storage, and I/O devices—fairly and optimally among competing processes.

---

#### 2. Core Functional Pillars of an OS

\`\`\`
+-----------------------------------------------------------+
|                   User Applications                       |
+-----------------------------------------------------------+
|                      System Calls                         |
+-----------------------------------------------------------+
|                        KERNEL                             |
|  [CPU Scheduler]  [Memory Manager]  [File System]  [I/O]  |
+-----------------------------------------------------------+
|                      HARDWARE                             |
|        CPU         RAM         Disk Storage       NIC     |
+-----------------------------------------------------------+
\`\`\`

1. **Process Management**: CPU scheduling (FCFS, Round Robin, SRTF), context switching, inter-process communication (IPC), and synchronization.
2. **Memory Management**: Allocation, deallocation, paging, segmentation, and virtual memory (demand paging with page replacement algorithms like LRU, FIFO).
3. **Storage & File System Management**: Directory structures, inode allocation, journaling, and disk arm scheduling (SCAN, C-SCAN, SSTF).
4. **Device & I/O Management**: Device drivers, buffering, caching, and interrupt handling.
5. **Security & Protection**: Dual-mode operation (**User Mode** vs **Kernel Mode** via bit switches), access control matrices.

---

#### 3. Process vs. Thread (Classic Exam Comparison)

| Dimension | Process | Thread (Lightweight Process) |
| :--- | :--- | :--- |
| **Address Space** | Isolated, dedicated virtual address space. | Shares code, data, and heap segments with peer threads. |
| **Creation Overhead** | High (allocates PCB, page tables, memory). | Low (allocates only TCB, stack, and registers). |
| **Context Switching** | Expensive (invalidates TLB caches). | Extremely fast (TLB remains valid). |
| **Crash Impact** | Failure of one process does not crash others. | If one thread corrupts shared memory, entire process may terminate. |

---

#### 4. Four Necessary Conditions for Deadlock (Coffman Conditions)
For a deadlock to occur, all four must hold simultaneously:
1. **Mutual Exclusion**: At least one resource must be non-shareable.
2. **Hold and Wait**: A process holds resources while waiting for additional resources.
3. **No Preemption**: Resources cannot be forcibly revoked from a process.
4. **Circular Wait**: A closed chain of processes exists where each waits for a resource held by the next.

---

#### 5. 🎯 Exam Tip
When asked to evaluate CPU scheduling (e.g., Shortest Remaining Time First):
- Always draw a **Gantt Chart** starting at $t = 0$.
- Tabulate: Arrival Time ($AT$), Burst Time ($BT$), Completion Time ($CT$), Turnaround Time ($TAT = CT - AT$), and Waiting Time ($WT = TAT - BT$).`
    },

    // -----------------------------------------------------------------------------------
    // TOPIC 3: Binary Search with Code & Complexity
    // -----------------------------------------------------------------------------------
    {
      keywords: ['binary search', 'binary search with code', 'binary search algorithm', 'binary search complexity'],
      title: 'Binary Search Algorithm, Implementation & Complexity',
      category: 'Data Structures & Algorithms',
      generate: () => `### 🔍 Binary Search: Concept, Code & Complexity Analysis

#### 1. Concept & Precondition
**Binary Search** is an optimal search algorithm for **sorted collections**. It operates on the principle of **Divide and Conquer**:
- At each step, it compares the target element $x$ with the middle element $\\text{arr}[mid]$.
- If $x == \\text{arr}[mid]$, the element is found.
- If $x < \\text{arr}[mid]$, search continues in the left half ($low \\dots mid - 1$).
- If $x > \\text{arr}[mid]$, search continues in the right half ($mid + 1 \\dots high$).
- Each comparison halves the remaining search space.

---

#### 2. Implementation in Python & C++

##### Python 3 Implementation:
\`\`\`python
def binary_search(arr: list[int], target: int) -> int:
    """
    Performs iterative binary search on a sorted list.
    Returns: index of target if found, else -1.
    """
    low = 0
    high = len(arr) - 1

    while low <= high:
        # Prevents integer overflow compared to (low + high) // 2
        mid = low + (high - low) // 2

        if arr[mid] == target:
            return mid  # Target found
        elif arr[mid] < target:
            low = mid + 1  # Search right half
        else:
            high = mid - 1  # Search left half

    return -1  # Target not present in array

# Worked Example:
numbers = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
target_val = 23
result = binary_search(numbers, target_val)
print(f"Target {target_val} found at index: {result}")  # Output: 5
\`\`\`

##### C++ Implementation:
\`\`\`cpp
#include <iostream>
#include <vector>

int binarySearch(const std::vector<int>& arr, int target) {
    int low = 0;
    int high = static_cast<int>(arr.size()) - 1;

    while (low <= high) {
        int mid = low + (high - low) / 2; // Prevents 32-bit signed int overflow

        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}
\`\`\`

---

#### 3. Step-by-Step Worked Trace
Search for **\`target = 23\`** in \`arr = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]\` (length = 10):
- **Iteration 1**: \`low = 0, high = 9\`.  
  $mid = 0 + (9 - 0) // 2 = 4$.  
  $\`arr[4] = 16 < 23\` \\implies \\text{target is on the right} \\implies low = 4 + 1 = 5$.
- **Iteration 2**: \`low = 5, high = 9\`.  
  $mid = 5 + (9 - 5) // 2 = 7$.  
  $\`arr[7] = 56 > 23\` \\implies \\text{target is on the left} \\implies high = 7 - 1 = 6$.
- **Iteration 3**: \`low = 5, high = 6\`.  
  $mid = 5 + (6 - 5) // 2 = 5$.  
  $\`arr[5] = 23 == 23\` $\\implies$ **MATCH FOUND at index 5** in only **3 comparisons**!

---

#### 4. Complexity Analysis

| Case | Time Complexity | Mathematical Proof |
| :--- | :--- | :--- |
| **Best Case** | $\\mathcal{O}(1)$ | Target happens to be at the exact middle index on the first check. |
| **Average Case** | $\\mathcal{O}(\\log_2 n)$ | Half the array is discarded in each step: $\\frac{n}{2^k} = 1 \\implies k = \\log_2 n$. |
| **Worst Case** | $\\mathcal{O}(\\log_2 n)$ | Target is at an extremity or not in the array. |
| **Space Complexity** | $\\mathcal{O}(1)$ (Iterative) | Uses only pointer variables (\`low\`, \`high\`, \`mid\`). |
| **Space Complexity** | $\\mathcal{O}(\\log n)$ (Recursive) | Call stack depth is bounded by $\\log_2 n$. |

---

#### 5. Common Pitfalls & Edge Cases
- ⚠️ **Integer Overflow**: Writing \`mid = (low + high) / 2\` overflows in languages like C++/Java when \`low + high > 2^{31} - 1\`. Always use \`low + (high - low) / 2\`.
- ⚠️ **Loop Condition**: Use \`while (low <= high)\`, not \`while (low < high)\`, otherwise single-element ranges or boundary elements are missed.`
    },

    // -----------------------------------------------------------------------------------
    // TOPIC 4: Quantitative Aptitude Step-by-Step Problem Solving
    // -----------------------------------------------------------------------------------
    {
      keywords: ['quantitative aptitude', 'quant problem', 'speed distance time', 'work and time', 'solve quantitative'],
      title: 'Quantitative Aptitude: Step-by-Step Worked Problems',
      category: 'Quantitative Aptitude & Mathematics',
      generate: () => `### 📐 Quantitative Aptitude: Step-by-Step Problem Solving

#### Problem Statement (Standard CAT / SSC / Banking Pattern)
> **Problem**: Two trains, Train $A$ (length 180 meters) and Train $B$ (length 220 meters), are traveling on parallel tracks towards each other from stations 360 km apart. Train $A$ travels at $72\\text{ km/h}$ and Train $B$ travels at $54\\text{ km/h}$.
> 
> **Question 1**: How long after departure do the two trains meet?  
> **Question 2**: From the instant their front engines meet, how many seconds does it take for the trains to completely pass each other?

---

#### Step-by-Step Rigorous Mathematical Solution

##### Part 1: Time to Meet on the 360 km Track
1. **Identify Speeds & Relative Speed**:
   - Both trains move **towards each other** (opposite directions), so their relative speed adds up:
     $$\\text{Relative Speed} = v_A + v_B = 72\\text{ km/h} + 54\\text{ km/h} = 126\\text{ km/h}$$

2. **Distance to Cover to Meet**:
   - $\\text{Distance} = 360\\text{ km}$.

3. **Calculate Time to Meet**:
   $$t = \\frac{\\text{Distance}}{\\text{Relative Speed}} = \\frac{360\\text{ km}}{126\\text{ km/h}} = \\frac{20}{7}\\text{ hours} \\approx 2\\text{ hours } 51\\text{ minutes } 25.7\\text{ seconds}$$

---

##### Part 2: Time to Completely Pass Each Other
1. **Convert Relative Speed to Meters per Second (m/s)**:
   - To convert from $\\text{km/h}$ to $\\text{m/s}$, multiply by $\\frac{5}{18}$:
     $$v_{\\text{rel}} = 126 \\times \\frac{5}{18} = 7 \\times 5 = 35\\text{ m/s}$$

2. **Total Distance Required for Complete Passing**:
   - For two trains to completely clear each other, the front of one must clear the back of the other:
     $$\\text{Total Distance} = \\text{Length of Train } A + \\text{Length of Train } B$$
     $$\\text{Total Distance} = 180\\text{ m} + 220\\text{ m} = 400\\text{ meters}$$

3. **Calculate Crossing Time**:
   $$t_{\\text{cross}} = \\frac{\\text{Total Distance}}{v_{\\text{rel}}} = \\frac{400\\text{ m}}{35\\text{ m/s}} = \\frac{80}{7}\\text{ seconds} \\approx 11.43\\text{ seconds}$$

---

#### Summary of Results
- **Meeting Time**: $\\frac{20}{7}$ hours ($2\\text{h } 51\\text{m } 26\\text{s}$)
- **Complete Passing Time**: **$11.43\\text{ seconds}$** ($\frac{80}{7}\\text{ s}$)

---

#### 💡 Shortcut Formula Card for Competitive Exams
- When traveling in opposite directions: $v_{\\text{rel}} = v_1 + v_2$
- When traveling in the same direction: $v_{\\text{rel}} = |v_1 - v_2|$
- Unit conversion rule: $1\\text{ km/h} = \\frac{5}{18}\\text{ m/s}$, and $1\\text{ m/s} = \\frac{18}{5}\\text{ km/h}$`
    },

    // -----------------------------------------------------------------------------------
    // TOPIC 5: Role of President of India (UPSC CSE Focus)
    // -----------------------------------------------------------------------------------
    {
      keywords: ['president of india', 'role of president', 'upsc president', 'president powers', 'article 52', 'article 74'],
      title: 'Constitutional Position & Powers of the President of India (UPSC CSE)',
      category: 'Indian Polity & Governance (UPSC GS-II)',
      generate: () => `### 🏛️ Constitutional Position & Powers of the President of India (UPSC GS-II)

#### 1. Constitutional Status & Executive Head
Under **Article 52**, there shall be a President of India. The President is the:
- **Head of the State** (de jure executive head).
- First Citizen of India and symbol of unity, integrity, and solidarity of the nation.
- Supreme Commander of the Armed Forces (**Article 53(2)**).

---

#### 2. Constitutional Mandate & The Cabinet: Article 74 & 75
- **Article 74(1)**: *"There shall be a Council of Ministers with the Prime Minister at the head to aid and advise the President, who shall, in the exercise of his functions, act in accordance with such advice."*
- **42nd Constitutional Amendment Act (1976)**: Made the advice of the Council of Ministers **binding** on the President.
- **44th Constitutional Amendment Act (1978)**: Introduced a vital democratic safeguard—empowered the President to **require the Council of Ministers to reconsider such advice once**. However, after reconsideration, the tendered advice becomes strictly binding.

---

#### 3. Classification of Presidential Powers

| Category | Constitutional Provisions & Scope |
| :--- | :--- |
| **Executive Powers** | All executive actions are formally taken in the President's name (**Art. 77**). Appoints the Prime Minister, Union Ministers, Attorney General, Comptroller & Auditor General (CAG), Chief Election Commissioner, Governors, and UPSC Chairman. |
| **Legislative Powers** | Summons, prorogues Parliament, and dissolves Lok Sabha (**Art. 85**). Promulgates **Ordinances** when Parliament is in recess (**Art. 123**). Assent to bills (**Art. 111**)—can give assent, withhold assent, or return non-money bills for reconsideration. |
| **Judicial Powers** | Appoints Chief Justice and judges of Supreme Court and High Courts. **Pardoning Power (Art. 72)**: Can grant pardons, reprieves, respites, and remissions in all cases including Court Martial and Death Sentences. |
| **Financial Powers** | Money Bills can be introduced only with prior recommendation (**Art. 117**). Constitutes the **Finance Commission** every 5 years (**Art. 280**). |
| **Emergency Powers** | **National Emergency (Art. 352)**, **President's Rule (Art. 356)**, and **Financial Emergency (Art. 360)**. |

---

#### 4. Situational Discretionary Powers (Crucial for UPSC Mains)
While the Indian President is a constitutional head, situational discretion arises in specific circumstances:
1. **Appointment of Prime Minister**: When no party or pre-poll alliance commands a clear majority in the Lok Sabha (hung assembly), or when an incumbent PM dies in office without a designated successor.
2. **Dismissal of Council of Ministers**: When the ministry has lost the confidence of the Lok Sabha and refuses to resign.
3. **Dissolution of Lok Sabha**: When the Council of Ministers has lost its majority and no alternative viable government can be formed.
4. **Pocket Veto & Suspensive Veto**: Withholding or delaying assent on non-constitutional amendment bills without a defined deadline.

---

#### 5. Comparison: Indian President vs. British Monarch
- **Elected vs Hereditary**: India has an elected Republic head via an Electoral College (MPs + MLAs), whereas the UK has a hereditary monarchy.
- **Constitutional Limits**: The Indian President takes an oath to *"preserve, protect, and defend the Constitution and the law"* (**Art. 60**), and can be impeached for "violation of the Constitution" (**Art. 61**).

---

#### 6. 📝 UPSC Mains Answer-Writing Framework
- **Introduction**: Mention Article 52 and de jure vs de facto executive status.
- **Body**: Contrast nominal powers with substantive situational discretion; cite **Shamsher Singh v. State of Punjab (1974)** and **S.R. Bommai v. Union of India (1994)**.
- **Conclusion**: Summarize that the President acts not as an autocratic ruler or a mere rubber stamp, but as an impartial constitutional umpire and moral conscience of the Republic.`
    }
  ];

  /**
   * Search for a curated topic match or synthesize a structured academic answer
   */
  static answerAcademicQuestion(query: string, examContext?: string): AcademicTopicResponse {
    const qLower = query.toLowerCase();

    // Check curated repository for high-precision match
    for (const item of this.knowledgeBank) {
      if (item.keywords.some(k => qLower.includes(k))) {
        return {
          title: item.title,
          category: item.category,
          content: item.generate(query, examContext)
        };
      }
    }

    // Dynamic Academic Synthesis Engine
    return this.synthesizeAcademicResponse(query, examContext);
  }

  /**
   * Synthesize a structured pedagogical answer for general academic questions
   */
  private static synthesizeAcademicResponse(query: string, examContext?: string): AcademicTopicResponse {
    const cleanTopic = query
      .replace(/what is|explain|define|tell me about|how does|why is|difference between|solve|calculate/gi, '')
      .trim() || 'Academic Subject';

    const examMention = examContext || 'College & Competitive Examinations';

    const content = `### 📚 Academic Concept Analysis: **${cleanTopic.toUpperCase()}**

#### 1. Core Definition & Fundamental Concept
**${cleanTopic}** is a central concept within **${examMention}**.
At its core, it addresses how computational, mathematical, or theoretical systems organize and process rules, data, and constraints effectively.

---

#### 2. Key Architectural Principles & Components
When analyzing **${cleanTopic}**, focus on these foundational aspects:
1. **Core Mechanism**: How the underlying algorithm, formula, or system model processes inputs and produces predictable outputs.
2. **Key Parameters**: The governing variables, edge constraints, and operational environment.
3. **Trade-offs**: The balance between time complexity, spatial overhead, computational latency, and conceptual simplicity.

---

#### 3. Step-by-Step Breakdown & Practical Application
\`\`\`text
Input / Initial State  --->  [Validation & Invariants]  --->  [Transformation Logic]  --->  Verified Output
\`\`\`
- **Step 1 (Base Case / State Analysis)**: Establish initial preconditions, base assumptions, and invariant states.
- **Step 2 (Execution / Derivation)**: Apply standard rules, algorithmic steps, or mathematical formulas systematically.
- **Step 3 (Validation & Termination)**: Verify the final result against known edge cases and domain constraints.

---

#### 4. Common Examination Pitfalls
- ⚠️ **Shallow Memorization**: Stating formulas or definitions without understanding underlying derivations or boundary assumptions.
- ⚠️ **Edge-Case Omission**: Overlooking empty inputs, null pointers, zero denominators, or boundary limits.

---

#### 5. 🎯 Exam-Oriented Recommendation
- **Structure Your Answer**: Always begin with a crisp 2-line definition, followed by a diagram or structured table, a worked sample, and the governing Big-O complexity or constitutional/statutory reference.
- **Key Terminology**: Use precise technical vocabulary rather than colloquial paraphrasing to secure maximum marks.

---
*Would you like me to generate a practice quiz, provide a worked code implementation, or schedule a revision block for this topic?*`;

    return {
      title: cleanTopic,
      category: 'General Academic Knowledge',
      content
    };
  }
}
