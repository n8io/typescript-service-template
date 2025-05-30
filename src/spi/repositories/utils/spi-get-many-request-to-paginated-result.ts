import { getTableColumns, sql } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'
import type { ZodObject, z } from 'zod'
import type { SpiPaginatedResponse } from '../../../domain/spi-ports/paginated.ts'
import type { SpiGetManyRequest } from '../../../domain/spi-ports/resource-repository.ts'
import type { initDatabase } from '../database/init.ts'
import { domainGetManyRequestToDrizzleQuery } from './domain-get-many-request-to-drizzle-query.ts'

// biome-ignore lint/suspicious/noExplicitAny: ???
type Params<T extends ZodObject<any>> = {
  db: ReturnType<typeof initDatabase>
  request: SpiGetManyRequest
  schema: T
  table: PgTable
}

// biome-ignore lint/suspicious/noExplicitAny: ???
const spiGetManyRequestToPaginatedResult = async <T extends ZodObject<any>>({
  db,
  request,
  schema,
  table,
}: Params<T>): Promise<SpiPaginatedResponse<z.infer<typeof schema>>> => {
  const { limit, offset, orderBy, where } = domainGetManyRequestToDrizzleQuery(request, table)

  const results = await db
    .select({
      // Return all the table's columns
      ...getTableColumns(table),
      // compute the grand‐total across the filtered set (omits limit/offset by default)
      count: sql<number>`count(*) OVER()`,
    })
    .from(table)
    .where(where)
    .orderBy(...orderBy)
    .limit(limit)
    .offset(offset)

  /* v8 ignore next 1 */
  const { count } = results[0] ?? { count: 0 }

  return {
    items: schema.array().parse(results),
    itemsTotal: count,
  }
}

export { spiGetManyRequestToPaginatedResult }
