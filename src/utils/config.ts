import type { z } from 'zod'
import { schemaConfig } from '../models/config.ts'
import { AppConfigIncompleteError } from '../models/custom-error.ts'

type Config = z.infer<typeof schemaConfig>

// biome-ignore lint/style/noProcessEnv: We need to parse the environment variables
const results = schemaConfig.safeParse(process.env)

if (!results.success) {
  const missingVars = results.error.issues
    .filter((issue) => issue.code === 'invalid_type' && issue.received === 'undefined')
    .map((issue) => issue.path.join('.'))
    .join(', ')

  const invalidVars = results.error.issues
    .filter((issue) => issue.code !== 'invalid_type' || issue.received !== 'undefined')
    .map((issue) => {
      const path = issue.path.join('.')
      return `${path}: ${issue.message}`
    })
    .join('; ')

  const messages = ['Application configuration is invalid.']

  if (missingVars) {
    messages.push(
      `Missing required environment variables: ${missingVars}. Please ensure these variables are set in your .env file or environment. See .env.example for required variables.`,
    )
  }

  if (invalidVars) {
    messages.push(
      `Invalid environment variables: ${invalidVars}. Please check the format and values of these variables.`,
    )
  }

  messages.push('For more information, see the README.md troubleshooting section.')

  const helpfulMessage = messages.join(' ')

  throw new AppConfigIncompleteError(helpfulMessage)
}

const config = results.data

export type { Config }
export { config }
