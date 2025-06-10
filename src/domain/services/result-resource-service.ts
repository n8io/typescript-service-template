import type { z } from 'zod'
import { pick } from '../../utils/fp.ts'
import { validation } from '../../utils/validation.ts'
import { toPaginatedResponseSchema } from '../models/pagination.ts'
import { exampleResource, schemaResource } from '../models/resource.ts'
import type { ResultSpiResourceRepository } from '../spi-ports/result-resource-repository.ts'
import type { ResultBaseDependencies } from './models/result-base-service.ts'
import { ResultBaseService } from './models/result-base-service.ts'

type Resource = z.infer<typeof schemaResource>

type ResultResourceServiceDependencies = {
  repository: ResultSpiResourceRepository
}

class ResultResourceService extends ResultBaseService<Resource> {
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
          example: pick(exampleResource(), ResultResourceService.propsMeta.create) as ReturnType<
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
        .strict()
        .openapi({
          example: pick(exampleResource(), ResultResourceService.propsMeta.update) as ReturnType<
            typeof exampleResource
          >,
        }),
    },
    response: {
      getMany: toPaginatedResponseSchema(schemaResource, exampleResource()),
      getOne: schemaResource,
    },
  } as const

  protected override readonly propsMeta = ResultResourceService.propsMeta
  protected override readonly schemas = ResultResourceService.schemas

  constructor(dependencies: ResultResourceServiceDependencies) {
    super({
      repository: dependencies.repository,
    } as ResultBaseDependencies<Resource>)
  }
}

export type { ResultResourceServiceDependencies }
export { ResultResourceService }
