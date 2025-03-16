import type { Spi } from '../../spi/index.ts'
import { ResourceService } from './resource.ts'

const initServices = async (spi: Spi) => {
  const resource = new ResourceService({
    repository: spi.repositories.resource,
  })

  return { resource }
}

export { initServices }
