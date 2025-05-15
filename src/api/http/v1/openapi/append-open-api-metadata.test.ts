import { z } from 'zod'
import { OPEN_API_DEFAULT_HEADERS, OPEN_API_DEFAULT_PAGINATION_PARAMS } from '../../models/openapi.ts'
import { appendOpenApiMetadata, RouteType } from './append-open-api-metadata.ts'

// Mocks
vi.mock('hono-openapi', async () => {
  return {
    describeRoute: vi.fn((options) => options),
    // biome-ignore lint/suspicious/noExplicitAny: ???
    resolver: (schema: any) => ({
      builder: () => ({ mock: `schema for ${schema.description || 'unknown'}` }),
    }),
  }
})

vi.mock('../../../../utils/validation.ts', () => ({
  validation: {
    gid: z.string().describe('GID'),
    string: z.string().describe('String'),
  },
}))

vi.mock('./copy.ts', () => ({
  copy: {
    sortable: (fields: string[]) => `Sortable by: ${fields.join(', ')}`,
  },
}))

const baseResponseSchema = z.object({
  id: z.string(),
})

const baseTags = ['test']

describe('appendOpenApiMetadata', () => {
  it('should handle CREATE_ONE route', () => {
    const requestSchema = z.object({ name: z.string() })

    const result = appendOpenApiMetadata({
      type: RouteType.CREATE_ONE,
      operationId: 'EntityCreateOne',
      requestSchema,
      responseSchema: baseResponseSchema,
      tags: baseTags,
      // biome-ignore lint/suspicious/noExplicitAny: ???
    }) as any

    expect(result.summary).toBe('Create One')
    expect(result.requestBody?.required).toBe(true)
    expect(result.parameters).toEqual(expect.arrayContaining([...OPEN_API_DEFAULT_HEADERS]))
  })

  it('should handle DELETE_ONE route', () => {
    const result = appendOpenApiMetadata({
      type: RouteType.DELETE_ONE,
      operationId: 'EntityDeleteOne',
      tags: baseTags,
      // biome-ignore lint/suspicious/noExplicitAny: ???
    }) as any

    expect(result.summary).toBe('Delete One')

    expect(result.parameters).toEqual(
      expect.arrayContaining([
        ...OPEN_API_DEFAULT_HEADERS,
        expect.objectContaining({
          name: 'gid',
          in: 'path',
          required: true,
        }),
      ]),
    )
  })

  it('should handle GET_ONE route', () => {
    const result = appendOpenApiMetadata({
      type: RouteType.GET_ONE,
      operationId: 'EntityGetOne',
      responseSchema: baseResponseSchema,
      tags: baseTags,
      // biome-ignore lint/suspicious/noExplicitAny: ???
    }) as any

    expect(result.summary).toBe('Get One')

    expect(result.parameters).toEqual(
      expect.arrayContaining([...OPEN_API_DEFAULT_HEADERS, expect.objectContaining({ name: 'gid' })]),
    )
  })

  it('should handle GET_MANY route with filtering, sorting, and pagination', () => {
    const requestSchema = z.object({
      name: z.string(),
      age: z.number(),
    })

    const result = appendOpenApiMetadata({
      type: RouteType.GET_MANY,
      operationId: 'EntityGetMany',
      defaultSortField: 'name',
      filterableFields: ['name', 'age'],
      sortableFields: ['name', 'age'],
      requestSchema,
      responseSchema: baseResponseSchema,
      tags: baseTags,
      // biome-ignore lint/suspicious/noExplicitAny: ???
    }) as any

    expect(result.summary).toBe('Get Many')
    expect(result.description).toContain('Sortable by')

    expect(result.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'name', in: 'query' }),
        expect.objectContaining({ name: 'age', in: 'query' }),
        expect.objectContaining({ name: 'sort', example: 'name' }),
      ]),
    )
  })

  it('should handle UPDATE_ONE route', () => {
    const requestSchema = z.object({ name: z.string() })

    const result = appendOpenApiMetadata({
      type: RouteType.UPDATE_ONE,
      operationId: 'EntityUpdateOne',
      requestSchema,
      responseSchema: baseResponseSchema,
      tags: baseTags,
      // biome-ignore lint/suspicious/noExplicitAny: ???
    }) as any

    expect(result.summary).toBe('Update One')
    expect(result.requestBody).toBeDefined()
    expect(result.parameters).toEqual(expect.arrayContaining([...OPEN_API_DEFAULT_HEADERS]))
  })

  it('should handle route with custom description', () => {
    const customDescription = 'Custom route description'
    const result = appendOpenApiMetadata({
      type: RouteType.GET_ONE,
      operationId: 'EntityGetOne',
      description: customDescription,
      responseSchema: baseResponseSchema,
      tags: baseTags,
      // biome-ignore lint/suspicious/noExplicitAny: ???
    }) as any

    expect(result.description).toBe(customDescription)
  })

  it('should handle route without response schema', () => {
    const result = appendOpenApiMetadata({
      type: RouteType.DELETE_ONE,
      operationId: 'EntityDeleteOne',
      tags: baseTags,
      // biome-ignore lint/suspicious/noExplicitAny: ???
    }) as any

    expect(result.responses).toEqual({
      204: {
        description: 'No content',
      },
    })
  })

  it('should handle route with response schema', () => {
    const result = appendOpenApiMetadata({
      type: RouteType.GET_ONE,
      operationId: 'EntityGetOne',
      responseSchema: baseResponseSchema,
      tags: baseTags,
      // biome-ignore lint/suspicious/noExplicitAny: ???
    }) as any

    expect(result.responses).toEqual({
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: {
              builder: expect.any(Function),
              validator: expect.any(Function),
            },
          },
        },
      },
    })
  })

  it('should throw error for unknown route type', () => {
    expect(() =>
      appendOpenApiMetadata({
        // biome-ignore lint/suspicious/noExplicitAny: ???
        type: 'unknown' as any,
        operationId: 'EntityGetOne',
        responseSchema: baseResponseSchema,
        tags: baseTags,
      }),
    ).toThrow('Unhandled route type: unknown')
  })

  it('should handle GET_MANY route with empty filterable and sortable fields', () => {
    const requestSchema = z.object({})

    const result = appendOpenApiMetadata({
      type: RouteType.GET_MANY,
      operationId: 'EntityGetMany',
      defaultSortField: 'name',
      filterableFields: [],
      sortableFields: [],
      requestSchema,
      responseSchema: baseResponseSchema,
      tags: baseTags,
      // biome-ignore lint/suspicious/noExplicitAny: ???
    }) as any

    expect(result.parameters).toEqual(
      expect.arrayContaining([
        ...OPEN_API_DEFAULT_HEADERS,
        ...OPEN_API_DEFAULT_PAGINATION_PARAMS,
        expect.objectContaining({ name: 'sort' }),
      ]),
    )
  })
})
