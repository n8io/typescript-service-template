import { exampleResource } from '../../domain/models/resource.ts'
import * as Utils from '../../utils/transforms/domain-get-many-request-to-drizzle-query.ts'
import type { initDatabase } from './database/init.ts'
import { resourcesTable } from './database/schema.ts'
import { ResourceRepository } from './resource.ts'

describe('ResourceRepository', () => {
  describe('createOne', () => {
    const mockDb = (overrides = {}) =>
      ({
        from: vi.fn().mockName('db.from').mockReturnThis(),
        insert: vi.fn().mockName('db.insert').mockReturnThis(),
        limit: vi.fn().mockName('db.limit').mockReturnThis(),
        offset: vi.fn().mockName('db.offset').mockResolvedValue([exampleResource()]),
        orderBy: vi.fn().mockName('db.orderBy').mockReturnThis(),
        returning: vi.fn().mockName('db.returning').mockResolvedValue([exampleResource()]),
        select: vi.fn().mockName('db.select').mockReturnThis(),
        values: vi.fn().mockName('db.values').mockReturnThis(),
        where: vi.fn().mockName('db.where').mockReturnThis(),
        ...overrides,
      }) as unknown as ReturnType<typeof initDatabase>

    const spiRequest = exampleResource()

    it('should have a method called createOne', () => {
      const db = mockDb()
      const repository = new ResourceRepository({ db })

      expect(repository.createOne).toBeDefined()
    })

    it('should return a resource object when createOne is called', async () => {
      const db = mockDb()
      const repository = new ResourceRepository({ db })
      const resource = await repository.createOne(spiRequest)

      expect(resource).toBeDefined()
    })

    it('should send the expected object to the db', async () => {
      const db = mockDb()
      const repository = new ResourceRepository({ db })

      await repository.createOne(spiRequest)

      expect(db.insert).toHaveBeenCalledWith(resourcesTable)

      // @ts-expect-error ???
      expect(db.values).toHaveBeenCalledWith({
        ...spiRequest,
        id: expect.any(String),
      })
    })
  })

  describe('getMany', () => {
    const mockDb = (overrides = {}) =>
      ({
        from: vi.fn().mockName('db.from').mockReturnThis(),
        insert: vi.fn().mockName('db.insert').mockReturnThis(),
        limit: vi.fn().mockName('db.limit').mockReturnThis(),
        offset: vi.fn().mockName('db.offset').mockResolvedValue([exampleResource()]),
        orderBy: vi.fn().mockName('db.orderBy').mockReturnThis(),
        returning: vi.fn().mockName('db.returning').mockReturnThis(),
        select: vi.fn().mockName('db.select').mockReturnThis(),
        values: vi.fn().mockName('db.values').mockReturnThis(),
        where: vi.fn().mockName('db.where').mockReturnThis(),
        ...overrides,
      }) as unknown as ReturnType<typeof initDatabase>

    const spiRequest = {
      pagination: {
        page: 1,
        pageSize: 1,
      },
    }

    it('should have a method called getMany', () => {
      const db = mockDb()
      const repository = new ResourceRepository({ db })

      expect(repository.getMany).toBeDefined()
    })

    it('should return a resource object when getMany is called', async () => {
      const db = mockDb()
      const repository = new ResourceRepository({ db })
      const results = await repository.getMany(spiRequest)

      const {
        items: [resource],
      } = results

      expect(resource).toBeDefined()
    })

    it('should call select twice, once to count and once to get the items', async () => {
      const db = mockDb()
      const repository = new ResourceRepository({ db })

      await repository.getMany(spiRequest)

      expect(db.select).toHaveBeenCalledTimes(2)
    })

    it('should call select twice, once to count and once to get the items', async () => {
      const db = mockDb()
      const repository = new ResourceRepository({ db })

      await repository.getMany(spiRequest)

      expect(db.select).toHaveBeenCalledTimes(2)
    })

    it('should call domainGetManyRequestToDrizzleQuery with the expected parameters', async () => {
      const db = mockDb()
      const repository = new ResourceRepository({ db })

      const domainGetManyRequestToDrizzleQuerySpy = vi
        .spyOn(Utils, 'domainGetManyRequestToDrizzleQuery')
        .mockReturnValue({
          limit: 10,
          offset: 0,
          orderBy: [],
          where: undefined,
        })

      await repository.getMany(spiRequest)

      expect(domainGetManyRequestToDrizzleQuerySpy).toHaveBeenCalledWith(spiRequest, resourcesTable)
    })
  })
})
