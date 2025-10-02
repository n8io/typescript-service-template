import type { Result } from 'neverthrow'
import { err, ok } from 'neverthrow'
import { PostgresError } from 'pg-error-enum'
import type { z } from 'zod'
import { ZodError } from 'zod'
import type { AuditRecord } from '../../../models/audit-record.ts'
import type { DomainError } from '../../../models/domain-errors.ts'
import { createDomainNotFoundError, createDomainValidationError } from '../../../models/domain-errors.ts'
import { mapSpiDatabaseErrorToDomainError } from '../../../utils/errors.ts'
import { gid } from '../../../utils/generators/gid.ts'
import type { PaginatedResponse } from '../../models/pagination.ts'
import type { DomainGetManyRequest } from '../../models/request.ts'
import type { SpiResourceRepository, SpiUpdateManyRequest } from '../../spi-ports/resource-repository.ts'
import { domainGetOneRequestToGetManyRequest } from '../utils/domain-get-one-request-to-get-many-request.ts'
import { spiRepositoryGetManyResponseToDomainPaginatedResponse } from '../utils/spi-get-many-response-to-domain-paginated-response.ts'

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 10

type BaseDependencies<
  T extends z.ZodObject<z.ZodRawShape>,
  CreateRequest = unknown,
  UpdateRequest = unknown,
  Repository extends SpiResourceRepository<z.infer<T>> = SpiResourceRepository<z.infer<T>>,
> = {
  repository: Repository
  schemas: {
    core: T
    request: {
      createOne: z.ZodType<CreateRequest>
      getOne: z.ZodType<string>
      updateOne: z.ZodType<UpdateRequest>
    }
  }
}

abstract class BaseService<
  T extends z.ZodObject<z.ZodRawShape>,
  CreateRequest = z.ZodObject<z.ZodRawShape>,
  UpdateRequest = z.ZodObject<z.ZodRawShape>,
  Repository extends SpiResourceRepository<z.infer<T>> = SpiResourceRepository<z.infer<T>>,
> {
  protected readonly dependencies: BaseDependencies<T, CreateRequest, UpdateRequest, Repository>

  constructor(dependencies: BaseDependencies<T, CreateRequest, UpdateRequest, Repository>) {
    this.dependencies = dependencies
  }

  async createOne(request: CreateRequest): Promise<Result<z.infer<T>, DomainError>> {
    try {
      const spiRequest = this.dependencies.schemas.request.createOne.parse(request)
      const now = new Date()

      const createRequest = {
        ...(spiRequest as Record<string, unknown>),
        createdAt: now,
        gid: gid(),
        updatedAt: now,
        updatedBy: this.extractCreatedByFromRequest(request),
      }

      const createdResult = await this.dependencies.repository.createOne(createRequest)

      if (createdResult.isErr()) {
        const dbError = createdResult.error

        if (dbError.code && Object.values(PostgresError).includes(dbError.code as PostgresError)) {
          return err(mapSpiDatabaseErrorToDomainError(dbError, dbError.detail ?? 'unknown'))
        }

        return err(createDomainNotFoundError('Failed to create entity', 'entity', 'creation_failed'))
      }

      return this.getOne(createdResult.value.gid)
    } catch (error) {
      if (error instanceof ZodError) {
        // Convert ZodError to domain validation error
        const firstIssue = error.issues[0]
        const field = String(firstIssue?.path?.[0] || 'unknown')
        const message = firstIssue?.message || 'Validation failed'

        return err(createDomainValidationError(message, field))
      }

      // Re-throw unexpected errors
      throw error
    }
  }

  async deleteOne(gid: string): Promise<Result<void, DomainError>> {
    const deleteResult = await this.dependencies.repository.deleteMany([gid])

    if (deleteResult.isErr()) {
      const dbError = deleteResult.error
      // Check if this is a database constraint violation
      if (dbError.code && Object.values(PostgresError).includes(dbError.code as PostgresError)) {
        return err(mapSpiDatabaseErrorToDomainError(dbError, dbError.detail ?? 'unknown'))
      }

      return err(createDomainNotFoundError('Failed to delete entity', 'entity', 'deletion_failed'))
    }

    return ok(undefined)
  }

  async getMany(query: unknown): Promise<Result<PaginatedResponse<z.infer<T>>, DomainError>> {
    const spiRequest = query as DomainGetManyRequest
    const getManyResult = await this.dependencies.repository.getMany(spiRequest)

    if (getManyResult.isErr()) {
      const dbError = getManyResult.error
      // Check if this is a database constraint violation
      if (dbError.code && Object.values(PostgresError).includes(dbError.code as PostgresError)) {
        return err(mapSpiDatabaseErrorToDomainError(dbError, dbError.detail ?? 'unknown'))
      }

      return err(createDomainNotFoundError('Failed to retrieve entities', 'entities', 'retrieval_failed'))
    }

    const { items, itemsTotal } = getManyResult.value

    const result = spiRepositoryGetManyResponseToDomainPaginatedResponse({
      page: spiRequest?.pagination?.page ?? DEFAULT_PAGE,
      pageSize: spiRequest?.pagination?.pageSize ?? DEFAULT_PAGE_SIZE,
      items,
      itemsTotal,
      schema: this.dependencies.schemas.core,
    })

    return ok(result as PaginatedResponse<z.infer<T>>)
  }

  async getOne(gid: string): Promise<Result<z.infer<T>, DomainError>> {
    const validGid = this.dependencies.schemas.request.getOne.parse(gid)

    const getManyResult = await this.getMany(domainGetOneRequestToGetManyRequest('gid', validGid))

    if (getManyResult.isErr()) {
      return getManyResult
    }

    const { items } = getManyResult.value
    const found = items[0]

    if (!found) {
      return err(createDomainNotFoundError(`Entity with gid ${gid} not found`, 'entity', gid))
    }

    return ok(found)
  }

  async updateOne(gid: string, updates: UpdateRequest): Promise<Result<z.infer<T>, DomainError>> {
    const validGid = this.dependencies.schemas.request.getOne.parse(gid)
    const parsedUpdates = this.dependencies.schemas.request.updateOne.parse(updates)
    const { updatedBy, ...spiRequest } = parsedUpdates as { updatedBy: AuditRecord; [key: string]: unknown }

    const updatesByGid: SpiUpdateManyRequest = [
      {
        ...(spiRequest as Record<string, unknown>),
        gid: validGid,
      },
    ]

    const updateResult = await this.dependencies.repository.updateMany(updatesByGid, updatedBy, new Date())

    if (updateResult.isErr()) {
      const dbError = updateResult.error
      if (dbError.code && Object.values(PostgresError).includes(dbError.code as PostgresError)) {
        return err(mapSpiDatabaseErrorToDomainError(dbError, dbError.detail ?? 'unknown'))
      }

      return err(createDomainNotFoundError('Failed to update entity', 'entity', 'update_failed'))
    }

    return this.getOne(validGid)
  }

  /**
   * Helper method to extract createdBy from create requests
   * Subclasses can override this to provide more specific extraction
   */
  protected extractCreatedByFromRequest(request: CreateRequest): unknown {
    // Default implementation - subclasses can override for better context
    if (request && typeof request === 'object' && 'createdBy' in request) {
      return (request as Record<string, unknown>).createdBy
    }
    return 'unknown'
  }

  /**
   * Helper method to extract field names from create requests
   * Subclasses can override this to provide more specific field extraction
   */
  protected extractFieldNameFromRequest(_request: CreateRequest): string {
    // Default implementation - subclasses can override for better context
    return 'unknown'
  }

  /**
   * Helper method to extract field values from create requests
   * Subclasses can override this to provide more specific value extraction
   */
  protected extractFieldValueFromRequest(request: CreateRequest, fieldName: string): unknown {
    // Default implementation - subclasses can override for better context
    if (request && typeof request === 'object' && fieldName in request) {
      return (request as Record<string, unknown>)[fieldName]
    }
    return 'unknown'
  }

  /**
   * Helper method to extract field names from update requests
   * Subclasses can override this to provide more specific field extraction
   */
  protected extractFieldNameFromUpdates(_updates: UpdateRequest): string {
    // Default implementation - subclasses can override for better context
    return 'unknown'
  }

  /**
   * Helper method to extract field values from update requests
   * Subclasses can override this to provide more specific value extraction
   */
  protected extractFieldValueFromUpdates(updates: UpdateRequest, fieldName: string): unknown {
    // Default implementation - subclasses can override for better context
    if (updates && typeof updates === 'object' && fieldName in updates) {
      return (updates as Record<string, unknown>)[fieldName]
    }
    return 'unknown'
  }
}

export { BaseService }
