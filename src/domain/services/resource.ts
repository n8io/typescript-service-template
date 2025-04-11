import type { z } from 'zod'
import { DomainNotFoundError } from '../../models/custom-error.ts'
import { domainGetOneRequestToGetManyRequest } from '../../utils/transforms/domain-get-one-request-to-get-many-request.ts'
import { spiRepositoryGetManyResponseToDomainPaginatedResponse } from '../../utils/transforms/spi-get-many-response-to-domain-paginated-response.ts'
import { toPaginatedResponseSchema } from '../models/pagination.ts'
import { schemaDomainGetManyRequest } from '../models/request.ts'
import { schemaResource } from '../models/resource.ts'
import type { SpiResourceRepository } from '../spi-ports/resource-repository.ts'

type Dependencies = {
  repository: SpiResourceRepository
}

class ResourceService {
  private schema = schemaResource

  private requestSchemas = {
    createOne: this.schema.omit({
      gid: true,
      createdAt: true,
      updatedAt: true,
      updatedBy: true,
    }),
    getMany: schemaDomainGetManyRequest,
  }

  private responseSchemas = {
    getMany: toPaginatedResponseSchema(this.schema),
    getOne: this.schema,
  }

  private dependencies: Dependencies

  constructor(dependencies: Dependencies) {
    this.dependencies = dependencies
  }

  async createOne(
    resource: z.infer<typeof this.requestSchemas.createOne>,
  ): Promise<Prettify<z.infer<typeof this.responseSchemas.getOne>>> {
    const spiRequest = schemaResource.parse({
      ...resource,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: resource.createdBy,
    })

    await this.dependencies.repository.createOne(spiRequest)

    return this.getOne(spiRequest.gid)
  }

  async getMany(
    query: Prettify<z.infer<typeof this.requestSchemas.getMany>>,
  ): Promise<Prettify<z.infer<typeof this.responseSchemas.getMany>>> {
    const spiRequest = schemaDomainGetManyRequest.parse(query)
    const { items, itemsTotal } = await this.dependencies.repository.getMany(spiRequest)

    return spiRepositoryGetManyResponseToDomainPaginatedResponse({
      ...spiRequest.pagination,
      items,
      itemsTotal,
      schema: this.schema,
    })
  }

  async getOne(gid: string): Promise<Prettify<z.infer<typeof this.responseSchemas.getOne>>> {
    const {
      items: [found],
    } = await this.getMany(domainGetOneRequestToGetManyRequest('gid', gid))

    if (!found) {
      throw new DomainNotFoundError(`Resource with gid ${gid} not found`)
    }

    return found
  }
}

export { ResourceService }
