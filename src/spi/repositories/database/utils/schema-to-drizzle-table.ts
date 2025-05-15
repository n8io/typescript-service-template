import type { date } from 'drizzle-orm/pg-core'
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import type { ZodObject, ZodRawShape, ZodTypeAny } from 'zod'
import { ZodFirstPartyTypeKind, z } from 'zod'

type DrizzleColumn = ReturnType<
  | typeof uuid
  | typeof varchar
  | typeof integer
  | typeof boolean
  | typeof timestamp
  | typeof numeric
  | typeof date
  | typeof text
  | typeof jsonb
>

type ColumnBuilder = (name: string, zodType: ZodTypeAny) => DrizzleColumn

const unwrapZodType = (zodType: ZodTypeAny) => {
  let current = zodType
  let isNullable = false
  let isOptional = false
  let defaultValue: unknown

  while (true) {
    const type = current._def.typeName

    if (type === ZodFirstPartyTypeKind.ZodNullable) {
      isNullable = true
      current = current._def.innerType
      continue
    }

    if (type === ZodFirstPartyTypeKind.ZodOptional) {
      isOptional = true
      current = current._def.innerType
      continue
    }

    if (type === ZodFirstPartyTypeKind.ZodDefault) {
      // biome-ignore lint/suspicious/noExplicitAny: accessing internal Zod definition
      const defaultVal = (current as any)._def.defaultValue

      defaultValue = typeof defaultVal === 'function' ? defaultVal() : defaultVal
      // biome-ignore lint/suspicious/noExplicitAny: accessing internal Zod definition
      current = (current as any)._def.innerType || (current as any)._def.schema
      continue
    }

    if (type === ZodFirstPartyTypeKind.ZodEffects) {
      current = current._def.schema
      continue
    }

    break
  }

  return {
    baseType: current,
    defaultValue,
    isNullable,
    isOptional,
  }
}

const mapZodToDrizzle: Record<string, ColumnBuilder> = {
  [ZodFirstPartyTypeKind.ZodString]: (name, zodType) => {
    const checks = zodType._def.checks

    // biome-ignore lint/suspicious/noExplicitAny: ???
    const isUuid = checks?.some((c: any) => c.kind === 'uuid')

    return isUuid ? uuid(name) : varchar(name, { length: 255 })
  },

  [ZodFirstPartyTypeKind.ZodNumber]: (name, zodType) => {
    // biome-ignore lint/suspicious/noExplicitAny: ???
    const isInt = zodType._def.checks?.some((c: any) => c.kind === 'int')

    return isInt ? integer(name) : numeric(name)
  },

  [ZodFirstPartyTypeKind.ZodBoolean]: (name) => boolean(name),

  [ZodFirstPartyTypeKind.ZodDate]: (name) => timestamp(name, { precision: 3 }),

  [ZodFirstPartyTypeKind.ZodEnum]: (name) => text(name),

  [ZodFirstPartyTypeKind.ZodArray]: (name) => jsonb(name),

  [ZodFirstPartyTypeKind.ZodUnion]: (name) => jsonb(name),

  [ZodFirstPartyTypeKind.ZodDiscriminatedUnion]: (name) => jsonb(name),
}

type IndexConfig<T> = {
  indexes?: (keyof T)[]
  uniqueIndexes?: (keyof T)[]
  compositeIndexes?: (keyof T)[][]
  compositeUniqueIndexes?: (keyof T)[][]
}

const toPostgresObjectName = (input: string) =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_') // Replace non-alphanumeric and non-underscore characters
    .replace(/^([^a-z_])/, '_$1') // Prefix if it doesn't start with letter or underscore
    .replace(/_+/g, '_') // Collapse multiple underscores
    .replace(/^_+|_+$/g, '') // Trim leading/trailing underscores
    .slice(0, 63) // Enforce max 63 characters

const schemaToDrizzleTable = <T extends ZodRawShape>(
  tableName: string,
  schema: ZodObject<T>,
  config: IndexConfig<T> = {},
) => {
  const shape = { ...schema.shape }

  if (!('id' in shape)) {
    // @ts-expect-error ???
    // biome-ignore lint/complexity/useLiteralKeys: ???
    shape['id'] = z.string()
  }

  const columns: Record<string, DrizzleColumn> = {}

  for (const [key, zodTypeOriginal] of Object.entries(shape)) {
    const { baseType, defaultValue, isNullable, isOptional } = unwrapZodType(zodTypeOriginal)
    const isNullish = isNullable || isOptional
    const baseTypeName = baseType._def.typeName
    const mapFn = mapZodToDrizzle[baseTypeName]

    if (!mapFn) {
      throw new Error(`Unsupported Zod type: ${baseTypeName} for field "${key}"`)
    }

    let column = mapFn(key, zodTypeOriginal)

    if (!isNullish && 'notNull' in column) {
      column = column.notNull()
    }

    // Apply default value only for non-nullish columns
    if (defaultValue !== undefined && !isNullish && 'default' in column) {
      // biome-ignore lint/suspicious/noExplicitAny: defaultValue comes from Zod default
      column = (column as any).default(defaultValue)
    }

    columns[key] = column
  }

  const tableConfig = (t: typeof columns) => {
    const constraints: Record<string, unknown> = {
      // @ts-expect-error ???
      primaryKey: primaryKey(t.id),
    }

    for (const field of config.indexes ?? []) {
      const name = toPostgresObjectName(`idx_${tableName}_${String(field)}`)

      // @ts-expect-error ???
      constraints[name] = index(name).on(t[field as string])
    }

    for (const field of config.uniqueIndexes ?? []) {
      const name = toPostgresObjectName(`udx_${tableName}_${String(field)}`)

      // @ts-expect-error ???
      constraints[name] = uniqueIndex(name).on(t[field as string])
    }

    for (const fields of config.compositeIndexes ?? []) {
      const name = toPostgresObjectName(`idx_${tableName}_${fields.join('_')}`)

      // @ts-expect-error ???
      constraints[name] = index(name).on(...fields.map((f) => t[f as string]))
    }

    for (const fields of config.compositeUniqueIndexes ?? []) {
      const name = toPostgresObjectName(`udx_${tableName}_${fields.join('_')}`)

      // @ts-expect-error ???
      constraints[name] = uniqueIndex(name).on(...fields.map((f) => t[f as string]))
    }

    return constraints
  }

  // @ts-expect-error ???
  return pgTable(tableName, columns, tableConfig)
}

export { schemaToDrizzleTable }
