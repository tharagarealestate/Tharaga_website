import 'dotenv/config'
import { Pool } from 'pg'

async function main() {
  const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/tharaga'
  const pool = new Pool({ connectionString: databaseUrl })
  // Ensure pgcrypto for gen_random_uuid
  await pool.query('create extension if not exists pgcrypto')
  // Schema
  await pool.query(`
  create table if not exists properties (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    city text not null,
    images jsonb default '[]'::jsonb,
    created_at timestamptz default now()
  );
  `)
  await pool.query(`
  create table if not exists leads (
    id uuid primary key default gen_random_uuid(),
    property_id uuid not null references properties(id) on delete cascade,
    name text not null,
    email text not null,
    message text,
    created_at timestamptz default now()
  );
  `)
  // Seed demo orgs as a table for future use
  await pool.query(`
  create table if not exists orgs (
    id uuid primary key,
    name text not null,
    tier text not null,
    created_at timestamptz default now()
  )`)
  const demoOrgs = [
    ['00000000-0000-0000-0000-000000000001', 'Free Demo', 'free'],
    ['00000000-0000-0000-0000-000000000002', 'Growth Demo', 'growth'],
    ['00000000-0000-0000-0000-000000000003', 'Pro Demo', 'pro'],
  ] as const
  for (const [id, name, tier] of demoOrgs) {
    await pool.query(
      `insert into orgs (id, name, tier) values ($1,$2,$3)
       on conflict (id) do update set name = excluded.name, tier = excluded.tier`,
      [id, name, tier]
    )
  }
  console.log('Schema synced and demo orgs upserted')
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
