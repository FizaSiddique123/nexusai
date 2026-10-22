# Alexa+ Track Compliance & MCP Architecture
**Amazon Developer Hackathon 2026 | Track: Alexa+**

## 1. Submission Route Selection

Nexus AI implements a dual-route submission architecture that satisfies both the official Model Context Protocol (MCP) server requirements and the live agentic evaluation standards for the **Alexa+** track:

### Route A: Remote MCP Server (Streamable HTTP Transport)
- **Protocol Specification**: Model Context Protocol (MCP) version `2025-11-25`
- **Transport**: Official `@modelcontextprotocol/sdk` with `StreamableHTTPServerTransport`
- **Endpoint**: `http://localhost:3001/mcp` (or deployed remote HTTPS URL)
- **Capability Discovery**: Standard JSON-RPC 2.0 `tools/list` returns all 22 declared tools with complete JSON schema validation powered by Zod.
- **Tool Invocation**: Handles standard `tools/call` with strict runtime input validation, safe execution timeouts, and structured JSON results.
- **Safe Logging**: No credentials, private tokens, or full un-redacted document contents are ever leaked in server logs.

### Route B: Full-Stack Web Application (Alexa+-Style Agentic Simulation)
- **Interactive UI**: Complete Google Stitch-designed frontend with voice simulation bar (`AlexaVoiceBar`), real-time tool execution stream, interactive timeline, and quiz studio.
- **Authoritative Orchestration**: Multi-step reasoning pipeline that breaks down conversational user goals into atomic actions, verifies execution success at every step, and records authoritative workflow records in persistent SQLite storage.
- **Safety Safeguard**: Consequential external scheduling actions require explicit confirmation ("Approve Schedule" state barrier) before locking sessions into the calendar.

---

## 2. Core Hackathon MCP Tools (Section 3)

The following core tools fulfill the Master Implementation Prompt requirements:

| Tool Identifier | Tool Name | Official Description | Implementation Status |
|---|---|---|---|
| **Tool A** | `search_knowledge` | Retrieves relevant document passages, filenames, page numbers, and BM25-style scores using SQLite FTS5. | **ACTIVE / TESTED** |
| **Tool B** | `extract_important_topics` | Extracts high-priority revision topics grounded in retrieved note excerpts with supporting evidence, page citations, and difficulty ratings. | **ACTIVE / TESTED** |
| **Tool C** | `create_revision_plan` | Synthesizes a realistic, time-aware study plan for a target exam date, breaking study into 45-minute focused blocks with 15-minute breaks and transparent assumptions. | **ACTIVE / TESTED** |
| **Tool D** | `schedule_study_sessions` | Persists study sessions in the database, performs conflict analysis, reports overlaps, and clearly disclaims external calendar alteration without user consent. | **ACTIVE / TESTED** |
| **Tool E** | `generate_quiz` | Generates a mastery quiz grounded in notes, providing question options, correct answer indices, explanations, and source page citations. | **ACTIVE / TESTED** |
| **Tool F** | `get_workflow_status` | Returns authoritative workflow state (`running`, `completed`, `failed`), step breakdown, tool outcomes, and verified persistent SQLite artifacts. | **ACTIVE / TESTED** |

---

## 3. Remote Connectivity & External Alexa+ Integration Details

### OAuth 2.1 & Protected Resource Metadata
In an enterprise production deployment connecting directly to Amazon Alexa+ developer console:
1. **OAuth 2.1 with PKCE**: Authorization Code Grant with Proof Key for Code Exchange (RFC 7636) is supported via the Express session adapter.
2. **Reverse Proxy & HTTPS**: In production, the MCP endpoint is deployed behind an TLS 1.3 reverse proxy (e.g. AWS ALB or Cloudflare) with endpoint verification headers.
3. **Local Testing Without Platform Credentials**: To allow hackathon judges to verify the agent without requiring private Alexa developer accounts or AWS credentials, the server provides:
   - Live HTTP Streamable transport on `/mcp`.
   - Comprehensive automated MCP test client (`npm run test:mcp`).
   - Interactive local frontend simulation simulating Alexa voice inputs.

---

## 4. Verification Evidence

All 22 MCP tools and multi-step agent workflows are verified by automated integration tests:
- `npm test`: Runs unit tests, MCP Streamable HTTP integration tests, and 14-step E2E demo workflow test.
- `npm run test:mcp`: Standalone verification of MCP tool discovery, valid calls, error handling, and session state.
