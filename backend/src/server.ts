import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { initDatabase } from './database/db.js';
import { createNexusMcpServer, createMcpStreamableTransport } from './mcp/mcpServer.js';
import { apiRouter } from './api/routes.js';
import { DocumentService } from './services/documentService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'mcp-session-id']
}));

// Setup MCP Streamable HTTP Transport
const mcpServer = createNexusMcpServer();
const mcpTransport = createMcpStreamableTransport();

mcpServer.connect(mcpTransport).then(() => {
  console.log('[MCP Server] Connected to Streamable HTTP Transport.');
}).catch(err => {
  console.error('[MCP Server] Connection failed:', err);
});

// MCP Endpoint: handle GET, POST, DELETE via Streamable HTTP Transport
app.all('/mcp', async (req, res) => {
  try {
    await mcpTransport.handleRequest(req, res);
  } catch (err: any) {
    console.error('[MCP Transport Error]:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

// JSON body parser for REST API routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// REST API routes
app.use('/api', apiRouter);

// Serve frontend in production build if present
const frontendDist = path.resolve(process.cwd(), 'frontend', 'dist');
app.use(express.static(frontendDist));
// Catch-all route to serve frontend index.html
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/mcp')) {
    return next();
  }
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('Nexus AI Server is running. Frontend dev server is on port 5173.');
    }
  });
});

async function startServer() {
  try {
    // Initialize DB
    initDatabase();
    // Seed demo notes for immediate hackathon verification
    await DocumentService.seedDemoNetworkingNotes();

    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 NEXUS AI Server running on http://localhost:${PORT}`);
      console.log(`📡 MCP Streamable HTTP Endpoint: http://localhost:${PORT}/mcp`);
      console.log(`🔌 REST API Base URL: http://localhost:${PORT}/api`);
      console.log(`====================================================`);
    });

    return server;
  } catch (err) {
    console.error('Fatal error starting Nexus AI server:', err);
    process.exit(1);
  }
}

// Start if executed directly
if (process.argv[1]?.includes('server.ts') || process.argv[1]?.includes('server.js')) {
  startServer();
}

export { app, startServer };
