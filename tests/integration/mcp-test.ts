import { runMcpIntegrationTests } from './mcp.test.js';

runMcpIntegrationTests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('MCP test runner failed:', err);
    process.exit(1);
  });
