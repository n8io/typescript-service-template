import { z } from 'zod'
import { schemaConfig } from '../models/config.ts'
import { AppConfigIncompleteError } from '../models/custom-error.ts'

type Config = z.infer<typeof schemaConfig>

const results = schemaConfig.safeParse(process.env)

if (!results.success) {
  throw new AppConfigIncompleteError(results.error)
}

const config = results.data

export type { Config }
export { config }
