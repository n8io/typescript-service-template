import { z } from 'zod'
import { exampleAuditRecord, schemaAuditRecord } from '../../../models/audit-record.ts'
import { DomainNotFoundError } from '../../../models/custom-error.ts'
import { validation } from '../../../utils/validation.ts'
import { schemaDomainGetManyRequest } from '../../models/request.ts'
import { BaseService } from './base-service.ts'

type TestEntity = {
  gid: string
  name: string
  updatedBy?: {
    type: 'SYSTEM' | 'USER'
    system?: string
    gid?: string
    email?: string
  }
}

// Mock implementation of BaseService for testing
class TestService extends BaseService<TestEntity> {
  protected readonly propsMeta: Record<'create' | 'filter' | 'sort' | 'update', (keyof TestEntity)[]> = {
    create: ['name'],
    filter: ['gid', 'name'],
    sort: ['gid', 'name'],
    update: ['name', 'updatedBy'],
  }

  public readonly schemas = {
    core: z.object({
      gid: z.string(),
      name: z.string(),
      updatedBy: schemaAuditRecord.optional(),
    }),
    request: {
      createOne: z.object({
        createdBy: schemaAuditRecord,
        name: z.string(),
      }),
      getMany: z.object({
        gid: validation.gid,
        name: z.string(),
      }),
      getOne: z.string(),
      updateOne: z.object({
        name: z.string(),
        updatedBy: schemaAuditRecord,
      }),
    },
    response: {
      getMany: z.object({
        items: z.array(z.object({ gid: z.string(), name: z.string() })),
        itemsTotal: z.number(),
        page: z.number(),
        pageSize: z.number(),
        pagesTotal: z.number(),
        hasMore: z.boolean(),
      }),
      getOne: z.object({
        gid: z.string(),
        name: z.string(),
        updatedBy: z
          .object({
            type: z.enum(['SYSTEM', 'USER']),
            system: z.string().optional(),
            gid: z.string().optional(),
            email: z.string().optional(),
          })
          .optional(),
      }),
    },
  }
}

describe('BaseService', () => {
  const mockEntity: TestEntity = {
    gid: 'test-gid',
    name: 'Test Entity',
  }

  const mockRepository = {
    createOne: vi.fn(),
    getMany: vi.fn(),
    updateOne: vi.fn(),
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

      const result = await service.getOne('test-gid')

      expect(mockRepository.getMany).toHaveBeenCalledWith({
        filters: {
          gid: {
            eq: 'test-gid',
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

      await expect(service.getOne('non-existent-gid')).rejects.toThrow(DomainNotFoundError)
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

      mockRepository.updateOne.mockResolvedValue(updatedEntity)
      mockRepository.getMany.mockResolvedValue({ items: [updatedEntity], itemsTotal: 1 })

      const result = await service.updateOne('test-gid', updateRequest)

      expect(mockRepository.updateOne).toHaveBeenCalledWith('test-gid', {
        ...updateRequest,
        updatedAt: expect.any(Date),
      })

      expect(result).toEqual(updatedEntity)
    })

    it('should throw an error if the update request is invalid', async () => {
      const invalidUpdate = {
        name: 123, // Invalid type
        updatedBy: exampleAuditRecord({ type: 'USER' }),
      }

      await expect(
        service.updateOne(
          'test-gid',
          // @ts-expect-error - Invalid request
          invalidUpdate,
        ),
      ).rejects.toThrow()
    })
  })
})
