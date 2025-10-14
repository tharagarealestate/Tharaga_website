import { Pool } from 'pg'
import { config } from './config'

export const pool = new Pool({ connectionString: config.databaseUrl })

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }> {
  const client = await pool.connect()
  try {
    const res = await client.query<T>(text, params)
    return { rows: res.rows }
  } finally {
    client.release()
  }
}
