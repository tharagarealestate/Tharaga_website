#!/usr/bin/env node
// Ensure NEXT_PUBLIC_* env vars exist for client-side Next.js code by
// mapping from server-only Netlify variables when necessary.
// Writes an .env.production file inside the Next.js app directory.

import fs from 'node:fs'
import path from 'node:path'

function main() {
  const appDir = path.resolve(process.cwd())
  // Always write to current working directory (the Next.js app root)
  const envFile = path.join(appDir, '.env.production')

  const currentNextPublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const currentNextPublicAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const fallbackUrl = process.env.SUPABASE_URL
  const fallbackAnon = process.env.SUPABASE_ANON_KEY

  // If NEXT_PUBLIC values already set, do nothing.
  if (currentNextPublicUrl && currentNextPublicAnon) {
    console.log('[ensure-env] NEXT_PUBLIC_* already present; no changes')
    return
  }

  if (!fallbackUrl || !fallbackAnon) {
    console.log('[ensure-env] Missing SUPABASE_URL or SUPABASE_ANON_KEY; cannot generate NEXT_PUBLIC_*')
    return
  }

  const lines = []
  if (!currentNextPublicUrl) lines.push(`NEXT_PUBLIC_SUPABASE_URL=${fallbackUrl}`)
  if (!currentNextPublicAnon) lines.push(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${fallbackAnon}`)

  try {
    // Preserve existing file contents if present
    let existing = ''
    if (fs.existsSync(envFile)) {
      existing = fs.readFileSync(envFile, 'utf8')
      if (existing.length > 0 && !existing.endsWith('\n')) existing += '\n'
    }
    const content = existing + lines.join('\n') + (lines.length ? '\n' : '')
    fs.writeFileSync(envFile, content, 'utf8')
    console.log(`[ensure-env] Wrote ${envFile} with NEXT_PUBLIC_* variables`)
  } catch (e) {
    console.error('[ensure-env] Failed to write env file:', e?.message || e)
    process.exitCode = 0 // do not fail the build if this step cannot write
  }
}

main()

