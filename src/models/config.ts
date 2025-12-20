import { z } from 'zod'

const Env = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  STAGING: 'staging',
  TEST: 'test',
} as const

const schemaConfig = z.object({
  APP_ENV: z.string().trim().optional().default('development').pipe(z.nativeEnum(Env)),
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z
    .string()
    .optional()
    .default('info')
    .pipe(z.enum(['debug', 'info', 'warn', 'error'])),
  PORT: z.string().optional().default('3000').pipe(z.coerce.number()),
})

const exampleConfig = (overrides: Partial<z.infer<typeof schemaConfig>> = {}) =>
  schemaConfig.parse({
    APP_ENV: Env.TEST,
    DATABASE_URL: 'postgres://localhost:5432/not-a-real-db',
    LOG_LEVEL: 'info',
    ...overrides,
  })

export { exampleConfig, schemaConfig }
