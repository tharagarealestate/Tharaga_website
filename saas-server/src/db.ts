import { Pool } from 'pg'
import { config } from './config'

export const pool = new Pool({ connectionString: config.databaseUrl })

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }> {
  const client = await pool.connect()
  try {
    const res = await client.query(text, params)
    return { rows: res.rows as T[] }
  } finally {
    client.release()
  }
}
