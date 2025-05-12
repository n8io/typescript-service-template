import type { z } from 'zod'
import { DomainNotFoundError } from '../../models/custom-error.ts'
import { pick } from '../../utils/fp.ts'
import { gid } from '../../utils/generators/gid.ts'
import { validation } from '../../utils/validation.ts'
import { toPaginatedResponseSchema } from '../models/pagination.ts'
import { schemaDomainGetManyRequest } from '../models/request.ts'
import { exampleResource, schemaResource } from '../models/resource.ts'
import type { SpiResourceRepository } from '../spi-ports/resource-repository.ts'
import { domainGetOneRequestToGetManyRequest } from './utils/domain-get-one-request-to-get-many-request.ts'
import { spiRepositoryGetManyResponseToDomainPaginatedResponse } from './utils/spi-get-many-response-to-domain-paginated-response.ts'

type Dependencies = {
  repository: SpiResourceRepository
}

class ResourceService {
  static propsMeta: Record<'create' | 'filter' | 'sort' | 'update', (keyof z.infer<typeof schemaResource>)[]> = {
    create: ['name', 'timeZone'],
    filter: ['createdAt', 'gid', 'name', 'timeZone', 'updatedAt'],
    sort: ['createdAt', 'gid', 'name', 'timeZone', 'updatedAt'],
    update: ['name', 'timeZone'],
  }

  static schemas = {
    core: schemaResource,
    request: {
      createOne: schemaResource
        .pick({
          createdBy: true,
          name: true,
          timeZone: true,
        })
        .openapi({
          example: pick(exampleResource(), ['createdBy', ...ResourceService.propsMeta.create]) as ReturnType<
            typeof exampleResource
          >,
        }),
      getMany: schemaResource,
      getOne: validation.gid,
      updateOne: schemaResource
        .pick({
          name: true,
          timeZone: true,
          updatedBy: true,
        })
        .partial({
          name: true,
          timeZone: true,
        })
        .openapi({
          example: pick(exampleResource(), [...ResourceService.propsMeta.update, 'updatedBy']),
        }),
    },
    response: {
      getMany: toPaginatedResponseSchema(schemaResource, exampleResource()),
      getOne: schemaResource,
    },
  } as const

  private dependencies: Dependencies

  constructor(dependencies: Dependencies) {
    this.dependencies = dependencies
  }

  async createOne(
    request: z.infer<typeof ResourceService.schemas.request.createOne>,
  ): Promise<Prettify<z.infer<typeof ResourceService.schemas.response.getOne>>> {
    const spiRequest = ResourceService.schemas.request.createOne.parse(request)
    const now = new Date()

    const created = await this.dependencies.repository.createOne({
      ...spiRequest,
      createdAt: now,
      gid: gid(),
      updatedAt: now,
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
    const validGid = ResourceService.schemas.request.getOne.parse(gid)

    const {
      items: [found],
    } = await this.getMany(domainGetOneRequestToGetManyRequest('gid', validGid))

    if (!found) {
      throw new DomainNotFoundError(`Resource with gid ${gid} not found`)
    }

    return found
  }

  async updateOne(gid: string, updates: z.infer<typeof ResourceService.schemas.request.updateOne>) {
    const validGid = ResourceService.schemas.request.getOne.parse(gid)
    const spiRequest = ResourceService.schemas.request.updateOne.parse(updates)

    const updated = await this.dependencies.repository.updateOne(validGid, {
      ...spiRequest,
      updatedAt: new Date(),
    })

    return this.getOne(updated.gid)
  }
}

export { ResourceService }
