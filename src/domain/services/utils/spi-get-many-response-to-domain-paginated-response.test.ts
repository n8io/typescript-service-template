import { z } from 'zod'
import { spiRepositoryGetManyResponseToDomainPaginatedResponse } from './spi-get-many-response-to-domain-paginated-response.ts'

describe('spiRepositoryGetManyResponseToDomainPaginatedResponse', () => {
  it('should convert the repository get many request to a paginated response', () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }]
    const itemsTotal = 3
    const pageSize = 10
    const page = 1

    const schema = z.object({
      id: z.number(),
    })

    const result = spiRepositoryGetManyResponseToDomainPaginatedResponse({
      items,
      itemsTotal,
      pageSize,
      page,
      schema,
    })

    expect(result).toEqual({
      hasMore: false,
      items,
      itemsTotal,
      page,
      pageSize,
      pagesTotal: 1,
    })
  })
})
