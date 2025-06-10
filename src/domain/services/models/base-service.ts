import { err, ok, Result } from 'neverthrow'
import type { z } from 'zod'
import type { AuditRecord } from '../../../models/audit-record.ts'
import type { SpiDatabaseError, SpiValidationError } from '../../../spi/models/spi-error.ts'
import { gid } from '../../../utils/factories/gid.ts'
import { DomainNotFoundError, DomainValidationError } from '../../models/domain-error.ts'
import type { PaginatedResponse } from '../../models/pagination.ts'
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, schemaDomainGetManyRequest } from '../../models/request.ts'
import type { SpiPaginatedResponse } from '../../spi-ports/paginated.ts'
import type { SpiUpdateManyRequest } from '../../spi-ports/resource-repository.ts'
import { domainGetOneRequestToGetManyRequest } from '../utils/domain-get-one-request-to-get-many-request.ts'
import { spiRepositoryGetManyResponseToDomainPaginatedResponse } from '../utils/spi-get-many-response-to-domain-paginated-response.ts'

type DomainServiceError = DomainNotFoundError | DomainValidationError | SpiDatabaseError | SpiValidationError

type BaseDependencies<T> = {
  repository: {
    createOne: (request: T) => Promise<Result<T, SpiDatabaseError | SpiValidationError>>
    deleteMany: (gids: string[]) => Promise<Result<void, SpiDatabaseError>>
    getMany: (
      request: z.infer<typeof schemaDomainGetManyRequest>,
    ) => Promise<Result<SpiPaginatedResponse<T>, SpiDatabaseError>>
    updateMany: (
      updates: SpiUpdateManyRequest,
      updatedBy: AuditRecord,
      updatedAt: Date,
    ) => Promise<Result<void, SpiDatabaseError | SpiValidationError>>
  }
}

/**
 * Base service class providing standard CRUD operations for domain entities.
 *
 * This abstract class implements common patterns for creating, reading, updating, and deleting entities.
 * Extend this class to create domain services with standard CRUD functionality.
 *
 * @template T - The entity type that must have a `gid` property
 *
 * @example
 * ```typescript
 * class UserService extends BaseService<User> {
 *   static readonly propsMeta = {
 *     create: ['email', 'name', 'createdBy'],
 *     filter: ['email', 'gid', 'name'],
 *     sort: ['createdAt', 'email', 'name'],
 *     update: ['email', 'name', 'updatedBy'],
 *   }
 *
 *   static readonly schemas = {
 *     core: schemaUser,
 *     request: { /* ... *\/ },
 *     response: { /* ... *\/ },
 *   }
 *
 *   protected override readonly propsMeta = UserService.propsMeta
 *   protected override readonly schemas = UserService.schemas
 * }
 * ```
 *
 * @remarks
 * - Subclasses must implement `propsMeta` and `schemas` as static readonly properties
 * - The `propsMeta` defines which fields can be used for create, filter, sort, and update operations
 * - The `schemas` define Zod schemas for validation and OpenAPI documentation
 * - All methods automatically handle gid generation, timestamps, and audit records
 * - Custom business logic can be added by overriding methods or adding new methods
 */
abstract class BaseService<T extends { gid: string }> {
  protected abstract readonly propsMeta: Record<'create' | 'filter' | 'sort' | 'update', (keyof T)[]>

  protected abstract readonly schemas: {
    /**
     * @description The core schema for the entity.
     */
    core: z.ZodType<T>
    request: {
      /**
       * @description The schema for the request to create one entity.
       */
      createOne: z.ZodType<Partial<Omit<T, 'createdBy'>> & { createdBy: AuditRecord }>
      /**
       * @description The schema for the request to get many entities.
       */
      getMany: z.ZodType<T>
      /**
       * @description The schema for the request to get one entity.
       */
      getOne: z.ZodType<string>
      /**
       * @description The schema for the request to update one entity.
       */
      updateOne: z.ZodType<Partial<Omit<T, 'updatedBy'>> & { updatedBy: AuditRecord }>
    }
    response: {
      /**
       * @description The schema for the response to get many entities.
       */
      getMany: z.ZodType<PaginatedResponse<T>>
      /**
       * @description The schema for the response to get one entity.
       */
      getOne: z.ZodType<T>
    }
  }

  protected readonly dependencies: BaseDependencies<T>

  /**
   * Creates a new BaseService instance.
   *
   * @param dependencies - Repository dependencies for data access
   */
  constructor(dependencies: BaseDependencies<T>) {
    this.dependencies = dependencies
  }

  /**
   * Creates a new entity.
   *
   * Automatically:
   * - Generates a unique gid
   * - Sets createdAt and updatedAt timestamps
   * - Sets updatedBy to match createdBy
   * - Validates the request using the createOne schema
   * - Returns the created entity by fetching it after creation
   *
   * @param request - The creation request validated against the createOne schema
   * @returns The created entity
   * @throws {ZodError} If validation fails
   */
  async createOne(
    request: z.infer<typeof this.schemas.request.createOne>,
  ): Promise<Result<Prettify<z.infer<typeof this.schemas.response.getOne>>, DomainServiceError>> {
    const validationResult = this.validateCreateRequest(request)
    if (validationResult.isErr()) {
      return err(validationResult.error)
    }

    const now = new Date()
    const entityToCreate = {
      ...validationResult.value,
      createdAt: now,
      gid: gid(),
      updatedAt: now,
      updatedBy: request.createdBy,
    } as unknown as T

    const createResult = await this.dependencies.repository.createOne(entityToCreate)
    if (createResult.isErr()) {
      return err(createResult.error)
    }

    return this.getOne(createResult.value.gid)
  }

  /**
   * Deletes an entity by gid.
   *
   * @param gid - The globally unique identifier of the entity to delete
   * @returns Result indicating success or failure
   */
  async deleteOne(gid: string): Promise<Result<void, DomainServiceError>> {
    const validationResult = this.validateGid(gid)

    if (validationResult.isErr()) {
      return err(validationResult.error)
    }

    return this.dependencies.repository.deleteMany([validationResult.value])
  }

  /**
   * Retrieves multiple entities with filtering, sorting, and pagination.
   *
   * @param query - The query parameters including filters, sorting, and pagination
   * @returns A paginated response containing the matching entities
   * @throws {ZodError} If query validation fails
   */
  async getMany(
    query: z.infer<typeof schemaDomainGetManyRequest>,
  ): Promise<Result<Prettify<z.infer<typeof this.schemas.response.getMany>>, DomainServiceError>> {
    const validationResult = this.validateGetManyRequest(query)

    if (validationResult.isErr()) {
      return err(validationResult.error)
    }

    const spiResult = await this.dependencies.repository.getMany(validationResult.value)

    if (spiResult.isErr()) {
      return err(spiResult.error)
    }

    const { items, itemsTotal } = spiResult.value

    const domainResult = spiRepositoryGetManyResponseToDomainPaginatedResponse({
      page: validationResult.value.pagination?.page ?? DEFAULT_PAGE,
      pageSize: validationResult.value.pagination?.pageSize ?? DEFAULT_PAGE_SIZE,
      ...validationResult.value.pagination,
      items,
      itemsTotal,
      schema: this.schemas.core,
    })

    return ok(domainResult)
  }

  /**
   * Retrieves a single entity by gid.
   *
   * @param gid - The globally unique identifier of the entity
   * @returns Result containing the entity if found, or an error if not found or validation fails
   */
  async getOne(
    gid: string,
  ): Promise<Result<Prettify<z.infer<typeof this.schemas.response.getOne>>, DomainServiceError>> {
    const validationResult = this.validateGid(gid)

    if (validationResult.isErr()) {
      return err(validationResult.error)
    }

    const getManyRequest = domainGetOneRequestToGetManyRequest('gid', validationResult.value)
    const getManyResult = await this.getMany(getManyRequest)

    if (getManyResult.isErr()) {
      return err(getManyResult.error)
    }

    const [found] = getManyResult.value.items

    if (!found) {
      return err(new DomainNotFoundError(`Entity with gid ${gid} not found`))
    }

    return ok(found)
  }

  /**
   * Updates an existing entity.
   *
   * Automatically:
   * - Validates the gid
   * - Validates the update request using the updateOne schema
   * - Sets updatedAt timestamp
   * - Returns the updated entity by fetching it after update
   *
   * @param gid - The globally unique identifier of the entity to update
   * @param updates - The update request validated against the updateOne schema
   * @returns The updated entity
   * @throws {DomainNotFoundError} If the entity is not found
   * @throws {ZodError} If validation fails
   */
  async updateOne(
    gid: string,
    updates: z.infer<typeof this.schemas.request.updateOne>,
  ): Promise<Result<Prettify<z.infer<typeof this.schemas.response.getOne>>, DomainServiceError>> {
    const gidValidationResult = this.validateGid(gid)
    const updateValidationResult = this.validateUpdateRequest(updates)

    const combinedValidation = Result.combine([gidValidationResult, updateValidationResult])

    if (combinedValidation.isErr()) {
      return err(combinedValidation.error)
    }

    const [validGid, validUpdates] = combinedValidation.value
    const { updatedBy, ...spiRequest } = validUpdates

    const updatesByGid: SpiUpdateManyRequest = [
      {
        ...spiRequest,
        gid: validGid,
      },
    ]

    const updateResult = await this.dependencies.repository.updateMany(updatesByGid, updatedBy, new Date())

    if (updateResult.isErr()) {
      return err(updateResult.error)
    }

    return this.getOne(validGid)
  }

  private validateCreateRequest(
    request: z.infer<typeof this.schemas.request.createOne>,
  ): Result<z.infer<typeof this.schemas.request.createOne>, DomainValidationError> {
    try {
      const validated = this.schemas.request.createOne.parse(request)

      return ok(validated)
    } catch (error) {
      return err(
        new DomainValidationError(
          `Create request validation failed: ${error instanceof Error ? error.message : 'Unknown validation error'}`,
          error instanceof Error ? error : undefined,
        ),
      )
    }
  }

  private validateGetManyRequest(
    query: z.infer<typeof schemaDomainGetManyRequest>,
  ): Result<z.infer<typeof schemaDomainGetManyRequest>, DomainValidationError> {
    try {
      const validated = schemaDomainGetManyRequest.parse(query)

      return ok(validated)
    } catch (error) {
      return err(
        new DomainValidationError(
          `Get many request validation failed: ${error instanceof Error ? error.message : 'Unknown validation error'}`,
          error instanceof Error ? error : undefined,
        ),
      )
    }
  }

  private validateGid(gid: string): Result<string, DomainValidationError> {
    try {
      const validated = this.schemas.request.getOne.parse(gid)

      return ok(validated)
    } catch (error) {
      return err(
        new DomainValidationError(
          `GID validation failed: ${error instanceof Error ? error.message : 'Unknown validation error'}`,
          error instanceof Error ? error : undefined,
        ),
      )
    }
  }

  private validateUpdateRequest(
    updates: z.infer<typeof this.schemas.request.updateOne>,
  ): Result<z.infer<typeof this.schemas.request.updateOne>, DomainValidationError> {
    try {
      const validated = this.schemas.request.updateOne.parse(updates)

      return ok(validated)
    } catch (error) {
      return err(
        new DomainValidationError(
          `Update request validation failed: ${error instanceof Error ? error.message : 'Unknown validation error'}`,
          error instanceof Error ? error : undefined,
        ),
      )
    }
  }
}

export type { BaseDependencies }
export { BaseService }
