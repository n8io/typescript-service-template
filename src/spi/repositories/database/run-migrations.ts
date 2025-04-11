import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import type { initDatabase } from './init.ts'

const runMigrations = async (db: ReturnType<typeof initDatabase>) => {
  const fileDirectory = path.dirname(fileURLToPath(import.meta.url))
  const migrationsFolder = path.resolve(fileDirectory, './migrations')

  console.log('🤓 Running db migrations...')
  await migrate(db, { migrationsFolder })
  console.log('✅ Migrations applied successfully')
}

export { runMigrations }
