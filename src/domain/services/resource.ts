import type { z } from 'zod'
import { pick } from '../../utils/fp.ts'
import { validation } from '../../utils/validation.ts'
import { toPaginatedResponseSchema } from '../models/pagination.ts'
import { exampleResource, schemaResource } from '../models/resource.ts'
import { BaseService } from './models/base-service.ts'

type Resource = z.infer<typeof schemaResource>

class ResourceService extends BaseService<Resource> {
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

  protected override readonly propsMeta = ResourceService.propsMeta
  protected override readonly schemas = ResourceService.schemas
}

export { ResourceService }
