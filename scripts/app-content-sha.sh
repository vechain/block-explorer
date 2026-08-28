#!/usr/bin/env bash
#
# Content-addressed identity for the app image: the last commit reachable from REF
# that touched anything the Docker build turns into image bytes. Two releases with
# the same content resolve to the same SHA, which is what lets the build and the
# ECS roll be skipped. See .github/workflows/README.md.
#
# Usage: scripts/app-content-sha.sh [ref]   ->   app-<sha12>   (needs full history)

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
  knip.config.ts
  terraform
  test
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

commit=$(git rev-list -1 "$REF" -- . "${EXCLUDED[@]/#/:(exclude)}")

if [ -z "$commit" ]; then
  echo "::error::No commit reachable from '${REF}' touches any app path. The EXCLUDED list in $0 is probably wrong." >&2
  exit 1
fi

echo "app-$(git rev-parse --short=12 "$commit")"
