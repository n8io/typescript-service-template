import type { SQL } from 'drizzle-orm'
import { and, asc, desc, eq, gt, gte, ilike, inArray, isNotNull, isNull, lt, lte, ne, notInArray } from 'drizzle-orm'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'
import type { DomainGetManyRequest } from '../../../domain/models/request.ts'
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../../../domain/models/request.ts'
import type { Operator } from '../../../models/filter.ts'

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

const domainGetManyRequestToDrizzleQuery = (request: DomainGetManyRequest, table: PgTable) => {
  const { filters = {}, pagination: { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE } = {}, sorting = [] } = request

  const whereClauses = Object.entries(filters).flatMap(([field, filterObj]) => {
    if (!filterObj) {
      return []
    }

    const col = (table as unknown as Record<string, PgColumn>)[field]

    if (!col) {
      return [] // ignore unknown fields
    }

    return Object.entries(filterObj)
      .map(([operator, value]) => {
        const fn = operatorMap[operator as keyof typeof operatorMap]

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

      return direction === 'DESC' ? desc(col) : asc(col)
    })
    .filter(Boolean) as SQL<unknown>[]

  /* v8 ignore start */
  const where = whereClauses.length ? and(...whereClauses) : undefined
  /* v8 ignore end */

  const orderBy = orderByClauses
  const offset = Math.max((page - 1) * pageSize, 0)
  const limit = pageSize

  return {
    limit,
    offset,
    orderBy,
    where,
  }
}

export { domainGetManyRequestToDrizzleQuery }
