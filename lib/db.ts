import { Pool, QueryResult, QueryResultRow } from 'pg';

let pool: Pool | null = null;

export function getDatabase(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const db = getDatabase();
  return db.query<T>(text, params);
}

export async function getOne<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] || null;
}

export async function getAll<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const result = await query<T>(text, params);
  return result.rows;
}

export async function insert<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T> {
  const result = await query<T>(text, params);
  return result.rows[0];
}

export async function update<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] || null;
}

export async function remove(text: string, params?: any[]): Promise<boolean> {
  const result = await query(text, params);
  return result.rowCount !== null && result.rowCount > 0;
}
