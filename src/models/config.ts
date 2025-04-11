import { z } from 'zod'

const schemaConfig = z.object({
  DATABASE_URL: z.string().url(),
  IS_TEST_CONTEXT: z.coerce.boolean().optional().default(false),
})

const exampleConfig = (overrides: Partial<z.infer<typeof schemaConfig>> = {}) => ({
  DATABASE_URL: 'sqlite://:memory:',
  IS_TEST_CONTEXT: false,
  ...overrides,
})

export { exampleConfig, schemaConfig }
