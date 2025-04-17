import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import type { AppStateManager, Closable, Monitorable } from '../../../utils/app-state-manager.ts'
import type { Config } from '../../../utils/config.ts'
import { logger } from '../../../utils/logger.ts'
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
      logger.info('📕 Closing database connection...')
      await pool.end()
      logger.info('✔️ Database connection closed')
    },
  }

  const isConnected = async () => {
    try {
      await pool.query('SELECT 1')

      return true
    } catch {
      return false
    }
  }

  const monitorable: Monitorable = {
    isConnected,
    name: 'database',
  }

  appStateManager.registerClosableDependency(closeable)
  appStateManager.registerMonitorableDependency(monitorable)

  return drizzle({ client: pool, schema })
}

export { initDatabase }
