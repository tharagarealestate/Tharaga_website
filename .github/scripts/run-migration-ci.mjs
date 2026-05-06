#!/usr/bin/env node
/**
 * CI migration runner
 *
 * Strategy (tried in order):
 *   1. Supabase Management API  — POST /v1/projects/{ref}/database/query
 *      Requires: SUPABASE_ACCESS_TOKEN (PAT)
 *   2. exec_sql RPC             — POST /rest/v1/rpc/exec_sql
 *      Requires: SUPABASE_SERVICE_ROLE_KEY + exec_sql function in DB
 *
 * Each request has a 10-second timeout so hung calls don’t block the runner.
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
  console.error('❌  SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) must be set.')
  process.exit(1)
}
if (!SUPABASE_ACCESS_TOKEN && !SUPABASE_SERVICE_KEY) {
  console.error('❌  Either SUPABASE_ACCESS_TOKEN or SUPABASE_SERVICE_ROLE_KEY must be set.')
  process.exit(1)
}

const PROJECT_REF = SUPABASE_URL.replace(/^https?:\/\//, '').split('.')[0]

// ── Fetch with timeout ────────────────────────────────────────────────────────────────────
function fetchWithTimeout(url, options, timeoutMs = 10_000) {
  const ctrl = new AbortController()
  const id   = setTimeout(() => ctrl.abort(), timeoutMs)
  return fetch(url, { ...options, signal: ctrl.signal })
    .finally(() => clearTimeout(id))
}

// ── Strategy 1: Management API ─────────────────────────────────────────────────────────
async function runSQLViaManagementAPI(sql) {
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`
  const res = await fetchWithTimeout(url, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ query: sql }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`Management API HTTP ${res.status}: ${JSON.stringify(body).slice(0, 300)}`)
  }
  return body
}

// ── Strategy 2: exec_sql RPC ───────────────────────────────────────────────────────────────────
async function runSQLViaRPC(sql) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`
  const res = await fetchWithTimeout(url, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer':        'return=minimal',
    },
    body: JSON.stringify({ sql }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`RPC HTTP ${res.status}: ${text.slice(0, 300)}`)
  }
  return {}
}

// ── Statement splitter (┤$$ dollar-quoting) ──────────────────────────────────────────────────
function splitStatements(sql) {
  const stmts = []
  let   buf   = ''
  let   inDollar = false

  for (const line of sql.split('\n')) {
    const trimmed = line.trim()
    if (!buf.trim() && (trimmed.startsWith('--') || trimmed === '')) continue

    buf += line + '\n'
    const dollarMatches = buf.match(/\$[A-Za-z0-9_]*\$/g) || []
    inDollar = dollarMatches.length % 2 !== 0

    if (!inDollar && buf.trimEnd().endsWith(';')) {
      const stmt = buf.trim()
      if (stmt && stmt !== ';') stmts.push(stmt)
      buf = ''
    }
  }
  if (buf.trim()) stmts.push(buf.trim())
  return stmts
}

// ── Run one migration file ────────────────────────────────────────────────────────────────────
async function runFile(filePath, strategy) {
  const sql   = readFileSync(filePath, 'utf8')
  const stmts = splitStatements(sql)
  console.log(`   ${stmts.length} statements — strategy: ${strategy}`)

  let ok = 0, skipped = 0, failed = 0
  const errors = []

  for (const stmt of stmts) {
    const preview = stmt.slice(0, 70).replace(/\n/g, ' ')
    try {
      if (strategy === 'management-api') {
        await runSQLViaManagementAPI(stmt)
      } else {
        await runSQLViaRPC(stmt)
      }
      console.log(`   ✅ ${preview}…`)
      ok++
    } catch (err) {
      const msg = err.message || ''
      const safe = msg.includes('already exists') ||
                   msg.includes('IF NOT EXISTS') ||
                   msg.includes('does not exist')
      if (safe) {
        console.log(`   ⚡ SKIP (${msg.slice(0, 80)}): ${preview}…`)
        skipped++
      } else {
        console.warn(`   ⚠  FAIL (${msg.slice(0, 120)}): ${preview}…`)
        failed++
        errors.push({ stmt: preview, error: msg.slice(0, 200) })
      }
    }
  }
  return { ok, skipped, failed, errors }
}

// ── Detect strategy ──────────────────────────────────────────────────────────────────────────
async function detectStrategy() {
  if (SUPABASE_ACCESS_TOKEN) {
    try {
      await runSQLViaManagementAPI('SELECT 1')
      return 'management-api'
    } catch (err) {
      console.warn(`   ⚠  Management API probe failed: ${err.message.slice(0, 120)}`)
      console.warn('   Falling back to exec_sql RPC…')
    }
  }
  if (SUPABASE_SERVICE_KEY) return 'exec_sql-rpc'
  throw new Error('No working strategy. Set SUPABASE_ACCESS_TOKEN or SUPABASE_SERVICE_ROLE_KEY.')
}

// ── Main ─────────────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🔍 Detecting connection strategy for project: ${PROJECT_REF}\n`)
  const strategy = await detectStrategy()
  console.log(`✅ Using strategy: ${strategy}\n`)

  const filesToRun = []
  if (MIGRATION_FILE) {
    filesToRun.push(join(MIGRATIONS_DIR, MIGRATION_FILE))
  } else {
    const files = readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort()
    filesToRun.push(...files.map(f => join(MIGRATIONS_DIR, f)))
  }

  console.log(`🚀 Running ${filesToRun.length} migration file(s) against ${SUPABASE_URL}\n`)

  const results = []
  let totalOk = 0, totalFail = 0

  for (const filePath of filesToRun) {
    const fileName = filePath.split('/').pop()
    console.log(`📄 ${fileName}`)
    const r = await runFile(filePath, strategy)
    console.log(`   ↳ ok=${r.ok}  skipped=${r.skipped}  failed=${r.failed}\n`)
    results.push({ file: fileName, ...r, timestamp: new Date().toISOString() })
    totalOk   += r.ok
    totalFail += r.failed
  }

  const status = {
    ran_at:     new Date().toISOString(),
    project:    PROJECT_REF,
    strategy,
    files:      results.length,
    total_ok:   totalOk,
    total_fail: totalFail,
    success:    totalFail === 0,
    results,
  }
  writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2) + '\n')
  console.log(`📝 Status written to supabase/migration-status.json`)

  if (totalFail > 0) {
    console.error(`\n❌  Migration completed with ${totalFail} failures.`)
    process.exit(1)
  }
  console.log(`\n✅  All migrations applied successfully (ok=${totalOk}).`)
}

main().catch(err => {
  console.error('❌  Migration runner crashed:', err.message)
  try {
    const prev = existsSync(STATUS_FILE)
      ? JSON.parse(readFileSync(STATUS_FILE, 'utf8'))
      : {}
    if (!prev.ran_at) {
      writeFileSync(STATUS_FILE, JSON.stringify({
        ...prev,
        ran_at:  new Date().toISOString(),
        success: false,
        error:   err.message,
        results: prev.results ?? [],
      }, null, 2) + '\n')
    }
  } catch (_) { /* best-effort */ }
  process.exit(1)
})
