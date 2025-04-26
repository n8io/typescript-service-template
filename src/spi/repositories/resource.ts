import { eq } from 'drizzle-orm'
import type { z } from 'zod'
import { schemaResource } from '../../domain/models/resource.ts'
import type {
  SpiGetManyRequest,
  SpiResourceRepository,
  SpiUpdateOneRequest,
} from '../../domain/spi-ports/resource-repository.ts'
import type { initDatabase } from './database/init.ts'
import { resourcesTable } from './database/schema.ts'
import { schemaDbRecord } from './models.ts'
import { spiGetManyRequestToPaginatedResult } from './utils/spi-get-many-request-to-paginated-result.ts'

type Dependencies = {
  db: ReturnType<typeof initDatabase>
}

class ResourceRepository implements SpiResourceRepository {
  private dependencies: Dependencies
  private schema = schemaResource
  private schemaDb = schemaDbRecord.merge(this.schema)
  private table = resourcesTable

  constructor(dependencies: Dependencies) {
    this.dependencies = dependencies
  }

  async createOne(resource: z.infer<typeof this.schema>): Promise<Prettify<z.infer<typeof this.schema>>> {
    const dbRecord = this.schemaDb.parse(resource)
    const [created] = await this.dependencies.db.insert(this.table).values(dbRecord).returning()

    return this.schema.parse(created)
  }

  async getMany(request: SpiGetManyRequest) {
    return spiGetManyRequestToPaginatedResult({
      db: this.dependencies.db,
      request,
      schema: this.schema,
      table: this.table,
    })
  }

  async updateOne(gid: string, request: SpiUpdateOneRequest): Promise<z.infer<typeof this.schema>> {
    const [updated] = await this.dependencies.db
      .update(this.table)
      .set(request)
      // @ts-expect-error Fix this type error
      .where(eq(this.table.gid, gid))
      .returning()

    return this.schema.parse(updated)
  }
}

export { ResourceRepository }
