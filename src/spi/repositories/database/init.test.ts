import * as Db from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { exampleConfig } from '../../../models/config.ts'
import type { AppStateManager, Closable } from '../../../utils/app-state-manager.ts'
import { initDatabase } from './init.ts'
import * as schema from './schema.ts'

vi.mock('drizzle-orm/node-postgres')
vi.mock('drizzle-orm/node-postgres/migrator')
vi.mock('pg')

describe('initDatabase', () => {
  const pool = {
    end: vi.fn().mockResolvedValue(undefined),
  } as unknown as pg.Pool

  beforeEach(() => {
    vi.spyOn(pg, 'Pool').mockReturnValue(pool)
  })

  it('should create a database connection', async () => {
    const drizzleSpy = vi.spyOn(Db, 'drizzle')
    let closeable: Closable | undefined = undefined

    const registerClosableDependency = vi.fn().mockImplementation((c: Closable) => {
      closeable = c
    })

    const appStateManager: AppStateManager = { registerClosableDependency } as unknown as AppStateManager
    const config = exampleConfig()

    initDatabase({ appStateManager, config })

    expect(pg.Pool).toHaveBeenCalledWith({
      connectionString: config.DATABASE_URL,
    })

    expect(drizzleSpy).toHaveBeenCalledWith({ client: pool, schema })
    expect(closeable).toBeDefined()

    // @ts-expect-error ???
    await closeable?.close()

    expect(pool.end).toHaveBeenCalled()
  })
})
