import { getTableName, inArray } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'
import type { Result } from 'neverthrow'
import { err, ok } from 'neverthrow'
import { DatabaseError } from 'pg'
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
  Entity extends z.infer<Schema> = z.infer<Schema>,
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

  async createOne(resource: CreateRequest): Promise<Result<Entity, DatabaseError>> {
    try {
      const dbRecord = this.schemaDb.parse(resource)

      // @ts-expect-error - TODO: fix this
      const [created] = await this.dependencies.db.insert(this.table).values(dbRecord).returning()

      return ok(this.schema.parse(created) as Entity)
    } catch (error) {
      if (error instanceof Error && error.cause && error.cause instanceof DatabaseError) {
        return err(error.cause)
      }

      if (error instanceof Error && 'code' in error) {
        return err(error as DatabaseError)
      }

      // For non-database errors, wrap them in a generic DatabaseError
      const genericError = new Error('Database operation failed') as DatabaseError
      genericError.code = 'UNKNOWN_ERROR'
      return err(genericError)
    }
  }

  async deleteMany(gids: string[]): Promise<Result<void, DatabaseError>> {
    try {
      // @ts-expect-error - TODO: fix this
      await this.dependencies.db.delete(this.table).where(inArray(this.table.gid, gids))
      return ok(undefined)
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        return err(error as DatabaseError)
      }

      const genericError = new Error('Database operation failed') as DatabaseError
      genericError.code = 'UNKNOWN_ERROR'
      return err(genericError)
    }
  }

  async getMany(request: SpiGetManyRequest): Promise<Result<SpiPaginatedResponse<Entity>, DatabaseError>> {
    try {
      const result = await spiGetManyRequestToPaginatedResult({
        db: this.dependencies.db,
        request,
        schema: this.schema,
        table: this.table,
      })
      return ok(result as SpiPaginatedResponse<Entity>)
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        return err(error as DatabaseError)
      }

      const genericError = new Error('Database operation failed') as DatabaseError
      genericError.code = 'UNKNOWN_ERROR'
      return err(genericError)
    }
  }

  async updateMany(
    updates: NonEmptyArray<UpdateByGid>,
    updatedBy: AuditRecord,
    updatedAt: Date,
  ): Promise<Result<Entity[], DatabaseError>> {
    try {
      const query = await domainUpdatesToDrizzleQuery(getTableName(this.table), updates, updatedBy, updatedAt)

      if (!query) {
        return ok([])
      }

      await this.dependencies.db.execute(query)

      // Fetch the updated resources to return them
      const gids = updates.map((u) => u.gid)
      const updatedResources = await this.dependencies.db
        .select()
        // biome-ignore lint/suspicious/noExplicitAny: Complex Drizzle ORM type issues
        .from(this.table as any)
        // biome-ignore lint/suspicious/noExplicitAny: Complex Drizzle ORM type issues
        .where(inArray((this.table as any).gid, gids))

      const parsedResources = updatedResources.map((resource) => this.schema.parse(resource) as Entity)

      return ok(parsedResources)
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        return err(error as DatabaseError)
      }

      const genericError = new Error('Database operation failed') as DatabaseError
      genericError.code = 'UNKNOWN_ERROR'
      return err(genericError)
    }
  }
}

export { DrizzleRepository }
