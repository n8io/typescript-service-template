import type { Config } from '../utils/config.ts'
import { initSpi } from './index.ts'
import * as Repositories from './repositories/index.ts'

vi.mock('./repositories/index.ts')

describe('initSpi', () => {
  it('should initialize the repositories', async () => {
    const config = {} as Config
    const repositories = {} as Awaited<ReturnType<typeof Repositories.initRepositories>>
    const initRepositoriesSpy = vi.spyOn(Repositories, 'initRepositories').mockResolvedValue(repositories)
    const result = await initSpi(config)

    expect(initRepositoriesSpy).toBeCalledWith(config)
    expect(result.repositories).toBe(repositories)
  })
})
