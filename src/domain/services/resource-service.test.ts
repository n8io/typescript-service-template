import { err, ok } from 'neverthrow'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { exampleAuditRecord } from '../../models/audit-record.ts'
import { HttpStatus } from '../../models/http-status.ts'
import { SpiDatabaseError } from '../../spi/models/spi-error.ts'
import { gid, isGid } from '../../utils/factories/gid.ts'
import { DomainNotFoundError, DomainValidationError } from '../models/domain-error.ts'
import { exampleResource } from '../models/resource.ts'
import type { SpiResourceRepository } from '../spi-ports/resource-repository.ts'
import { ResourceService } from './resource-service.ts'

vi.mock('../../utils/factories/gid.ts')

vi.mock('../../utils/logger.ts', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

const createMockRepository = (): SpiResourceRepository => ({
  createOne: vi.fn(),
  deleteMany: vi.fn(),
  getMany: vi.fn(),
  updateMany: vi.fn(),
})

describe('ResourceService', () => {
  let mockRepository: SpiResourceRepository
  let service: ResourceService
  let mockGid: ReturnType<typeof vi.mocked<typeof gid>>
  let mockIsGid: ReturnType<typeof vi.mocked<typeof isGid>>
  let validGid: string

  beforeEach(() => {
    vi.clearAllMocks()
    mockRepository = createMockRepository()
    service = new ResourceService({ repository: mockRepository })
    mockGid = vi.mocked(gid)
    mockIsGid = vi.mocked(isGid)

    // Set up a valid GID for tests
    validGid = '999.00000000-0000-0000-0000-000000000000'
    mockGid.mockReturnValue(validGid)
    // Mock isGid to return true for our valid GID and false for invalid ones
    mockIsGid.mockImplementation((value: string) => {
      return (
        value === validGid ||
        value.match(/^999\.[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/) !== null
      )
    })
  })

  describe('createOne', () => {
    const validCreateRequest = {
      createdBy: exampleAuditRecord(),
      name: 'Test Resource',
      timeZone: 'UTC',
    }

    it('should return Ok result for successful creation', async () => {
      const expectedResource = {
        ...exampleResource(),
        gid: validGid,
        name: 'Test Resource',
        timeZone: 'UTC',
        createdBy: { ...exampleAuditRecord(), gid: validGid },
      }

      vi.mocked(mockRepository.createOne).mockResolvedValue(ok(expectedResource))
      vi.mocked(mockRepository.getMany).mockResolvedValue(
        ok({
          items: [expectedResource],
          itemsTotal: 1,
        }),
      )

      const result = await service.createOne(validCreateRequest)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.name).toBe('Test Resource')
        expect(result.value.gid).toBe(validGid)
      }
    })

    it('should return Err result for repository creation failure', async () => {
      const databaseError = new SpiDatabaseError('Database connection failed')
      vi.mocked(mockRepository.createOne).mockResolvedValue(err(databaseError))

      const result = await service.createOne(validCreateRequest)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(SpiDatabaseError)
        expect(result.error.message).toBe('Database connection failed')
      }
    })

    it('should return Err result for validation failure', async () => {
      const invalidRequest = {
        ...validCreateRequest,
        name: '', // Invalid empty name
      }

      const result = await service.createOne(invalidRequest)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(DomainValidationError)
        expect(result.error.message).toContain('Create request validation failed')
      }
    })

    it('should call repository with correct parameters', async () => {
      const expectedResource = {
        ...exampleResource(),
        gid: validGid,
        createdBy: { ...exampleAuditRecord(), gid: validGid },
      }
      vi.mocked(mockRepository.createOne).mockResolvedValue(ok(expectedResource))
      vi.mocked(mockRepository.getMany).mockResolvedValue(
        ok({
          items: [expectedResource],
          itemsTotal: 1,
        }),
      )

      await service.createOne(validCreateRequest)

      expect(mockRepository.createOne).toHaveBeenCalledWith(
        expect.objectContaining({
          createdBy: validCreateRequest.createdBy,
          gid: validGid,
          name: 'Test Resource',
          timeZone: 'UTC',
          updatedBy: validCreateRequest.createdBy,
        }),
      )
    })
  })

  describe('getOne', () => {
    it('should return Ok result for existing resource', async () => {
      const expectedResource = {
        ...exampleResource(),
        gid: validGid,
        createdBy: { ...exampleAuditRecord(), gid: validGid },
      }
      vi.mocked(mockRepository.getMany).mockResolvedValue(
        ok({
          items: [expectedResource],
          itemsTotal: 1,
        }),
      )

      const result = await service.getOne(validGid)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.gid).toBe(validGid)
      }
    })

    it('should return Err result for non-existent resource', async () => {
      vi.mocked(mockRepository.getMany).mockResolvedValue(
        ok({
          items: [],
          itemsTotal: 0,
        }),
      )

      const result = await service.getOne(validGid)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(DomainNotFoundError)
        expect(result.error.message).toContain(`Entity with gid ${validGid} not found`)
      }
    })

    it('should return Err result for invalid GID format', async () => {
      const result = await service.getOne('invalid-gid')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(DomainValidationError)
        expect(result.error.message).toContain('GID validation failed')
      }
    })

    it('should return Err result for repository failure', async () => {
      const databaseError = new SpiDatabaseError('Database query failed')
      vi.mocked(mockRepository.getMany).mockResolvedValue(err(databaseError))

      const result = await service.getOne(validGid)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(SpiDatabaseError)
      }
    })
  })

  describe('getMany', () => {
    const validGetManyRequest = {
      filters: {},
      pagination: { page: 1, pageSize: 10 },
      sorting: [],
    }

    it('should return Ok result for successful query', async () => {
      const expectedResources = [
        {
          ...exampleResource(),
          gid: validGid,
          createdBy: { ...exampleAuditRecord(), gid: validGid },
        },
        {
          ...exampleResource(),
          gid: '999.11111111-1111-1111-1111-111111111111',
          createdBy: { ...exampleAuditRecord(), gid: '999.11111111-1111-1111-1111-111111111111' },
        },
      ]
      vi.mocked(mockRepository.getMany).mockResolvedValue(
        ok({
          items: expectedResources,
          itemsTotal: 2,
        }),
      )

      const result = await service.getMany(validGetManyRequest)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.items).toHaveLength(2)
        expect(result.value.itemsTotal).toBe(2)
      }
    })

    it('should return Err result for repository failure', async () => {
      const databaseError = new SpiDatabaseError('Database connection lost')
      vi.mocked(mockRepository.getMany).mockResolvedValue(err(databaseError))

      const result = await service.getMany(validGetManyRequest)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(SpiDatabaseError)
      }
    })
  })

  describe('updateOne', () => {
    const validUpdateRequest = {
      name: 'Updated Resource',
      timeZone: 'America/New_York',
      updatedBy: exampleAuditRecord(),
    }

    it('should return Ok result for successful update', async () => {
      const updatedResource = {
        ...exampleResource(),
        gid: validGid,
        name: 'Updated Resource',
        timeZone: 'America/New_York',
        createdBy: { ...exampleAuditRecord(), gid: validGid },
      }

      vi.mocked(mockRepository.updateMany).mockResolvedValue(ok(undefined))
      vi.mocked(mockRepository.getMany).mockResolvedValue(
        ok({
          items: [updatedResource],
          itemsTotal: 1,
        }),
      )

      const result = await service.updateOne(validGid, validUpdateRequest)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.name).toBe('Updated Resource')
        expect(result.value.timeZone).toBe('America/New_York')
      }
    })

    it('should return Err result for repository update failure', async () => {
      const databaseError = new SpiDatabaseError('Update operation failed')
      vi.mocked(mockRepository.updateMany).mockResolvedValue(err(databaseError))

      const result = await service.updateOne(validGid, validUpdateRequest)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(SpiDatabaseError)
      }
    })

    it('should return Err result for validation failure', async () => {
      const invalidUpdateRequest = {
        name: '', // Invalid empty name
        timeZone: '',
        updatedBy: exampleAuditRecord(),
      }

      const result = await service.updateOne(validGid, invalidUpdateRequest)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(DomainValidationError)
      }
    })

    it('should call repository updateMany with correct parameters', async () => {
      const updatedResource = {
        ...exampleResource(),
        gid: validGid,
        createdBy: { ...exampleAuditRecord(), gid: validGid },
      }
      vi.mocked(mockRepository.updateMany).mockResolvedValue(ok(undefined))
      vi.mocked(mockRepository.getMany).mockResolvedValue(
        ok({
          items: [updatedResource],
          itemsTotal: 1,
        }),
      )

      await service.updateOne(validGid, validUpdateRequest)

      expect(mockRepository.updateMany).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            gid: validGid,
            name: 'Updated Resource',
            timeZone: 'America/New_York',
          }),
        ],
        validUpdateRequest.updatedBy,
        expect.any(Date),
      )
    })
  })

  describe('deleteOne', () => {
    it('should return Ok result for successful deletion', async () => {
      vi.mocked(mockRepository.deleteMany).mockResolvedValue(ok(undefined))

      const result = await service.deleteOne(validGid)

      expect(result.isOk()).toBe(true)
      expect(mockRepository.deleteMany).toHaveBeenCalledWith([validGid])
    })

    it('should return Err result for repository failure', async () => {
      const databaseError = new SpiDatabaseError('Delete operation failed')
      vi.mocked(mockRepository.deleteMany).mockResolvedValue(err(databaseError))

      const result = await service.deleteOne(validGid)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(SpiDatabaseError)
      }
    })

    it('should return Err result for invalid GID', async () => {
      const result = await service.deleteOne('invalid-gid')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(DomainValidationError)
        expect(result.error.message).toContain('GID validation failed')
      }
    })

    it('should return Err result when no rows are deleted', async () => {
      const noRowsDeletedError = new SpiDatabaseError(
        `No rows deleted for the provided GID(s): ${validGid}`,
        HttpStatus.NOT_FOUND,
      )
      vi.mocked(mockRepository.deleteMany).mockResolvedValue(err(noRowsDeletedError))

      const result = await service.deleteOne(validGid)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(SpiDatabaseError)
        expect(result.error.message).toContain(`No rows deleted for the provided GID(s): ${validGid}`)
        expect(result.error.httpStatusCode).toBe(HttpStatus.NOT_FOUND)
      }
    })
  })
})
