import type { SQL } from 'drizzle-orm'
import { and, asc, desc, eq, gt, gte, ilike, inArray, isNotNull, isNull, lt, lte, ne, notInArray } from 'drizzle-orm'
import type { PgColumn } from 'drizzle-orm/pg-core'
import type { DomainGetManyRequest } from '../../../domain/models/request.ts'
import type { Operator } from '../../../models/filter.ts'
import type { tableResources } from '../../../spi/repositories/database/schema.ts'

type ColumnConditionFn = (
  column: PgColumn,
  value: unknown | unknown[],
) => SQL<unknown | ReturnType<typeof inArray> | ReturnType<typeof notInArray>>

const operatorMap: Record<Operator, ColumnConditionFn> = {
  eq: (column, value) => (value === null ? isNull(column) : eq(column, value)),
  neq: (column, value) => (value === null ? isNotNull(column) : ne(column, value)),
  gt: (column, value) => gt(column, value),
  gte: (column, value) => gte(column, value),
  lt: (column, value) => lt(column, value),
  lte: (column, value) => lte(column, value),
  in: (column, value) => inArray(column, value as unknown[]),
  nin: (column, value) => notInArray(column, value as unknown[]),
  search: (column, value) => ilike(column, `%${value}%`),
}

const domainGetManyRequestToDrizzleQuery = (request: DomainGetManyRequest, table: typeof tableResources) => {
  const {
    filters = {},
    pagination: { page, pageSize },
    sorting = [],
  } = request

  const whereClauses = Object.entries(filters).flatMap(([field, ops]) => {
    if (!ops) {
      return []
    }

    const col = (table as unknown as Record<string, PgColumn>)[field]

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
      const col = (table as unknown as Record<string, PgColumn>)[field]

      if (!col) {
        return undefined
      }

      return direction === 'ASC' ? asc(col) : desc(col)
    })
    .filter(Boolean) as SQL<unknown>[]

  const offset = Math.max((page - 1) * pageSize, 0)

  /* v8 ignore start */
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
