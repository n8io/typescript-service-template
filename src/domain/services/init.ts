import type { Spi } from '../../spi/init.ts'
import { ResourceService } from './resource.ts'

const initServices = async (spi: Spi) => {
  const resource = new ResourceService(spi)

  return { resource }
}

export { initServices }
