import type { Spi } from '../spi/init.ts'
import { initServices } from './services/index.ts'

type Domain = {
  services: Awaited<ReturnType<typeof initServices>>
}

const initDomain = async (spi: Spi): Promise<Domain> => {
  const services = await initServices(spi)

  return { services }
}

export { initDomain }
export type { Domain }
