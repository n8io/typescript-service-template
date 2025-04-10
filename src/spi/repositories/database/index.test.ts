import * as Db from 'drizzle-orm/node-postgres'
import * as DbMigrator from 'drizzle-orm/node-postgres/migrator'
import { makeDatabase, runMigrations } from './index.ts'

vi.mock('drizzle-orm/node-postgres')
vi.mock('drizzle-orm/node-postgres/migrator')

describe('makeDatabase', () => {
  it('should create a database connection', () => {
    const drizzleSpy = vi.spyOn(Db, 'drizzle')

    const config = {
      DATABASE_URL: 'postgres://user:password@localhost:5432/db',
    }

    makeDatabase(config)

    expect(drizzleSpy).toHaveBeenCalledWith(config.DATABASE_URL)
  })
})

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
