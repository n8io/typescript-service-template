import { z } from 'zod'
import { exampleAuditRecord } from '../../../models/audit-record.ts'
import { DomainNotFoundError } from '../../../models/custom-error.ts'
import { schemaEntity } from '../../../models/entity.ts'
import { gid } from '../../../utils/generators/gid.ts'
import { validation } from '../../../utils/validation.ts'
import type { PaginatedResponse } from '../../models/pagination.ts'
import { toPaginatedResponseSchema } from '../../models/pagination.ts'
import { schemaDomainGetManyRequest } from '../../models/request.ts'
import { BaseService } from './base-service.ts'

const mockGid = gid()

const schemaTestEntity = schemaEntity.extend({
  name: z.string(),
})

const exampleTestEntity = (overrides?: Partial<z.infer<typeof schemaTestEntity>>) =>
  ({
    createdAt: new Date(),
    createdBy: exampleAuditRecord({ type: 'USER' }),
    gid: mockGid,
    name: 'Test Entity',
    updatedAt: new Date(),
    updatedBy: exampleAuditRecord({ type: 'USER' }),
    ...overrides,
  }) as z.infer<typeof schemaTestEntity>

type TestEntity = z.infer<typeof schemaTestEntity>

// Mock implementation of BaseService for testing
class TestService extends BaseService<TestEntity> {
  protected readonly propsMeta: Record<'create' | 'filter' | 'sort' | 'update', (keyof TestEntity)[]> = {
    create: ['name'],
    filter: ['gid', 'name'],
    sort: ['gid', 'name'],
    update: ['name', 'updatedBy'],
  }

  public readonly schemas = {
    core: schemaTestEntity,
    request: {
      createOne: schemaTestEntity.pick({
        name: true,
        createdBy: true,
      }),
      getMany: schemaTestEntity,
      getOne: validation.gid,
      updateOne: schemaTestEntity.pick({
        name: true,
        updatedBy: true,
      }),
    },
    response: {
      getMany: toPaginatedResponseSchema(schemaTestEntity, exampleTestEntity()) as z.ZodType<
        PaginatedResponse<TestEntity>
      >,
      getOne: schemaTestEntity,
    },
  }
}

describe('BaseService', () => {
  const mockEntity: TestEntity = {
    createdAt: new Date(),
    createdBy: exampleAuditRecord({ type: 'USER' }),
    gid: mockGid,
    name: 'Test Entity',
    updatedAt: new Date(),
    updatedBy: exampleAuditRecord({ type: 'USER' }),
  }

  const mockRepository = {
    createOne: vi.fn(),
    deleteMany: vi.fn(),
    getMany: vi.fn(),
    updateMany: vi.fn(),
  }

  let service: TestService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new TestService({ repository: mockRepository })
  })

  describe('createOne', () => {
    it('should create an entity and return it', async () => {
      const createRequest = {
        name: 'New Entity',
        createdBy: exampleAuditRecord({ type: 'USER' }),
      }

      mockRepository.createOne.mockResolvedValue(mockEntity)
      mockRepository.getMany.mockResolvedValue({ items: [mockEntity], itemsTotal: 1 })

      const result = await service.createOne(createRequest)

      expect(mockRepository.createOne).toHaveBeenCalledWith({
        ...createRequest,
        gid: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        updatedBy: createRequest.createdBy,
      })

      expect(result).toEqual(mockEntity)
    })

    it('should throw an error if the request is invalid', async () => {
      const invalidRequest = {
        name: 123, // Invalid type
        createdBy: exampleAuditRecord({ type: 'USER' }),
      }

      await expect(
        // @ts-expect-error - Invalid request
        service.createOne(invalidRequest),
      ).rejects.toThrow()
    })
  })

  describe('getMany', () => {
    it('should return a paginated response of entities', async () => {
      const query = {
        pagination: {
          page: 1,
          pageSize: 10,
        },
      }

      mockRepository.getMany.mockResolvedValue({ items: [mockEntity], itemsTotal: 1 })

      const result = await service.getMany(query)

      expect(mockRepository.getMany).toHaveBeenCalledWith(schemaDomainGetManyRequest.parse(query))
      expect(result).toEqual({
        items: [mockEntity],
        itemsTotal: 1,
        page: 1,
        pageSize: 10,
        pagesTotal: 1,
        hasMore: false,
      })
    })

    it('should throw an error if the query is invalid', async () => {
      const invalidQuery = {
        pagination: {
          page: 'invalid', // Invalid type
          pageSize: 10,
        },
      }

      await expect(
        service.getMany(invalidQuery as unknown as z.infer<typeof schemaDomainGetManyRequest>),
      ).rejects.toThrow()
    })
  })

  describe('getOne', () => {
    it('should return an entity by gid', async () => {
      mockRepository.getMany.mockResolvedValue({ items: [mockEntity], itemsTotal: 1 })

      const result = await service.getOne(mockGid)

      expect(mockRepository.getMany).toHaveBeenCalledWith({
        filters: {
          gid: {
            eq: mockGid,
          },
        },
        pagination: {
          page: 1,
          pageSize: 1,
        },
      })

      expect(result).toEqual(mockEntity)
    })

    it('should throw DomainNotFoundError if entity is not found', async () => {
      mockRepository.getMany.mockResolvedValue({ items: [], itemsTotal: 0 })

      await expect(service.getOne(mockGid)).rejects.toThrow(DomainNotFoundError)
    })
  })

  describe('updateOne', () => {
    it('should update an entity and return the updated entity', async () => {
      const updateRequest = {
        name: 'Updated Entity',
        updatedBy: exampleAuditRecord({ type: 'USER' }),
      }

      const updatedEntity = {
        ...mockEntity,
        name: updateRequest.name,
        updatedBy: updateRequest.updatedBy,
      }

      mockRepository.updateMany.mockResolvedValue(undefined)
      mockRepository.getMany.mockResolvedValue({ items: [updatedEntity], itemsTotal: 1 })

      const result = await service.updateOne(mockGid, updateRequest)

      expect(mockRepository.updateMany).toHaveBeenCalledWith(
        [
          {
            name: updateRequest.name,
            gid: mockGid,
          },
        ],
        updateRequest.updatedBy,
        expect.any(Date),
      )

      expect(result).toEqual(updatedEntity)
    })

    it('should throw an error if the update request is invalid', async () => {
      const invalidUpdate = {
        name: 123, // Invalid type
        updatedBy: exampleAuditRecord({ type: 'USER' }),
      }

      await expect(
        service.updateOne(
          mockGid,
          // @ts-expect-error - Invalid request
          invalidUpdate,
        ),
      ).rejects.toThrow()
    })
  })
})
