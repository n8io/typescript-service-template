import { schemaResource } from '../../domain/models/resource.ts'
import type { ResultSpiResourceRepository } from '../../domain/spi-ports/result-resource-repository.ts'
import type { initDatabase } from './database/init.ts'
import { tableResources } from './database/schema.ts'
import { ResultDrizzleRepository } from './models/result-drizzle-repository.ts'

type Dependencies = {
  db: ReturnType<typeof initDatabase>
}

class ResultResourceRepository
  extends ResultDrizzleRepository<typeof schemaResource, typeof tableResources>
  implements ResultSpiResourceRepository
{
  constructor(dependencies: Dependencies) {
    super(dependencies, schemaResource, tableResources)
  }
}

export { ResultResourceRepository }
