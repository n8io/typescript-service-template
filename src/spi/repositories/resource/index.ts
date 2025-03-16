import type { z } from 'zod'
import { schemaResource } from '../../../domain/models/resource.ts'
import type { SpiResourceRepository } from '../../../domain/spi-ports/resource-repository.ts'
import { schemaDbRecord } from '../models.ts'

type Dependencies = {
  db: {
    connection: {
      url: string
    }
  }
}

class ResourceRepository implements SpiResourceRepository {
  private schema = schemaResource
  private schemaDb = schemaDbRecord.merge(this.schema)

  private dependencies: Dependencies

  constructor(dependencies: Dependencies) {
    this.dependencies = dependencies
  }

  async getOne(gid: string): Promise<Prettify<z.infer<typeof this.schema>>> {
    const dbRecord = this.schemaDb.parse({
      createdAt: new Date(),
      createdBy: {
        gid: '1',
        email: 'john.doe@example.com',
        type: 'USER',
      },
      gid,
      id: 'ID',
      name: 'Resource Name',
      timeZone: 'America/New_York',
      updatedAt: new Date(),
      updatedBy: {
        system: 'CRON',
        type: 'SYSTEM',
      },
    })

    return this.schema.parse(dbRecord)
  }
}

export { ResourceRepository }
