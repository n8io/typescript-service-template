import { z } from 'zod'
import { OPEN_API_DEFAULT_HEADERS } from '../../models/openapi.ts'
import { RouteType, appendOpenApiMetadata } from './append-open-api-metadata.ts'

// Mocks
vi.mock('hono-openapi', async () => {
  return {
    describeRoute: vi.fn((options) => options),
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
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
      schemaResponse: baseResponseSchema,
      tags: baseTags,
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    }) as any

    console.dir(result, { depth: 10 })

    expect(result.summary).toBe('Create One')
    expect(result.requestBody?.required).toBe(true)
    expect(result.parameters).toEqual(expect.arrayContaining([...OPEN_API_DEFAULT_HEADERS]))
  })

  it('should handle DELETE_ONE route', () => {
    const result = appendOpenApiMetadata({
      type: RouteType.DELETE_ONE,
      operationId: 'EntityDeleteOne',
      schemaResponse: baseResponseSchema,
      tags: baseTags,
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
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
      schemaResponse: baseResponseSchema,
      tags: baseTags,
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
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
      schemaResponse: baseResponseSchema,
      tags: baseTags,
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
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
      schemaResponse: baseResponseSchema,
      tags: baseTags,
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    }) as any

    expect(result.summary).toBe('Update One')
    expect(result.requestBody).toBeDefined()
    expect(result.parameters).toEqual(expect.arrayContaining([...OPEN_API_DEFAULT_HEADERS]))
  })
})
