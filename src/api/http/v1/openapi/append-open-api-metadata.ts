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
  [RouteType.CREATE_ONE]: 'Create One',
  [RouteType.DELETE_ONE]: 'Delete One',
  [RouteType.GET_MANY]: 'Get Many',
  [RouteType.GET_ONE]: 'Get One',
  [RouteType.UPDATE_ONE]: 'Update One',
} as const

type BaseRoute = {
  description?: string
  parameters?: unknown[]
  schemaResponse: AnyZodObject
  tags: string[]
}

type CreateOneRoute = Prettify<
  BaseRoute & {
    operationId: `${string}${'CreateOne'}`
    requestSchema: AnyZodObject
    type: Extract<RouteType, 'createOne'>
  }
>

type DeleteOneRoute = Prettify<
  BaseRoute & {
    operationId: `${string}${'DeleteOne'}`
    type: Extract<RouteType, 'deleteOne'>
  }
>

type GetManyRoute = Prettify<
  BaseRoute & {
    defaultSortField: string
    filterableFields: string[]
    operationId: `${string}${'GetMany'}`
    parameters?: unknown[]
    requestSchema: AnyZodObject
    sortableFields: string[]
    type: Extract<RouteType, 'getMany'>
  }
>

type GetOneRoute = Prettify<
  BaseRoute & {
    operationId: `${string}${'GetOne'}`
    type: Extract<RouteType, 'getOne'>
  }
>

type UpdateOneRoute = Prettify<
  BaseRoute & {
    operationId: `${string}${'UpdateOne'}`
    requestSchema: AnyZodObject
    type: Extract<RouteType, 'updateOne'>
  }
>

type RouteConfig = CreateOneRoute | DeleteOneRoute | GetManyRoute | GetOneRoute | UpdateOneRoute

const appendOpenApiMetadata = ({ description, operationId, schemaResponse, tags, type, ...rest }: RouteConfig) => {
  let actualDescription: DescribeRouteOptions['description'] = description
  let actualParameters: DescribeRouteOptions['parameters'] = undefined
  let requestBody: DescribeRouteOptions['requestBody'] = undefined

  if (type === RouteType.CREATE_ONE) {
    const { requestSchema: schemaRequest } = rest as CreateOneRoute

    actualParameters = [...OPEN_API_DEFAULT_HEADERS]

    requestBody = {
      required: true,
      content: {
        'application/json': resolver(schemaRequest).builder(),
      },
    }
  } else if (type === RouteType.DELETE_ONE || type === RouteType.GET_ONE) {
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
  } else if (type === RouteType.GET_MANY) {
    const { defaultSortField, filterableFields, requestSchema: schemaRequest, sortableFields } = rest as GetManyRoute

    actualDescription = copy.sortable(sortableFields)

    actualParameters = [
      ...OPEN_API_DEFAULT_HEADERS,
      ...filterableFields.toSorted().map((field) => ({
        in: 'query',
        name: field,
        ...resolver(schemaRequest.shape[field]).builder(),
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
  } else if (type === RouteType.UPDATE_ONE) {
    const { requestSchema: schemaRequest } = rest as UpdateOneRoute

    actualParameters = [...OPEN_API_DEFAULT_HEADERS]

    requestBody = {
      content: {
        'application/json': resolver(schemaRequest).builder(),
      },
    }
  }

  return describeRoute({
    summary: routeTypeToSummary[type],
    description: actualDescription,
    operationId,
    parameters: actualParameters,
    requestBody,
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: resolver(schemaResponse),
          },
        },
      },
    },
    tags,
  })
}

export { RouteType, appendOpenApiMetadata }
