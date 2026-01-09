#!/usr/bin/env node
import { execSync } from 'child_process'

// Run knip without file arguments (knip analyzes the entire project)
try {
  execSync('pnpm knip', { stdio: 'inherit' })
} catch {
  process.exit(1)
}
