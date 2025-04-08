import { ZodObject, ZodSchema, type ZodTypeAny, z } from 'zod'

type Options = {
  // biome-ignore lint/suspicious/noExplicitAny: schema shape is dynamic
  baseSchema: ZodObject<any>
}

const Operator = {
  eq: 'eq',
  neq: 'neq',
  gt: 'gt',
  gte: 'gte',
  lt: 'lt',
  lte: 'lte',
  in: 'in',
  nin: 'nin',
  search: 'search',
} as const

type Operator = (typeof Operator)[keyof typeof Operator]

class CustomError extends Error {
  code?: string

  constructor(name: string, message: string, code?: string) {
    super(message)
    this.code = code
    this.name = name
  }

  override toString() {
    return `[${this.name}] ${this.message}`
  }
}

class UnsupportedOperatorError extends CustomError {
  constructor(operator: string) {
    super('UnsupportedOperatorError', `Unsupported operator: ${operator}`, 'UNSUPPORTED_OPERATOR')
  }
}

class UnsupportedFieldOperatorError extends CustomError {
  constructor(field: string, operator: string) {
    super(
      'UnsupportedFieldOperatorError',
      `Operation "${operator}" is not valid for field "${field}"`,
      'UNSUPPORTED_FIELD_OPERATOR_ERROR',
    )
  }
}

class UnsupportedMultipleValueOperatorError extends CustomError {
  constructor(operator: string) {
    super(
      'UnsupportedMultipleValueOperatorError',
      `The "${operator}" does not support multiple values`,
      'UNSUPPORTED_MULTIPLE_VALUE_OPERATOR_ERROR',
    )
  }
}

class UnsupportedFieldError extends CustomError {
  constructor(field: string) {
    super('UnsupportedFieldError', `The field "${field}" is not supported`, 'UNSUPPORTED_FIELD_ERROR')
  }
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
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

  if (type === 'ZodBoolean') {
    return ['eq', 'neq', 'in', 'nin']
  }

  return ['eq', 'neq', 'in', 'nin']
}

const getBaseType = (schema: ZodSchema): string => {
  if ('unwrap' in schema) {
    // biome-ignore lint/suspicious/noExplicitAny: unwrap is not typed
    return getBaseType((schema as any).unwrap())
  }

  // @ts-expect-error ???
  return schema._def.typeName
}

const getBaseSchema = (schema: ZodSchema): ZodSchema => {
  if ('unwrap' in schema) {
    // biome-ignore lint/suspicious/noExplicitAny: dynamic unwrap chain
    return getBaseSchema((schema as any).unwrap())
  }

  return schema
}

const isNullable = (schema: ZodSchema): boolean => {
  if (schema.isNullable?.()) {
    return true
  }

  return false
}

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

const urlSearchParamsToFilters = (params: URLSearchParams, { baseSchema }: Options) => {
  // biome-ignore lint/suspicious/noExplicitAny: schema shape is dynamic
  const filters: Record<string, any> = {}

  const rawParamGroups: Record<string, string[]> = {}

  for (const [rawKey, rawValue] of params.entries()) {
    if (!rawParamGroups[rawKey]) {
      rawParamGroups[rawKey] = []
    }

    rawParamGroups[rawKey].push(rawValue)
  }

  for (const [rawKey, rawValues] of Object.entries(rawParamGroups)) {
    const [fieldRaw, operatorRaw = 'eq'] = rawKey.split(':')
    const operator = operatorRaw as Operator
    const field = (fieldRaw as string).trim()

    if (!Operator[operator]) {
      throw new UnsupportedOperatorError(operator)
    }

    if (!(field in baseSchema.shape)) {
      throw new UnsupportedFieldError(field)
    }

    const schemaOps = new Set(getOperatorsForSchema(baseSchema.shape[field]))

    if (schemaOps.has(operator) === false) {
      throw new UnsupportedFieldOperatorError(field, operator)
    }

    const schema = baseSchema.shape[field]
    const type = getBaseType(schema)

    const values = rawValues
      .flatMap((v) => (operator === 'search' ? v : v.split(',')))
      .map((v) => (v === 'null' ? null : v.trim()))
      .filter((v) => v !== '')

    // biome-ignore lint/suspicious/noExplicitAny: coercion needs dynamic input
    const coerceValue = (value: any) => {
      if (value === null) return null

      if (type === 'ZodDate') {
        const date = new Date(value)

        return Number.isNaN(date.getTime()) ? value : date
      }

      if (type === 'ZodNumber') {
        const number = Number(value)

        return Number.isNaN(number) ? value : number
      }

      if (type === 'ZodBoolean') {
        return value === 'true'
      }

      if (type === 'ZodString' || type === 'ZodEnum') {
        return value.toString().trim()
      }

      return value
    }

    const parsedValues = values.map(coerceValue)

    if (!filters[field]) {
      filters[field] = {}
    }

    const deduped = [...new Set(parsedValues)]

    if (['eq', 'in'].includes(operator)) {
      const previousEq = structuredClone(filters[field].eq)
      const previousIn = structuredClone(filters[field].in) ?? []
      const nextIn = safeSort([...new Set([...previousIn, previousEq, ...deduped].filter(isDefined))], type)

      filters[field].eq = undefined

      if (nextIn.length > 1) {
        filters[field].in = nextIn
      } else {
        filters[field].eq = nextIn[0]
      }
    } else if (['neq', 'nin'].includes(operator)) {
      const previousNeq = structuredClone(filters[field].neq)
      const previousNin = structuredClone(filters[field].nin) ?? []
      const nextNin = safeSort([...new Set([...previousNin, previousNeq, ...deduped].filter(isDefined))], type)

      filters[field].neq = undefined

      if (nextNin.length > 1) {
        filters[field].nin = nextNin
      } else {
        filters[field].neq = nextNin[0]
      }
    } else {
      if (deduped.length > 1) {
        throw new UnsupportedMultipleValueOperatorError(operator)
      }

      filters[field][operator] = deduped[0]
    }
  }

  const filterSchema = buildFilterSchema(baseSchema)

  return filterSchema.parse(filters)
}

export { urlSearchParamsToFilters }
