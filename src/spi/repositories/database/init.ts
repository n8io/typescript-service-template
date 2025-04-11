import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import pg from 'pg'
import type { AppStateManager, Closable } from '../../../utils/app-state-manager.ts'
import type { Config } from '../../../utils/config.ts'
import * as schema from './schema.ts'

type MakeDatabaseDependencies = {
  appStateManager: AppStateManager
  config: Config
}

const makeDatabase = ({ appStateManager, config }: MakeDatabaseDependencies) => {
  const pool = new pg.Pool({
    connectionString: config.DATABASE_URL,
  })

  const closeable: Closable = {
    close: async () => {
      console.log('📕 Closing database connection...')
      await pool.end()
      console.log('✔️ Database connection closed')
    },
  }

  appStateManager.registerClosableDependency(closeable)

  return drizzle({ client: pool, schema })
}

const runMigrations = async (db: ReturnType<typeof makeDatabase>) => {
  const fileDirectory = path.dirname(fileURLToPath(import.meta.url))
  const migrationsFolder = path.resolve(fileDirectory, './migrations')

  console.log('🤓 Running db migrations...')
  await migrate(db, { migrationsFolder })
  console.log('✅ Migrations applied successfully')
}

export { makeDatabase, runMigrations }
