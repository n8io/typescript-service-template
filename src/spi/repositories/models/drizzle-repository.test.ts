import * as DrizzleOrm from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'
import { z } from 'zod'
import { exampleAuditRecord } from '../../../models/audit-record.ts'
import type { initDatabase } from '../database/init.ts'
import * as DomainUpdatesToDrizzleQuery from '../utils/domain-updates-to-drizzle-query.ts'
import * as Utils from '../utils/spi-get-many-request-to-paginated-result.ts'
import { DrizzleRepository } from './drizzle-repository.ts'

vi.mock('../utils/domain-updates-to-drizzle-query.ts')
vi.mock('drizzle-orm')

import * as Operations from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'

// Test schema and table setup
const testSchema = z.object({
  gid: z.string(),
  name: z.string(),
  timeZone: z.string().nullable(),
  createdAt: z.date(),
  createdBy: z.record(z.unknown()),
  updatedAt: z.date(),
  updatedBy: z.record(z.unknown()),
})

type TestEntity = z.infer<typeof testSchema>

const exampleEntity = (overrides: Partial<TestEntity> = {}): TestEntity => ({
  gid: 'test-gid',
  name: 'Test Entity',
  timeZone: 'UTC',
  createdAt: new Date(),
  createdBy: { id: 'user-1' },
  updatedAt: new Date(),
  updatedBy: { id: 'user-1' },
  ...overrides,
})

describe('DrizzleRepository', () => {
  const mockDb = (overrides = {}) =>
    ({
      delete: vi.fn().mockName('db.delete').mockReturnThis(),
      execute: vi.fn().mockName('db.execute').mockReturnThis(),
      from: vi.fn().mockName('db.from').mockReturnThis(),
      insert: vi.fn().mockName('db.insert').mockReturnThis(),
      limit: vi.fn().mockName('db.limit').mockReturnThis(),
      offset: vi.fn().mockName('db.offset').mockResolvedValue([exampleEntity()]),
      orderBy: vi.fn().mockName('db.orderBy').mockReturnThis(),
      returning: vi.fn().mockName('db.returning').mockResolvedValue([exampleEntity()]),
      select: vi.fn().mockName('db.select').mockReturnThis(),
      set: vi.fn().mockName('db.set').mockReturnThis(),
      update: vi.fn().mockName('db.update').mockReturnThis(),
      values: vi.fn().mockName('db.values').mockReturnThis(),
      where: vi.fn().mockName('db.where').mockReturnThis(),
      ...overrides,
    }) as unknown as ReturnType<typeof initDatabase>

  const mockTable = {
    gid: { name: 'gid' },
  } as unknown as PgTable

  type Dependencies = {
    db: ReturnType<typeof initDatabase>
  }

  // Test repository class
  class TestDrizzleRepository extends DrizzleRepository<typeof testSchema, typeof mockTable, TestEntity> {
    constructor(dependencies: Dependencies) {
      super(dependencies, testSchema, mockTable)
    }
  }

  describe('createOne', () => {
    const spiRequest = exampleEntity()

    it('should have a method called createOne', () => {
      const db = mockDb()
      const repository = new TestDrizzleRepository({ db })

      expect(repository.createOne).toBeDefined()
    })

    it('should return a resource object when createOne is called', async () => {
      const db = mockDb()
      const repository = new TestDrizzleRepository({ db })
      const resource = await repository.createOne(spiRequest)

      expect(resource).toBeDefined()
    })

    it('should send the expected object to the db', async () => {
      const db = mockDb()
      const repository = new TestDrizzleRepository({ db })

      await repository.createOne(spiRequest)

      expect(db.insert).toHaveBeenCalledWith(mockTable)

      // @ts-expect-error ???
      expect(db.values).toHaveBeenCalledWith({
        ...spiRequest,
        id: expect.any(String),
      })
    })
  })

  describe('deleteMany', () => {
    it('should have a method called deleteMany', () => {
      const db = mockDb()
      const repository = new TestDrizzleRepository({ db })

      expect(repository.deleteMany).toBeDefined()
    })

    it('should call delete with the expected parameters', async () => {
      // @ts-expect-error We don't need to mock the whole module
      const inArraySpy = vi.spyOn(Operations, 'inArray').mockReturnValue(undefined)

      const db = mockDb()
      const repository = new TestDrizzleRepository({ db })
      const gids = ['GID_1', 'GID_2']

      await repository.deleteMany(gids)

      expect(db.delete).toHaveBeenCalledWith(mockTable)

      // @ts-expect-error ???
      expect(db.where).toHaveBeenCalledWith(inArraySpy(mockTable.gid, gids))
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
      const repository = new TestDrizzleRepository({ db })

      expect(repository.getMany).toBeDefined()
    })

    it('should return a resource object when getMany is called', async () => {
      const spiGetManyRequestToPaginatedResultSpy = vi
        .spyOn(Utils, 'spiGetManyRequestToPaginatedResult')
        .mockResolvedValue({
          items: [exampleEntity()],
          itemsTotal: 1,
        })

      const db = mockDb()
      const repository = new TestDrizzleRepository({ db })

      await repository.getMany(spiRequest)

      expect(spiGetManyRequestToPaginatedResultSpy).toHaveBeenCalledWith({
        db,
        request: spiRequest,
        schema: testSchema,
        table: mockTable,
      })
    })
  })

  describe('updateMany', () => {
    const updatedBy = exampleAuditRecord()

    describe('when no updates are provided', () => {
      beforeEach(() => {
        vi.spyOn(DomainUpdatesToDrizzleQuery, 'domainUpdatesToDrizzleQuery').mockReturnValue(undefined)
      })

      it('should NOT execute a query', async () => {
        const db = mockDb()
        const repository = new TestDrizzleRepository({ db })
        const { gid } = exampleEntity()

        const updateRequests: Parameters<typeof repository.updateMany>[0] = [
          {
            gid,
            name: 'UPDATED_NAME',
            updatedAt: new Date(),
            updatedBy: exampleAuditRecord(),
          },
        ]

        await repository.updateMany(updateRequests, updatedBy, new Date())

        expect(db.execute).not.toHaveBeenCalled()
      })
    })

    describe('when updates are provided', () => {
      const mockTableName = 'mock_table'

      const mockQuery = {
        params: {},
        sql: 'SELECT * FROM mock_table',
      } as unknown as SQL

      beforeEach(() => {
        vi.spyOn(DrizzleOrm, 'getTableName').mockReturnValue(mockTableName)
        vi.spyOn(DomainUpdatesToDrizzleQuery, 'domainUpdatesToDrizzleQuery').mockReturnValue(mockQuery)
      })

      it('should execute a query', async () => {
        const db = mockDb()
        const repository = new TestDrizzleRepository({ db })
        const { gid } = exampleEntity()

        const updateRequests: Parameters<typeof repository.updateMany>[0] = [
          {
            gid,
            name: 'UPDATED_NAME',
          },
        ]

        await repository.updateMany(updateRequests, updatedBy, new Date())

        expect(DomainUpdatesToDrizzleQuery.domainUpdatesToDrizzleQuery).toHaveBeenCalledWith(
          mockTableName,
          updateRequests,
          updatedBy,
          expect.any(Date),
        )

        expect(db.execute).toHaveBeenCalledWith(mockQuery)
      })
    })
  })
})
