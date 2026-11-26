#!/usr/bin/env node
// Ensure NEXT_PUBLIC_* env vars exist for client-side Next.js code by
// mapping from server-only Netlify variables when necessary.
// Writes an .env.production file inside the Next.js app directory.

import fs from 'node:fs'
import path from 'node:path'

function main() {
  // When run from netlify.toml: "cd app && node ../scripts/ensure-next-public-env.mjs"
  // process.cwd() is already 'app', so we're in the right directory
  console.log('[ensure-env] Starting environment setup...')
  console.log('[ensure-env] Current working directory:', process.cwd())
  
  const appDir = path.resolve(process.cwd())
  // Always write to current working directory (the Next.js app root)
  const envFile = path.join(appDir, '.env.production')
  // Note: static home (app/public/index.html) may be intentionally present.

  const currentNextPublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const currentNextPublicAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const fallbackUrl = process.env.SUPABASE_URL
  const fallbackAnon = process.env.SUPABASE_ANON_KEY

  console.log('[ensure-env] NEXT_PUBLIC_SUPABASE_URL:', currentNextPublicUrl ? '✓ Set' : '✗ Not set')
  console.log('[ensure-env] NEXT_PUBLIC_SUPABASE_ANON_KEY:', currentNextPublicAnon ? '✓ Set' : '✗ Not set')
  console.log('[ensure-env] SUPABASE_URL (fallback):', fallbackUrl ? '✓ Set' : '✗ Not set')
  console.log('[ensure-env] SUPABASE_ANON_KEY (fallback):', fallbackAnon ? '✓ Set' : '✗ Not set')

  // If NEXT_PUBLIC values already set, do nothing.
  if (currentNextPublicUrl && currentNextPublicAnon) {
    console.log('[ensure-env] ✓ NEXT_PUBLIC_* already present; no changes needed')
    return
  }

  if (!fallbackUrl || !fallbackAnon) {
    console.warn('[ensure-env] ⚠ Missing SUPABASE_URL or SUPABASE_ANON_KEY; cannot generate NEXT_PUBLIC_*')
    console.warn('[ensure-env] ⚠ Build will continue, but Supabase features may not work')
    console.warn('[ensure-env] ⚠ This is OK if you have set NEXT_PUBLIC_* variables directly in Netlify')
    console.warn('[ensure-env] Available env vars:', {
      hasNextPublicUrl: !!currentNextPublicUrl,
      hasNextPublicAnon: !!currentNextPublicAnon,
      hasSupabaseUrl: !!fallbackUrl,
      hasSupabaseAnon: !!fallbackAnon
    })
    // Don't fail the build - let Next.js handle missing env vars
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
    console.log(`[ensure-env] ✓ Wrote ${envFile} with NEXT_PUBLIC_* variables`)
    console.log(`[ensure-env] ✓ Variables written: ${lines.length}`)
  } catch (e) {
    console.error('[ensure-env] ✗ Failed to write env file:', e?.message || e)
    console.error('[ensure-env] ✗ This may cause build failures')
    throw e // Fail the build if we can't write the env file
  }
}

try {
  main()
  console.log('[ensure-env] ✓ Completed successfully')
} catch (error) {
  console.error('[ensure-env] ✗ Fatal error:', error)
  process.exit(1)
}
