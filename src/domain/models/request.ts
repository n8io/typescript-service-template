import { z } from 'zod'
import { schemaSortDirection } from '../../utils/url-search-params/sorting.ts'
import { validation } from '../../utils/validation.ts'

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100

const schemaFilter = z.object({
  eq: z.any().optional(),
  neq: z.any().optional(),
  gt: z.any().optional(),
  gte: z.any().optional(),
  lt: z.any().optional(),
  lte: z.any().optional(),
  in: z.any().array().optional(),
  nin: z.any().array().optional(),
  search: validation.string.optional(),
})

const schemaFilters = z.record(validation.string, schemaFilter.strict().optional())

const schemaDomainPagination = z.object({
  page: validation.number.int().positive().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE).optional(),
  pageSize: validation.number.int().nonnegative().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE).optional(),
})

const schemaDomainSorting = z.object({
  field: validation.string,
  direction: schemaSortDirection,
})

const schemaDomainGetManyRequest = z
  .object({
    filters: schemaFilters.optional(),
    pagination: schemaDomainPagination.optional(),
    sorting: schemaDomainSorting.array().optional(),
  })
  .strict()

type DomainGetManyRequest = Prettify<z.infer<typeof schemaDomainGetManyRequest>>

export type { DomainGetManyRequest }
export { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, schemaDomainGetManyRequest }
