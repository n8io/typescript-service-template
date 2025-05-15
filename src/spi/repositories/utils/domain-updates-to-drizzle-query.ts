import type { SQL } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import type { AuditRecord } from '../../../models/audit-record.ts'

type JsonValue = Date | string | number | boolean | null | undefined | JsonObject | JsonArray

type JsonObject = {
  [key: string]: JsonValue
}

type JsonArray = JsonValue[]

type UpdateByGid = {
  gid: string
  [key: string]: JsonValue
}

const ID_KEY = 'gid'

const formatValue = (value: Exclude<JsonValue, undefined>): SQL => {
  if (value === null) {
    return sql`NULL`
  }

  if (value instanceof Date) {
    return sql`${value.toISOString()}`
  }

  if (typeof value === 'object') {
    return sql`${JSON.stringify(value)}`
  }

  return sql`${value}`
}

const domainUpdatesToDrizzleQuery = (
  tableName: string,
  updates: UpdateByGid[],
  updatedBy: AuditRecord,
  updatedAt = new Date(),
): SQL | undefined => {
  const allFields = new Set<string>()

  // Filter out updates that only have undefined values
  const validUpdates = updates.filter((update) =>
    Object.entries(update).some(([key, value]) => key !== ID_KEY && value !== undefined),
  )

  if (validUpdates.length === 0) {
    return
  }

  // Always add updatedAt to the fields to update
  allFields.add('updatedAt')
  allFields.add('updatedBy')

  for (const row of validUpdates) {
    for (const key in row) {
      if (key !== ID_KEY && row[key] !== undefined) {
        allFields.add(key)
      }
    }
  }

  // Build parameterized CASE WHEN clauses for multiple updates
  const setClauses = Array.from(allFields)
    .sort()
    .map((field) => {
      if (field === 'updatedAt') {
        // For updatedAt, use the now parameter for all records
        const cases = validUpdates.map((u) => sql`WHEN ${u.gid} THEN ${formatValue(updatedAt)}`)

        return sql`"${sql.raw(field)}" = CASE "gid" ${sql.join(cases, sql` `)} ELSE "${sql.raw(field)}" END`
      }

      if (field === 'updatedBy') {
        const cases = validUpdates.map((u) => sql`WHEN ${u.gid} THEN ${formatValue(updatedBy)}`)

        return sql`"${sql.raw(field)}" = CASE "gid" ${sql.join(cases, sql` `)} ELSE "${sql.raw(field)}" END`
      }

      const cases = validUpdates
        .filter((u) => u[field] !== undefined)
        .map((u) => sql`WHEN ${u.gid} THEN ${formatValue(u[field] as Exclude<JsonValue, undefined>)}`)

      return sql`"${sql.raw(field)}" = CASE "gid" ${sql.join(cases, sql` `)} ELSE "${sql.raw(field)}" END`
    })

  const gids = validUpdates.map((u) => u.gid).sort()

  return sql`
    UPDATE "${sql.raw(tableName)}"
    SET ${sql.join(setClauses, sql`, `)}
    WHERE "gid" IN (${sql.join(
      gids.map((g) => sql`${g}`),
      sql`, `,
    )})
  `
}

export type { UpdateByGid }
export { domainUpdatesToDrizzleQuery }
