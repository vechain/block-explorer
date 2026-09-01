#!/usr/bin/env bash
#
# Hash of every blob at REF the build turns into out/. See .github/workflows/README.md.
#
# Usage: scripts/app-content-sha.sh [ref]   ->   app-<sha12>

set -euo pipefail

cd "$(dirname "$0")/.."

REF="${1:-HEAD}"

# Excluded only if it cannot change what lands in out/; everything else counts by default.
EXCLUDED=(
  .agents
  .claude
  .cursor
  .eslintignore
  .eslintrc.json
  .github
  .husky
  .prettierignore
  .prettierrc
  .vscode
  '*.md'
  '*.spec.ts'
  '*.spec.tsx'
  '*.test.ts'
  '*.test.tsx'
  knip.config.ts
  terraform
  test
  tests
  vitest.config.ts
)

# Diffing against the empty tree lists every included path with its blob SHA.
manifest=$(git -c core.quotePath=true diff-tree -r --no-commit-id \
  "$(git hash-object -t tree /dev/null)" "$REF" -- . "${EXCLUDED[@]/#/:(exclude)}")

if [ -z "$manifest" ]; then
  echo "::error::No path at '${REF}' is an app input. The EXCLUDED list in $0 is probably wrong." >&2
  exit 1
fi

echo "app-$(printf '%s\n' "$manifest" | git hash-object --stdin | cut -c1-12)"
