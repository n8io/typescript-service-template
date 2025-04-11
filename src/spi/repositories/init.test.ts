import type { AppStateManager } from '../../utils/app-state-manager.ts'
import type { Config } from '../../utils/config.ts'
import * as Db from './database/init.ts'
import { initRepositories } from './init.ts'

vi.mock('./database/index.ts')

describe('initRepositories', () => {
  it('should initialize the resource repository with the database connection', async () => {
    const config = {} as Config
    const appStateManager = {} as AppStateManager
    const db = {}
    const makeDatabaseSpy = vi.spyOn(Db, 'makeDatabase').mockReturnValue(db as ReturnType<typeof Db.makeDatabase>)
    const runMigrationsSpy = vi.spyOn(Db, 'runMigrations').mockResolvedValue()

    await initRepositories({ appStateManager, config })

    expect(makeDatabaseSpy).toBeCalledWith({ appStateManager, config })
    expect(runMigrationsSpy).toBeCalledWith(db)
  })
})
