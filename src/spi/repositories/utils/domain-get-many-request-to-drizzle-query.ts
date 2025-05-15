import type { SQL } from 'drizzle-orm'
import { and, asc, desc, eq, gt, gte, ilike, inArray, isNotNull, isNull, lt, lte, ne, notInArray } from 'drizzle-orm'
import type { DomainGetManyRequest } from '../../../domain/models/request.ts'
import type { Operator } from '../../../models/filter.ts'
import type { resourcesTable } from '../../../spi/repositories/database/schema.ts'

// biome-ignore lint/suspicious/noExplicitAny: We need to pass a PgTableWithColumns to the function
type ColumnConditionFn = (column: any, value: unknown) => SQL<unknown>

const operatorMap: Record<Operator, ColumnConditionFn> = {
  eq: (column, value) => (value === null ? isNull(column) : eq(column, value)),
  neq: (column, value) => (value === null ? isNotNull(column) : ne(column, value)),
  gt: (column, value) => gt(column, value),
  gte: (column, value) => gte(column, value),
  lt: (column, value) => lt(column, value),
  lte: (column, value) => lte(column, value),
  // @ts-expect-error Need to fix this
  in: (column, value) => inArray(column, value),
  // @ts-expect-error Need to fix this
  nin: (column, value) => notInArray(column, value),
  search: (column, value) => ilike(column, `%${value}%`),
}

const domainGetManyRequestToDrizzleQuery = (request: DomainGetManyRequest, table: typeof resourcesTable) => {
  const {
    filters = {},
    pagination: { page, pageSize },
    sorting = [],
  } = request

  const whereClauses = Object.entries(filters).flatMap(([field, ops]) => {
    if (!ops) {
      return []
    }

    const col = table[field]

    if (!col) {
      return [] // ignore unknown fields
    }

    return Object.entries(ops)
      .map(([op, value]) => {
        const fn = operatorMap[op as keyof typeof operatorMap]

        return fn?.(col, value)
      })
      .filter(Boolean) as SQL<unknown>[]
  })

  const orderByClauses = sorting
    .map(({ field, direction }) => {
      const col = table[field]

      if (!col) {
        return undefined
      }

      return direction === 'ASC' ? asc(col) : desc(col)
    })
    .filter(Boolean) as SQL<unknown>[]

  /* v8 ignore start */
  const offset = page ? (page - 1) * pageSize : 0
  const where = whereClauses.length ? and(...whereClauses) : undefined
  /* v8 ignore end */

  const orderBy = orderByClauses

  return {
    limit: pageSize,
    offset,
    orderBy,
    where,
  }
}
/* v8 ignore end */

export { domainGetManyRequestToDrizzleQuery }
