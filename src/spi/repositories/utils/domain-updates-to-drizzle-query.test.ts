import { type SQL } from 'drizzle-orm'
import { PgDialect } from 'drizzle-orm/pg-core'
import { domainUpdatesToDrizzleQuery } from './domain-updates-to-drizzle-query.ts'

const trimSql = (sql: string) =>
  sql
    .replace(/^[ ]+/gm, '')
    .replace(/[ \t\n]+/gm, ' ')
    .replace(/\( +/gm, '(')
    .replace(/ \)+/gm, ')')
    .trim()

const interpolateParams = (query: { sql: string; params: unknown[] }): string => {
  let { sql, params } = query

  params.forEach((param, index) => {
    const placeholder = `$${index + 1}`
    const value = typeof param === 'string' ? `'${param}'` : param
    sql = sql.replace(placeholder, String(value))
  })

  return sql
}

const dialect = new PgDialect()
const queryToSql = (query: SQL) => dialect.sqlToQuery(query)

describe('domainUpdatesToDrizzleQuery', () => {
  const now = new Date()
  it('should return an empty query if no updates are provided', () => {
    const query = domainUpdatesToDrizzleQuery('test', [])

    expect(query).toBeUndefined()
  })

  it('should return a query if updates are provided', () => {
    const tableName = 'test'
    const gid = 'GID-1'
    const query = domainUpdatesToDrizzleQuery(tableName, [{ gid, name: 'John' }], now)

    const sql = trimSql(interpolateParams(queryToSql(query as SQL)))

    expect(sql).toEqual(
      trimSql(`
        UPDATE "${tableName}"
        SET 
          "name" = CASE "gid" WHEN 'GID-1' THEN 'John' ELSE "name" END,
          "updatedAt" = CASE "gid" WHEN 'GID-1' THEN '${now.toISOString()}' ELSE "updatedAt" END
        WHERE "gid" IN ('GID-1')
      `),
    )
  })

  it('should ignore updates that only have undefined values', () => {
    const tableName = 'test'

    const query = domainUpdatesToDrizzleQuery(tableName, [{ gid: 'GID_JAMIE', thisUpdateShouldBeIgnored: undefined }])

    expect(query).toBeUndefined()
  })

  it('should handle multiple updates with different fields and sort them', () => {
    const tableName = 'test'
    const json = { a: 1, b: 2, c: null, d: `With special characters \`,*():!@#%#$^"'` }
    const birthDate = new Date('2025-01-01Z')

    const query = domainUpdatesToDrizzleQuery(
      tableName,
      [
        { gid: 'GID_JOHN', name: 'John', other: null },
        { gid: 'GID_JANE', name: 'Jane', age: 25 },
        { gid: 'GID_JOE', isActive: true },
        {
          gid: 'GID_JAKE',
          birthDate,
          json,
          undefined: undefined,
        },
        { gid: 'GID_JAMIE', thisUpdateShouldBeIgnored: undefined }, // ...because its only update has an undefined value
      ],
      now,
    )

    const { params, sql } = queryToSql(query as SQL)
    const rawSql = trimSql(interpolateParams({ sql, params }))

    expect(rawSql).toEqual(
      trimSql(`
        UPDATE "${tableName}"
        SET 
          "age" = CASE "gid"
            WHEN 'GID_JANE' THEN 25 ELSE "age"
          END,
          "birthDate" = CASE "gid"
            WHEN 'GID_JAKE' THEN '${birthDate.toISOString()}'
            ELSE "birthDate"
          END,
          "isActive" = CASE "gid"
            WHEN 'GID_JOE' THEN true
            ELSE "isActive"
          END,
          "json" = CASE "gid"
            WHEN 'GID_JAKE' THEN '${JSON.stringify(json)}'
            ELSE "json"
          END,
          "name" = CASE "gid" 
            WHEN 'GID_JOHN' THEN 'John'
            WHEN 'GID_JANE' THEN 'Jane'
            ELSE "name"
          END,
          "other" = CASE "gid" 
            WHEN 'GID_JOHN' THEN NULL ELSE "other" 
          END,
          "updatedAt" = CASE "gid"
            WHEN 'GID_JOHN' THEN '${now.toISOString()}'
            WHEN 'GID_JANE' THEN '${now.toISOString()}'
            WHEN 'GID_JOE' THEN '${now.toISOString()}'
            WHEN 'GID_JAKE' THEN '${now.toISOString()}'
            ELSE "updatedAt"
          END
        WHERE 
          "gid" IN (
            'GID_JAKE',
            'GID_JANE',
            'GID_JOE',
            'GID_JOHN'
          )
      `),
    )
  })
})
