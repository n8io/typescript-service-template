import type { z } from 'zod'
import type { AuditRecord } from '../../../models/audit-record.ts'
import { DomainNotFoundError } from '../../../models/custom-error.ts'
import { gid } from '../../../utils/generators/gid.ts'
import type { PaginatedResponse } from '../../models/pagination.ts'
import { schemaDomainGetManyRequest } from '../../models/request.ts'
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

  constructor(dependencies: BaseDependencies<T>) {
    this.dependencies = dependencies
  }

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

  async deleteOne(gid: string): Promise<void> {
    await this.dependencies.repository.deleteMany([gid])
  }

  async getMany(
    query: z.infer<typeof schemaDomainGetManyRequest>,
  ): Promise<Prettify<z.infer<typeof this.schemas.response.getMany>>> {
    const spiRequest = schemaDomainGetManyRequest.parse(query)
    const { items, itemsTotal } = await this.dependencies.repository.getMany(spiRequest)

    return spiRepositoryGetManyResponseToDomainPaginatedResponse({
      ...spiRequest.pagination,
      items,
      itemsTotal,
      schema: this.schemas.core,
    })
  }

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
