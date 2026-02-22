import { Pool, QueryResult, QueryResultRow } from 'pg';

let pool: Pool | null = null;

export function getDatabase(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.error('DATABASE_URL is not defined in environment variables');
      throw new Error('DATABASE_URL is not configured');
    }
    
    console.log('Initializing database connection pool...');
    console.log('Database URL format:', connectionString.replace(/:[^:@]+@/, ':****@')); // Hide password
    
    // SSL設定: RDSは自己署名証明書を使用するため rejectUnauthorized: false
    const sslConfig = {
      rejectUnauthorized: false // RDSの自己署名証明書を許可
    };
    
    pool = new Pool({
      connectionString,
      ssl: sslConfig,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });

    pool.on('connect', () => {
      console.log('Database connection established');
    });
  }
  return pool;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const db = getDatabase();
  try {
    const start = Date.now();
    const result = await db.query<T>(text, params);
    const duration = Date.now() - start;
    console.log('Query executed:', { sql: text.substring(0, 100), duration: `${duration}ms`, rows: result.rowCount });
    return result;
  } catch (error: any) {
    console.error('Database query error:', {
      sql: text.substring(0, 200),
      params,
      error: error.message,
      code: error.code,
      detail: error.detail
    });
    throw error;
  }
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
