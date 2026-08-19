export interface TestRecord {
  id: string;
  category: string;
  scenario: string;
  expected: string;
  actual: string;
  status: 'PASS' | 'FAIL';
  evidence: string;
  durationMs: number;
}

export class E2EReporter {
  private results: TestRecord[] = [];

  record(test: TestRecord) {
    this.results.push(test);
    const icon = test.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
    console.log(`${icon} [${test.id}] ${test.scenario} (${test.durationMs}ms)`);
    if (test.evidence) {
      console.log(`   Evidence: ${test.evidence}`);
    }
  }

  getResults(): TestRecord[] {
    return this.results;
  }

  summary(): { total: number; passed: number; failed: number; durationTotalMs: number } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = total - passed;
    const durationTotalMs = this.results.reduce((acc, curr) => acc + curr.durationMs, 0);
    return { total, passed, failed, durationTotalMs };
  }

  generateMarkdownTable(): string {
    const lines: string[] = [];
    lines.push('| Test ID | Category | Scenario | Expected | Actual | Status | Evidence | Duration |');
    lines.push('|---|---|---|---|---|---|---|---|');
    for (const r of this.results) {
      const sanitizedEvidence = r.evidence.replace(/\|/g, '\\|');
      lines.push(`| ${r.id} | ${r.category} | ${r.scenario} | ${r.expected} | ${r.actual} | **${r.status}** | ${sanitizedEvidence} | ${r.durationMs}ms |`);
    }
    return lines.join('\n');
  }
}
