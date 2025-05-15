// This script runs after the package is installed and checks if Lefthook is installed.
// If Lefthook is installed, it will check if the git hooks are initialized.
// If not, it will install the git hooks.

import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const isLefthookInstalled = existsSync('node_modules/.bin/lefthook')
const hookPath = '.git/hooks/pre-commit'
const isLefthookInitialized = existsSync(hookPath) && readFileSync(hookPath, 'utf8').includes('lefthook')

if (isLefthookInstalled && !isLefthookInitialized) {
  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log('🥊 Installing lefthook git hooks...')
  execSync('npx lefthook install', { stdio: 'inherit' })
}
