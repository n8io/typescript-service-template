import type { Spi } from '../../spi/init.ts'
import { ResourceService } from './resource.ts'

const initServices = async (spi: Spi) => {
  const resource = new ResourceService({
    repository: spi.repositories.resource,
  })

  return { resource }
}

export { initServices }
