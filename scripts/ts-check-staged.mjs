import { spawnSync } from 'node:child_process'

// lint-staged appends a list of staged filenames to the command.
// If those filenames reach `tsc`, it will ignore tsconfig.json and use defaults,
// which causes a bunch of false-positive errors from dependencies.
//
// This wrapper intentionally ignores argv and always type-checks the project.
const result = spawnSync('pnpm', ['exec', 'tsc', '-p', 'tsconfig.json', '--noEmit'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

process.exit(result.status ?? 1)
