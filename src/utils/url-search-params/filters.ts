import type { ZodObject, ZodSchema, ZodTypeAny } from 'zod'
import { z } from 'zod'
import {
  ApiUnsupportedFieldError,
  ApiUnsupportedFieldOperatorError,
  ApiUnsupportedMultipleValueOperatorError,
  ApiUnsupportedOperatorError,
} from '../../models/custom-error.ts'
import { Operator } from '../../models/filter.ts'

type Options = {
  // biome-ignore lint/suspicious/noExplicitAny: schema shape is dynamic
  baseSchema: ZodObject<any>
}

const unwrapAll = (schema: ZodSchema): ZodSchema => {
  let current = schema

  while (true) {
    // @ts-expect-error Need to fix this
    const typeName = current._def?.typeName

    if (typeName === 'ZodEffects') {
      // @ts-expect-error Need to fix this
      current = current._def.schema
      continue
    }

    if (typeName === 'ZodDefault') {
      // @ts-expect-error Need to fix this
      current = current._def.innerType
      continue
    }

    if (typeName === 'ZodCatch') {
      // @ts-expect-error Need to fix this
      current = current._def.innerType
      continue
    }

    if (typeName === 'ZodPipeline') {
      // @ts-expect-error Need to fix this
      current = current._def.in
      continue
    }

    // biome-ignore lint/suspicious/noExplicitAny: ???
    if (typeof (current as any).unwrap === 'function') {
      // biome-ignore lint/suspicious/noExplicitAny: ???
      current = (current as any).unwrap()
      continue
    }

    break
  }

  return current
}

// @ts-expect-error Need to fix this
const getBaseType = (schema: ZodSchema): string => unwrapAll(schema)._def?.typeName ?? 'Unknown'

const getBaseSchema = unwrapAll

// biome-ignore lint/suspicious/noExplicitAny: ???
const safeSort = (values: any[], zodType: string) => {
  if (zodType === 'ZodNumber') {
    return values.sort((a, b) => a - b)
  }

  if (zodType === 'ZodDate') {
    return values.sort((a, b) => a.getTime() - b.getTime())
  }

  if (zodType === 'ZodBoolean') {
    return values.sort((a, b) => Number(a) - Number(b))
  }

  if (zodType === 'ZodString' || zodType === 'ZodEnum') {
    return values.sort((a, b) => a?.localeCompare(b))
  }

  /* v8 ignore next 2 */
  return values.sort()
}

const getOperatorsForSchema = (schema: ZodSchema): Operator[] => {
  const type = getBaseType(schema)

  if (type === 'ZodString') {
    return ['eq', 'in', 'neq', 'nin', 'search']
  }

  if (type === 'ZodNumber' || type === 'ZodDate') {
    return ['eq', 'in', 'neq', 'nin', 'gt', 'gte', 'lt', 'lte']
  }

  return ['eq', 'neq', 'in', 'nin']
}

const isNullable = (schema: ZodSchema): boolean => schema.isNullable?.() ?? false

const isDefined = (value: unknown): boolean => value !== undefined

// biome-ignore lint/suspicious/noExplicitAny: schema shape is dynamic
const buildFilterSchema = <T extends ZodObject<any>>(baseSchema: T) => {
  const shape = Object.entries(baseSchema.shape).reduce(
    (acc, [key, schemaRaw]) => {
      const schema = schemaRaw as ZodSchema
      const ops = getOperatorsForSchema(schema)
      const opShape: Record<string, ZodSchema> = {}

      const base = getBaseSchema(schema)
      const nullable = isNullable(schema)

      for (const op of ops) {
        if (op === 'in' || op === 'nin') {
          const arrSchema = nullable ? base.nullable().array() : base.array()
          opShape[op] = arrSchema.optional()
        } else if (op === 'search') {
          opShape[op] = z.string().min(1).optional()
        } else {
          opShape[op] = nullable ? base.nullable().optional() : base.optional()
        }
      }

      acc[key] = z.object(opShape).partial().optional()

      return acc
    },
    {} as Record<string, ZodTypeAny>,
  )

  return z.object(shape)
}

// biome-ignore lint/suspicious/noExplicitAny: coercion needs dynamic input
const makeCoerceValue = (zodType: string) => (value: any) => {
  if (value === null) return null

  if (zodType === 'ZodDate') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date
  }

  if (zodType === 'ZodNumber') {
    const number = Number(value)
    return Number.isNaN(number) ? value : number
  }

  if (zodType === 'ZodBoolean') {
    return value === 'true'
  }

  if (zodType === 'ZodString' || zodType === 'ZodEnum') {
    return value.toString().trim()
  }

  return value
}

const makeNormalizeValues = (operator: Operator) => (rawValues: string[]) =>
  rawValues
    .flatMap((v) => (operator === 'search' ? v : v.split(',')))
    .map((v) => (v === 'null' ? null : v.trim()))
    .filter((v) => v !== '')

const reservedFieldNames = new Set(['page', 'pageSize', 'sort'])

const urlSearchParamsToFilters = (params: URLSearchParams, { baseSchema }: Options) => {
  // biome-ignore lint/suspicious/noExplicitAny: schema shape is dynamic
  const filters: Record<string, any> = {}
  const rawParamGroups: Record<string, string[]> = {}

  for (const [rawKey, rawValue] of params.entries()) {
    if (reservedFieldNames.has(rawKey)) {
      continue
    }

    if (!rawParamGroups[rawKey]) {
      rawParamGroups[rawKey] = []
    }

    rawParamGroups[rawKey].push(rawValue)
  }

  for (const [rawKey, rawValues] of Object.entries(rawParamGroups)) {
    const [fieldRaw = '', operatorRaw = 'eq'] = rawKey.split(':')
    const operator = operatorRaw as Operator

    if (!Object.hasOwn(Operator, operator)) {
      throw new ApiUnsupportedOperatorError(operator)
    }

    const field = fieldRaw.trim()
    const isSupportedField = field in baseSchema.shape

    if (!isSupportedField) {
      throw new ApiUnsupportedFieldError(field)
    }

    const schema = baseSchema.shape[field]
    const schemaOperators = new Set(getOperatorsForSchema(schema))

    if (!schemaOperators.has(operator)) {
      throw new ApiUnsupportedFieldOperatorError(field, operator)
    }

    const type = getBaseType(schema)
    const normalizeValues = makeNormalizeValues(operator)
    const coerceValue = makeCoerceValue(type)
    const values = normalizeValues(rawValues)
    const parsedValues = values.map(coerceValue)

    if (!filters[field]) {
      filters[field] = {}
    }

    const deduped = [...new Set(parsedValues)]

    const applyEquivalenceOperation = ({ isNegated = false }: { isNegated?: boolean }) => {
      const eqOp = isNegated ? 'neq' : 'eq'
      const inOp = isNegated ? 'nin' : 'in'
      const previousEq = structuredClone(filters[field][eqOp])
      const previousIn = structuredClone(filters[field][inOp]) ?? []

      const nextIn = safeSort(
        [...new Set([...(Array.isArray(previousIn) ? previousIn : []), previousEq, ...deduped].filter(isDefined))],
        type,
      )

      delete filters[field][eqOp]

      if (nextIn.length > 1) {
        filters[field][inOp] = nextIn
      } else {
        filters[field][eqOp] = nextIn[0]
      }
    }

    switch (operator) {
      case 'eq':
      case 'in':
        applyEquivalenceOperation({ isNegated: false })
        break
      case 'neq':
      case 'nin':
        applyEquivalenceOperation({ isNegated: true })
        break
      case 'gt':
      case 'gte':
      case 'lt':
      case 'lte':
      case 'search': {
        if (deduped.length > 1) {
          throw new ApiUnsupportedMultipleValueOperatorError(operator)
        }

        if (isDefined(deduped[0]) === false) {
          break
        }

        filters[field][operator] = deduped[0]

        break
      }
      /* v8 ignore next 5 */
      default: {
        const _exhaustiveCheck: never = operator

        throw new ApiUnsupportedOperatorError(operator)
      }
    }
  }

  return buildFilterSchema(baseSchema).parse(filters)
}

export { urlSearchParamsToFilters }
