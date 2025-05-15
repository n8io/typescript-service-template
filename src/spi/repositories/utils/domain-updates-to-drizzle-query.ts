import { SQL, sql } from 'drizzle-orm'

type JsonValue = Date | string | number | boolean | null | undefined | JsonObject | JsonArray

type JsonObject = {
  [key: string]: JsonValue
}

type JsonArray = JsonValue[]

type UpdateByGid = {
  gid: string
  updatedAt?: Date
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

const domainUpdatesToDrizzleQuery = (tableName: string, updates: UpdateByGid[], now = new Date()): SQL | undefined => {
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

  for (const row of validUpdates) {
    for (const key in row) {
      if (key !== ID_KEY && row[key] !== undefined) {
        allFields.add(key)
      }
    }
  }

  // Build parameterized CASE WHEN clauses
  const setClauses = Array.from(allFields)
    .sort()
    .map((field) => {
      if (field === 'updatedAt') {
        // For updatedAt, use the now parameter for all records
        const cases = validUpdates.map((u) => sql`WHEN ${u.gid} THEN ${formatValue(now)}`)

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
