import { getTableName, inArray } from 'drizzle-orm'
import { type PgTable } from 'drizzle-orm/pg-core'
import type { z } from 'zod'
import type { SpiPaginatedResponse } from '../../../domain/spi-ports/paginated.ts'
import type { SpiGetManyRequest } from '../../../domain/spi-ports/resource-repository.ts'
import type { AuditRecord } from '../../../models/audit-record.ts'
import type { initDatabase } from '../database/init.ts'
import { schemaDbRecord } from '../models/db-record.ts'
import type { UpdateByGid } from '../utils/domain-updates-to-drizzle-query.ts'
import { domainUpdatesToDrizzleQuery } from '../utils/domain-updates-to-drizzle-query.ts'
import { spiGetManyRequestToPaginatedResult } from '../utils/spi-get-many-request-to-paginated-result.ts'

type Dependencies = {
  db: ReturnType<typeof initDatabase>
}

abstract class DrizzleRepository<
  Schema extends z.ZodObject<z.ZodRawShape>,
  Table extends PgTable,
  Entity = z.infer<Schema>,
  CreateRequest = Entity,
> {
  protected readonly dependencies: Dependencies
  protected readonly schema: Schema
  protected readonly schemaDb: z.ZodObject<z.ZodRawShape>
  protected readonly table: Table

  protected constructor(dependencies: Dependencies, schema: Schema, table: Table) {
    this.dependencies = dependencies
    this.schema = schema
    this.schemaDb = schemaDbRecord.merge(schema)
    this.table = table
  }

  async createOne(resource: CreateRequest): Promise<Entity> {
    const dbRecord = this.schemaDb.parse(resource)

    // @ts-expect-error - TODO: fix this
    const [created] = await this.dependencies.db.insert(this.table).values(dbRecord).returning()

    return this.schema.parse(created) as Entity
  }

  async deleteMany(gids: string[]): Promise<void> {
    // @ts-expect-error - TODO: fix this
    await this.dependencies.db.delete(this.table).where(inArray(this.table.gid, gids))
  }

  async getMany(request: SpiGetManyRequest): Promise<SpiPaginatedResponse<Entity>> {
    return spiGetManyRequestToPaginatedResult({
      db: this.dependencies.db,
      request,
      schema: this.schema,
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      table: this.table as any,
    }) as Promise<SpiPaginatedResponse<Entity>>
  }

  async updateMany(updates: NonEmptyArray<UpdateByGid>, updatedBy: AuditRecord, updatedAt: Date): Promise<void> {
    const query = await domainUpdatesToDrizzleQuery(getTableName(this.table), updates, updatedBy, updatedAt)

    if (!query) {
      return
    }

    await this.dependencies.db.execute(query)
  }
}

export { DrizzleRepository }
