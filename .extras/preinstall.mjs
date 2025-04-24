import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// This script updates the package.json file to set the node version in the engines field
// This allows us to have a single source of truth for the node version (.nvmrc)

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const nvmRcPath = resolve(__dirname, '../.nvmrc')
const packageJsonPath = resolve(__dirname, '../package.json')
const nodeVersion = readFileSync(nvmRcPath, 'utf8').trim().replace('v', '')
const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'))

pkg.engines.node = `^${nodeVersion}`

writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`)
