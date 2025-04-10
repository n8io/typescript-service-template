import type { Config } from '../../utils/config.ts'
import * as Db from './database/index.ts'
import { initRepositories } from './index.ts'

vi.mock('./database/index.ts')

describe('initRepositories', () => {
  it('should initialize the resource repository with the database connection', async () => {
    const config = {} as Config
    const db = {}
    const makeDatabaseSpy = vi.spyOn(Db, 'makeDatabase').mockReturnValue(db as ReturnType<typeof Db.makeDatabase>)
    const runMigrationsSpy = vi.spyOn(Db, 'runMigrations').mockResolvedValue()

    await initRepositories(config)

    expect(makeDatabaseSpy).toBeCalledWith(config)
    expect(runMigrationsSpy).toBeCalledWith(db)
  })
})
