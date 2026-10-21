import { runUnitTests } from './unit/services.test.js';
import { runMcpIntegrationTests } from './integration/mcp.test.js';
import { runE2EDemoWorkflow } from './e2e/demo-workflow.test.js';

async function main() {
  console.log('========================================================');
  console.log('    NEXUS AI - COMPREHENSIVE AUTOMATED TEST RUNNER     ');
  console.log('========================================================');

  const start = Date.now();

  try {
    await runUnitTests();
    await runMcpIntegrationTests();
    await runE2EDemoWorkflow();

    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`\n🎉 ALL TESTS COMPLETED SUCCESSFULLY IN ${elapsed}s!`);
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ TEST RUN FAILED:', error);
    process.exit(1);
  }
}

main();
