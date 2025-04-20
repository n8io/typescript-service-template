import type { z } from 'zod'
import { DomainNotFoundError } from '../../models/custom-error.ts'
import { gid } from '../../utils/generators/gid.ts'
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
    createOne: this.schema.pick({
      createdBy: true,
      name: true,
      timeZone: true,
    }),
    getMany: schemaDomainGetManyRequest,
    updateOne: this.schema
      .pick({
        name: true,
        timeZone: true,
        updatedBy: true,
      })
      .extend({
        name: this.schema.shape.name.optional(),
        timeZone: this.schema.shape.timeZone.optional(),
      }),
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
    request: z.infer<typeof this.requestSchemas.createOne>,
  ): Promise<Prettify<z.infer<typeof this.responseSchemas.getOne>>> {
    const spiRequest = this.requestSchemas.createOne.parse(request)

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

  async updateOne(gid: string, updates: z.infer<typeof this.requestSchemas.updateOne>) {
    const spiRequest = this.requestSchemas.updateOne.parse(updates)

    const updated = await this.dependencies.repository.updateOne(gid, {
      ...spiRequest,
      updatedAt: new Date(),
    })

    return this.getOne(updated.gid)
  }
}

export { ResourceService }
