import * as Db from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { exampleConfig } from '../../../models/config.ts'
import type { AppStateManager, Closable, Monitorable } from '../../../utils/app-state-manager.ts'
import * as schema from './schema.ts'

vi.mock('drizzle-orm/node-postgres')
vi.mock('drizzle-orm/node-postgres/migrator')
vi.mock('./logger.ts')
vi.mock('pg')

import { initDatabase } from './init.ts'

describe('initDatabase', () => {
  const pool = {
    end: vi.fn().mockResolvedValue(undefined),
    query: vi.fn().mockImplementation(() => Promise.resolve({ rows: [] })),
  } as unknown as pg.Pool

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(pg, 'Pool').mockReturnValue(pool)
  })

  it('should create a database connection', async () => {
    const drizzleSpy = vi.spyOn(Db, 'drizzle')
    const registerClosableDependency = vi.fn().mockImplementation(() => {})
    const registerMonitorableDependency = vi.fn().mockImplementation(() => {})

    const appStateManager: AppStateManager = {
      registerClosableDependency,
      registerMonitorableDependency,
    } as unknown as AppStateManager

    const config = exampleConfig()

    initDatabase({ appStateManager, config })

    expect(pg.Pool).toHaveBeenCalledWith({
      connectionString: config.DATABASE_URL,
    })

    expect(drizzleSpy).toHaveBeenCalledWith({ client: pool, schema })
  })

  it('should close the database connection when close is called', async () => {
    let closeable: Closable | undefined = undefined

    const registerClosableDependency = vi.fn().mockImplementation((c: Closable) => {
      closeable = c
    })

    const registerMonitorableDependency = vi.fn().mockImplementation(() => {})

    const appStateManager: AppStateManager = {
      registerClosableDependency,
      registerMonitorableDependency,
    } as unknown as AppStateManager

    const config = exampleConfig()

    initDatabase({ appStateManager, config })

    expect(closeable).toBeDefined()

    // @ts-expect-error ???
    await closeable?.close()

    expect(pool.end).toHaveBeenCalled()
  })

  it('should check the database connection status when isConnected is called', async () => {
    let monitorable: Monitorable | undefined = undefined

    const registerClosableDependency = vi.fn().mockImplementation(() => {})

    const registerMonitorableDependency = vi.fn().mockImplementation((m: Monitorable) => {
      monitorable = m
    })

    const appStateManager: AppStateManager = {
      registerClosableDependency,
      registerMonitorableDependency,
    } as unknown as AppStateManager

    const config = exampleConfig()

    initDatabase({ appStateManager, config })

    expect(monitorable).toBeDefined()

    // @ts-expect-error ???
    const isConnected = await monitorable?.isConnected()

    expect(pool.query).toHaveBeenCalledWith('SELECT 1')
    expect(isConnected).toBe(true)
  })

  it('should report isConnected false when isConnected fails', async () => {
    let monitorable: Monitorable | undefined = undefined

    vi.spyOn(pool, 'query').mockImplementationOnce(() => {
      throw new Error('Connection failed')
    })

    const registerClosableDependency = vi.fn().mockImplementation(() => {})

    const registerMonitorableDependency = vi.fn().mockImplementation((m: Monitorable) => {
      monitorable = m
    })

    const appStateManager: AppStateManager = {
      registerClosableDependency,
      registerMonitorableDependency,
    } as unknown as AppStateManager

    const config = exampleConfig()

    initDatabase({ appStateManager, config })

    expect(monitorable).toBeDefined()

    // @ts-expect-error ???
    const isConnected = await monitorable?.isConnected()

    expect(pool.query).toHaveBeenCalledWith('SELECT 1')
    expect(isConnected).toBe(false)
  })
})
