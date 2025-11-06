#!/usr/bin/env node
/*
 Copies top-level static microsites into Next.js public directory before build.
 This lets Netlify (Next plugin) serve them at their paths without 404s.
*/

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

async function pathExists(p) {
  try {
    await fsp.access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true });
}

async function copyFile(src, dest) {
  await ensureDir(path.dirname(dest));
  await fsp.copyFile(src, dest);
}

async function copyDir(srcDir, destDir) {
  await ensureDir(destDir);
  const entries = await fsp.readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      await copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  // scripts/ is at repoRoot/scripts; we want repo root
  const repoRoot = path.resolve(__dirname, '..');
  const srcRoot = repoRoot; // where microsites live at top-level
  const nextPublic = path.join(repoRoot, 'app', 'public');

  const exclude = new Set([
    'app',
    'backend',
    'supabase',
    'netlify',
    'tests',
    'test-results',
    'node_modules',
    '.git',
    '.github',
    '.vscode',
    'scripts',
    'public',
  ]);

  // Only copy a minimal allowlist of microsites required in production.
  // This drastically reduces the published asset size in Netlify.
  const allowedDirs = new Set([
    'auth-email-landing',
    // 'login_signup_glassdrop', // REMOVED - using snippets auth system instead
    'Reset_password',
    'property-listing',
    'snippets',
    'pricing',
    'admin', // Admin panel with updated glassy blue header
  ]);

  await ensureDir(nextPublic);

  const topEntries = await fsp.readdir(srcRoot, { withFileTypes: true });

  const candidates = [];
  for (const entry of topEntries) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    if (exclude.has(name)) continue;
    const dirPath = path.join(srcRoot, name);
    if (allowedDirs.has(name)) candidates.push(name);
  }

  // Do NOT copy large shared asset folders wholesale. Keep only what is
  // explicitly checked into app/public to minimize bundle size.
  const sharedAssets = [];

  console.log('[copy-static] Next public dir:', nextPublic);
  console.log('[copy-static] Copying microsites:', candidates);

  for (const dirName of candidates) {
    const src = path.join(srcRoot, dirName);
    const dest = path.join(nextPublic, dirName);
    await copyDir(src, dest);
  }

  // Intentionally left empty (sharedAssets = [])

  // Copy root index.html as the public homepage - user prefers this design
  // Note: auth-gate.js references have been removed from index.html (using snippets auth instead)
  try {
    const rootIndex = path.join(repoRoot, 'index.html');
    if (await pathExists(rootIndex)) {
      const destIndex = path.join(nextPublic, 'index.html');
      await copyFile(rootIndex, destIndex);
      console.log('[copy-static] Copied root index.html -> app/public/index.html');
    }
  } catch (e) {
    console.warn('[copy-static] Could not copy root index.html:', e?.message || e);
  }

  // Copy role-manager-v2.js to public directory
  try {
    const rootRoleManager = path.join(repoRoot, 'role-manager-v2.js');
    if (await pathExists(rootRoleManager)) {
      const destRoleManager = path.join(nextPublic, 'role-manager-v2.js');
      await copyFile(rootRoleManager, destRoleManager);
      console.log('[copy-static] Copied root role-manager-v2.js -> app/public/role-manager-v2.js');
    }
  } catch (e) {
    console.warn('[copy-static] Could not copy role-manager-v2.js:', e?.message || e);
  }

  console.log('[copy-static] Done.');
}

main().catch((err) => {
  console.error('[copy-static] Failed:', err);
  process.exit(1);
});

