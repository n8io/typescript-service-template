import { exampleResource } from '../../domain/models/resource.ts'
import { exampleAuditRecord } from '../../models/audit-record.ts'
import * as Utils from '../../utils/transforms/domain-get-many-request-to-drizzle-query.ts'
import type { initDatabase } from './database/init.ts'
import { resourcesTable } from './database/schema.ts'
import { ResourceRepository } from './resource.ts'

vi.mock('drizzle-orm')

import * as Operations from 'drizzle-orm'

describe('ResourceRepository', () => {
  const mockDb = (overrides = {}) =>
    ({
      from: vi.fn().mockName('db.from').mockReturnThis(),
      insert: vi.fn().mockName('db.insert').mockReturnThis(),
      limit: vi.fn().mockName('db.limit').mockReturnThis(),
      offset: vi.fn().mockName('db.offset').mockResolvedValue([exampleResource()]),
      orderBy: vi.fn().mockName('db.orderBy').mockReturnThis(),
      returning: vi.fn().mockName('db.returning').mockResolvedValue([exampleResource()]),
      select: vi.fn().mockName('db.select').mockReturnThis(),
      set: vi.fn().mockName('db.set').mockReturnThis(),
      update: vi.fn().mockName('db.update').mockReturnThis(),
      values: vi.fn().mockName('db.values').mockReturnThis(),
      where: vi.fn().mockName('db.where').mockReturnThis(),
      ...overrides,
    }) as unknown as ReturnType<typeof initDatabase>

  describe('createOne', () => {
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

  describe('updateOne', () => {
    it('should call update with the expected parameters', async () => {
      const db = mockDb()
      const repository = new ResourceRepository({ db })
      const { gid } = exampleResource()
      const updateRequest = { name: 'UPDATED_NAME', updatedAt: new Date(), updatedBy: exampleAuditRecord() }

      // @ts-expect-error We don't need to mock the whole module
      const eqSpy = vi.spyOn(Operations, 'eq').mockReturnValue(undefined)

      await repository.updateOne(gid, updateRequest)

      expect(db.update).toHaveBeenCalledWith(resourcesTable)

      // @ts-expect-error Fix this type error
      expect(db.set).toHaveBeenCalledWith(updateRequest)

      // @ts-expect-error Fix this type error
      expect(db.where).toHaveBeenCalledWith(eqSpy(resourcesTable.gid, gid))

      // @ts-expect-error Fix this type error
      expect(db.returning).toHaveBeenCalled()
    })
  })
})
