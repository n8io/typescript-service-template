import { getTableName, inArray } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'
import type { Result } from 'neverthrow'
import { err, ok } from 'neverthrow'
import type { z } from 'zod'
import type { SpiPaginatedResponse } from '../../../domain/spi-ports/paginated.ts'
import type { SpiGetManyRequest } from '../../../domain/spi-ports/resource-repository.ts'
import type { AuditRecord } from '../../../models/audit-record.ts'
import type { SpiDatabaseError } from '../../models/spi-error.ts'
import { SpiDatabaseError as SpiDbError, SpiValidationError } from '../../models/spi-error.ts'
import { isSpiDatabaseError } from '../database/error.ts'
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

  async createOne(resource: CreateRequest): Promise<Result<Entity, SpiDatabaseError | SpiValidationError>> {
    try {
      const dbRecord = this.schemaDb.parse(resource)

      // @ts-expect-error - TODO: fix this generic typing issue
      const [created] = await this.dependencies.db.insert(this.table).values(dbRecord).returning()

      return this.validateSchema(created)
    } catch (error) {
      return err(this.handleDatabaseError(error))
    }
  }

  async deleteMany(gids: string[]): Promise<Result<void, SpiDatabaseError>> {
    try {
      // @ts-expect-error - TODO: fix this generic typing issue
      await this.dependencies.db.delete(this.table).where(inArray(this.table.gid, gids))

      return ok(undefined)
    } catch (error) {
      return err(this.handleDatabaseError(error))
    }
  }

  async getMany(request: SpiGetManyRequest): Promise<Result<SpiPaginatedResponse<Entity>, SpiDatabaseError>> {
    try {
      const result = await spiGetManyRequestToPaginatedResult({
        db: this.dependencies.db,
        request,
        schema: this.schema,
        table: this.table,
      })

      return ok(result as SpiPaginatedResponse<Entity>)
    } catch (error) {
      return err(this.handleDatabaseError(error))
    }
  }

  async updateMany(
    updates: NonEmptyArray<UpdateByGid>,
    updatedBy: AuditRecord,
    updatedAt: Date,
  ): Promise<Result<void, SpiDatabaseError>> {
    try {
      const query = await domainUpdatesToDrizzleQuery(getTableName(this.table), updates, updatedBy, updatedAt)

      if (!query) {
        return ok(undefined)
      }

      await this.dependencies.db.execute(query)

      return ok(undefined)
    } catch (error) {
      return err(this.handleDatabaseError(error))
    }
  }

  protected handleDatabaseError(error: unknown): SpiDatabaseError {
    if (isSpiDatabaseError(error)) {
      // biome-ignore lint/suspicious/noExplicitAny: ???
      const dbError = error as any

      return new SpiDbError(dbError.detail ?? 'Database operation failed', dbError)
    }

    return new SpiDbError(
      error instanceof Error ? error.message : 'Unknown database error occurred',
      error instanceof Error ? error : undefined,
    )
  }

  protected validateSchema(data: unknown): Result<Entity, SpiValidationError> {
    try {
      const parsed = this.schema.parse(data)

      return ok(parsed as Entity)
    } catch (error) {
      return err(
        new SpiValidationError(
          `Schema validation failed: ${error instanceof Error ? error.message : 'Unknown validation error'}`,
          error instanceof Error ? error : undefined,
        ),
      )
    }
  }
}

export { DrizzleRepository }
