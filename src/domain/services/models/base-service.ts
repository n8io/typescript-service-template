import type { z } from 'zod'
import type { AuditRecord } from '../../../models/audit-record.ts'
import { DomainNotFoundError } from '../../../models/custom-error.ts'
import { gid } from '../../../utils/factories/gid.ts'
import type { PaginatedResponse } from '../../models/pagination.ts'
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, schemaDomainGetManyRequest } from '../../models/request.ts'
import type { SpiPaginatedResponse } from '../../spi-ports/paginated.ts'
import type { SpiUpdateManyRequest } from '../../spi-ports/resource-repository.ts'
import { domainGetOneRequestToGetManyRequest } from '../utils/domain-get-one-request-to-get-many-request.ts'
import { spiRepositoryGetManyResponseToDomainPaginatedResponse } from '../utils/spi-get-many-response-to-domain-paginated-response.ts'

type BaseDependencies<T> = {
  repository: {
    createOne: (request: T) => Promise<T>
    deleteMany: (gid: string[]) => Promise<void>
    getMany: (request: z.infer<typeof schemaDomainGetManyRequest>) => Promise<SpiPaginatedResponse<T>>
    updateMany: (updates: SpiUpdateManyRequest, updatedBy: AuditRecord, updatedAt: Date) => Promise<void>
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
  ): Promise<Prettify<z.infer<typeof this.schemas.response.getOne>>> {
    const spiRequest = this.schemas.request.createOne.parse(request)
    const now = new Date()

    const created = await this.dependencies.repository.createOne({
      ...spiRequest,
      createdAt: now,
      gid: gid(),
      updatedAt: now,
      updatedBy: request.createdBy,
    } as unknown as T)

    return this.getOne(created.gid)
  }

  /**
   * Deletes an entity by gid.
   *
   * @param gid - The globally unique identifier of the entity to delete
   * @throws {DomainNotFoundError} If the entity is not found
   */
  async deleteOne(gid: string): Promise<void> {
    await this.dependencies.repository.deleteMany([gid])
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
  ): Promise<Prettify<z.infer<typeof this.schemas.response.getMany>>> {
    const spiRequest = schemaDomainGetManyRequest.parse(query)
    const { items, itemsTotal } = await this.dependencies.repository.getMany(spiRequest)

    return spiRepositoryGetManyResponseToDomainPaginatedResponse({
      page: spiRequest.pagination?.page ?? DEFAULT_PAGE,
      pageSize: spiRequest.pagination?.pageSize ?? DEFAULT_PAGE_SIZE,
      items,
      itemsTotal,
      schema: this.schemas.core,
    })
  }

  /**
   * Retrieves a single entity by gid.
   *
   * @param gid - The globally unique identifier of the entity
   * @returns The entity if found
   * @throws {DomainNotFoundError} If the entity is not found
   * @throws {ZodError} If gid validation fails
   */
  async getOne(gid: string): Promise<Prettify<z.infer<typeof this.schemas.response.getOne>>> {
    const validGid = this.schemas.request.getOne.parse(gid)

    const {
      items: [found],
    } = await this.getMany(domainGetOneRequestToGetManyRequest('gid', validGid))

    if (!found) {
      throw new DomainNotFoundError(`Entity with gid ${gid} not found`)
    }

    return found
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
  ): Promise<Prettify<z.infer<typeof this.schemas.response.getOne>>> {
    const validGid = this.schemas.request.getOne.parse(gid)
    const { updatedBy, ...spiRequest } = this.schemas.request.updateOne.parse(updates)

    const updatesByGid: SpiUpdateManyRequest = [
      {
        ...spiRequest,
        gid: validGid,
      },
    ]

    await this.dependencies.repository.updateMany(updatesByGid, updatedBy, new Date())

    return this.getOne(validGid)
  }
}

export { BaseService }
