import type { AppStateManager } from '../utils/app-state-manager.ts'
import type { Config } from '../utils/config.ts'
import { initSpi } from './init.ts'
import * as Repositories from './repositories/init.ts'

vi.mock('./repositories/index.ts')

describe('initSpi', () => {
  it('should initialize the repositories', async () => {
    const config = {} as Config
    const appStateManager = {} as AppStateManager
    const repositories = {} as Awaited<ReturnType<typeof Repositories.initRepositories>>
    const initRepositoriesSpy = vi.spyOn(Repositories, 'initRepositories').mockResolvedValue(repositories)
    const result = await initSpi({ appStateManager, config })

    expect(initRepositoriesSpy).toBeCalledWith({ appStateManager, config })
    expect(result.repositories).toBe(repositories)
  })
})
