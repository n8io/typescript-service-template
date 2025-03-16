import type { Config } from '../utils/config.ts'
import { initRepositories } from './repositories/index.ts'

type Spi = {
  repositories: Awaited<ReturnType<typeof initRepositories>>
}

const initSpi = async (config: Config): Promise<Spi> => {
  const repositories = await initRepositories(config)

  return { repositories }
}

export { initSpi }
export type { Spi }
