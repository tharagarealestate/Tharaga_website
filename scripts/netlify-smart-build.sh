#!/bin/bash
# Smart build script that skips rebuild if .next exists and is recent

cd app

# Install dependencies (cached by Netlify)
npm install

# Install function dependencies
npm --prefix ../netlify/functions install --no-audit --no-fund --omit=dev

# Ensure environment variables
node ../scripts/ensure-next-public-env.mjs

# Copy static files
node ../scripts/copy-static.cjs

# Check if .next exists and was created in the last 10 minutes
# This allows local builds to be deployed without rebuilding
if [ -d ".next" ] && [ -f ".next/BUILD_ID" ]; then
  BUILD_AGE=$(($(date +%s) - $(stat -c %Y .next/BUILD_ID 2>/dev/null || stat -f %m .next/BUILD_ID 2>/dev/null || echo 0)))
  if [ $BUILD_AGE -lt 600 ]; then
    echo "✅ Using existing .next build (age: ${BUILD_AGE}s)"
    echo "⏭️  Skipping npm run build to save build minutes"
    exit 0
  fi
fi

# Otherwise, run the full build
echo "🔨 Running full Next.js build..."
npm run build
