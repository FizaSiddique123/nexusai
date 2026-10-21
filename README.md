# NEXUS AI

**Amazon Developer Hackathon 2026** | **Primary Track:** Alexa+  
**Tagline:** *One Conversation. Multiple Tools. Real-World Actions.*

---

## 🌟 Executive Summary

**Nexus AI** is a full-stack, context-aware AI productivity agent powered by the **Model Context Protocol (MCP)** specification (Version `2025-11-25`). 

Unlike simple chat interfaces or static UI mockups, Nexus AI coordinates a complete, functional backend with an official TypeScript MCP server communicating over **Streamable HTTP Transport**. Through natural conversation or simulated Alexa+ voice commands, Nexus AI retrieves uploaded course notes, identifies core topics, schedules balanced study sessions with conflict detection, generates practice quizzes, and persists all changes in an ACID-compliant SQLite database with Full-Text Search (FTS5).

---

## 🎯 Primary Demonstration Scenario

A student uploads Computer Networks revision notes and asks:

> *"Analyse my notes, identify the important topics, create a revision plan for my upcoming exam, schedule my study sessions, and generate a quiz."*

**Nexus AI autonomously executes this workflow end-to-end:**
1. **Passage Retrieval**: Searches indexed document passages using SQLite FTS5 for topics (OSI, TCP/UDP, Subnetting, Routing).
2. **Task Creation**: Creates 4 high-priority study tasks with estimated durations.
3. **Schedule Generation**: Assembles a 4-hour revision plan with 15-minute rest breaks.
4. **Conflict Validation**: Checks time ranges and verifies zero overlaps.
5. **Approval Safeguard**: Marks schedule as `proposed` and requests user confirmation before locking the timeline.
6. **Quiz Synthesis**: Synthesizes a 10-question MCQ quiz grounded directly in the retrieved notes.
7. **Interactive Assessment**: User completes the quiz, receives immediate percentage scoring and question-by-question rationales.
8. **Persistence Across Sessions**: All tasks, schedules, and quiz attempts survive server restarts and browser reloads.

---

## 🛠️ Architecture Overview

```
nexusai/
├── backend/
│   ├── src/
│   │   ├── agent/          # Multi-step Agent Orchestrator & Reasoning Engine
│   │   ├── api/            # Express REST Endpoints
│   │   ├── database/       # SQLite WAL DB with FTS5 virtual tables
│   │   ├── mcp/            # Official MCP Server (Streamable HTTP Transport)
│   │   ├── services/       # Unified Shared Service Layer (Tasks, Docs, Planner, Quizzes)
│   │   └── server.ts       # Main Express & MCP Entrypoint
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Sidebar, Header, AlexaVoiceBar
│   │   ├── pages/          # Dashboard, Assistant, KnowledgeBase, Tasks, Planner, Quizzes, History, Settings
│   │   ├── services/       # Typed API client
│   │   ├── styles/         # Pure CSS Design System (theme.css, zero Tailwind)
│   │   └── App.tsx
│   └── vite.config.ts
├── shared/
│   └── src/types.ts        # Shared TypeScript interfaces
├── tests/
│   ├── unit/               # Service & DB Unit Tests
│   ├── integration/        # MCP Client/Server Streamable HTTP Tests
│   ├── e2e/                # Primary 14-Step Demo Workflow Test
│   └── run-all-tests.ts    # Master Test Runner
├── docs/
│   ├── architecture.md     # In-depth architectural design
│   ├── mcp-testing.md      # Testing guide with curl & SDK examples
│   └── setup.md            # Detailed setup instructions
├── .env.example            # Safe environment template
└── README.md
```

---

## 📡 The 17 MCP Tools Implemented

All tools are implemented in `backend/src/mcp/mcpServer.ts` using the official `@modelcontextprotocol/sdk` and share the backend service layer:

| # | Tool Name | Parameters | Purpose |
|---|---|---|---|
| 1 | `search_knowledge` | `query`, `document_id?`, `limit?` | Searches indexed notes using SQLite FTS5 with score ranking |
| 2 | `list_documents` | None | Returns metadata and chunk counts for all uploaded notes |
| 3 | `get_document_content` | `document_id` | Fetches extracted text and structured passages |
| 4 | `create_task` | `title`, `description?`, `deadline?`, `priority?`, `estimated_duration?` | Adds actionable revision task to SQLite |
| 5 | `get_tasks` | `status?`, `priority?`, `search?` | Queries tasks with filter criteria and stats |
| 6 | `update_task` | `task_id`, `fields...` | Modifies existing task attributes |
| 7 | `complete_task` | `task_id` | Marks task status as completed |
| 8 | `delete_task` | `task_id` | Deletes task with confirmation policy |
| 9 | `generate_schedule` | `date?`, `available_time?`, `task_ids?`, `status?` | Optimizes study blocks with rest intervals |
| 10 | `get_schedule` | `date_or_id?` | Retrieves active or proposed schedule |
| 11 | `update_schedule` | `schedule_id`, `title?`, `status?`, `sessions?` | Updates timeline or approves proposed schedule |
| 12 | `check_schedule_conflicts` | `sessions: Array<{start, end}>` | Validates time blocks and reports overlapping sessions |
| 13 | `create_quiz` | `topic_or_doc_id`, `question_count?`, `difficulty?` | Generates MCQ quiz from notes |
| 14 | `submit_quiz_answers` | `quiz_id`, `submitted_answers: Record<string, number>` | Grades answers, computes percentage, stores attempt |
| 15 | `get_quiz_results` | `quiz_id` | Returns questions, past attempts, and answer rationales |
| 16 | `save_preference` | `preference_key`, `preference_value` | Persists user study routine preferences |
| 17 | `retrieve_preferences` | None | Retrieves saved user configuration |

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: `v20.0.0` or higher (`v24.15.0+` tested)
- **npm**: `v10.0.0` or higher

### 2. Installation
```bash
# Install root dependencies
npm install

# Install frontend dependencies
npm --prefix frontend install
```

### 3. Running Locally (Development Mode)
```bash
npm run dev
```
- **Frontend Web UI**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3001/api](http://localhost:3001/api)
- **MCP Endpoint**: [http://localhost:3001/mcp](http://localhost:3001/mcp)

*(Pre-seeded with demo Computer Networks notes on first launch so the primary workflow works immediately without manual file hunting).*

---

## 🧪 Automated Testing

Run the automated test suite covering unit tests, genuine MCP tool discovery/invocation, and the full 14-step primary demonstration workflow:

```bash
npm test
```

### Verified Test Results:
```
========================================================
    NEXUS AI - COMPREHENSIVE AUTOMATED TEST RUNNER     
========================================================

--- Running Unit Tests ---
1. Testing Task Management CRUD...
   ✓ Task Service passed
2. Testing Document & FTS5 Search...
   ✓ Document Ingestion & FTS5 Search passed
3. Testing Schedule Generation & Conflicts...
   ✓ Schedule Service & Conflict Detection passed
4. Testing Quiz Generation & Scoring...
   ✓ Quiz Service & Scoring passed
5. Testing User Preferences...
   ✓ Preference Service passed
--- All Unit Tests Passed Successfully! ---

--- Running MCP Integration Tests ---
1. Connecting MCP Client via Streamable HTTP Transport...
   ✓ Connected. Session ID: 5c7e26c3-0339-4f7d-b908-b74bd81a4684
2. Discovering MCP Tools...
   ✓ Discovered 17 MCP tools.
   ✓ All 17 required MCP tools verified!
3. Testing MCP Tool Call: create_task...
   ✓ create_task executed successfully.
4. Testing MCP Tool Call: get_tasks...
   ✓ get_tasks returned tasks.
5. Testing MCP Tool Call: search_knowledge...
   ✓ search_knowledge returned 2 results.
6. Testing MCP Tool Call: generate_schedule...
   ✓ generate_schedule created proposed schedule.
7. Testing MCP Tool Call: retrieve_preferences...
   ✓ retrieve_preferences succeeded.
8. Testing MCP Input Validation Error Handling...
   ✓ Input validation properly rejected invalid enum argument.
--- All MCP Integration Tests Passed! ---

======================================================
--- Running Primary Demonstration Workflow (E2E) ---
======================================================
STEP 1 & 2: Ingesting and indexing Computer Networks exam notes...
STEP 3: User Prompt: "Analyse my notes, identify the important topics..."
STEP 4-8: AI Agent multi-tool orchestration executing...
STEP 9: User approves the proposed revision schedule...
STEP 10: User completes the generated practice quiz...
STEP 11 & 12: Verifying database persistence across session restart...
STEP 13 & 14: Revising existing schedule with adjusted timing...

🎉 ALL TESTS COMPLETED SUCCESSFULLY!
```

---

## 🔒 Security & Safe Execution
- **Zero Exposed Secrets**: No hardcoded API keys exist in frontend or Git history.
- **SQL Injection Prevention**: All SQLite queries utilize parameterized statements (`db.prepare(sql).run(...)`).
- **Destructive Action Confirmation**: Deleting tasks and documents requires explicit user confirmation.
- **File Upload Limits**: Restricted to 25MB with file-type whitelisting (`.pdf`, `.txt`, `.md`).
- **Offline Reliability**: The agent features a built-in deterministic multi-tool reasoning engine for offline hackathon evaluations, with optional external LLM integration via `.env`.

---

## 🏆 Hackathon Compliance Checklist

- [x] **Polished React frontend** (Responsive, dark-first, clean CSS design system, zero Tailwind).
- [x] **Functional Node.js backend** (Express 5, shared service layer).
- [x] **Official TypeScript MCP server** (`@modelcontextprotocol/sdk`).
- [x] **MCP Specification Version `2025-11-25`** verified.
- [x] **Streamable HTTP transport** implemented on `/mcp`.
- [x] **17 MCP tools** implemented with Zod validation.
- [x] **Persistent SQLite database** (`data/nexusai.db` with WAL mode).
- [x] **RAG retrieval with FTS5** indexing and source attribution.
- [x] **Complete 14-step primary demonstration scenario** verified by automated E2E test.
- [x] **Zero broken buttons or placeholder navigation links**.
