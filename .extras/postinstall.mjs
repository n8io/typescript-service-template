import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const isLefthookInstalled = existsSync('node_modules/.bin/lefthook')
const hookPath = '.git/hooks/pre-commit'
const isLefthookInitialized = existsSync(hookPath) && readFileSync(hookPath, 'utf8').includes('lefthook')

if (isLefthookInstalled && !isLefthookInitialized) {
  console.log('🥊 Installing lefthook git hooks...')
  execSync('npx lefthook install', { stdio: 'inherit' })
}
