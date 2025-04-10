import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import type { Config } from '../../../utils/config.ts'

const makeDatabase = (config: Config) => drizzle(config.DATABASE_URL)

const runMigrations = async (db: ReturnType<typeof makeDatabase>) => {
  const fileDirectory = path.dirname(fileURLToPath(import.meta.url))
  const migrationsFolder = path.resolve(fileDirectory, './migrations')

  console.log('🤓 Running db migrations...')
  await migrate(db, { migrationsFolder })
  console.log('✅ Migrations applied successfully')
}

export { makeDatabase, runMigrations }
