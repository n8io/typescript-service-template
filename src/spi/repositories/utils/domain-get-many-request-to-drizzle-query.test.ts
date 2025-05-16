import { drizzle } from 'drizzle-orm/node-postgres'
import type { DomainGetManyRequest } from '../../../domain/models/request.ts'
import { tableResources } from '../../../spi/repositories/database/schema.ts'
import { domainGetManyRequestToDrizzleQuery } from './domain-get-many-request-to-drizzle-query.ts'

describe('domainGetManyRequestToDrizzleQuery', () => {
  it('should convert the kitchen sink domain get many request to the proper drizzle query', () => {
    const request: DomainGetManyRequest = {
      filters: {
        invalidResourceField: {
          eq: 'EQ',
        },
        name: {
          // @ts-expect-error We are sending this on purpose
          invalidOperator: 'INVALID_OPERATOR',
          eq: 'EQ',
          neq: null,
          gt: 'GT',
          gte: 'GTE',
          in: ['A', 'B', 'C'],
          nin: ['X', 'Y', 'Z'],
          lt: 'LT',
          lte: 'LTE',
          search: 'SEARCH',
        },
        invalidNoOps: undefined,
      },
      pagination: {
        page: 12,
        pageSize: 345,
      },
      sorting: [
        {
          direction: 'ASC',
          field: 'createdAt',
        },
        {
          direction: 'DESC',
          field: 'name',
        },
        {
          // @ts-expect-error We are sending this on purpose
          direction: 'invalid',
          field: 'invalid',
        },
      ],
    }

    const { limit, offset, orderBy, where } = domainGetManyRequestToDrizzleQuery(request, tableResources)
    const db = drizzle('')

    const query = db
      .select()
      .from(tableResources)
      .where(where)
      .orderBy(...orderBy)
      .toSQL()

    expect(limit).toEqual(345)
    expect(offset).toEqual(3795)

    expect(query.params).toEqual(['EQ', 'GT', 'GTE', 'A', 'B', 'C', 'X', 'Y', 'Z', 'LT', 'LTE', '%SEARCH%'])

    expect(query.sql).toEqual(
      `
      select 
        "createdAt", 
        "createdBy", 
        "gid", 
        "updatedAt", 
        "updatedBy", 
        "name", 
        "timeZone", 
        "id" 
      from "resources"
      where (
        "resources"."name" = $1 and 
        "resources"."name" is not null and 
        "resources"."name" > $2 and 
        "resources"."name" >= $3 and 
        "resources"."name" in ($4, $5, $6) and 
        "resources"."name" not in ($7, $8, $9) and 
        "resources"."name" < $10 and 
        "resources"."name" <= $11 and 
        "resources"."name" ilike $12
      ) 
      order by 
        "resources"."createdAt" asc, 
        "resources"."name" desc
    `
        .replace(/(\s)+/g, ' ')
        .replace(/(\( )+/g, '(')
        .replace(/( \))+/g, ')')
        .trim(),
    )
  })
})
