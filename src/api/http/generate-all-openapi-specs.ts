import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateSpecs } from 'hono-openapi'
import { logger } from '../../utils/logger.ts'
import { OpenApiTag } from './models/openapi.ts'
import type { makeApp } from './v1/app.ts'
import { version as v1Version } from './v1/models.ts'
import { copy } from './v1/openapi/copy.ts'

const tagMap: Record<OpenApiTag, string> = {
  [OpenApiTag.RESOURCES]: 'Manage resources',
}

const versions = [v1Version] as const
const tags = Object.entries(tagMap).map(([name, description]) => ({ name, description }))

const areSpecsEqual = (filePath: string, spec: string) => {
  if (!existsSync(filePath)) {
    return false
  }

  return readFileSync(filePath, { encoding: 'utf8' }) === spec
}

const makeGenerateOpenApiSpec = (app: ReturnType<typeof makeApp>) => async (version: string) => {
  const __filename = fileURLToPath(import.meta.url)
  const openApiSpecDirectory = resolve(dirname(__filename), '../../../specs', version)

  if (!existsSync(openApiSpecDirectory)) {
    mkdirSync(openApiSpecDirectory, { recursive: true })
  }

  const openApiSpecPath = `${openApiSpecDirectory}/openapi.json`

  const spec = await generateSpecs(app, {
    documentation: {
      info: {
        title: 'Typescript Service Template',
        version,
        description: copy.introduction,
      },
      servers: [
        // Update the URLs to match your environments
        {
          description: 'Local',
          url: 'http://localhost:3000',
        },
        {
          description: 'Testing',
          url: 'https://testing.example.com',
        },
        {
          description: 'Staging',
          url: 'https://staging.example.com',
        },
        {
          description: 'Production',
          url: 'https://production.example.com',
        },
      ],
      tags,
    },
  })

  const stringifiedSpec = JSON.stringify(spec, null, 2)

  if (areSpecsEqual(openApiSpecPath, stringifiedSpec)) {
    logger.info(`📗 OpenAPI spec for version ${version} is up to date`)

    return stringifiedSpec
  }

  writeFileSync(openApiSpecPath, stringifiedSpec, 'utf8')

  return stringifiedSpec
}

const generateAllOpenApiSpecs = async (app: ReturnType<typeof makeApp>) => {
  // biome-ignore lint/nursery/noProcessEnv: <explanation>
  if (!process.env.GENERATE_OPENAPI_SPEC) {
    return []
  }

  logger.info('📘 Generating latest openapi spec(s)...')

  const generateOpenApiSpec = makeGenerateOpenApiSpec(app)

  const specs = await Promise.all(versions.map(generateOpenApiSpec))

  logger.info('✅ Latest openapi spec(s) generated successfully')

  return specs
}

export { generateAllOpenApiSpecs }
