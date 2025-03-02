import type { z } from 'zod'
import { schemaResource } from '../../../domain/models/resource.ts'
import type { SpiResourceRepository } from '../../../domain/spi-ports/resource-repository.ts'
import { schemaDbResource } from './model.ts'

type Dependencies = {
  db: {
    connection: {
      url: string
    }
  }
}

class ResourceRepository implements SpiResourceRepository {
  private dbSchema = schemaDbResource
  private schema = schemaResource

  private dependencies: Dependencies

  constructor(dependencies: Dependencies) {
    this.dependencies = dependencies
  }

  async getOne(id: string): Promise<Prettify<z.infer<typeof this.schema>>> {
    const record = this.dbSchema.parse({
      createdAt: new Date(),
      createdBy: {
        gid: '1',
        email: 'john.doe@example.com',
        type: 'USER',
      },
      gid: 'gid',
      id,
      name: 'Resource Name',
      timeZone: 'America/New_York',
      updatedAt: new Date(),
      updatedBy: {
        system: 'CRON',
        type: 'SYSTEM',
      },
    })

    return this.schema.parse(record)
  }
}

export { ResourceRepository }
