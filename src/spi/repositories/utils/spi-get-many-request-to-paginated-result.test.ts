import type { PgTableWithColumns } from 'drizzle-orm/pg-core'
import { exampleResource, schemaResource } from '../../../domain/models/resource.ts'
import type { initDatabase } from '../database/init.ts'
import * as Utils from './domain-get-many-request-to-drizzle-query.ts'
import { spiGetManyRequestToPaginatedResult } from './spi-get-many-request-to-paginated-result.ts'

vi.mock('./domain-get-many-request-to-drizzle-query.ts')

describe('spiGetManyRequestToPaginatedResult', () => {
  it('should convert the get many request to a paginated result', async () => {
    const conditions = {
      limit: 1,
      offset: 0,
      orderBy: [],
      where: undefined,
    }

    vi.spyOn(Utils, 'domainGetManyRequestToDrizzleQuery').mockReturnValue(conditions)

    const request = {
      filters: {
        FIELD: {
          eq: 'VALUE',
        },
      },
      pagination: {
        page: 1,
        pageSize: 1,
      },
    }

    const mockDbResource = { ...exampleResource(), id: 'ID' }
    const mockDbResults = [{ ...mockDbResource, count: 1 }]

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockResolvedValue(mockDbResults),
    } as unknown as ReturnType<typeof initDatabase>

    const inputs = {
      db: mockDb,
      request,
      schema: schemaResource,
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      table: {} as PgTableWithColumns<any>,
    }

    const result = await spiGetManyRequestToPaginatedResult(inputs)

    expect(mockDb.select).toHaveBeenCalledWith(expect.objectContaining({ count: expect.anything() }))

    // @ts-expect-error ???
    expect(mockDb.from).toHaveBeenCalledWith(inputs.table)
    // @ts-expect-error ???
    expect(mockDb.where).toHaveBeenCalledWith(conditions.where)
    // @ts-expect-error ???
    expect(mockDb.orderBy).toHaveBeenCalledWith(...conditions.orderBy)
    // @ts-expect-error ???
    expect(mockDb.limit).toHaveBeenCalledWith(conditions.limit)
    // @ts-expect-error ???
    expect(mockDb.offset).toHaveBeenCalledWith(conditions.offset)

    expect(result).toEqual({
      items: schemaResource.array().parse(mockDbResults),
      itemsTotal: mockDbResults.length,
    })
  })
})
