import { type DescribeRouteOptions, describeRoute } from 'hono-openapi'
import { resolver } from 'hono-openapi/zod'
import type { ZodObject } from 'zod'
import { validation } from '../../../../utils/validation.ts'
import { OPEN_API_DEFAULT_HEADERS, OPEN_API_DEFAULT_PAGINATION_PARAMS } from '../../models/openapi.ts'
import { copy } from './copy.ts'

const RouteType = {
  CREATE_ONE: 'createOne',
  DELETE_ONE: 'deleteOne',
  GET_MANY: 'getMany',
  GET_ONE: 'getOne',
  UPDATE_ONE: 'updateOne',
} as const

type RouteType = (typeof RouteType)[keyof typeof RouteType]

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type AnyZodObject = ZodObject<any>

const routeTypeToSummary: Record<RouteType, string> = {
  createOne: 'Create One',
  deleteOne: 'Delete One',
  getMany: 'Get Many',
  getOne: 'Get One',
  updateOne: 'Update One',
}

const toResponse = (schemaResponse: AnyZodObject | undefined) => {
  if (!schemaResponse) {
    return {
      204: {
        description: 'No content',
      },
    }
  }

  return {
    200: {
      description: 'Success',
      content: {
        'application/json': {
          schema: resolver(schemaResponse),
        },
      },
    },
  }
}

type BaseRoute = {
  description?: string
  parameters?: unknown[]
  responseSchema?: AnyZodObject
  tags: string[]
}

type CreateOneRoute = BaseRoute & {
  operationId: `${string}${'CreateOne'}`
  requestSchema: AnyZodObject
  responseSchema: AnyZodObject
  type: 'createOne'
}

type DeleteOneRoute = BaseRoute & {
  operationId: `${string}${'DeleteOne'}`
  type: 'deleteOne'
}

type GetManyRoute = BaseRoute & {
  defaultSortField: string
  filterableFields: string[]
  operationId: `${string}${'GetMany'}`
  requestSchema: AnyZodObject
  responseSchema: AnyZodObject
  sortableFields: string[]
  type: 'getMany'
}

type GetOneRoute = BaseRoute & {
  operationId: `${string}${'GetOne'}`
  responseSchema: AnyZodObject
  type: 'getOne'
}

type UpdateOneRoute = BaseRoute & {
  operationId: `${string}${'UpdateOne'}`
  requestSchema: AnyZodObject
  responseSchema: AnyZodObject
  type: 'updateOne'
}

type RouteConfig = CreateOneRoute | DeleteOneRoute | GetManyRoute | GetOneRoute | UpdateOneRoute

const appendOpenApiMetadata = (config: RouteConfig) => {
  const { description, operationId, responseSchema, tags, type } = config

  let actualDescription: DescribeRouteOptions['description'] = description
  let actualParameters: DescribeRouteOptions['parameters'] = undefined
  let requestBody: DescribeRouteOptions['requestBody'] = undefined
  let actualResponses: DescribeRouteOptions['responses'] = toResponse(responseSchema)

  switch (type) {
    case 'createOne': {
      const { requestSchema } = config

      actualParameters = [...OPEN_API_DEFAULT_HEADERS]

      requestBody = {
        required: true,
        content: {
          'application/json': {
            // @ts-expect-error Fix this type error
            schema: resolver(requestSchema).builder().schema,
          },
        },
      }

      break
    }
    case 'deleteOne': {
      actualParameters = [
        ...OPEN_API_DEFAULT_HEADERS,
        {
          name: 'gid',
          in: 'path',
          description: 'The globally unique identifier',
          required: true,
          ...resolver(validation.gid).builder(),
        },
      ]

      actualResponses = toResponse(undefined)

      break
    }
    case 'getOne': {
      actualParameters = [
        ...OPEN_API_DEFAULT_HEADERS,
        {
          name: 'gid',
          in: 'path',
          description: 'The globally unique identifier',
          required: true,
          ...resolver(validation.gid).builder(),
        },
      ]

      break
    }
    case 'getMany': {
      const { defaultSortField, filterableFields, requestSchema, sortableFields } = config

      actualDescription = copy.sortable(sortableFields)

      actualParameters = [
        ...OPEN_API_DEFAULT_HEADERS,
        ...filterableFields.toSorted().map((field) => ({
          in: 'query',
          name: field,
          ...resolver(requestSchema.shape[field]).builder(),
        })),
        ...OPEN_API_DEFAULT_PAGINATION_PARAMS,
        {
          description: 'Which field(s) and directions to [sort](#description/sorting) the results by',
          example: defaultSortField,
          in: 'query',
          name: 'sort',
          ...resolver(validation.string).builder(),
        },
      ]

      break
    }
    case 'updateOne': {
      const { requestSchema } = config

      actualParameters = [...OPEN_API_DEFAULT_HEADERS]

      requestBody = {
        content: {
          'application/json': {
            // @ts-expect-error Fix this type error
            schema: resolver(requestSchema).builder().schema,
          },
        },
      }

      break
    }

    default:
      throw new Error(`Unhandled route type: ${type}`)
  }

  return describeRoute({
    summary: routeTypeToSummary[type],
    description: actualDescription,
    operationId,
    parameters: actualParameters,
    requestBody,
    responses: actualResponses,
    tags,
  })
}

export { RouteType, appendOpenApiMetadata }
