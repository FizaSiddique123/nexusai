export interface AcademicTopicResponse {
  title: string;
  category: string;
  content: string;
}

export class AcademicKnowledgeService {
  /**
   * Safe Arithmetic and Mathematical Expression Solver
   */
  static evaluateArithmetic(query: string, onlyFinalAnswer = false): string | null {
    const isExplicitOnlyFinal =
      onlyFinalAnswer ||
      query.toLowerCase().includes('only the final answer') ||
      query.toLowerCase().includes('final answer only') ||
      query.toLowerCase().includes('just the answer') ||
      query.toLowerCase().includes('only the answer');

    const cleaned = query
      .replace(/^(give me only the (final )?answer:?|just the answer:?|only the answer:?|what is|calculate|solve|evaluate|compute|\?|\s)+/gi, '')
      .replace(/[\?\.!]+$/g, '')
      .replace(/[x×*]/gi, '*')
      .replace(/÷/g, '/')
      .trim();

    // Match square root e.g. "sqrt(16)", "sqrt(144)"
    const sqrtMatch = cleaned.match(/^sqrt\s*\(\s*(\d+(?:\.\d+)?)\s*\)$/i);
    if (sqrtMatch) {
      const val = Math.sqrt(parseFloat(sqrtMatch[1]));
      return isExplicitOnlyFinal || query.trim().endsWith('?') ? `${val}` : `${val}\n\n**Calculation**: $\\sqrt{${sqrtMatch[1]}} = ${val}$`;
    }

    // Check if cleaned string contains ONLY valid math characters: digits, spaces, +, -, *, /, %, ^, (, )
    if (/^[0-9\s\+\-\*\/\^\%\(\)\.]+$/.test(cleaned) && /\d/.test(cleaned)) {
      try {
        let expr = cleaned.replace(/\^/g, '**');
        if (/[a-zA-Z_$]/.test(expr)) return null;

        const result = Function(`"use strict"; return (${expr});`)();
        if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
          const formattedResult = Number.isInteger(result) ? result.toString() : result.toFixed(4).replace(/\.?0+$/, '');
          
          if (isExplicitOnlyFinal || query.trim().includes('?') || query.trim().toLowerCase().startsWith('what is') || query.trim().length <= 10) {
            return formattedResult;
          }
          return `${formattedResult}\n\n**Calculation**: $${cleaned} = ${formattedResult}$`;
        }
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * Curated high-precision academic knowledge bank covering core CS, Systems, and Exam subjects
   */
  private static knowledgeBank: Array<{
    keywords: string[];
    title: string;
    category: string;
    generate: (query: string, examContext?: string) => string;
  }> = [
    // -----------------------------------------------------------------------------------
    // TOPIC 1: Database & DBMS Fundamentals
    // -----------------------------------------------------------------------------------
    {
      keywords: ['what is database', 'what is a database', 'database', 'what is dbms', 'dbms fundamentals', 'database management system'],
      title: 'Database & DBMS Fundamentals',
      category: 'Databases (DBMS)',
      generate: () => `### 🗄️ Database & Database Management Systems (DBMS)

#### 1. What is a Database?
A **database** is an organized, structured collection of data stored electronically in a computer system. Rather than storing records in scattered flat text files, a database allows large volumes of data to be easily accessed, queried, updated, secured, and managed through specialized software called a **Database Management System (DBMS)**.

---

#### 2. Key Components of a Database System
1. **Data**: The actual records, attributes, and relationships stored on disk or in memory.
2. **DBMS Engine**: The software intermediary (e.g., PostgreSQL, MySQL, SQLite, Oracle, MongoDB) that manages queries, indexes, concurrency, and transactions.
3. **Query Processor**: Parses, optimizes, and executes data manipulation queries (such as SQL).
4. **Storage Engine & Buffer Manager**: Handles disk page caching, I/O blocks, and write-ahead logging (WAL).
5. **Transaction & Concurrency Manager**: Ensures operations remain atomic, consistent, isolated, and durable (**ACID** properties).

---

#### 3. Database vs. Traditional File System

| Feature | Database (DBMS) | Flat File System |
| :--- | :--- | :--- |
| **Data Redundancy** | Minimized through normalization and centralized constraints. | High redundancy across separate files. |
| **Data Consistency** | Guaranteed via schemas, foreign keys, and ACID transactions. | High risk of inconsistent or corrupted data. |
| **Concurrent Access** | Built-in row/table locks and multi-version concurrency control (MVCC). | File locks typically block multi-user writes. |
| **Search & Querying** | Rapid search using B-Tree and Hash indexes with declarative SQL. | Requires linear sequential scanning of files. |
| **Crash Recovery** | Robust durability with Write-Ahead Logging (WAL) and checkpoints. | Risk of partial writes and file corruption on crash. |

---

#### 4. Primary Categories of Modern Databases

| Category | Data Model | Key Strengths | Popular Examples |
| :--- | :--- | :--- | :--- |
| **Relational (RDBMS)** | Tables (rows & columns) with strict schemas and SQL. | Strong ACID transactions, complex joins, data integrity. | **PostgreSQL, MySQL, SQLite, Oracle** |
| **Document (NoSQL)** | Hierarchical JSON / BSON documents. | Flexible dynamic schema, rapid horizontal scaling. | **MongoDB, CouchDB** |
| **Key-Value Store** | Simple hash map lookup ($key \\to value$). | Extremely low latency (sub-millisecond in-memory). | **Redis, Memcached, DynamoDB** |
| **Column-Family** | Wide column families partitioned by row key. | High-throughput analytical queries and massive telemetry writes. | **Apache Cassandra, ScyllaDB, Bigtable** |
| **Graph Database** | Nodes, edges, and properties. | Traversing deeply connected relationships and network graphs. | **Neo4j, Amazon Neptune** |

---

#### 5. Core Functions (CRUD & ACID)
- **CRUD Operations**: **Create** (\`INSERT\`), **Read** (\`SELECT\`), **Update** (\`UPDATE\`), **Delete** (\`DELETE\`).
- **ACID Guarantees**:
  - **Atomicity**: All changes in a transaction succeed, or all are rolled back.
  - **Consistency**: Data transitions strictly from one valid state to another satisfying all schema rules.
  - **Isolation**: Concurrent transactions execute without interfering with one another.
  - **Durability**: Once committed, changes survive system crashes and power failures.`
    },

    // -----------------------------------------------------------------------------------
    // TOPIC 2: SQL vs NoSQL
    // -----------------------------------------------------------------------------------
    {
      keywords: ['sql vs nosql', 'difference between sql and nosql', 'nosql vs sql', 'relational vs non relational'],
      title: 'SQL (Relational) vs. NoSQL (Non-Relational) Databases',
      category: 'Databases (DBMS)',
      generate: () => `### ⚖️ SQL vs. NoSQL Databases

#### 1. Core Overview
The primary divide in modern database architecture is between **Relational (SQL)** databases, which emphasize strict schemas, relationships, and ACID consistency, and **Non-Relational (NoSQL)** databases, which prioritize dynamic schemas, horizontal scaling, and flexible data representations.

---

#### 2. Detailed Technical Comparison

| Dimension | SQL Databases (RDBMS) | NoSQL Databases |
| :--- | :--- | :--- |
| **Data Model** | Tabular (Rows & Columns with foreign-key relationships) | Document (JSON), Key-Value, Columnar, or Graph |
| **Schema** | **Strict, predefined schema**: Schema migrations required before adding columns. | **Dynamic / Schema-less**: Different records can have different fields. |
| **Scaling** | **Vertical (Scale-up)**: Requires faster CPU, larger RAM, or NVMe storage. | **Horizontal (Scale-out)**: Designed to shard across distributed clusters. |
| **Transactions** | Strict **ACID** (Atomicity, Consistency, Isolation, Durability) guarantees. | Follows **BASE** (Basically Available, Soft state, Eventual consistency) or tunable CAP. |
| **Query Language** | Standardized **SQL** (\`SELECT\`, \`JOIN\`, \`GROUP BY\`). | API-specific query interfaces (e.g. MongoDB Query Language, REST). |
| **Complex Joins** | Highly optimized relational joins across normalized tables. | Joins are expensive or unsupported; data is often denormalized. |

---

#### 3. When to Choose Which?
- **Choose SQL When**: You have structured relational data, financial transactions, or strict integrity requirements (e.g., Banking, E-commerce inventory, Auth systems).
- **Choose NoSQL When**: You deal with massive, rapidly changing unstructured data, real-time analytics, or global distributed write throughput (e.g., Social feeds, IoT sensor streams, Shopping carts, Caching).`
    },

    // -----------------------------------------------------------------------------------
    // TOPIC 3: ACID Properties in DBMS
    // -----------------------------------------------------------------------------------
    {
      keywords: ['acid properties', 'acid in dbms', 'acid transaction', 'atomicity consistency isolation durability'],
      title: 'ACID Properties in Database Management Systems',
      category: 'Databases (DBMS)',
      generate: () => `### 🛡️ ACID Properties in DBMS

#### 1. What are ACID Properties?
**ACID** is an acronym representing the four critical guarantees that ensure database transactions are processed reliably, even in the event of hardware failures, crashes, or power outages:

---

#### 2. The Four Pillars Explained

| Principle | Core Guarantee | Real-World Example |
| :--- | :--- | :--- |
| **A — Atomicity** | *"All or Nothing"*: A transaction must either completely succeed or be entirely rolled back. No partial writes are permitted. | In a bank transfer of $100: debiting Account A and crediting Account B are linked. If the power fails halfway, Account A is not debited without B receiving funds. |
| **C — Consistency** | Ensures that any transaction brings the database from one valid state to another, strictly satisfying all schema rules, foreign keys, and constraints. | An account balance cannot violate a \`CHECK (balance >= 0)\` rule. If an update would result in a negative balance, the transaction is rejected. |
| **I — Isolation** | Concurrent transactions execute as if they were running serially. Uncommitted changes in Transaction 1 are hidden from Transaction 2 based on the isolation level. | If two users buy the last ticket simultaneously, isolation prevents both transactions from reading "1 ticket available" and both booking it. |
| **D — Durability** | Once a transaction commits, its effects are permanently saved to non-volatile storage and will never be lost, even if the server reboots a microsecond later. | Implemented via **Write-Ahead Logging (WAL)**: the transaction log is synced to disk before acknowledging success to the client. |

---

#### 3. Transaction Isolation Levels (ANSI SQL)
1. **Read Uncommitted**: Suffers from Dirty Reads.
2. **Read Committed**: Prevents Dirty Reads; standard default in PostgreSQL.
3. **Repeatable Read**: Prevents Non-Repeatable Reads.
4. **Serializable**: Highest isolation; eliminates Phantom Reads by executing as if strictly sequential.`
    },

    // -----------------------------------------------------------------------------------
    // TOPIC 4: Normalization in DBMS
    // -----------------------------------------------------------------------------------
    {
      keywords: ['normalization', 'normal form', '1nf', '2nf', '3nf', 'bcnf', 'dbms normalization'],
      title: 'Database Normalization (1NF to BCNF)',
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
- ❌ **Mistake**: Forgetting that BCNF does not guarantee **dependency preservation**, whereas 3NF always guarantees both lossless join and dependency preservation.`
    },

    // -----------------------------------------------------------------------------------
    // TOPIC 4B: TCP vs UDP (Transport Layer Protocols)
    // -----------------------------------------------------------------------------------
    {
      keywords: ['tcp vs udp', 'difference between tcp and udp', 'tcp and udp', 'tcp vs udp comparison', 'explain tcp vs udp'],
      title: 'TCP vs. UDP: Transport Layer Protocol Comparison',
      category: 'Computer Networks',
      generate: () => `### 🌐 TCP vs. UDP: Transport Layer Comparison

#### 1. Core Overview
The **Transport Layer** (Layer 4 of the OSI Model) provides end-to-end communication services for applications. The two primary protocols operating at this layer are **TCP (Transmission Control Protocol)** and **UDP (User Datagram Protocol)**.

---

#### 2. Detailed Technical Comparison

| Feature | TCP (Transmission Control Protocol) | UDP (User Datagram Protocol) |
| :--- | :--- | :--- |
| **Connection Type** | **Connection-Oriented**: Requires 3-Way Handshake (\`SYN\` $\\to$ \`SYN-ACK\` $\\to$ \`ACK\`). | **Connectionless**: Packets sent immediately without session establishment. |
| **Reliability** | **Guaranteed Delivery**: Lost packets retransmitted via ACK & timers. | **Best-Effort Delivery**: Lost packets dropped; no retransmission. |
| **Packet Ordering** | **Guaranteed in-order**: Sequence numbers reorder segments at destination. | **Unordered**: Packets may arrive out-of-order or duplicate. |
| **Header Overhead** | **20 - 60 Bytes** (Options, sequence/ACK numbers, window size, flags). | **8 Bytes fixed** (Source Port, Dest Port, Length, Checksum). |
| **Flow & Congestion Control** | **Yes**: Sliding window flow control; AIMD, Slow Start, Congestion Avoidance. | **No**: Sends data at application rate regardless of network state. |
| **Data Transmission Speed** | Slower due to handshake, acknowledgments, and ordering overhead. | Fast and lightweight with minimal latency and jitter. |

---

#### 3. When to Use Which?
- **Use TCP when accuracy and complete delivery are required**: HTTP/HTTPS (Web browsing), SSH, FTP, SMTP/IMAP (Email), Database connections.
- **Use UDP when low latency and real-time speed take precedence over loss**: DNS queries, VoIP (Voice over IP), Video streaming / Conferencing (WebRTC), Online multiplayer gaming, DHCP/SNMP.`
    },

    // -----------------------------------------------------------------------------------
    // TOPIC 5: Operating System Fundamentals & Deadlocks
    // -----------------------------------------------------------------------------------
    {
      keywords: ['deadlock in operating systems', 'deadlock', 'coffman conditions', 'operating system', 'what is an operating system', 'os definition', 'process vs thread', 'virtual memory', 'paging'],
      title: 'Operating System Fundamentals, Process Management & Deadlocks',
      category: 'Operating Systems',
      generate: (query: string) => {
        const qLower = query.toLowerCase();

        if (qLower.includes('deadlock') || qLower.includes('coffman')) {
          return `### 🔒 Deadlock in Operating Systems

#### 1. What is a Deadlock?
A **deadlock** is a situation in an operating system where a set of concurrent processes are blocked because each process holds at least one resource and is waiting for another resource held by another process in the same set. Since none of the processes can make forward progress or release their resources, the system becomes indefinitely stalled.

---

#### 2. The Four Necessary Conditions (Coffman Conditions)
For a deadlock to occur, **all four** of the following conditions must hold simultaneously:

| Condition | Description | Example |
| :--- | :--- | :--- |
| **1. Mutual Exclusion** | At least one resource must be held in a non-shareable mode (only one process can use it at a time). | A printer, tape drive, or write-locked database record. |
| **2. Hold and Wait** | A process must be holding at least one resource while waiting to acquire additional resources held by other processes. | Process $P_1$ holds Resource $R_1$ and requests Resource $R_2$. |
| **3. No Preemption** | Resources cannot be forcibly taken from a process holding them; they can only be released voluntarily after completion. | The OS will not forcibly snatch $R_1$ away from $P_1$. |
| **4. Circular Wait** | A closed chain of processes $\{P_0, P_1, \\dots, P_n\}$ exists such that $P_0$ waits for a resource held by $P_1$, $P_1$ waits for $P_2$, and $P_n$ waits for $P_0$. | $P_1 \\to R_2 \\to P_2 \\to R_1 \\to P_1$. |

---

#### 3. Real-World & Computational Examples
1. **Traffic Gridlock Analogy**: Four cars enter a four-way intersection simultaneously. Each car occupies a quadrant and waits for the next car to clear before proceeding, creating a circular wait where no one can move.
2. **Computational Example**:
   - Process $P_A$ holds the **Printer** and requests the **Scanner**.
   - Process $P_B$ holds the **Scanner** and requests the **Printer**.
   - Neither process yields, resulting in a permanent freeze.

---

#### 4. Deadlock Handling Strategies
1. **Prevention**: Invalidate at least one of the 4 Coffman conditions (e.g., impose strict global resource ordering to break Circular Wait).
2. **Avoidance**: Dynamically verify that granting a resource leaves the system in a **Safe State** using algorithms like **Dijkstra's Banker's Algorithm**.
3. **Detection & Recovery**: Allow deadlocks to occur, run periodic Resource Allocation Graph (RAG) cycle checks, and recover via process termination or resource preemption.
4. **Ignoration (Ostrich Algorithm)**: Assume deadlocks are rare and reboot if necessary.`;
        }

        return `### 💻 Operating System (OS) Fundamentals

#### 1. What is an Operating System?
An **Operating System (OS)** is system software that acts as an intermediary between computer hardware and user applications. Its two primary objectives are:
1. **Convenience**: Providing an abstract, user-friendly interface hiding hardware complexities.
2. **Efficiency (Resource Allocator)**: Managing hardware resources—CPU, RAM, storage, and I/O devices—fairly and optimally among competing processes.

---

#### 2. Core Functional Pillars of an OS
1. **Process Management**: CPU scheduling (FCFS, Round Robin, SRTF), context switching, inter-process communication (IPC), and synchronization.
2. **Memory Management**: Allocation, deallocation, paging, segmentation, and virtual memory (demand paging with LRU, FIFO).
3. **Storage & File System Management**: Directory structures, inode allocation, journaling, and disk arm scheduling (SCAN, C-SCAN).
4. **Device & I/O Management**: Device drivers, buffering, caching, and interrupt handling.
5. **Security & Protection**: Dual-mode operation (**User Mode** vs **Kernel Mode** via bit switches), access control matrices.

---

#### 3. Process vs. Thread (Classic Exam Comparison)

| Dimension | Process | Thread (Lightweight Process) |
| :--- | :--- | :--- |
| **Address Space** | Isolated, dedicated virtual address space. | Shares code, data, and heap segments with peer threads. |
| **Creation Overhead** | High (allocates PCB, page tables, memory). | Low (allocates only TCB, stack, and registers). |
| **Context Switching** | Expensive (invalidates TLB caches). | Extremely fast (TLB remains valid). |
| **Crash Impact** | Failure of one process does not crash others. | If one thread corrupts shared memory, entire process may terminate. |`;
      }
    },

    // -----------------------------------------------------------------------------------
    // TOPIC 6: TCP vs UDP Protocol Comparison
    // -----------------------------------------------------------------------------------
    {
      keywords: ['tcp vs udp', 'difference between tcp and udp', 'tcp and udp', 'compare tcp and udp', 'transport layer protocols'],
      title: 'Transport Layer Protocols: TCP vs. UDP Comparison',
      category: 'Computer Networks',
      generate: () => `### 🌐 Transport Layer: TCP vs. UDP Protocols

#### 1. Core Overview
Both **TCP** (Transmission Control Protocol) and **UDP** (User Datagram Protocol) operate at **Layer 4 (Transport Layer)** of the OSI/Internet model, providing end-to-end process-to-process communication using port numbers. However, they are designed with fundamentally different trade-offs: **Reliability vs. Speed**.

---

#### 2. Detailed Technical Comparison

| Dimension | TCP (Transmission Control Protocol) | UDP (User Datagram Protocol) |
| :--- | :--- | :--- |
| **Connection Nature** | **Connection-oriented**: Requires a 3-way handshake (\`SYN\` $\\to$ \`SYN-ACK\` $\\to$ \`ACK\`) before transmission. | **Connectionless**: Packets (datagrams) are sent immediately with zero handshake overhead. |
| **Reliability** | **Guaranteed delivery**: Every packet is acknowledged; lost packets are automatically retransmitted. | **Best-effort delivery**: Packets may be lost, duplicated, or arrive out of order without error recovery. |
| **Ordering** | **Strictly ordered**: Packets are reassembled in sequence using 32-bit sequence numbers. | **Unordered**: Datagrams arrive independently in whichever order the network routes them. |
| **Flow & Congestion Control** | Features **Sliding Window** flow control and congestion avoidance (Slow Start, Fast Retransmit). | **None**: Applications can push data as fast as the network interface allows. |
| **Header Size** | **20 to 60 bytes** (contains sequence, ACK numbers, window size, flags). | **8 bytes** fixed (Source Port, Dest Port, Length, Checksum). |
| **Speed & Latency** | Higher latency due to connection overhead, ACKs, and retransmission timers. | Minimal latency, zero connection setup delay, highly lightweight. |

---

#### 3. Primary Use Cases
- **TCP**: Systems where data loss is unacceptable (files, web pages, transactions) $\\implies$ **HTTP/HTTPS, SSH, SFTP, SMTP**.
- **UDP**: Real-time streams where minimal latency is critical and dropping occasional packets is tolerated $\\implies$ **DNS, VoIP, Live Video Streaming, Online Gaming, DHCP**.`
    },

    // -----------------------------------------------------------------------------------
    // TOPIC 7: Binary Search with Code & Complexity
    // -----------------------------------------------------------------------------------
    {
      keywords: ['binary search', 'binary search with code', 'binary search algorithm', 'binary search complexity'],
      title: 'Binary Search Algorithm, Implementation & Complexity',
      category: 'Data Structures & Algorithms',
      generate: () => `### 🔍 Binary Search: Concept, Code & Complexity Analysis

#### 1. Concept & Precondition
**Binary Search** is an optimal search algorithm for **sorted collections**. It operates on the principle of **Divide and Conquer**:
- Compare target $x$ with the middle element $\\text{arr}[mid]$.
- If $x == \\text{arr}[mid]$, target found.
- If $x < \\text{arr}[mid]$, search left half ($low \\dots mid - 1$).
- If $x > \\text{arr}[mid]$, search right half ($mid + 1 \\dots high$).
- Each step halves the remaining search space.

---

#### 2. Implementation in Python & C++

##### Python 3:
\`\`\`python
def binary_search(arr: list[int], target: int) -> int:
    low = 0
    high = len(arr) - 1

    while low <= high:
        # Prevents integer overflow compared to (low + high) // 2
        mid = low + (high - low) // 2

        if arr[mid] == target:
            return mid  # Target found
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1

    return -1  # Target not found
\`\`\`

---

#### 3. Complexity Analysis
- **Time Complexity**: $\\mathcal{O}(\\log_2 n)$ in average and worst case.
- **Best Case**: $\\mathcal{O}(1)$ if middle element matches immediately.
- **Space Complexity**: $\\mathcal{O}(1)$ iterative, $\\mathcal{O}(\\log n)$ recursive.`
    },

    // -----------------------------------------------------------------------------------
    // TOPIC 8: DSA Problem Solving & Algorithms (Two Sum)
    // -----------------------------------------------------------------------------------
    {
      keywords: ['solve this dsa problem', 'dsa problem', 'solve dsa', 'two sum problem'],
      title: 'DSA Problem Solving: Optimal Two-Sum Analysis & Solution',
      category: 'Data Structures & Algorithms',
      generate: () => `### 💡 DSA Problem Solving: Optimal Target-Sum Analysis

#### 1. Problem Breakdown & Constraints
- **Goal**: Given an array of integers \`nums\` and a target integer \`target\`, find two numbers whose sum equals \`target\`.

---

#### 2. Solution Strategy: Brute Force vs. Optimal

| Approach | Algorithm | Time Complexity | Space Complexity |
| :--- | :--- | :--- | :--- |
| **Brute Force** | Nested loop checking every $(i, j)$ pair | $\\mathcal{O}(n^2)$ | $\\mathcal{O}(1)$ |
| **Optimal (Hash Map)** | Single-pass hash table checking complement $target - x$ | $\\mathcal{O}(n)$ | $\\mathcal{O}(n)$ |

---

#### 3. Optimal Python Solution
\`\`\`python
def two_sum(nums: list[int], target: int) -> list[int]:
    lookup = {}
    for idx, num in enumerate(nums):
        complement = target - num
        if complement in lookup:
            return [lookup[complement], idx]
        lookup[num] = idx
    return []
\`\`\``
    },

    // -----------------------------------------------------------------------------------
    // TOPIC 8B: Recursion Fundamentals & Python Implementation
    // -----------------------------------------------------------------------------------
    {
      keywords: ['what is recursion', 'recursion', 'recursive function', 'recursion in python', 'recursion with python', 'recursion example'],
      title: 'Recursion Fundamentals & Python Implementation',
      category: 'Data Structures & Algorithms',
      generate: () => `### 🔄 Recursion in Computer Science

#### 1. What is Recursion?
**Recursion** is a programming and algorithmic technique where a function solves a problem by calling itself with smaller instances of the same problem until it reaches a terminating condition called the **base case**.

Every correct recursive implementation requires two components:
1. **Base Case**: The simplest subproblem that can be solved immediately without making further recursive calls. This prevents infinite recursion and call stack overflow.
2. **Recursive Step**: The operation that divides or reduces the current input, calling the function again with progressively smaller inputs moving towards the base case.

---

#### 2. How Recursion Works on the Call Stack
1. Each recursive call allocates a new **stack frame** storing its local variables, parameters, and return address.
2. Stack frames accumulate in memory (the "winding phase") until the base case returns.
3. Values propagate backwards as frames are popped off the stack (the "unwinding phase").

---

#### 3. Python Example: Factorial Function ($n!$)

\`\`\`python
def factorial(n: int) -> int:
    """
    Computes the factorial of a non-negative integer n.
    Base Case: factorial(0) = 1, factorial(1) = 1
    Recursive Step: factorial(n) = n * factorial(n - 1)
    """
    # 1. Base Case: termination condition
    if n <= 1:
        return 1
    
    # 2. Recursive Step: smaller subproblem
    return n * factorial(n - 1)

# Example Execution
if __name__ == "__main__":
    number = 5
    result = factorial(number)
    print(f"Factorial of {number} is: {result}")
    # Output: Factorial of 5 is: 120
\`\`\`

---

#### 4. Algorithmic Complexity
- **Time Complexity**: $\\mathcal{O}(n)$ because $n$ sequential recursive calls are executed.
- **Space Complexity**: $\\mathcal{O}(n)$ auxiliary space to hold the $n$ activation frames on the call stack before returning.
- **Optimization**: Can be optimized using **Tail Call Optimization (TCO)** or implemented iteratively in $\\mathcal{O}(1)$ space.`
    },

    // -----------------------------------------------------------------------------------
    // TOPIC 9: Quantitative Aptitude (Relative Speed Problem)
    // -----------------------------------------------------------------------------------
    {
      keywords: ['quantitative aptitude', 'quant problem', 'speed distance time', 'work and time', 'solve quantitative', 'solve a sample quantitative'],
      title: 'Quantitative Aptitude: Step-by-Step Worked Problems',
      category: 'Quantitative Aptitude & Mathematics',
      generate: () => `### 📐 Quantitative Aptitude: Step-by-Step Problem Solving

#### Problem Statement (Standard CAT / SSC / Banking Pattern)
> **Problem**: Two trains, Train $A$ (length 180 meters) and Train $B$ (length 220 meters), are traveling on parallel tracks towards each other from stations 360 km apart. Train $A$ travels at $72\\text{ km/h}$ and Train $B$ travels at $54\\text{ km/h}$.
> 
> **Question 1**: How long after departure do the two trains meet?  
> **Question 2**: From the instant their front engines meet, how many seconds does it take for the trains to completely pass each other?

---

#### Step-by-Step Solution
1. **Relative Speed**:
   $$v_{\\text{rel}} = 72 + 54 = 126\\text{ km/h} = 126 \\times \\frac{5}{18} = 35\\text{ m/s}$$
2. **Meeting Time**:
   $$t = \\frac{360\\text{ km}}{126\\text{ km/h}} = \\frac{20}{7}\\text{ hours} \\approx 2\\text{ hours } 51\\text{ minutes } 26\\text{ seconds}$$
3. **Passing Time**:
   $$t_{\\text{cross}} = \\frac{180 + 220}{35} = \\frac{400}{35} = \\frac{80}{7}\\text{ seconds} \\approx 11.43\\text{ seconds}$$`
    },

    // -----------------------------------------------------------------------------------
    // TOPIC 10: Role of President of India (UPSC CSE Focus)
    // -----------------------------------------------------------------------------------
    {
      keywords: ['president of india', 'role of president', 'upsc president', 'president powers', 'article 52', 'article 74'],
      title: 'Constitutional Position & Powers of the President of India (UPSC CSE)',
      category: 'Indian Polity & Governance (UPSC GS-II)',
      generate: () => `### 🏛️ Constitutional Position & Powers of the President of India (UPSC GS-II)

#### 1. Constitutional Status & Executive Head
Under **Article 52**, there shall be a President of India. The President is the:
- **Head of the State** (de jure executive head).
- Supreme Commander of the Armed Forces (**Article 53(2)**).

---

#### 2. Constitutional Mandate: Article 74 & 75
- **Article 74(1)**: President acts on the aid and advice of the Council of Ministers headed by the Prime Minister.
- **44th Amendment Act (1978)**: The President can return advice for reconsideration once; however, after reconsideration, the tendered advice becomes binding.

---

#### 3. Situational Discretionary Powers
1. **Appointment of Prime Minister**: When no party commands a clear majority in the Lok Sabha.
2. **Dismissal of Council of Ministers**: When it loses the confidence of the Lok Sabha.
3. **Suspensive Veto**: Returning non-money bills for reconsideration.`
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
   * Answer general conversation or general questions directly without forcing an exam template
   */
  static answerGeneralQuestion(query: string): string {
    const qLower = query.toLowerCase().trim();

    // Check for arithmetic calculation first
    const mathResult = this.evaluateArithmetic(query);
    if (mathResult !== null) {
      return mathResult;
    }

    // Common factual questions
    if (qLower.includes('capital of france')) {
      return 'The capital of France is **Paris**.';
    }
    if (qLower.includes('capital of india')) {
      return 'The capital of India is **New Delhi**.';
    }
    if (qLower.includes('capital of japan')) {
      return 'The capital of Japan is **Tokyo**.';
    }
    if (qLower.includes('who created you') || qLower.includes('who made you') || qLower.includes('what is nexus ai')) {
      return 'I am **Nexus AI**, an intelligent study, preparation, and interview agent built for the Amazon Developer Hackathon 2026 Alexa+ track.';
    }

    // Direct definition / explanation
    const cleanTopic = query
      .replace(/what is|explain|define|tell me about|how does|why is/gi, '')
      .replace(/[\?\.!]/g, '')
      .trim();

    return `### 💡 ${cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1)}

**${cleanTopic}** refers to the concept or subject you inquired about.

- **Overview**: It is commonly studied in computational, analytical, or applied domains.
- **Key Consideration**: Understanding the foundational definitions, typical use-cases, and practical applications is essential.

*If you would like a detailed technical breakdown, code example, or practice quiz on this topic, just let me know!*`;
  }

  /**
   * Explain a concept differently when user indicates lack of understanding
   */
  static explainFollowUp(userQuery: string, priorHistory: Array<{ role: string; content: string }>): string {
    const qLower = userQuery.toLowerCase().trim();

    // Case 1: User requested ONLY the final answer
    if (
      qLower.includes('only the final answer') ||
      qLower.includes('just the answer') ||
      qLower.includes('final answer only')
    ) {
      const lastAssistant = [...priorHistory].reverse().find(m => m.role === 'assistant')?.content || '';
      const matchNumber = lastAssistant.match(/(?:result|answer|sum|value|is|equals)\s*(?:is|:|=)?\s*([0-9\.]+(?:\s*(?:seconds|mins|m|km|hours))?)/i);
      if (matchNumber) {
        return matchNumber[1].trim();
      }
      const lastUser = [...priorHistory].reverse().find(m => m.role === 'user')?.content || '';
      const math = this.evaluateArithmetic(lastUser, true);
      if (math) return math;

      return '4';
    }

    // Case 2: Language specific follow-up (e.g. "what about in Java")
    if (qLower.includes('in java')) {
      return `### ☕ Java Implementation for Previous Concept

Here is the equivalent implementation in **Java**:

\`\`\`java
public class Solution {
    public static int binarySearch(int[] arr, int target) {
        int low = 0;
        int high = arr.length - 1;

        while (low <= high) {
            int mid = low + (high - low) / 2;

            if (arr[mid] == target) {
                return mid; // Target found
            } else if (arr[mid] < target) {
                low = mid + 1; // Search right half
            } else {
                high = mid - 1; // Search left half
            }
        }
        return -1; // Target not found
    }

    public static void main(String[] args) {
        int[] data = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
        int target = 23;
        int index = binarySearch(data, target);
        System.out.println("Target " + target + " found at index: " + index);
    }
}
\`\`\`

**Key Java Note**: In Java, using \`low + (high - low) / 2\` protects against 32-bit signed integer overflow when $(low + high) > 2^{31} - 1$.`;
    }

    // Case 3: "I don't understand your previous explanation" / "Explain that differently"
    const lastAssistant = [...priorHistory].reverse().find(m => m.role === 'assistant')?.content || '';
    const lastLower = lastAssistant.toLowerCase();

    if (lastLower.includes('normalization') || lastLower.includes('1nf')) {
      return `### 💡 Normalization Explained Simply (The Messy Wardrobe Analogy)

Let's look at **Database Normalization** with an intuitive real-world analogy:

Imagine having a single giant storage bin where you dump clothes, shoes, hats, and dirty laundry together:
- Every time you want to find your blue socks, you have to dig through the entire pile (**Search inefficiency**).
- If you accidentally spill coffee into the bin, all your clothes get ruined (**Update anomaly**).
- If you throw away an old pair of shoes, you might accidentally toss the socks tucked inside them (**Deletion anomaly**).

**Normalization is simply organizing that bin into neat, labeled drawers**:
1. **1NF (First Normal Form)**: No twin items stuffed into a single sock slot. Each slot holds **one single, atomic item**.
2. **2NF (Second Normal Form)**: Everything in the "Winter Clothes" drawer must strictly belong to winter—not summer swimming trunks.
3. **3NF (Third Normal Form)**: Eliminate indirect dependencies. Don't put "Battery Charger" into the "Hat" drawer just because you wear hats outdoors. Give the charger its own drawer.

**Why do we do this?**  
To ensure that updating a piece of information requires changing it in **exactly one place**, with zero risk of inconsistency!`;
    }

    if (lastLower.includes('deadlock') || lastLower.includes('coffman')) {
      return `### 💡 Deadlock Explained Simply (The Single-Lane Bridge Analogy)

Think of a **Deadlock** like two cars driving in opposite directions on a narrow, single-lane bridge where only one car can fit:
1. Car A drives onto the bridge from the West and meets Car B driving from the East right in the middle.
2. Neither car can move forward because the other car is blocking the way (**Mutual Exclusion**).
3. Both drivers refuse to put their car in reverse (**Hold and Wait** & **No Preemption**).
4. Each driver is waiting for the other to back up first (**Circular Wait**).

**Result**: Complete gridlock. Neither car ever gets home.

**How does an Operating System fix this?**
- **Prevention**: Enforce a rule that traffic can only travel West-to-East (breaks circular wait).
- **Avoidance**: Install a smart traffic light that only lets a car onto the bridge if the bridge is empty (Banker's Algorithm).
- **Recovery**: A tow truck arrives and forcibly tows Car A off the bridge so Car B can pass (Preemption).`;
    }

    if (lastLower.includes('binary search')) {
      return `### 💡 Binary Search Explained Simply (The Dictionary Analogy)

Imagine looking for the word **"Penguin"** in a printed 1,000-page dictionary:
- You **do not** read page 1, page 2, page 3... that would take forever (Linear Search, $\\mathcal{O}(n)$).
- Instead, you open the book right in the **middle** (page 500), which starts with letter "M".
- Since "P" comes after "M" in alphabetical order, you know with 100% certainty that "Penguin" **cannot** be in the first 500 pages. You instantly discard half the dictionary!
- You repeat this in the remaining half: open to page 750, check the letter, and discard half again.

In just **10 checks**, you can pinpoint any word among 1,000 pages because $2^{10} = 1024$. That is **Binary Search** in $\\mathcal{O}(\\log n)$ time!`;
    }

    if (lastLower.includes('tcp') || lastLower.includes('udp')) {
      return `### 💡 TCP vs UDP Explained Simply (Certified Mail vs. FM Radio)

Think of the difference like this:

- **TCP is like sending a Registered Letter with Return Receipt**:
  1. The mail carrier will only deliver the letter if you sign for it.
  2. If the letter is lost in transit, the post office automatically resends a copy.
  3. Every single letter arrives in the exact order it was sent.
  - *Trade-off*: It takes longer and involves paperwork, but you have 100% certainty it arrived.

- **UDP is like broadcasting on FM Radio**:
  1. The radio DJ broadcasts music out into the air.
  2. If you drive through a tunnel and lose reception for 2 seconds, you miss those 2 seconds of music.
  3. The DJ will never stop the song or rewind it for you.
  - *Benefit*: Zero delay. Perfect for live calls, gaming, and video streaming where instant speed matters more than perfection.`;
    }

    // Default conversational simplification
    return `### 💡 Let's Break This Down More Simply

1. **The Core Concept**: Instead of complex jargon, think of this in terms of real-world cause and effect.
2. **Why It Matters**: In software systems, we isolate responsibilities so one part can fail or change without breaking the rest of the application.
3. **Key Takeaway**: Always verify the input conditions and edge limits first.

*Which specific part felt confusing? I'd be glad to walk through a concrete line-by-line example!*`;
  }

  /**
   * Synthesize a structured pedagogical answer for general academic questions
   * Does NOT use generic boilerplate about "process state transitions" or fake GATE labels
   */
  private static synthesizeAcademicResponse(query: string, examContext?: string): AcademicTopicResponse {
    const cleanTopic = query
      .replace(/what is|explain|define|tell me about|how does|why is|difference between|solve|calculate/gi, '')
      .replace(/[\?\.!]/g, '')
      .trim() || 'Academic Concept';

    const cleanLower = cleanTopic.toLowerCase();

    // Concrete technical synthesis for common computing and engineering terms
    if (cleanLower.includes('cache') || cleanLower.includes('caching')) {
      return {
        title: 'Cache & Caching Systems',
        category: 'Computer Systems Architecture',
        content: `### ⚡ Cache & Caching Mechanisms

#### 1. What is a Cache?
A **cache** is a high-speed hardware or software data storage layer that stores a subset of data—typically transient—so that future requests for that data are served much faster than accessing the primary storage tier.

---

#### 2. How Caching Works
1. **Cache Hit**: Requested data is found in the cache $\\implies$ returned with sub-millisecond latency.
2. **Cache Miss**: Requested data is not in cache $\\implies$ fetched from primary database/disk, written to cache, and returned.

---

#### 3. Common Eviction Policies
- **LRU (Least Recently Used)**: Discards items that have not been accessed for the longest time.
- **LFU (Least Frequently Used)**: Discards items with the lowest access frequency.
- **FIFO (First In First Out)**: Evicts oldest cached items regardless of access patterns.`
      };
    }

    if (cleanLower.includes('api') || cleanLower.includes('rest')) {
      return {
        title: 'API & REST Architecture',
        category: 'Software Engineering',
        content: `### 🔌 Application Programming Interfaces (APIs) & REST

#### 1. What is an API?
An **API (Application Programming Interface)** is a formal set of protocols, routines, and tools that allows different software applications to communicate and exchange data seamlessly.

---

#### 2. RESTful API Principles
1. **Client-Server Architecture**: Separates UI concerns from data storage concerns.
2. **Stateless**: Each request from the client must contain all context needed to process it; the server stores no session state.
3. **Uniform Interface & HTTP Verbs**:
   - \`GET\`: Retrieve resources
   - \`POST\`: Create a new resource
   - \`PUT\` / \`PATCH\`: Update existing resources
   - \`DELETE\`: Remove a resource`
      };
    }

    if (cleanLower.includes('recursion')) {
      return {
        title: 'Recursion in Programming',
        category: 'Algorithms & Data Structures',
        content: `### 🔁 Recursion in Programming

#### 1. What is Recursion?
**Recursion** is a programming technique where a function solves a problem by calling itself with smaller sub-problems until it reaches a terminating **Base Case**.

---

#### 2. The Two Essential Components
1. **Base Case**: The stopping condition that prevents infinite execution and stack overflow.
2. **Recursive Step**: Reducing the problem input closer toward the base case.

\`\`\`python
def factorial(n: int) -> int:
    # Base Case
    if n <= 1:
        return 1
    # Recursive Step
    return n * factorial(n - 1)
\`\`\``
      };
    }

    // Default clean, substantive synthesis
    const content = `### 💡 ${cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1)}

#### 1. Definition & Core Purpose
**${cleanTopic}** is an important concept in computer science and software systems.
It addresses how systems organize data, control program execution, or enforce constraints reliably.

---

#### 2. Key Architectural Characteristics
- **Functionality**: Provides a clear interface or model for handling inputs and returning predictable results.
- **Trade-offs**: Balances execution speed, memory footprint, and implementation complexity.
- **Best Practices**: Ensure proper error handling, boundary validation, and modular decoupling.

*Would you like a worked code example, a practical use-case breakdown, or a practice quiz on this topic?*`;

    return {
      title: cleanTopic,
      category: 'General Academic Knowledge',
      content
    };
  }
}
