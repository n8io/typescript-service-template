import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { logger } from '../../../utils/logger.ts'
import type { initDatabase } from './init.ts'

const runMigrations = async (db: ReturnType<typeof initDatabase>) => {
  const fileDirectory = path.dirname(fileURLToPath(import.meta.url))
  const migrationsFolder = path.resolve(fileDirectory, './migrations')

  logger.info('🤓 Running db migrations...')
  await migrate(db, { migrationsFolder })
  logger.info('✅ Migrations applied successfully')
}

export { runMigrations }
