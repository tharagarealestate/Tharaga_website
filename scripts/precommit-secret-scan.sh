#!/usr/bin/env bash
set -euo pipefail

# Simple pre-commit scan for OpenAI-like secrets in staged diffs
# Usage: sh scripts/precommit-secret-scan.sh

if git diff --cached -U0 | grep -E "sk-[A-Za-z0-9_-]{20,}" >/dev/null; then
  echo "Blocked: possible OpenAI secret (sk-...) found in staged changes." >&2
  exit 1
fi

if git diff --cached -U0 | grep -E "^\+.*OPENAI_API_KEY\s*=\s*\S+" >/dev/null; then
  echo "Blocked: OPENAI_API_KEY appears to have a value in staged changes." >&2
  exit 1
fi

echo "Secret scan: OK"
