import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import type { AppStateManager, Closable } from '../../../utils/app-state-manager.ts'
import type { Config } from '../../../utils/config.ts'
import * as schema from './schema.ts'

type Dependencies = {
  appStateManager: AppStateManager
  config: Config
}

const initDatabase = ({ appStateManager, config }: Dependencies) => {
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

export { initDatabase }
