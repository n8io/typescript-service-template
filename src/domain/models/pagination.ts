import { ZodSchema, z } from 'zod'
import { validation } from '../../utils/validation.ts'

const toPaginatedResponseSchema = (itemSchema: ZodSchema) =>
  z.object({
    hasMore: validation.bool,
    items: itemSchema.array(),
    itemsTotal: validation.number.int().min(0),
    page: validation.number.int().min(0),
    pageSize: validation.number.int().min(0),
    pagesTotal: validation.number.int().min(0),
  })

export { toPaginatedResponseSchema }
