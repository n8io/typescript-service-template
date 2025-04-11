import type { AppStateManager } from '../utils/app-state-manager.ts'
import type { Config } from '../utils/config.ts'
import { initRepositories } from './repositories/init.ts'

type Spi = {
  repositories: Awaited<ReturnType<typeof initRepositories>>
}

type SpiDependencies = {
  appStateManager: AppStateManager
  config: Config
}

const initSpi = async (dependencies: SpiDependencies): Promise<Spi> => {
  const repositories = await initRepositories(dependencies)

  return { repositories }
}

export { initSpi }
export type { Spi }
