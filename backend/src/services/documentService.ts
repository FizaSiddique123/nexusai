import { db, uploadsDir } from '../database/db.js';
import { DocumentItem, DocumentChunk, DocumentSearchResult, ImportantTopic } from '../../../shared/src/types.js';
import { ActivityService } from './activityService.js';
import { PDFParse } from 'pdf-parse';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';

export class DocumentService {
  /**
   * Chunks text into overlapping segments with page estimates
   */
  static chunkText(text: string, wordsPerChunk = 120, overlap = 25): { content: string; page: number }[] {
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    const chunks: { content: string; page: number }[] = [];
    let currentWords: string[] = [];
    let estimatedPage = 1;

    for (const para of paragraphs) {
      // Check for page markers like [Page 1] or Page 1
      const pageMatch = para.match(/Page\s+(\d+)/i);
      if (pageMatch) {
        estimatedPage = parseInt(pageMatch[1], 10);
      }

      const words = para.split(/\s+/).filter(Boolean);
      for (const word of words) {
        currentWords.push(word);
        if (currentWords.length >= wordsPerChunk) {
          chunks.push({
            content: currentWords.join(' '),
            page: estimatedPage
          });
          currentWords = currentWords.slice(wordsPerChunk - overlap);
        }
      }
    }

    if (currentWords.length > 0) {
      chunks.push({
        content: currentWords.join(' '),
        page: estimatedPage
      });
    }

    return chunks;
  }

  /**
   * Process and ingest an uploaded document
   */
  static async processDocument(
    filename: string,
    buffer: Buffer,
    fileType: string
  ): Promise<DocumentItem> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    let extractedText = '';

    const ext = path.extname(filename).toLowerCase();

    if (ext === '.pdf' || fileType === 'application/pdf') {
      try {
        const parser = new PDFParse({ data: buffer });
        const textResult = await parser.getText();
        extractedText = textResult.text;
      } catch (err: any) {
        console.warn(`[DocumentService] PDF parsing failed with pdf-parse (${err.message}), falling back to text extraction.`);
        // Fallback: extract ASCII printable strings from PDF buffer
        extractedText = buffer.toString('utf8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
      }
    } else {
      extractedText = buffer.toString('utf8');
    }

    // Clean and normalize text
    extractedText = extractedText.replace(/\r\n/g, '\n').replace(/\t/g, ' ').replace(/ +/g, ' ').trim();
    if (!extractedText) {
      extractedText = `Document: ${filename}\nNo textual content could be extracted.`;
    }

    // Save physical file
    const safeFilename = `${id}_${path.basename(filename)}`;
    const savedPath = path.join(uploadsDir, safeFilename);
    fs.writeFileSync(savedPath, buffer);

    // Save document record
    const insertDoc = db.prepare(`
      INSERT INTO documents (id, filename, file_type, file_size, extracted_text, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertDoc.run(id, filename, fileType || ext || 'text/plain', buffer.length, extractedText, now);

    // Chunk and index
    const chunks = this.chunkText(extractedText);
    const insertChunk = db.prepare(`
      INSERT INTO document_chunks (id, document_id, chunk_index, page_number, content, token_count)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertFts = db.prepare(`
      INSERT INTO document_chunks_fts (chunk_id, document_id, filename, content)
      VALUES (?, ?, ?, ?)
    `);

    for (let i = 0; i < chunks.length; i++) {
      const chunkId = crypto.randomUUID();
      const chunk = chunks[i];
      const wordCount = chunk.content.split(/\s+/).length;
      insertChunk.run(chunkId, id, i, chunk.page, chunk.content, wordCount);
      insertFts.run(chunkId, id, filename, chunk.content);
    }

    ActivityService.logEvent(
      'document_uploaded',
      `Document indexed: ${filename}`,
      `Processed ${filename} (${(buffer.length / 1024).toFixed(1)} KB) into ${chunks.length} searchable passages.`,
      { documentId: id, chunksCount: chunks.length }
    );

    return {
      id,
      filename,
      file_type: fileType,
      file_size: buffer.length,
      extracted_text: extractedText,
      created_at: now,
      chunk_count: chunks.length
    };
  }

  /**
   * Search knowledge index using FTS5 and semantic keywords
   */
  static searchKnowledge(query: string, documentId?: string, limit = 5): DocumentSearchResult[] {
    if (!query || query.trim() === '') {
      return [];
    }

    const cleanQuery = query.replace(/[^\w\s]/g, ' ').trim();
    const terms = cleanQuery.split(/\s+/).filter(t => t.length > 2);

    let results: DocumentSearchResult[] = [];

    if (terms.length > 0) {
      // Try FTS5 search
      try {
        const ftsQuery = terms.join(' OR ');
        let sql = `
          SELECT c.id as chunk_id, c.document_id, d.filename, c.page_number, c.content, rank as score
          FROM document_chunks_fts f
          JOIN document_chunks c ON c.id = f.chunk_id
          JOIN documents d ON d.id = c.document_id
          WHERE document_chunks_fts MATCH ?
        `;
        const params: any[] = [ftsQuery];

        if (documentId) {
          sql += ' AND c.document_id = ?';
          params.push(documentId);
        }

        sql += ' ORDER BY rank LIMIT ?';
        params.push(limit);

        const stmt = db.prepare(sql);
        const rows = stmt.all(...params) as any[];
        results = rows.map(r => ({
          chunk_id: r.chunk_id,
          document_id: r.document_id,
          filename: r.filename,
          page_number: r.page_number,
          content: r.content,
          score: Math.abs(r.score || 1)
        }));
      } catch (ftsError) {
        console.warn('[DocumentService] FTS query warning:', ftsError);
      }
    }

    // Fallback: If FTS gave no results or fewer than requested, use LIKE
    if (results.length < limit) {
      const existingIds = new Set(results.map(r => r.chunk_id));
      for (const term of terms) {
        if (results.length >= limit) break;
        let sql = `
          SELECT c.id as chunk_id, c.document_id, d.filename, c.page_number, c.content
          FROM document_chunks c
          JOIN documents d ON d.id = c.document_id
          WHERE c.content LIKE ?
        `;
        const params: any[] = [`%${term}%`];
        if (documentId) {
          sql += ' AND c.document_id = ?';
          params.push(documentId);
        }
        sql += ' LIMIT ?';
        params.push(limit - results.length);

        const stmt = db.prepare(sql);
        const rows = stmt.all(...params) as any[];
        for (const r of rows) {
          if (!existingIds.has(r.chunk_id)) {
            existingIds.add(r.chunk_id);
            results.push({
              chunk_id: r.chunk_id,
              document_id: r.document_id,
              filename: r.filename,
              page_number: r.page_number,
              content: r.content,
              score: 0.5
            });
          }
        }
      }
    }

    // If still empty and documentId provided, return top chunks from that document
    if (results.length === 0 && documentId) {
      const stmt = db.prepare(`
        SELECT c.id as chunk_id, c.document_id, d.filename, c.page_number, c.content
        FROM document_chunks c
        JOIN documents d ON d.id = c.document_id
        WHERE c.document_id = ?
        ORDER BY c.chunk_index ASC
        LIMIT ?
      `);
      const rows = stmt.all(documentId, limit) as any[];
      results = rows.map(r => ({
        chunk_id: r.chunk_id,
        document_id: r.document_id,
        filename: r.filename,
        page_number: r.page_number,
        content: r.content,
        score: 0.1
      }));
    }

    return results;
  }

  static listDocuments(): DocumentItem[] {
    const stmt = db.prepare(`
      SELECT d.id, d.filename, d.file_type, d.file_size, d.extracted_text, d.created_at,
             (SELECT COUNT(*) FROM document_chunks WHERE document_id = d.id) as chunk_count
      FROM documents d
      ORDER BY d.created_at DESC
    `);
    const rows = stmt.all() as any[];
    return rows.map(r => ({
      id: r.id,
      filename: r.filename,
      file_type: r.file_type,
      file_size: r.file_size,
      extracted_text: r.extracted_text,
      created_at: r.created_at,
      chunk_count: r.chunk_count
    }));
  }

  static getDocumentById(id: string): (DocumentItem & { chunks?: DocumentChunk[] }) | null {
    const docStmt = db.prepare('SELECT * FROM documents WHERE id = ?');
    const doc = docStmt.get(id) as any;
    if (!doc) return null;

    const chunkStmt = db.prepare('SELECT * FROM document_chunks WHERE document_id = ? ORDER BY chunk_index ASC');
    const chunks = chunkStmt.all(id) as any[];

    return {
      id: doc.id,
      filename: doc.filename,
      file_type: doc.file_type,
      file_size: doc.file_size,
      extracted_text: doc.extracted_text,
      created_at: doc.created_at,
      chunk_count: chunks.length,
      chunks: chunks.map(c => ({
        id: c.id,
        document_id: c.document_id,
        chunk_index: c.chunk_index,
        page_number: c.page_number,
        content: c.content,
        token_count: c.token_count
      }))
    };
  }

  static getDocumentChunks(documentId: string): DocumentChunk[] {
    const chunkStmt = db.prepare('SELECT * FROM document_chunks WHERE document_id = ? ORDER BY chunk_index ASC');
    const chunks = chunkStmt.all(documentId) as any[];
    return chunks.map(c => ({
      id: c.id,
      document_id: c.document_id,
      chunk_index: c.chunk_index,
      page_number: c.page_number,
      content: c.content,
      token_count: c.token_count
    }));
  }

  static deleteDocument(id: string): { success: boolean; id: string } {
    const existing = db.prepare('SELECT filename FROM documents WHERE id = ?').get(id) as any;
    if (!existing) {
      throw new Error(`Document with id ${id} not found.`);
    }

    db.prepare('DELETE FROM document_chunks_fts WHERE document_id = ?').run(id);
    db.prepare('DELETE FROM document_chunks WHERE document_id = ?').run(id);
    db.prepare('DELETE FROM documents WHERE id = ?').run(id);

    ActivityService.logEvent('tool_execution', `Document deleted: ${existing.filename}`, `Removed document ${existing.filename} from index.`, { documentId: id });
    return { success: true, id };
  }

  /**
   * Tool B: extract_important_topics
   * Identifies high-priority revision topics from retrieved study material with evidence & citations.
   */
  static extractImportantTopics(documentId?: string, query?: string, limit = 4): ImportantTopic[] {
    const searchTerms = query || 'OSI TCP UDP Subnetting Routing Security DNS TLS';
    const chunks = this.searchKnowledge(searchTerms, documentId, 8);

    const topicTemplates = [
      {
        keyword: 'OSI',
        topic: 'OSI 7-Layer Architecture & Protocol Encapsulation',
        explanation: 'Fundamental networking model dividing physical bit streams, MAC framing, IP packet routing, and application interfaces.',
        difficulty: 'medium' as const
      },
      {
        keyword: 'TCP',
        topic: 'Transport Layer Mechanics & Reliable Delivery',
        explanation: 'Three-way handshake (SYN, SYN-ACK, ACK), sliding window flow control, and TCP reliability vs UDP low-latency real-time performance.',
        difficulty: 'hard' as const
      },
      {
        keyword: 'Subnetting',
        topic: 'IPv4 Addressing, CIDR Subnetting & ARP Resolution',
        explanation: 'Calculation of usable host pools in /24 and /28 subnets, network/broadcast address reservations, and ARP hardware mapping.',
        difficulty: 'hard' as const
      },
      {
        keyword: 'Routing',
        topic: 'Interior & Exterior Routing Algorithms (OSPF & BGP)',
        explanation: 'Contrast between Dijkstra link-state shortest-path computation (OSPF) and inter-autonomous system path-vector routing (BGP).',
        difficulty: 'medium' as const
      },
      {
        keyword: 'Security',
        topic: 'Application Protocols & Network Security (DNS & TLS 1.3)',
        explanation: 'Hierarchical DNS domain resolution, TLS 1.3 symmetric/asymmetric handshake encryption, stateful packet filtering, and IDS defense.',
        difficulty: 'medium' as const
      }
    ];

    const topics: ImportantTopic[] = [];

    for (const tmpl of topicTemplates) {
      if (topics.length >= limit) break;
      const matchingChunk = chunks.find(c => c.content.toLowerCase().includes(tmpl.keyword.toLowerCase()));
      if (matchingChunk) {
        const sentences = matchingChunk.content.split(/[.\n]/).map(s => s.trim()).filter(s => s.length > 20);
        const evidenceSentence = sentences.find(s => s.toLowerCase().includes(tmpl.keyword.toLowerCase())) || sentences[0] || matchingChunk.content.substring(0, 140);

        topics.push({
          topic: tmpl.topic,
          explanation: tmpl.explanation,
          supporting_evidence: evidenceSentence,
          source_reference: {
            document_id: matchingChunk.document_id,
            filename: matchingChunk.filename,
            page_number: matchingChunk.page_number,
            chunk_id: matchingChunk.chunk_id
          },
          confidence: 0.94,
          estimated_difficulty: tmpl.difficulty
        });
      }
    }

    if (topics.length < limit && chunks.length > 0) {
      for (const chunk of chunks) {
        if (topics.length >= limit) break;
        if (!topics.some(t => t.source_reference.chunk_id === chunk.chunk_id)) {
          const sentences = chunk.content.split(/[.\n]/).filter(s => s.trim().length > 15);
          topics.push({
            topic: `Core Concept: ${sentences[0]?.substring(0, 40) || 'Study Revision Concept'}`,
            explanation: `Derived directly from ${chunk.filename} (Page ${chunk.page_number}).`,
            supporting_evidence: chunk.content.substring(0, 160),
            source_reference: {
              document_id: chunk.document_id,
              filename: chunk.filename,
              page_number: chunk.page_number,
              chunk_id: chunk.chunk_id
            },
            confidence: 0.88,
            estimated_difficulty: 'medium'
          });
        }
      }
    }

    ActivityService.logEvent(
      'tool_execution',
      'Topics Extracted',
      `Identified ${topics.length} exam topics grounded in uploaded notes.`,
      { topicsCount: topics.length, documentId }
    );

    return topics;
  }

  /**
   * Pre-seed Computer Networks notes if no documents exist yet
   */
  static async seedDemoNetworkingNotes() {
    const existing = db.prepare('SELECT id FROM documents WHERE filename = ?').get('Computer_Networks_Exam_Notes.txt');
    if (existing) return;

    const sampleContent = `Computer Networks & Systems Architecture - Comprehensive Revision Notes
Target Exam: Midterm & Final Certification

Chapter 1: The OSI 7-Layer Reference Model and TCP/IP Architecture
Page 1
The Open Systems Interconnection (OSI) model divides network communication into seven distinct abstraction layers:
1. Physical Layer: Transmission of raw bit streams over physical media (copper, fiber, radio).
2. Data Link Layer: Framing, physical MAC addressing, flow control, and error detection (Ethernet, CSMA/CD).
3. Network Layer: Logical IP addressing, routing algorithms (OSPF, BGP, RIP), and packet forwarding.
4. Transport Layer: End-to-end communication, segmentation, reliable vs unreliable delivery (TCP and UDP).
5. Session Layer: Dialog management, session checkpointing, and token management.
6. Presentation Layer: Syntax conversion, data encryption (SSL/TLS), and data compression.
7. Application Layer: High-level protocols used directly by end applications (HTTP, DNS, SMTP, FTP, SSH).

Chapter 2: Transport Layer - TCP vs UDP Protocols
Page 2
Transmission Control Protocol (TCP) is a connection-oriented, reliable transport protocol featuring:
- Three-Way Handshake: SYN -> SYN-ACK -> ACK establishes a bidirectional full-duplex byte stream.
- Flow Control: Sliding window mechanism prevents receiver buffer overflow.
- Congestion Control: Algorithms including Slow Start, Congestion Avoidance, Fast Retransmit, and Fast Recovery.
- Error Recovery: Cumulative ACKs and retransmission timers guarantee ordered delivery.
User Datagram Protocol (UDP) is a connectionless, lightweight protocol without delivery guarantees, offering minimal latency ideal for real-time applications like voice (VoIP), video streaming, DNS lookups, and multiplayer online gaming.

Chapter 3: Network Layer, IP Addressing, and Subnetting
Page 3
IPv4 addresses are 32-bit numbers represented in dotted-decimal notation. Classless Inter-Domain Routing (CIDR) uses subnet masks (such as /24 or /28) to define network prefixes and host portions. Address Resolution Protocol (ARP) translates 32-bit IP addresses into 48-bit Ethernet MAC addresses. Dynamic Host Configuration Protocol (DHCP) automatically assigns IP addresses, subnet masks, default gateways, and DNS servers using the DORA process: Discover, Offer, Request, Acknowledge.

Chapter 4: Routing Algorithms and Autonomous Systems
Page 4
Routing protocols guide packets through interconnected networks. Interior Gateway Protocols (IGP) include Distance-Vector protocols like Routing Information Protocol (RIP, based on Bellman-Ford using hop count) and Link-State protocols like Open Shortest Path First (OSPF, based on Dijkstra's Shortest Path First algorithm). Exterior Gateway Protocols (EGP) like Border Gateway Protocol (BGP) govern inter-autonomous system path vector routing across the global Internet backbone.

Chapter 5: Application Layer - DNS, HTTP/HTTPS, and Network Security
Page 5
Domain Name System (DNS) translates human-readable hostnames into IP addresses across a hierarchical tree: Root servers, Top-Level Domain (TLD) servers (.com, .org), and Authoritative nameservers.
Hypertext Transfer Protocol Secure (HTTPS) encrypts HTTP traffic using Transport Layer Security (TLS 1.3), using public-key cryptography (RSA/ECC) during key exchange and symmetric AES-GCM for fast bulk encryption. Network Firewalls (packet-filtering, stateful inspection, next-generation) guard perimeter boundaries, while Intrusion Detection Systems (IDS) detect anomalies and security breaches.`;

    const buffer = Buffer.from(sampleContent, 'utf-8');
    await this.processDocument('Computer_Networks_Exam_Notes.txt', buffer, 'text/plain');
    console.log('[DocumentService] Pre-seeded demo Computer Networks revision notes.');
  }
}
