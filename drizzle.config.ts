/* v8 ignore start */
import { defineConfig } from 'drizzle-kit'

// biome-ignore lint/style/noDefaultExport: <explanation>
export default defineConfig({
  out: './src/spi/repositories/database/migrations',
  schema: './src/spi/repositories/database/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
})
