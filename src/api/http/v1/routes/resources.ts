import type { DomainGetManyRequest } from '../../../../domain/models/request.ts'
import { ResourceService } from '../../../../domain/services/resource.ts'
import { urlSearchParamsToFilters } from '../../../../utils/url-search-params/filters.ts'
import { urlSearchParamsToPagination } from '../../../../utils/url-search-params/pagination.ts'
import { urlSearchParamsToSort } from '../../../../utils/url-search-params/sorting.ts'
import { OpenApiTag } from '../../models/openapi.ts'
import { makeApp } from '../app.ts'
import { appendOpenApiMetadata, RouteType } from '../openapi/append-open-api-metadata.ts'

// Create a new Hono app instance for resource routes
// This follows the pattern of one route file per resource/entity
const resources = makeApp()

// POST /api/v1/resources - Create a new resource
// This route demonstrates the standard create pattern:
// 1. OpenAPI metadata is appended for documentation
// 2. Request body is validated against the service's createOne schema
// 3. Domain service handles business logic and persistence
// 4. Created entity is returned as JSON
resources.post(
  '/',
  appendOpenApiMetadata({
    operationId: 'resourcesCreateOne',
    requestSchema: ResourceService.schemas.request.createOne,
    responseSchema: ResourceService.schemas.response.getOne,
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

// DELETE /api/v1/resources/:gid - Delete a resource by gid
// This route demonstrates the standard delete pattern:
// 1. gid is extracted from URL parameters
// 2. Domain service handles deletion logic
// 3. Returns 204 No Content on success
resources.delete(
  '/:gid',
  appendOpenApiMetadata({
    operationId: 'resourcesDeleteOne',
    tags: [OpenApiTag.RESOURCES],
    type: RouteType.DELETE_ONE,
  }),
  async (ctx) => {
    const gid = ctx.req.param('gid')
    const services = ctx.get('services')

    await services.resource.deleteOne(gid)

    return new Response(null, { status: 204 })
  },
)

// GET /api/v1/resources - Get multiple resources with filtering, sorting, and pagination
// This route demonstrates the standard get-many pattern:
// 1. URL search parameters are parsed for filters, pagination, and sorting
// 2. Parameters are transformed to domain request format
// 3. Domain service handles query logic
// 4. Paginated response is returned
// Query parameters:
//   - filter[field][operator]=value - Filter by field (e.g., filter[name][eq]=John)
//   - sort=field:asc|desc - Sort by field (e.g., sort=createdAt:desc)
//   - page=1 - Page number (default: 1)
//   - pageSize=10 - Items per page (default: 10)
resources.get(
  '/',
  appendOpenApiMetadata({
    defaultSortField: 'createdAt',
    filterableFields: ResourceService.propsMeta.filter,
    operationId: 'resourcesGetMany',
    requestSchema: ResourceService.schemas.request.getMany,
    responseSchema: ResourceService.schemas.response.getMany,
    sortableFields: ResourceService.propsMeta.sort,
    tags: [OpenApiTag.RESOURCES],
    type: RouteType.GET_MANY,
  }),
  async (ctx) => {
    const services = ctx.get('services')
    const params = new URL(ctx.req.url).searchParams

    const request: DomainGetManyRequest = {
      filters: urlSearchParamsToFilters(params, { baseSchema: ResourceService.schemas.core }),
      pagination: urlSearchParamsToPagination(params),
      sorting: urlSearchParamsToSort(params, { sortableFields: ResourceService.propsMeta.sort }),
    }

    const paginated = await services.resource.getMany(request)

    return ctx.json(paginated)
  },
)

// GET /api/v1/resources/:gid - Get a single resource by gid
// This route demonstrates the standard get-one pattern:
// 1. gid is extracted from URL parameters
// 2. Domain service handles retrieval logic
// 3. Entity is returned as JSON, or 404 if not found
resources.get(
  '/:gid',
  appendOpenApiMetadata({
    operationId: 'resourcesGetOne',
    responseSchema: ResourceService.schemas.response.getOne,
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

// PATCH /api/v1/resources/:gid - Update a resource by gid
// This route demonstrates the standard update pattern:
// 1. gid is extracted from URL parameters
// 2. Request body contains partial update fields
// 3. Request is validated against the service's updateOne schema
// 4. Domain service handles update logic
// 5. Updated entity is returned as JSON
resources.patch(
  '/:gid',
  appendOpenApiMetadata({
    operationId: 'resourcesUpdateOne',
    requestSchema: ResourceService.schemas.request.updateOne,
    responseSchema: ResourceService.schemas.response.getOne,
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
