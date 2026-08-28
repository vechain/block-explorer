#!/usr/bin/env bash
#
# Content-addressed identity for the app image: a hash of every blob at REF that the
# Docker build turns into image bytes. Identical content resolves to the same SHA
# however it got there, which is what lets the build and the ECS roll be skipped.
# Naming the last touching commit instead would mint a new identity on every squash
# merge and rebase. See .github/workflows/README.md.
#
# Usage: scripts/app-content-sha.sh [ref]   ->   app-<sha12>

set -euo pipefail

cd "$(dirname "$0")/.."

REF="${1:-HEAD}"

# Excluded only if it cannot change .next/standalone, .next/static or public — the
# three things the runner stage copies out. Everything else counts by default, so a
# new source directory is an input without anyone listing it here.
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

# The rest are dockerignored; these two reach the builder but nothing reads them.
CONTEXT_BUT_NOT_INPUT=(.agents .claude)

for path in "${EXCLUDED[@]}"; do
  if grep -qxF "$path" .dockerignore; then
    continue
  fi
  for allowed in "${CONTEXT_BUT_NOT_INPUT[@]}"; do
    if [ "$path" = "$allowed" ]; then
      continue 2
    fi
  done
  echo "::error::'${path}' is excluded from the content hash but is no longer in .dockerignore, so it is now an image input the hash cannot see. Either restore it there, or drop it from EXCLUDED in $0." >&2
  exit 1
done

# Diffing against the empty tree lists every included path with its blob SHA.
manifest=$(git -c core.quotePath=true diff-tree -r --no-commit-id \
  "$(git hash-object -t tree /dev/null)" "$REF" -- . "${EXCLUDED[@]/#/:(exclude)}")

if [ -z "$manifest" ]; then
  echo "::error::No path at '${REF}' is an app input. The EXCLUDED list in $0 is probably wrong." >&2
  exit 1
fi

echo "app-$(printf '%s\n' "$manifest" | git hash-object --stdin | cut -c1-12)"
