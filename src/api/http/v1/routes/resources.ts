import { type DomainGetManyRequest } from '../../../../domain/models/request.ts'
import { ResourceService } from '../../../../domain/services/resource.ts'
import { urlSearchParamsToFilters } from '../../../../utils/url-search-params/filters.ts'
import { urlSearchParamsToPagination } from '../../../../utils/url-search-params/pagination.ts'
import { urlSearchParamsToSort } from '../../../../utils/url-search-params/sorting.ts'
import { OpenApiTag } from '../../models/openapi.ts'
import { makeApp } from '../app.ts'
import { RouteType, appendOpenApiMetadata } from '../openapi/append-open-api-metadata.ts'

const resources = makeApp()

resources.post(
  '/',
  appendOpenApiMetadata({
    operationId: 'resourcesCreateOne',
    requestSchema: ResourceService.schemas.request.createOne,
    schemaResponse: ResourceService.schemas.response.getOne,
    tags: [OpenApiTag.RESOURCES],
    type: RouteType.CREATE_ONE,
  }),
  async (ctx) => {
    const services = ctx.get('services')
    const request = await ctx.req.json()
    const resource = await services.resource.createOne(request)

    return ctx.json(resource)
  },
)

resources.get(
  '/',
  appendOpenApiMetadata({
    defaultSortField: 'createdAt',
    filterableFields: ResourceService.filterableFields,
    operationId: 'resourcesGetMany',
    requestSchema: ResourceService.schemas.request.getMany,
    schemaResponse: ResourceService.schemas.response.getMany,
    sortableFields: ResourceService.sortableFields,
    tags: [OpenApiTag.RESOURCES],
    type: RouteType.GET_MANY,
  }),
  async (ctx) => {
    const services = ctx.get('services')
    const params = new URL(ctx.req.url).searchParams

    const request = {
      filters: urlSearchParamsToFilters(params, { baseSchema: ResourceService.schemas.core }),
      pagination: urlSearchParamsToPagination(params),
      sorting: urlSearchParamsToSort(params, { sortableFields: ResourceService.sortableFields }),
    } as DomainGetManyRequest

    const paginated = await services.resource.getMany(request)

    return ctx.json(paginated)
  },
)

resources.get(
  '/:gid',
  appendOpenApiMetadata({
    operationId: 'resourcesGetOne',
    schemaResponse: ResourceService.schemas.response.getOne,
    tags: [OpenApiTag.RESOURCES],
    type: RouteType.GET_ONE,
  }),
  async (ctx) => {
    const gid = ctx.req.param('gid')
    const services = ctx.get('services')
    const resource = await services.resource.getOne(gid)

    return ctx.json(resource)
  },
)

resources.patch(
  '/:gid',
  appendOpenApiMetadata({
    operationId: 'resourcesUpdateOne',
    requestSchema: ResourceService.schemas.request.updateOne,
    schemaResponse: ResourceService.schemas.response.getOne,
    tags: [OpenApiTag.RESOURCES],
    type: RouteType.UPDATE_ONE,
  }),
  async (ctx) => {
    const gid = ctx.req.param('gid')
    const services = ctx.get('services')
    const request = await ctx.req.json()
    const resource = await services.resource.updateOne(gid, request)

    return ctx.json(resource)
  },
)

export { resources }
