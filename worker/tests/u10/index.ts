import { runDeploymentTests } from './deployment_runner';
import { runEnvironmentTests } from './environment_runner';
import { runAuthSmokeTests } from './auth_smoke_runner';
import { runTenantTests } from './tenant_runner';
import { runLiveSyncTests } from './live_sync_runner';
import { runFailureInjectionTests } from './failure_injection_runner';
import { runRollbackTests } from './rollback_runner';
import { runProductionSmokeTests } from './production_smoke_runner';
import { U10Reporter } from './u10_report';

export async function runU10MasterSuite(): Promise<{ passed: number; failed: number; total: number }> {
  console.log('\n============================================================');
  console.log('STARTING FASE U10: PRODUCTION DEPLOYMENT & LIVE SMOKE TEST SUITE');
  console.log('============================================================\n');

  const reporter = new U10Reporter();

  // 1. Deployment Configuration Tests
  const depResults = await runDeploymentTests();
  reporter.addResults(depResults);

  // 2. Environment & Secret Hardening Tests
  const envResults = await runEnvironmentTests();
  reporter.addResults(envResults);

  // 3. Authentication & RBAC Smoke Tests
  const authResults = await runAuthSmokeTests();
  reporter.addResults(authResults);

  // 4. Multi-Tenant Isolation Tests
  const tenantResults = await runTenantTests();
  reporter.addResults(tenantResults);

  // 5. Outbox Sync & Google Sheets Replica Tests
  const syncResults = await runLiveSyncTests();
  reporter.addResults(syncResults);

  // 6. Failure Injection & Resilience Tests
  const failureResults = await runFailureInjectionTests();
  reporter.addResults(failureResults);

  // 7. Rollback & Disaster Recovery Drill Tests
  const rollbackResults = await runRollbackTests();
  reporter.addResults(rollbackResults);

  // 8. Production Smoke & Operational Readiness Tests
  const smokeResults = await runProductionSmokeTests();
  reporter.addResults(smokeResults);

  return reporter.printReport();
}

if (import.meta.url.endsWith(process.argv[1])) {
  runU10MasterSuite()
    .then(summary => {
      if (summary.failed > 0) {
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Fatal error running U10 master suite:', err);
      process.exit(1);
    });
}
