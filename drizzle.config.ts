// Must be in the root of the project to make sure all schemas have access to the openapi extension
import 'zod-openapi/extend'

/* v8 ignore start */
import { defineConfig } from 'drizzle-kit'

// biome-ignore lint/style/noDefaultExport: We need to default export the config to use it in the project
export default defineConfig({
  out: './src/spi/repositories/database/migrations',
  schema: './src/spi/repositories/database/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    // biome-ignore lint/style/noProcessEnv: We need to check the environment variable directly instead of via config
    url: process.env.DATABASE_URL as string,
  },
})
