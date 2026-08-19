import { U10TestResult } from './u10_helpers';

export class U10Reporter {
  private results: U10TestResult[] = [];

  public addResults(results: U10TestResult[]): void {
    this.results.push(...results);
  }

  public printReport(): { passed: number; failed: number; total: number } {
    console.log('\n' + '='.repeat(100));
    console.log('                 FASE U10 — AUTOMATED TEST SUITE EXECUTION REPORT');
    console.log('='.repeat(100) + '\n');

    const categories = Array.from(new Set(this.results.map(r => r.category)));

    for (const category of categories) {
      const items = this.results.filter(r => r.category === category);
      const catPassed = items.filter(r => r.status === 'PASS').length;
      console.log(`\n--- [CATEGORY: ${category.toUpperCase()}] (${catPassed}/${items.length} PASS) ---`);

      for (const item of items) {
        const icon = item.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
        console.log(`  [${item.id}] ${icon} - ${item.scenario} (${item.durationMs}ms)`);
        if (item.status === 'FAIL') {
          console.log(`      Expected: ${item.expected}`);
          console.log(`      Actual:   ${item.actual}`);
          console.log(`      Evidence: ${item.evidence}`);
        }
      }
    }

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;

    console.log('\n' + '='.repeat(100));
    console.log(`SUMMARY: ${passed}/${total} TESTS PASSED (${failed} FAILED) - DURATION: ${this.results.reduce((acc, r) => acc + r.durationMs, 0)}ms`);
    console.log('='.repeat(100) + '\n');

    return { passed, failed, total };
  }

  public getResults(): U10TestResult[] {
    return this.results;
  }
}
