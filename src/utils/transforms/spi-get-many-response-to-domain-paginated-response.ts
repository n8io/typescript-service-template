import type { ZodSchema } from 'zod'
import { toPaginatedResponseSchema } from '../../domain/models/pagination.ts'

const spiRepositoryGetManyResponseToDomainPaginatedResponse = ({
  items,
  itemsTotal,
  page,
  pageSize,
  schema,
}: {
  items: unknown[]
  itemsTotal: number
  pageSize: number
  page: number
  schema: ZodSchema
}) =>
  toPaginatedResponseSchema(schema).parse({
    hasMore: pageSize ? itemsTotal > pageSize * page : false,
    items,
    itemsTotal,
    page,
    pageSize,
    pagesTotal: pageSize ? Math.ceil(itemsTotal / pageSize) : 0,
  })

export { spiRepositoryGetManyResponseToDomainPaginatedResponse }
