import { eq, sql } from 'drizzle-orm'
import type { z } from 'zod'
import { schemaResource } from '../../domain/models/resource.ts'
import type { SpiPaginatedResponse } from '../../domain/spi-ports/paginated.ts'
import type {
  SpiGetManyRequest,
  SpiResourceRepository,
  SpiUpdateOneRequest,
} from '../../domain/spi-ports/resource-repository.ts'
import { domainGetManyRequestToDrizzleQuery } from '../../utils/transforms/domain-get-many-request-to-drizzle-query.ts'
import { validation } from '../../utils/validation.ts'
import type { initDatabase } from './database/init.ts'
import { resourcesTable } from './database/schema.ts'
import { schemaDbRecord } from './models.ts'

type Dependencies = {
  db: ReturnType<typeof initDatabase>
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
    const [created] = await this.dependencies.db.insert(resourcesTable).values(dbRecord).returning()

    return this.schema.parse(created)
  }

  async getMany(query: SpiGetManyRequest): Promise<SpiPaginatedResponse<z.infer<typeof this.schema>>> {
    const { limit, offset, orderBy, where } = domainGetManyRequestToDrizzleQuery(query, resourcesTable)
    const countResults = await this.dependencies.db.select({ count: sql`COUNT(*)` }).from(resourcesTable).where(where)

    /* v8 ignore next 1 */
    const count = validation.number.parse(countResults[0]?.count ?? 0)

    const results = await this.dependencies.db
      .select()
      .from(resourcesTable)
      .where(where)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset)

    return {
      items: this.schema.array().parse(results),
      itemsTotal: count,
    }
  }

  async updateOne(gid: string, request: SpiUpdateOneRequest): Promise<z.infer<typeof this.schema>> {
    const [updated] = await this.dependencies.db
      .update(resourcesTable)
      .set(request)
      // @ts-expect-error Fix this type error
      .where(eq(resourcesTable.gid, gid))
      .returning()

    return this.schema.parse(updated)
  }
}

export { ResourceRepository }
