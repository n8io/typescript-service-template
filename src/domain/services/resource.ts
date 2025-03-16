import type { z } from 'zod'
import { schemaResource } from '../models/resource.ts'
import type { SpiResourceRepository } from '../spi-ports/resource-repository.ts'

type Dependencies = {
  repository: SpiResourceRepository
}

class ResourceService {
  private schema = schemaResource

  private dependencies: Dependencies

  constructor(dependencies: Dependencies) {
    this.dependencies = dependencies
  }

  async getOne(id: string): Promise<Prettify<z.infer<typeof this.schema>>> {
    return this.dependencies.repository.getOne(id)
  }
}

export { ResourceService }
