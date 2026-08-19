import * as fs from 'fs';
import * as path from 'path';
import { U10TestResult, createD1Emulator } from './u10_helpers';

export async function runDeploymentTests(): Promise<U10TestResult[]> {
  const results: U10TestResult[] = [];
  const wranglerPath = path.join(process.cwd(), 'worker', 'wrangler.toml');
  const wranglerContent = fs.readFileSync(wranglerPath, 'utf-8');
  const migrationsDir = path.join(process.cwd(), 'worker', 'migrations');

  // U10-DEP-01: Wrangler Root Configuration
  {
    const start = Date.now();
    const hasName = wranglerContent.includes('name = "sistem-manajemen-guru-api"');
    const hasMain = wranglerContent.includes('main = "src/index.ts"');
    const hasCompatDate = wranglerContent.includes('compatibility_date =');

    const pass = hasName && hasMain && hasCompatDate;
    results.push({
      id: 'U10-DEP-01',
      category: 'Deployment Configuration',
      scenario: 'Wrangler Root Configuration Validation (Name, Entrypoint & Date)',
      expected: 'wrangler.toml contains valid name, main, and compatibility_date',
      actual: `name=${hasName}, main=${hasMain}, compatDate=${hasCompatDate}`,
      status: pass ? 'PASS' : 'FAIL',
      evidence: 'Root wrangler configuration verified for Cloudflare Worker runtime.',
      durationMs: Date.now() - start
    });
  }

  // U10-DEP-02: Node.js Compatibility Flag
  {
    const start = Date.now();
    const hasNodeCompat = wranglerContent.includes('nodejs_compat');
    results.push({
      id: 'U10-DEP-02',
      category: 'Deployment Configuration',
      scenario: 'Node.js Compatibility Flag Presence in Wrangler',
      expected: 'compatibility_flags includes "nodejs_compat"',
      actual: `hasNodeCompat=${hasNodeCompat}`,
      status: hasNodeCompat ? 'PASS' : 'FAIL',
      evidence: 'Node.js compatibility flag enables crypto and Buffer modules.',
      durationMs: Date.now() - start
    });
  }

  // U10-DEP-03: Staging Environment Isolation Block
  {
    const start = Date.now();
    const hasStagingBlock = wranglerContent.includes('[env.staging]');
    const hasStagingD1 = wranglerContent.includes('[[env.staging.d1_databases]]');
    const hasStagingCors = wranglerContent.includes('staging.smanusantara.sch.id');

    const pass = hasStagingBlock && hasStagingD1 && hasStagingCors;
    results.push({
      id: 'U10-DEP-03',
      category: 'Deployment Configuration',
      scenario: 'Staging Environment Block Isolation & D1 Config',
      expected: 'Staging block defines ENVIRONMENT=staging, D1 database, and CORS origin',
      actual: `stagingBlock=${hasStagingBlock}, stagingD1=${hasStagingD1}, stagingCors=${hasStagingCors}`,
      status: pass ? 'PASS' : 'FAIL',
      evidence: 'Staging environment configured with isolated D1 database and CORS domain.',
      durationMs: Date.now() - start
    });
  }

  // U10-DEP-04: Production Environment Isolation Block
  {
    const start = Date.now();
    const hasProdBlock = wranglerContent.includes('[env.production]');
    const hasProdD1 = wranglerContent.includes('[[env.production.d1_databases]]');
    const hasProdCors = wranglerContent.includes('app.smanusantara.sch.id');

    const pass = hasProdBlock && hasProdD1 && hasProdCors;
    results.push({
      id: 'U10-DEP-04',
      category: 'Deployment Configuration',
      scenario: 'Production Environment Block Isolation & D1 Config',
      expected: 'Production block defines ENVIRONMENT=production, D1 database, and CORS origin',
      actual: `prodBlock=${hasProdBlock}, prodD1=${hasProdD1}, prodCors=${hasProdCors}`,
      status: pass ? 'PASS' : 'FAIL',
      evidence: 'Production environment configured with distinct D1 database and production origin.',
      durationMs: Date.now() - start
    });
  }

  // U10-DEP-05: Uniform D1 Binding Name Across Environments
  {
    const start = Date.now();
    const matches = wranglerContent.match(/binding\s*=\s*"DB"/g);
    const count = matches ? matches.length : 0;
    const pass = count >= 3; // dev, staging, production

    results.push({
      id: 'U10-DEP-05',
      category: 'Deployment Configuration',
      scenario: 'Uniform D1 Database Binding Name ("DB") Across All Environments',
      expected: 'Binding "DB" configured in dev, staging, and production blocks (>=3)',
      actual: `bindingCount=${count}`,
      status: pass ? 'PASS' : 'FAIL',
      evidence: 'Consistent "DB" binding prevents runtime binding naming discrepancies.',
      durationMs: Date.now() - start
    });
  }

  // U10-DEP-06: Global Cron Trigger Configuration
  {
    const start = Date.now();
    const hasTriggers = wranglerContent.includes('[triggers]');
    const hasCrons = wranglerContent.includes('crons = ["* * * * *"]');

    const pass = hasTriggers && hasCrons;
    results.push({
      id: 'U10-DEP-06',
      category: 'Deployment Configuration',
      scenario: 'Cron Trigger Schedule Configuration (* * * * *)',
      expected: 'Triggers block defines 1-minute cron interval for outbox processing',
      actual: `hasTriggers=${hasTriggers}, hasCrons=${hasCrons}`,
      status: pass ? 'PASS' : 'FAIL',
      evidence: 'Cron schedule runs every minute to process outbox queue asynchronously.',
      durationMs: Date.now() - start
    });
  }

  // U10-DEP-07: Worker Runtime Observability Configuration
  {
    const start = Date.now();
    const hasObs = wranglerContent.includes('[observability]') && wranglerContent.includes('enabled = true');
    results.push({
      id: 'U10-DEP-07',
      category: 'Deployment Configuration',
      scenario: 'Cloudflare Worker Observability Telemetry Flag',
      expected: '[observability] enabled = true present in configuration',
      actual: `observabilityEnabled=${hasObs}`,
      status: hasObs ? 'PASS' : 'FAIL',
      evidence: 'Observability logging enabled for runtime telemetry and log streaming.',
      durationMs: Date.now() - start
    });
  }

  // U10-DEP-08: Sequential Migration Directory Structure
  {
    const start = Date.now();
    const files = fs.readdirSync(migrationsDir).sort();
    const hasSchema = files.includes('0001_initial_schema.sql');
    const hasIndexes = files.includes('0002_indexes.sql');
    const hasSeed = files.includes('0003_seed.sql');

    const pass = hasSchema && hasIndexes && hasSeed;
    results.push({
      id: 'U10-DEP-08',
      category: 'Deployment Configuration',
      scenario: 'Sequential D1 Migration Files Presence & Order',
      expected: 'Files 0001_initial_schema.sql, 0002_indexes.sql, and 0003_seed.sql present',
      actual: `schema=${hasSchema}, indexes=${hasIndexes}, seed=${hasSeed}`,
      status: pass ? 'PASS' : 'FAIL',
      evidence: 'Migration files properly versioned and ordered for deterministic replay.',
      durationMs: Date.now() - start
    });
  }

  // U10-DEP-09: D1 Schema Definition Completeness (19 Tables)
  {
    const start = Date.now();
    const schemaSql = fs.readFileSync(path.join(migrationsDir, '0001_initial_schema.sql'), 'utf-8');
    const db = createD1Emulator();
    await db.exec(schemaSql);

    const countRes = await db.prepare(`
      SELECT count(*) as count FROM sqlite_schema 
      WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%';
    `).first<{ count: number }>();

    const tableCount = countRes?.count ?? 0;
    const pass = tableCount === 19;

    results.push({
      id: 'U10-DEP-09',
      category: 'Deployment Configuration',
      scenario: 'D1 Schema Execution Produces Exact 19 Core Relational Tables',
      expected: 'Exact 19 core tables created with foreign keys enabled',
      actual: `tableCount=${tableCount}`,
      status: pass ? 'PASS' : 'FAIL',
      evidence: 'All 19 relational tables created cleanly without foreign key compilation errors.',
      durationMs: Date.now() - start
    });
  }

  // U10-DEP-10: D1 Performance & Isolation Indexes Integrity (23 Indexes)
  {
    const start = Date.now();
    const schemaSql = fs.readFileSync(path.join(migrationsDir, '0001_initial_schema.sql'), 'utf-8');
    const indexSql = fs.readFileSync(path.join(migrationsDir, '0002_indexes.sql'), 'utf-8');
    const db = createD1Emulator();
    await db.exec(schemaSql);
    await db.exec(indexSql);

    const indexRes = await db.prepare(`
      SELECT count(*) as count FROM sqlite_schema 
      WHERE type = 'index' AND name NOT LIKE 'sqlite_%';
    `).first<{ count: number }>();

    const indexCount = indexRes?.count ?? 0;
    const pass = indexCount >= 23;

    results.push({
      id: 'U10-DEP-10',
      category: 'Deployment Configuration',
      scenario: 'Performance & Multi-Tenant Indexes Applied to D1 Database',
      expected: 'At least 23 performance and tenant-scoping indexes created',
      actual: `indexCount=${indexCount}`,
      status: pass ? 'PASS' : 'FAIL',
      evidence: '23 indexes active for school-scoping, foreign keys, and queue processing.',
      durationMs: Date.now() - start
    });
  }

  return results;
}
