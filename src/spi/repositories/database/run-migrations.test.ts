import * as DbMigrator from 'drizzle-orm/node-postgres/migrator'
import { runMigrations } from './run-migrations.ts'

vi.mock('drizzle-orm/node-postgres')
vi.mock('drizzle-orm/node-postgres/migrator')
vi.mock('pg')

describe('runMigrations', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('should run migrations', async () => {
    const migrateSpy = vi.spyOn(DbMigrator, 'migrate').mockResolvedValue(undefined)
    const db = {} as Parameters<typeof runMigrations>[0]

    await runMigrations(db)

    expect(migrateSpy).toHaveBeenCalledWith(db, { migrationsFolder: expect.any(String) })
  })
})
