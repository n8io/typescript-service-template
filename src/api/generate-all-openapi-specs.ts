import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateSpecs } from 'hono-openapi'
import { logger } from '../utils/logger.ts'
import type { makeApp } from './http/v1/app.ts'
import { version } from './http/v1/models.ts'

const makeGenerateOpenApiSpec = (app: ReturnType<typeof makeApp>) => async (version: string) => {
  const __filename = fileURLToPath(import.meta.url)
  const openApiSpecDirectory = resolve(dirname(__filename), '../../specs', version)

  if (!existsSync(openApiSpecDirectory)) {
    mkdirSync(openApiSpecDirectory, { recursive: true })
  }

  const openApiSpecPath = `${openApiSpecDirectory}/openapi.json`
  const spec = await generateSpecs(app)

  writeFileSync(openApiSpecPath, JSON.stringify(spec, null, 2), 'utf8')
}

const generateAllSpecs = (app: ReturnType<typeof makeApp>) => {
  // biome-ignore lint/nursery/noProcessEnv: <explanation>
  if (!process.env.GENERATE_OPENAPI_SPEC) {
    return
  }

  logger.info('📘 Generating latest openapi spec(s)...')

  const versions = [version]
  const generateOpenApiSpec = makeGenerateOpenApiSpec(app)

  versions.map(generateOpenApiSpec)
  logger.info('✅ Latest openapi spec(s) generated successfully')
}

export { generateAllSpecs }
