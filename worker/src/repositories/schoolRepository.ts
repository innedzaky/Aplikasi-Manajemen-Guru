export interface SchoolRecord {
  id: string;
  name: string;
  npsn?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logo_url?: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export class SchoolRepository {
  constructor(private db: D1Database) {}

  async findById(schoolId: string): Promise<SchoolRecord | null> {
    const query = `
      SELECT id, name, npsn, address, phone, email, logo_url, is_active, created_at, updated_at
      FROM schools
      WHERE id = ?
      LIMIT 1;
    `;
    return await this.db.prepare(query).bind(schoolId).first<SchoolRecord>();
  }

  async findFirstActive(): Promise<SchoolRecord | null> {
    const query = `
      SELECT id, name, npsn, address, phone, email, logo_url, is_active, created_at, updated_at
      FROM schools
      WHERE is_active = 1
      ORDER BY created_at ASC
      LIMIT 1;
    `;
    return await this.db.prepare(query).first<SchoolRecord>();
  }

  async update(schoolId: string, data: Partial<SchoolRecord>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.npsn !== undefined) { fields.push('npsn = ?'); values.push(data.npsn); }
    if (data.address !== undefined) { fields.push('address = ?'); values.push(data.address); }
    if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
    if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
    if (data.logo_url !== undefined) { fields.push('logo_url = ?'); values.push(data.logo_url); }

    if (fields.length === 0) return;
    fields.push("updated_at = datetime('now')");

    const query = `UPDATE schools SET ${fields.join(', ')} WHERE id = ?;`;
    values.push(schoolId);

    await this.db.prepare(query).bind(...values).run();
  }
}
