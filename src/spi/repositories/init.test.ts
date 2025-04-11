import type { AppStateManager } from '../../utils/app-state-manager.ts'
import type { Config } from '../../utils/config.ts'
import * as Init from './database/init.ts'
import * as RunMigrations from './database/run-migrations.ts'
import { initRepositories } from './init.ts'

vi.mock('./database/init.ts')
vi.mock('./database/run-migrations.ts')

describe('initRepositories', () => {
  it('should initialize the resource repository with the database connection', async () => {
    const config = {} as Config
    const appStateManager = {} as AppStateManager
    const db = {}
    const initDatabaseSpy = vi.spyOn(Init, 'initDatabase').mockReturnValue(db as ReturnType<typeof Init.initDatabase>)
    const runMigrationsSpy = vi.spyOn(RunMigrations, 'runMigrations').mockResolvedValue()

    await initRepositories({ appStateManager, config })

    expect(initDatabaseSpy).toBeCalledWith({ appStateManager, config })
    expect(runMigrationsSpy).toBeCalledWith(db)
  })
})
