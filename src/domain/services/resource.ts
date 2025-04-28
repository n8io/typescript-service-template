import type { z } from 'zod'
import { DomainNotFoundError } from '../../models/custom-error.ts'
import { gid } from '../../utils/generators/gid.ts'
import { toPaginatedResponseSchema } from '../models/pagination.ts'
import { schemaDomainGetManyRequest } from '../models/request.ts'
import { type Resource, exampleResource, schemaResource } from '../models/resource.ts'
import type { SpiResourceRepository } from '../spi-ports/resource-repository.ts'
import { domainGetOneRequestToGetManyRequest } from './utils/domain-get-one-request-to-get-many-request.ts'
import { spiRepositoryGetManyResponseToDomainPaginatedResponse } from './utils/spi-get-many-response-to-domain-paginated-response.ts'

type Dependencies = {
  repository: SpiResourceRepository
}

class ResourceService {
  static schemas = {
    core: schemaResource,
    request: {
      createOne: schemaResource.pick({
        createdBy: true,
        name: true,
        timeZone: true,
      }),
      getMany: schemaResource,
      updateOne: schemaResource
        .pick({
          name: true,
          timeZone: true,
          updatedBy: true,
        })
        .extend({
          name: schemaResource.shape.name.optional(),
          timeZone: schemaResource.shape.timeZone.optional(),
        }),
    },
    response: {
      getMany: toPaginatedResponseSchema(schemaResource, exampleResource()),
      getOne: schemaResource,
    },
  } as const

  static sortableFields: (keyof Resource)[] = ['createdAt', 'gid', 'name', 'timeZone', 'updatedAt']
  static filterableFields: (keyof Resource)[] = structuredClone(this.sortableFields)

  private dependencies: Dependencies

  constructor(dependencies: Dependencies) {
    this.dependencies = dependencies
  }

  async createOne(
    request: z.infer<typeof ResourceService.schemas.request.createOne>,
  ): Promise<Prettify<z.infer<typeof ResourceService.schemas.response.getOne>>> {
    const spiRequest = ResourceService.schemas.request.createOne.parse(request)

    const created = await this.dependencies.repository.createOne({
      ...spiRequest,
      createdAt: new Date(),
      gid: gid(),
      updatedAt: new Date(),
      updatedBy: request.createdBy,
    })

    return this.getOne(created.gid)
  }

  async getMany(
    query: Prettify<z.infer<typeof schemaDomainGetManyRequest>>,
  ): Promise<Prettify<z.infer<typeof ResourceService.schemas.response.getMany>>> {
    const spiRequest = schemaDomainGetManyRequest.parse(query)
    const { items, itemsTotal } = await this.dependencies.repository.getMany(spiRequest)

    return spiRepositoryGetManyResponseToDomainPaginatedResponse({
      ...spiRequest.pagination,
      items,
      itemsTotal,
      schema: ResourceService.schemas.core,
    })
  }

  async getOne(gid: string): Promise<Prettify<z.infer<typeof ResourceService.schemas.response.getOne>>> {
    const {
      items: [found],
    } = await this.getMany(domainGetOneRequestToGetManyRequest('gid', gid))

    if (!found) {
      throw new DomainNotFoundError(`Resource with gid ${gid} not found`)
    }

    return found
  }

  async updateOne(gid: string, updates: z.infer<typeof ResourceService.schemas.request.updateOne>) {
    const spiRequest = ResourceService.schemas.request.updateOne.parse(updates)

    const updated = await this.dependencies.repository.updateOne(gid, {
      ...spiRequest,
      updatedAt: new Date(),
    })

    return this.getOne(updated.gid)
  }
}

export { ResourceService }
