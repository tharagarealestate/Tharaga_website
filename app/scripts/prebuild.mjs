#!/usr/bin/env node
// Wrapper prebuild to be robust across environments that build only /app
// 1) Ensure NEXT_PUBLIC_* envs exist in app/.env.production
// 2) If repo-root scripts/copy-static.cjs exists, run it to populate app/public
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

function runNodeScript(cwd, scriptPath) {
  const abs = path.resolve(cwd, scriptPath)
  const res = spawnSync(process.execPath, [abs], { stdio: 'inherit', cwd })
  if (res.error) throw res.error
  if (typeof res.status === 'number' && res.status !== 0) {
    process.exit(res.status)
  }
}

function main() {
  const appDir = path.resolve(process.cwd())
  // Step 1: always run ensure-next-public-env from app/scripts
  const ensureEnvPath = path.join(appDir, 'scripts', 'ensure-next-public-env.mjs')
  if (fs.existsSync(ensureEnvPath)) {
    runNodeScript(appDir, ensureEnvPath)
  } else {
    console.warn('[prebuild] Missing ensure-next-public-env.mjs in app/scripts')
  }

  // Step 2: Try to run repo-root copy-static.cjs if available
  // In Docker build, our working directory is /app; repo root is parent of /app
  const repoRoot = path.resolve(appDir, '..')
  const copyStaticPath = path.join(repoRoot, 'scripts', 'copy-static.cjs')
  if (fs.existsSync(copyStaticPath)) {
    console.log('[prebuild] Running root scripts/copy-static.cjs')
    runNodeScript(repoRoot, copyStaticPath)
  } else {
    console.log('[prebuild] No root scripts/copy-static.cjs found; skipping static copy')
  }
}

main()
