#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Checking shell scripts..."
bash -n scripts/bootstrap.sh
bash -n scripts/verify.sh
bash -n scripts/check-docs.sh
bash -n scripts/check-local-env.sh

echo "Checking Markdown links..."
mapfile -t markdown_files < <(
  find . \
    -path './node_modules' -prune -o \
    -path './frontend/node_modules' -prune -o \
    -path './backend/node_modules' -prune -o \
    -path './.git' -prune -o \
    -path './audit-system/reports' -prune -o \
    -name '*.md' -type f -print | sort
)

for file in "${markdown_files[@]}"; do
  npx markdown-link-check --quiet --config .markdown-link-check.json "$file"
done

echo "Documentation checks passed."
