import { MockGasSpreadsheetEngine } from './e2e_helpers';

export class E2EAssertions {
  /**
   * Asserts a record exists in D1 database
   */
  static async assertD1RecordExists(
    d1: D1Database,
    table: string,
    whereClause: string,
    params: any[] = []
  ): Promise<any> {
    const query = `SELECT * FROM ${table} WHERE ${whereClause} LIMIT 1;`;
    const record = await d1.prepare(query).bind(...params).first<any>();
    if (!record) {
      throw new Error(`[Assertion Error] Expected record to exist in '${table}' WHERE ${whereClause}, but found none.`);
    }
    return record;
  }

  /**
   * Asserts sync_queue status for a specific entity
   */
  static async assertSyncQueueStatus(
    d1: D1Database,
    entityType: string,
    entityId: string,
    expectedStatus: 'PENDING' | 'PROCESSING' | 'SYNCED' | 'FAILED'
  ): Promise<any> {
    const record = await d1.prepare(`
      SELECT * FROM sync_queue 
      WHERE entity_type = ? AND entity_id = ?
      ORDER BY id DESC LIMIT 1;
    `).bind(entityType, entityId).first<any>();

    if (!record) {
      throw new Error(`[Assertion Error] Expected sync_queue entry for ${entityType}:${entityId}, but found none.`);
    }

    if (record.status !== expectedStatus) {
      throw new Error(`[Assertion Error] Expected sync_queue status '${expectedStatus}', got '${record.status}'. Error: ${record.error_message || 'None'}`);
    }

    return record;
  }

  /**
   * Asserts that a row exists in the Spreadsheet Replica with exact canonical primary key
   */
  static assertSpreadsheetRow(
    mockGas: MockGasSpreadsheetEngine,
    schoolId: string,
    tabName: string,
    primaryKey: string
  ): any {
    const row = mockGas.getRow(schoolId, tabName, primaryKey);
    if (!row) {
      throw new Error(`[Assertion Error] Expected row with PK '${primaryKey}' in Spreadsheet '${tabName}' for school '${schoolId}', but not found.`);
    }
    return row;
  }

  /**
   * Asserts zero duplicate primary keys in Spreadsheet Replica tab
   */
  static assertNoDuplicatesInSheet(
    mockGas: MockGasSpreadsheetEngine,
    schoolId: string,
    tabName: string,
    primaryKey: string
  ): void {
    const rows = mockGas.getRows(schoolId, tabName);
    const matching = rows.filter(r => r.primaryKey === primaryKey);
    if (matching.length !== 1) {
      throw new Error(`[Assertion Error] Expected exactly 1 row with PK '${primaryKey}' in '${tabName}', found ${matching.length} rows!`);
    }
  }

  /**
   * Asserts multi-tenant data isolation between two schools
   */
  static assertMultiTenantIsolation(
    mockGas: MockGasSpreadsheetEngine,
    schoolAId: string,
    schoolBId: string,
    tabName: string,
    schoolAPk: string,
    schoolBPk: string
  ): void {
    const rowInA = mockGas.getRow(schoolAId, tabName, schoolAPk);
    const rowInB = mockGas.getRow(schoolBId, tabName, schoolBPk);

    if (!rowInA) {
      throw new Error(`[Assertion Error] School A data '${schoolAPk}' not found in School A spreadsheet.`);
    }
    if (!rowInB) {
      throw new Error(`[Assertion Error] School B data '${schoolBPk}' not found in School B spreadsheet.`);
    }

    // Verify School A does NOT contain School B's PK
    const crossCheckA = mockGas.getRow(schoolAId, tabName, schoolBPk);
    if (crossCheckA) {
      throw new Error(`[Assertion Error] CRITICAL DATA LEAK: School A contains School B data '${schoolBPk}'!`);
    }

    // Verify School B does NOT contain School A's PK
    const crossCheckB = mockGas.getRow(schoolBId, tabName, schoolAPk);
    if (crossCheckB) {
      throw new Error(`[Assertion Error] CRITICAL DATA LEAK: School B contains School A data '${schoolAPk}'!`);
    }
  }
}
