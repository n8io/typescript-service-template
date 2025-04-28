import { ZodSchema, z } from 'zod'
import { validation } from '../../utils/validation.ts'

const schemaBasePagination = z.object({
  hasMore: validation.bool,
  itemsTotal: validation.number.int().min(0),
  page: validation.number.int().min(0),
  pageSize: validation.number.nonnegative(),
  pagesTotal: validation.number.int().min(0),
})

const toPaginatedResponseSchema = (itemSchema: ZodSchema, exampleItem?: Record<string, unknown>) =>
  schemaBasePagination.extend({ items: itemSchema.array() }).openapi({
    example: {
      hasMore: false,
      itemsTotal: exampleItem ? 1 : 0,
      page: 1,
      pageSize: 10,
      pagesTotal: exampleItem ? 1 : 0,
      items: exampleItem ? [exampleItem] : [],
    },
  })

export { toPaginatedResponseSchema }
