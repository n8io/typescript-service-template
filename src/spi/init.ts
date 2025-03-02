import type { Config } from '../config.ts'
import { initRepositories } from './repositories/init.ts'

type Spi = {
  repositories: Awaited<ReturnType<typeof initRepositories>>
}

const initSpi = async (config: Config): Promise<Spi> => {
  const repositories = await initRepositories(config)

  return { repositories }
}

export type { Spi }
export { initSpi }
