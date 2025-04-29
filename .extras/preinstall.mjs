// This script updates the package.json file to set the node version in the engines field
// This allows us to have a single source of truth for the node version (.nvmrc)

import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const nvmRcPath = resolve(__dirname, '../.nvmrc')
const packageJsonPath = resolve(__dirname, '../package.json')
const nodeVersion = readFileSync(nvmRcPath, 'utf8').trim().replace('v', '')
const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim()
const majorNpmVersion = npmVersion.split('.')[0]

pkg.engines.node = `^${nodeVersion}`
pkg.engines.npm = `^${majorNpmVersion}`

writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`)
