import { sql } from 'drizzle-orm'
import type { z } from 'zod'
import { schemaResource } from '../../domain/models/resource.ts'
import type { SpiPaginatedResponse } from '../../domain/spi-ports/paginated.ts'
import type { SpiGetManyRequest, SpiResourceRepository } from '../../domain/spi-ports/resource-repository.ts'
import { domainGetManyRequestToDrizzleQuery } from '../../utils/transforms/domain-get-many-request-to-drizzle-query.ts'
import { validation } from '../../utils/validation.ts'
import type { makeDatabase } from './database/index.ts'
import { resourcesTable as resourceTable } from './database/schema.ts'
import { schemaDbRecord } from './models.ts'

type Dependencies = {
  db: ReturnType<typeof makeDatabase>
}

class ResourceRepository implements SpiResourceRepository {
  private dependencies: Dependencies
  private schema = schemaResource
  private schemaDb = schemaDbRecord.merge(this.schema)

  constructor(dependencies: Dependencies) {
    this.dependencies = dependencies
  }

  async createOne(resource: z.infer<typeof this.schema>): Promise<Prettify<z.infer<typeof this.schema>>> {
    const dbRecord = this.schemaDb.parse(resource)
    const [created] = await this.dependencies.db.insert(resourceTable).values(dbRecord).returning()

    return this.schema.parse(created)
  }

  async getMany(query: SpiGetManyRequest): Promise<SpiPaginatedResponse<z.infer<typeof this.schema>>> {
    const { limit, offset, orderBy, where } = domainGetManyRequestToDrizzleQuery(query, resourceTable)
    const countResults = await this.dependencies.db.select({ count: sql`COUNT(*)` }).from(resourceTable).where(where)

    /* v8 ignore next 1 */
    const count = validation.number.parse(countResults[0]?.count ?? 0)

    const results = await this.dependencies.db
      .select()
      .from(resourceTable)
      .where(where)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset)

    return {
      items: this.schema.array().parse(results),
      itemsTotal: count,
    }
  }
}

export { ResourceRepository }
