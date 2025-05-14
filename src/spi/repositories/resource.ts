import { schemaResource } from '../../domain/models/resource.ts'
import type { SpiResourceRepository } from '../../domain/spi-ports/resource-repository.ts'
import type { initDatabase } from './database/init.ts'
import { resourcesTable } from './database/schema.ts'
import { DrizzleRepository } from './models/drizzle-repository.ts'

type Dependencies = {
  db: ReturnType<typeof initDatabase>
}

class ResourceRepository
  extends DrizzleRepository<typeof schemaResource, typeof resourcesTable>
  implements SpiResourceRepository
{
  constructor(dependencies: Dependencies) {
    super(dependencies, schemaResource, resourcesTable)
  }
}

export { ResourceRepository }
