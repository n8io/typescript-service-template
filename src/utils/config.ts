import { z } from 'zod'
import { AppConfigIncompleteError } from '../models/custom-error.ts'

const schemaConfig = z.object({
  DATABASE_URL: z.string().url(),
})

type Config = z.infer<typeof schemaConfig>

const results = schemaConfig.safeParse(process.env)

if (!results.success) {
  throw new AppConfigIncompleteError(results.error)
}

const config = results.data

export type { Config }
export { config }
