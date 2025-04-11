import * as Db from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { exampleConfig } from '../../../models/config.ts'
import type { AppStateManager } from '../../../utils/app-state-manager.ts'
import { initDatabase } from './init.ts'
import * as schema from './schema.ts'

vi.mock('drizzle-orm/node-postgres')
vi.mock('drizzle-orm/node-postgres/migrator')
vi.mock('pg')

describe('makeDatabase', () => {
  const pool = {} as pg.Pool

  beforeEach(() => {
    vi.spyOn(pg, 'Pool').mockReturnValue(pool)
  })

  it('should create a database connection', () => {
    const drizzleSpy = vi.spyOn(Db, 'drizzle')
    const appStateManager: AppStateManager = { registerClosableDependency: vi.fn() } as unknown as AppStateManager
    const config = exampleConfig()

    initDatabase({ appStateManager, config })

    expect(pg.Pool).toHaveBeenCalledWith({
      connectionString: config.DATABASE_URL,
    })

    expect(drizzleSpy).toHaveBeenCalledWith({ client: pool, schema })
  })
})
