import { runUnitTests } from './unit/services.test.js';
import { runFailureCaseTests } from './unit/failure-cases.test.js';
import { runMcpIntegrationTests } from './integration/mcp.test.js';
import { runE2EDemoWorkflow } from './e2e/demo-workflow.test.js';
import { runExamMentorTests } from './unit/exam-mentor.test.js';
import { runInterviewTests } from './unit/interview.test.js';
import { runQaRegressionTests } from './unit/qa-regression.test.js';

async function main() {
  console.log('========================================================');
  console.log('    NEXUS AI - COMPREHENSIVE AUTOMATED TEST RUNNER     ');
  console.log('========================================================');

  const start = Date.now();

  try {
    await runUnitTests();
    await runFailureCaseTests();
    await runMcpIntegrationTests();
    await runExamMentorTests();
    await runInterviewTests();
    await runQaRegressionTests();
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
