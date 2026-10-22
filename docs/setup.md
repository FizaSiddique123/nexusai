# Nexus AI - Setup and Deployment Guide

## Prerequisites

- **Node.js**: `v20.0.0` or later (`v24.15.0+` recommended)
- **Package Manager**: `npm` v10+
- **OS**: Windows, macOS, or Linux

---

## Quick Start (Development Mode)

1. **Clone and Install Root Dependencies**:
   ```bash
   npm install
   ```

2. **Install Frontend Dependencies**:
   ```bash
   npm --prefix frontend install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *(Note: The system functions 100% offline out-of-the-box with default settings).*

4. **Run Both Backend and Frontend**:
   ```bash
   npm run dev
   ```
   - **Frontend UI**: `http://localhost:5173`
   - **Backend REST API**: `http://localhost:3001/api`
   - **MCP Streamable HTTP Endpoint**: `http://localhost:3001/mcp`

---

## Running Automated Tests

Nexus AI includes a comprehensive test runner executing unit tests, MCP protocol tests, and the primary demonstration E2E workflow:

```bash
npm test
```

---

## Production Build and Serving

1. **Build Frontend**:
   ```bash
   npm run build
   ```
2. **Start Backend Server** (which automatically serves the production frontend bundle):
   ```bash
   node backend/src/server.ts
   # or with tsx:
   npx tsx backend/src/server.ts
   ```
   The complete application will be served at `http://localhost:3001`.

---

## Deployment Notes

- **Persistent Storage**: Ensure the `./data` directory is mounted on a persistent volume if deploying on Docker, AWS ECS, or Fly.io so that `nexusai.db` and uploaded files in `data/uploads/` persist across redeployments.
- **Port**: Configured via the `PORT` environment variable (defaults to `3001`).
- **CORS**: Configured with permissive origins for flexible deployment topologies.
