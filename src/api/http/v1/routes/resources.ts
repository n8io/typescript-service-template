import { type DomainGetManyRequest } from '../../../../domain/models/request.ts'
import { ResourceService } from '../../../../domain/services/resource.ts'
import { urlSearchParamsToFilters } from '../../../../utils/url-search-params/filters.ts'
import { urlSearchParamsToPagination } from '../../../../utils/url-search-params/pagination.ts'
import { urlSearchParamsToSort } from '../../../../utils/url-search-params/sorting.ts'
import { OpenApiTag } from '../../models/openapi.ts'
import { makeApp } from '../app.ts'
import { RouteType, generateOpenApiRouteConfig } from '../openapi/generate-open-api-route-config.ts'

const resources = makeApp()

resources.post(
  '/',
  generateOpenApiRouteConfig({
    operationId: 'resourcesCreateOne',
    requestSchema: ResourceService.requestSchemas.createOne,
    schemaResponse: ResourceService.responseSchemas.getOne,
    tag: OpenApiTag.RESOURCES,
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
  generateOpenApiRouteConfig({
    defaultSortField: 'createdAt',
    filterableFields: ResourceService.filterableFields,
    operationId: 'resourcesGetMany',
    requestSchema: ResourceService.requestSchemas.getMany,
    schemaResponse: ResourceService.responseSchemas.getMany,
    sortableFields: ResourceService.sortableFields,
    tag: OpenApiTag.RESOURCES,
    type: RouteType.GET_MANY,
  }),
  async (ctx) => {
    const services = ctx.get('services')
    const params = new URL(ctx.req.url).searchParams

    const request = {
      filters: urlSearchParamsToFilters(params, { baseSchema: ResourceService.schema }),
      pagination: urlSearchParamsToPagination(params),
      sorting: urlSearchParamsToSort(params, { sortableFields: ResourceService.sortableFields }),
    } as DomainGetManyRequest

    const paginated = await services.resource.getMany(request)

    return ctx.json(paginated)
  },
)

resources.get(
  '/:gid',
  generateOpenApiRouteConfig({
    operationId: 'resourcesGetOne',
    schemaResponse: ResourceService.responseSchemas.getOne,
    tag: OpenApiTag.RESOURCES,
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
  generateOpenApiRouteConfig({
    operationId: 'resourcesUpdateOne',
    requestSchema: ResourceService.requestSchemas.updateOne,
    schemaResponse: ResourceService.responseSchemas.getOne,
    tag: OpenApiTag.RESOURCES,
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
