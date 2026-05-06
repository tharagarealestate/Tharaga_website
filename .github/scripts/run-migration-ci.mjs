#!/usr/bin/env node
/**
 * CI migration runner — each request has a 10 s timeout.
 * Strategy 1: Supabase Management API (SUPABASE_ACCESS_TOKEN required)
 * Strategy 2: exec_sql RPC (SUPABASE_SERVICE_ROLE_KEY required)
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir          = dirname(fileURLToPath(import.meta.url))
const ROOT           = join(__dir, '..', '..')
const MIGRATIONS_DIR = join(ROOT, 'supabase', 'migrations')
const STATUS_FILE    = join(ROOT, 'supabase', 'migration-status.json')

const SUPABASE_URL          = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN
const SUPABASE_SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
const MIGRATION_FILE        = process.env.MIGRATION_FILE

if (!SUPABASE_URL) {
  writeFileSync(STATUS_FILE, JSON.stringify({ ran_at: new Date().toISOString(), success: false, error: 'SUPABASE_URL not set', results: [] }, null, 2) + '\n')
  console.error('❌  SUPABASE_URL not set.')
  process.exit(1)
}
if (!SUPABASE_ACCESS_TOKEN && !SUPABASE_SERVICE_KEY) {
  writeFileSync(STATUS_FILE, JSON.stringify({ ran_at: new Date().toISOString(), success: false, error: 'No auth token set — need SUPABASE_ACCESS_TOKEN or SUPABASE_SERVICE_ROLE_KEY', results: [] }, null, 2) + '\n')
  console.error('❌  Neither SUPABASE_ACCESS_TOKEN nor SUPABASE_SERVICE_ROLE_KEY is set.')
  process.exit(1)
}

const PROJECT_REF = SUPABASE_URL.replace(/^https?:\/\//, '').split('.')[0]

function fetchWithTimeout(url, options, ms = 10_000) {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), ms)
  return fetch(url, { ...options, signal: ctrl.signal }).finally(() => clearTimeout(id))
}

async function runSQLViaManagementAPI(sql) {
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}` },
    body: JSON.stringify({ query: sql }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Management API HTTP ${res.status}: ${JSON.stringify(body).slice(0, 300)}`)
  return body
}

async function runSQLViaRPC(sql) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ sql }),
  })
  if (!res.ok) { const text = await res.text(); throw new Error(`RPC HTTP ${res.status}: ${text.slice(0, 300)}`) }
  return {}
}

function splitStatements(sql) {
  const stmts = []; let buf = ''; let inDollar = false
  for (const line of sql.split('\n')) {
    const trimmed = line.trim()
    if (!buf.trim() && (trimmed.startsWith('--') || trimmed === '')) continue
    buf += line + '\n'
    const m = buf.match(/\$[A-Za-z0-9_]*\$/g) || []; inDollar = m.length % 2 !== 0
    if (!inDollar && buf.trimEnd().endsWith(';')) {
      const stmt = buf.trim(); if (stmt && stmt !== ';') stmts.push(stmt); buf = ''
    }
  }
  if (buf.trim()) stmts.push(buf.trim())
  return stmts
}

async function runFile(filePath, strategy) {
  const stmts = splitStatements(readFileSync(filePath, 'utf8'))
  console.log(`   ${stmts.length} statements — strategy: ${strategy}`)
  let ok = 0, skipped = 0, failed = 0; const errors = []
  for (const stmt of stmts) {
    const preview = stmt.slice(0, 70).replace(/\n/g, ' ')
    try {
      strategy === 'management-api' ? await runSQLViaManagementAPI(stmt) : await runSQLViaRPC(stmt)
      console.log(`   ✅ ${preview}…`); ok++
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('already exists') || msg.includes('does not exist')) {
        console.log(`   ⚡ SKIP: ${preview}…`); skipped++
      } else {
        console.warn(`   ⚠  FAIL (${msg.slice(0, 120)}): ${preview}…`); failed++
        errors.push({ stmt: preview, error: msg.slice(0, 200) })
      }
    }
  }
  return { ok, skipped, failed, errors }
}

async function detectStrategy() {
  if (SUPABASE_ACCESS_TOKEN) {
    try { await runSQLViaManagementAPI('SELECT 1'); return 'management-api' }
    catch (err) { console.warn(`   ⚠  Management API probe failed: ${err.message.slice(0, 120)}`); console.warn('   Falling back to exec_sql RPC…') }
  }
  if (SUPABASE_SERVICE_KEY) return 'exec_sql-rpc'
  throw new Error('No working strategy.')
}

async function main() {
  console.log(`\n🔍 project: ${PROJECT_REF}\n`)
  const strategy = await detectStrategy()
  console.log(`✅ strategy: ${strategy}\n`)
  const filesToRun = MIGRATION_FILE
    ? [join(MIGRATIONS_DIR, MIGRATION_FILE)]
    : readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort().map(f => join(MIGRATIONS_DIR, f))
  console.log(`🚀 ${filesToRun.length} file(s)\n`)
  const results = []; let totalOk = 0, totalFail = 0
  for (const fp of filesToRun) {
    const fn = fp.split('/').pop(); console.log(`📄 ${fn}`)
    const r = await runFile(fp, strategy)
    console.log(`   ↳ ok=${r.ok} skipped=${r.skipped} failed=${r.failed}\n`)
    results.push({ file: fn, ...r, timestamp: new Date().toISOString() })
    totalOk += r.ok; totalFail += r.failed
  }
  const status = { ran_at: new Date().toISOString(), project: PROJECT_REF, strategy, files: results.length, total_ok: totalOk, total_fail: totalFail, success: totalFail === 0, results }
  writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2) + '\n')
  console.log(`📝 Status written.`)
  if (totalFail > 0) { console.error(`\n❌  ${totalFail} failure(s).`); process.exit(1) }
  console.log(`\n✅  All done (ok=${totalOk}).`)
}

main().catch(err => {
  console.error('❌  Crash:', err.message)
  try { writeFileSync(STATUS_FILE, JSON.stringify({ ran_at: new Date().toISOString(), success: false, error: err.message, results: [] }, null, 2) + '\n') } catch (_) {}
  process.exit(1)
})
