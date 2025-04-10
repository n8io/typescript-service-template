import { Hono } from 'hono'
import { type DomainGetManyRequest } from '../../../../domain/models/request.ts'
import { resourceSortableFields, schemaResource } from '../../../../domain/models/resource.ts'
import { urlSearchParamsToFilters } from '../../../../utils/url-search-params/filters.ts'
import { urlSearchParamsToPagination } from '../../../../utils/url-search-params/pagination.ts'
import { urlSearchParamsToSort } from '../../../../utils/url-search-params/sorting.ts'
import type { Env } from '../models.ts'

const resources = new Hono<Env>()

resources.get('/', async (ctx) => {
  const services = ctx.get('services')
  const params = new URL(ctx.req.url).searchParams

  const request = {
    filters: urlSearchParamsToFilters(params, { baseSchema: schemaResource }),
    pagination: urlSearchParamsToPagination(params),
    sorting: urlSearchParamsToSort(params, { sortableFields: resourceSortableFields }),
  } as DomainGetManyRequest

  const paginated = await services.resource.getMany(request)

  return ctx.json(paginated)
})

resources.post('/', async (ctx) => {
  const services = ctx.get('services')
  const request = await ctx.req.json()
  const resource = await services.resource.createOne(request)

  return ctx.json(resource)
})

resources.get('/:gid', async (ctx) => {
  const gid = ctx.req.param('gid')
  const services = ctx.get('services')
  const resource = await services.resource.getOne(gid)

  return ctx.json(resource)
})

export { resources }
