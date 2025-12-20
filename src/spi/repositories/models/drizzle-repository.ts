import { getTableName, inArray } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'
import type { Result } from 'neverthrow'
import { err, ok } from 'neverthrow'
import { PostgresError } from 'pg-error-enum'
import type { z } from 'zod'
import type { SpiPaginatedResponse } from '../../../domain/spi-ports/paginated.ts'
import type { SpiGetManyRequest } from '../../../domain/spi-ports/resource-repository.ts'
import type { AuditRecord } from '../../../models/audit-record.ts'
import { ErrorMessage } from '../../../models/error-messages.ts'
import { HttpStatus } from '../../../models/http-status.ts'
import { formatErrorForLogging } from '../../../utils/errors.ts'
import { logger } from '../../../utils/logger.ts'
import type { SpiDatabaseError } from '../../models/spi-error.ts'
import { SpiDatabaseError as SpiDbError, SpiValidationError } from '../../models/spi-error.ts'
import {
  databaseErrorMessages,
  extractConstraintName,
  extractFieldNameFromConstraint,
  getDatabaseError,
  getDatabaseErrorHttpStatus,
} from '../database/error.ts'
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

  async createOne(request: CreateRequest): Promise<Result<Entity, SpiDatabaseError | SpiValidationError>> {
    try {
      const dbRecord = this.schemaDb.parse(request)

      const [created] = await this.dependencies.db
        .insert(this.table)
        // @ts-expect-error: Zod parse result type doesn't match Drizzle's strict table types, but is validated at runtime
        .values(dbRecord)
        .returning()

      return this.validateSchema(created)
    } catch (error) {
      return err(this.handleDatabaseError(error))
    }
  }

  async deleteMany(gids: string[]): Promise<Result<void, SpiDatabaseError>> {
    try {
      // @ts-expect-error: TypeScript doesn't recognize gid as a property on the generic Table extends PgTable type
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
    const dbError = getDatabaseError(error)

    if (dbError) {
      const errorCode = dbError.code

      // Determine the appropriate HTTP status code based on the error type
      const httpStatusCode = getDatabaseErrorHttpStatus(errorCode)

      // Use client-safe message for handled errors
      let clientSafeMessage: string = ErrorMessage.DATABASE_OPERATION_FAILED
      if (errorCode && databaseErrorMessages.has(errorCode)) {
        const safeMessage = databaseErrorMessages.get(errorCode)
        if (safeMessage) {
          clientSafeMessage = safeMessage

          // For unique constraint violations, extract and append the field name
          if (errorCode === PostgresError.UNIQUE_VIOLATION) {
            const constraintName = extractConstraintName(dbError, error)
            const fieldName = extractFieldNameFromConstraint(constraintName)
            if (fieldName) {
              clientSafeMessage = `${safeMessage}: ${fieldName}`
            }
          }
        }
      }

      // Log the db error
      logger.error(formatErrorForLogging(dbError))

      // Always use generic message for unhandled database errors to prevent leaking details
      // Pass the original error (which may be wrapped) as the cause for logging
      return new SpiDbError(clientSafeMessage, httpStatusCode, error instanceof Error ? error : dbError)
    }

    // Log the unhandled error
    logger.error(formatErrorForLogging(error))

    // For non-database errors, always return generic message to prevent leaking any details
    return new SpiDbError(
      ErrorMessage.DATABASE_OPERATION_FAILED,
      HttpStatus.INTERNAL_SERVER_ERROR,
      error instanceof Error ? error : undefined,
    )
  }

  protected validateSchema(data: unknown): Result<Entity, SpiValidationError> {
    try {
      const parsed = this.schema.parse(data)

      return ok(parsed as Entity)
    } catch (error) {
      const validationError = new SpiValidationError(
        `Schema validation failed: ${error instanceof Error ? error.message : 'Unknown validation error'}`,
        error instanceof Error ? error : undefined,
      )
      logger.error(formatErrorForLogging(validationError))
      return err(validationError)
    }
  }
}

export { DrizzleRepository }
