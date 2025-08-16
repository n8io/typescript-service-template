import type {
  bigserial,
  char,
  cidr,
  date,
  decimal,
  inet,
  json,
  macaddr,
  macaddr8,
  numeric,
  PgColumn,
  PgTable,
  PgTableExtraConfig,
  serial,
  smallint,
  smallserial,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb as jsonbBuilder,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { ZodFirstPartyTypeKind, z } from 'zod'
import type { Result } from '../../../../models/result.ts'
import { failure, success } from '../../../../models/result.ts'
import type { SpiError } from '../../../../models/spi-errors.ts'
import { createSpiValidationError } from '../../../../models/spi-errors.ts'

type ColumnBuilder = (
  name: string,
  zodType: z.ZodTypeAny,
) =>
  | ReturnType<typeof text>
  | ReturnType<typeof varchar>
  | ReturnType<typeof integer>
  | ReturnType<typeof boolean>
  | ReturnType<typeof timestamp>
  | ReturnType<typeof date>
  | ReturnType<typeof uuid>
  | ReturnType<typeof numeric>
  | ReturnType<typeof bigint>
  | ReturnType<typeof smallint>
  | ReturnType<typeof decimal>
  | ReturnType<typeof json>
  | ReturnType<typeof jsonbBuilder>
  | ReturnType<typeof char>
  | ReturnType<typeof cidr>
  | ReturnType<typeof inet>
  | ReturnType<typeof macaddr>
  | ReturnType<typeof macaddr8>
  | ReturnType<typeof serial>
  | ReturnType<typeof smallserial>
  | ReturnType<typeof bigserial>

type ZodRawShape = Record<string, z.ZodTypeAny>
type ZodObject<T extends ZodRawShape> = z.ZodObject<T>

const unwrapZodType = (zodType: z.ZodTypeAny) => {
  let current = zodType
  let isNullable = false
  let isOptional = false
  let defaultValue: unknown

  while (
    current._def.typeName === ZodFirstPartyTypeKind.ZodOptional ||
    current._def.typeName === ZodFirstPartyTypeKind.ZodNullable ||
    current._def.typeName === ZodFirstPartyTypeKind.ZodDefault
  ) {
    if (current._def.typeName === ZodFirstPartyTypeKind.ZodOptional) {
      isOptional = true
      current = current._def.innerType
    } else if (current._def.typeName === ZodFirstPartyTypeKind.ZodNullable) {
      isNullable = true
      current = current._def.innerType
    } else if (current._def.typeName === ZodFirstPartyTypeKind.ZodDefault) {
      defaultValue = current._def.defaultValue()
      current = current._def.innerType
    }
  }

  return { baseType: current, isNullable, isOptional, defaultValue }
}

const mapZodToDrizzle: Partial<Record<ZodFirstPartyTypeKind, ColumnBuilder>> = {
  [ZodFirstPartyTypeKind.ZodString]: (name) => text(name),
  [ZodFirstPartyTypeKind.ZodNumber]: (name) => integer(name),
  [ZodFirstPartyTypeKind.ZodBoolean]: (name) => boolean(name),
  [ZodFirstPartyTypeKind.ZodDate]: (name) => timestamp(name),
  [ZodFirstPartyTypeKind.ZodBigInt]: (name) => bigint(name, { mode: 'bigint' }),
  [ZodFirstPartyTypeKind.ZodSymbol]: (name) => text(name),
  [ZodFirstPartyTypeKind.ZodFunction]: (name) => text(name),
  [ZodFirstPartyTypeKind.ZodUndefined]: (name) => text(name),
  [ZodFirstPartyTypeKind.ZodNull]: (name) => text(name),
  [ZodFirstPartyTypeKind.ZodNever]: (name) => text(name),
  [ZodFirstPartyTypeKind.ZodVoid]: (name) => text(name),
  [ZodFirstPartyTypeKind.ZodAny]: (name) => jsonbBuilder(name),
  [ZodFirstPartyTypeKind.ZodUnknown]: (name) => jsonbBuilder(name),
  [ZodFirstPartyTypeKind.ZodPromise]: (name) => text(name),
  [ZodFirstPartyTypeKind.ZodMap]: (name) => jsonbBuilder(name),
  [ZodFirstPartyTypeKind.ZodSet]: (name) => jsonbBuilder(name),
  [ZodFirstPartyTypeKind.ZodEnum]: (name) => text(name),
  [ZodFirstPartyTypeKind.ZodNativeEnum]: (name) => text(name),
  [ZodFirstPartyTypeKind.ZodLiteral]: (name) => text(name),
  [ZodFirstPartyTypeKind.ZodObject]: (name) => jsonbBuilder(name),
  [ZodFirstPartyTypeKind.ZodRecord]: (name) => jsonbBuilder(name),
  [ZodFirstPartyTypeKind.ZodTuple]: (name) => jsonbBuilder(name),
  [ZodFirstPartyTypeKind.ZodEffects]: (name) => text(name),
  [ZodFirstPartyTypeKind.ZodLazy]: (name) => text(name),
  [ZodFirstPartyTypeKind.ZodBranded]: (name) => text(name),
  [ZodFirstPartyTypeKind.ZodPipeline]: (name) => text(name),
  [ZodFirstPartyTypeKind.ZodReadonly]: (name) => text(name),
  [ZodFirstPartyTypeKind.ZodArray]: (name) => jsonbBuilder(name),
  [ZodFirstPartyTypeKind.ZodUnion]: (name) => jsonbBuilder(name),
  [ZodFirstPartyTypeKind.ZodDiscriminatedUnion]: (name) => jsonbBuilder(name),
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
): Result<PgTable, SpiError> => {
  try {
    const shape: Record<string, z.ZodTypeAny> = { ...schema.shape }

    if (!('id' in shape)) {
      shape.id = z.string()
    }

    const table = pgTable(
      tableName,
      (_columnTypes) => {
        const columns: Record<string, ReturnType<ColumnBuilder>> = {}

        for (const [key, zodTypeOriginal] of Object.entries(shape)) {
          const { baseType, defaultValue, isNullable, isOptional } = unwrapZodType(zodTypeOriginal)
          const isNullish = isNullable || isOptional
          const baseTypeName = baseType._def.typeName
          const mapFn = mapZodToDrizzle[baseTypeName as ZodFirstPartyTypeKind]

          if (!mapFn) {
            throw new Error(`Unsupported Zod type: ${baseTypeName} for field "${key}"`)
          }

          let column = mapFn(key, zodTypeOriginal)

          if (!isNullish && 'notNull' in column) {
            column = column.notNull()
          }

          if (defaultValue !== undefined && !isNullish && 'default' in column) {
            // biome-ignore lint/suspicious/noExplicitAny: ???
            column = (column as any).default(defaultValue)
          }

          columns[key] = column
        }

        return columns
      },
      (t) => {
        const constraints: PgTableExtraConfig = {
          primaryKey: primaryKey({ columns: [t.id as unknown as PgColumn] }),
        }

        for (const field of config.indexes ?? []) {
          const name = toPostgresObjectName(`idx_${tableName}_${String(field)}`)
          constraints[name] = index(name).on(t[field as string] as unknown as PgColumn)
        }

        for (const field of config.uniqueIndexes ?? []) {
          const name = toPostgresObjectName(`udx_${tableName}_${String(field)}`)
          constraints[name] = uniqueIndex(name).on(t[field as string] as unknown as PgColumn)
        }

        for (const fields of config.compositeIndexes ?? []) {
          const name = toPostgresObjectName(`idx_${tableName}_${fields.join('_')}`)
          constraints[name] = index(name).on(
            ...(fields.map((f) => t[f as string] as unknown as PgColumn) as [PgColumn, ...PgColumn[]]),
          )
        }

        for (const fields of config.compositeUniqueIndexes ?? []) {
          const name = toPostgresObjectName(`udx_${tableName}_${fields.join('_')}`)
          constraints[name] = uniqueIndex(name).on(
            ...(fields.map((f) => t[f as string] as unknown as PgColumn) as [PgColumn, ...PgColumn[]]),
          )
        }

        return constraints
      },
    )

    return success(table)
  } catch (error) {
    return failure(createSpiValidationError('Failed to create table schema', 'schema', error, 'table_creation'))
  }
}

export { schemaToDrizzleTable }
