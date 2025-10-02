/** biome-ignore-all lint/suspicious/noExplicitAny: This is a test file */
import { err, ok } from 'neverthrow'
import { z } from 'zod'
import { exampleAuditRecord } from '../../../models/audit-record.ts'
import { BaseService } from './base-service.ts'

// Mock schema for testing
const mockSchema = z.object({
  id: z.string(),
  name: z.string(),
})

const mockRequestSchema = z.object({
  name: z.string(),
  createdBy: z.object({ gid: z.string() }),
})

const mockUpdateSchema = z.object({
  name: z.string().optional(),
  updatedBy: z.object({
    type: z.enum(['USER', 'SYSTEM']),
    gid: z.string().optional(),
    system: z.string().optional(),
  }),
})

type MockCreateRequest = z.infer<typeof mockRequestSchema>
type MockUpdateRequest = z.infer<typeof mockUpdateSchema>

// Mock repository for testing
const createMockRepository = () => {
  const mockRepo = {
    createOne: vi.fn(),
    deleteMany: vi.fn(),
    getMany: vi.fn(),
    updateMany: vi.fn(),
  }

  // Set default mock values
  mockRepo.createOne.mockResolvedValue(ok({ id: 'test-id', name: 'test-name' }))
  mockRepo.deleteMany.mockResolvedValue(ok(undefined))
  mockRepo.getMany.mockResolvedValue(ok({ items: [], itemsTotal: 0 }))
  mockRepo.updateMany.mockResolvedValue(ok(undefined))

  return mockRepo
}

type MockRepository = ReturnType<typeof createMockRepository>

// Mock schemas for testing
const createMockSchemas = () => ({
  core: mockSchema,
  request: {
    createOne: mockRequestSchema,
    getOne: z.string(),
    updateOne: mockUpdateSchema,
  },
})

// Test implementation of BaseService
class TestBaseService extends BaseService<typeof mockSchema, MockCreateRequest, MockUpdateRequest, MockRepository> {
  // Override helper methods to provide better context for testing
  protected override extractFieldNameFromRequest(request: MockCreateRequest): string {
    if (request && typeof request === 'object' && 'name' in request) {
      return 'name'
    }
    return 'unknown'
  }

  protected override extractFieldValueFromRequest(request: MockCreateRequest, fieldName: string): unknown {
    if (request && typeof request === 'object' && fieldName in request) {
      return (request as any)[fieldName]
    }
    return 'unknown'
  }

  protected override extractFieldNameFromUpdates(updates: MockUpdateRequest): string {
    if (updates && typeof updates === 'object' && 'name' in updates) {
      return 'name'
    }
    return 'unknown'
  }

  protected override extractFieldValueFromUpdates(updates: MockUpdateRequest, fieldName: string): unknown {
    if (updates && typeof updates === 'object' && fieldName in updates) {
      return (updates as any)[fieldName]
    }
    return 'unknown'
  }
}

describe('BaseService', () => {
  let service: TestBaseService
  let mockRepository: MockRepository
  let mockSchemas: ReturnType<typeof createMockSchemas>

  beforeEach(() => {
    mockRepository = createMockRepository()
    mockSchemas = createMockSchemas()
    service = new TestBaseService({
      repository: mockRepository,
      schemas: mockSchemas,
    })
  })

  describe('createOne', () => {
    it('should return success when creation succeeds', async () => {
      const request = { name: 'Test Resource', createdBy: { gid: 'user123' } }
      const createdGid = 'gid123'
      const createdResource = { id: '1', name: 'Test Resource' }

      mockRepository.createOne.mockResolvedValue(ok({ gid: createdGid }))
      mockRepository.getMany.mockResolvedValue(
        ok({
          items: [createdResource],
          itemsTotal: 1,
        }),
      )

      const result = await service.createOne(request)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual(createdResource)
      }
      expect(mockRepository.createOne).toHaveBeenCalledWith({
        name: 'Test Resource',
        createdBy: { gid: 'user123' },
        createdAt: expect.any(Date),
        gid: expect.any(String),
        updatedAt: expect.any(Date),
        updatedBy: { gid: 'user123' },
      })
    })

    it('should return error when database constraint violation occurs', async () => {
      const request = { name: 'Test Resource', createdBy: { gid: 'user123' } }
      const dbError = new Error('Database constraint violation')
      ;(dbError as any).code = '23505' // Unique constraint violation
      ;(dbError as any).detail = 'already exists'

      mockRepository.createOne.mockResolvedValue(err(dbError))

      const result = await service.createOne(request)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('already exists')
      }
    })

    it('should return generic error when non-database error occurs', async () => {
      const request = { name: 'Test Resource', createdBy: { gid: 'user123' } }
      const genericError = new Error('Generic error')

      mockRepository.createOne.mockResolvedValue(err(genericError))

      const result = await service.createOne(request)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toBe('Failed to create entity')
      }
    })
  })

  describe('deleteOne', () => {
    it('should return success when deletion succeeds', async () => {
      const gid = 'gid123'

      mockRepository.deleteMany.mockResolvedValue(ok(undefined))

      const result = await service.deleteOne(gid)

      expect(result.isOk()).toBe(true)
      expect(mockRepository.deleteMany).toHaveBeenCalledWith([gid])
    })

    it('should return error when database constraint violation occurs', async () => {
      const gid = 'gid123'
      const dbError = new Error('Database constraint violation')
      ;(dbError as any).code = '23503' // Foreign key constraint violation
      ;(dbError as any).detail = 'Referenced gid does not exist'

      mockRepository.deleteMany.mockResolvedValue(err(dbError))

      const result = await service.deleteOne(gid)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('Referenced gid does not exist')
      }
    })
  })

  describe('getMany', () => {
    it('should return paginated response when retrieval succeeds', async () => {
      const query = { pagination: { page: 1, pageSize: 10 } }
      const mockResponse = {
        items: [
          { id: '1', name: 'Resource 1' },
          { id: '2', name: 'Resource 2' },
        ],
        itemsTotal: 2,
      }

      mockRepository.getMany.mockResolvedValue(ok(mockResponse))

      const result = await service.getMany(query)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.items).toHaveLength(2)
        expect(result.value.itemsTotal).toBe(2)
        expect(result.value.page).toBe(1)
        expect(result.value.pageSize).toBe(10)
      }
    })

    it('should use default pagination when not provided', async () => {
      const query = {}
      const mockResponse = {
        items: [{ id: '1', name: 'Resource 1' }],
        itemsTotal: 1,
      }

      mockRepository.getMany.mockResolvedValue(ok(mockResponse))

      const result = await service.getMany(query)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.page).toBe(1)
        expect(result.value.pageSize).toBe(10)
      }
    })

    it('should return error when database constraint violation occurs', async () => {
      const query = { pagination: { page: 1, pageSize: 10 } }
      const dbError = new Error('Database constraint violation')
      ;(dbError as any).code = '42P01' // Undefined table
      ;(dbError as any).detail = 'constraint violation'

      mockRepository.getMany.mockResolvedValue(err(dbError))

      const result = await service.getMany(query)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('constraint violation')
      }
    })
  })

  describe('getOne', () => {
    it('should return resource when found', async () => {
      const gid = 'gid123'
      const mockResponse = {
        items: [{ id: '1', name: 'Resource 1' }],
        itemsTotal: 1,
      }

      mockRepository.getMany.mockResolvedValue(ok(mockResponse))

      const result = await service.getOne(gid)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual({ id: '1', name: 'Resource 1' })
      }
    })

    it('should return error when resource not found', async () => {
      const gid = 'gid123'
      const mockResponse = {
        items: [],
        itemsTotal: 0,
      }

      mockRepository.getMany.mockResolvedValue(ok(mockResponse))

      const result = await service.getOne(gid)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain(`Entity with gid ${gid} not found`)
      }
    })
  })

  describe('updateOne', () => {
    it('should return updated resource when update succeeds', async () => {
      const gid = 'gid123'
      const updates = {
        name: 'Updated Resource',
        updatedBy: exampleAuditRecord({ type: 'USER', gid: 'user123' }),
      }
      const mockResponse = {
        items: [{ id: '1', name: 'Updated Resource' }],
        itemsTotal: 1,
      }

      mockRepository.updateMany.mockResolvedValue(ok(undefined))
      mockRepository.getMany.mockResolvedValue(ok(mockResponse))

      const result = await service.updateOne(gid, updates)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual({ id: '1', name: 'Updated Resource' })
      }
      expect(mockRepository.updateMany).toHaveBeenCalledWith(
        [
          {
            name: 'Updated Resource',
            gid: 'gid123',
          },
        ],
        exampleAuditRecord({ type: 'USER', gid: 'user123' }),
        expect.any(Date),
      )
    })

    it('should return error when database constraint violation occurs', async () => {
      const gid = 'gid123'
      const updates = {
        name: 'Updated Resource',
        updatedBy: exampleAuditRecord({ type: 'USER', gid: 'user123' }),
      }
      const dbError = new Error('Database constraint violation')
      ;(dbError as any).code = '23505' // Unique constraint violation
      ;(dbError as any).detail = 'UNIQUE_VIOLATION_DETAILS'

      mockRepository.updateMany.mockResolvedValue(err(dbError))

      const result = await service.updateOne(gid, updates)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('UNIQUE_VIOLATION_DETAILS')
      }
    })
  })
})
