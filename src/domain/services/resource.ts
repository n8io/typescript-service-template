import type { z } from 'zod'
import type { Spi } from '../../spi/init.ts'
import { pick } from '../../utils/fp.ts'
import { validation } from '../../utils/validation.ts'
import { toPaginatedResponseSchema } from '../models/pagination.ts'
import { exampleResource, schemaResource } from '../models/resource.ts'
import { BaseService } from './models/base-service.ts'

type Resource = z.infer<typeof schemaResource>

type CreateRequest = z.infer<typeof ResourceService.schemas.request.createOne>
type UpdateRequest = z.infer<typeof ResourceService.schemas.request.updateOne>

class ResourceService extends BaseService<
  typeof schemaResource,
  CreateRequest,
  UpdateRequest,
  Spi['repositories']['resource']
> {
  /**
   * @description The properties that are used to create, filter, sort and update a resource.
   */
  static readonly propsMeta: Record<'create' | 'filter' | 'sort' | 'update', (keyof Resource)[]> = {
    create: ['name', 'timeZone', 'createdBy'],
    filter: ['createdAt', 'gid', 'name', 'timeZone', 'updatedAt'],
    sort: ['createdAt', 'gid', 'name', 'timeZone', 'updatedAt'],
    update: ['name', 'timeZone', 'updatedBy'],
  }

  /**
   * @description The schemas for the service. These are used to validate the requests and responses.
   */
  static readonly schemas = {
    core: schemaResource,
    request: {
      createOne: schemaResource
        .pick({
          createdBy: true,
          name: true,
          timeZone: true,
        })
        .strict()
        .openapi({
          example: pick(exampleResource(), ResourceService.propsMeta.create) as ReturnType<typeof exampleResource>,
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
        .strict()
        .openapi({
          example: pick(exampleResource(), ResourceService.propsMeta.update) as ReturnType<typeof exampleResource>,
        }),
    },
    response: {
      getMany: toPaginatedResponseSchema(schemaResource, exampleResource()),
      getOne: schemaResource,
    },
  } as const

  constructor(spi: Spi) {
    super({
      repository: spi.repositories.resource,
      schemas: ResourceService.schemas,
    })
  }

  public readonly propsMeta = ResourceService.propsMeta
  public readonly schemas = ResourceService.schemas
}

export { ResourceService }
