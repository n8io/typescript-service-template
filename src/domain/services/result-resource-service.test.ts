import { err, ok } from 'neverthrow'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { exampleAuditRecord } from '../../models/audit-record.ts'
import { SpiDatabaseError } from '../../spi/models/spi-error.ts'
import { exampleGid, gid } from '../../utils/generators/gid.ts'
import { DomainNotFoundError, DomainValidationError } from '../models/domain-error.ts'
import { exampleResource } from '../models/resource.ts'
import type { ResultSpiResourceRepository } from '../spi-ports/result-resource-repository.ts'
import { ResultResourceService } from './result-resource-service.ts'

vi.mock('../../utils/generators/gid.ts')

const createMockRepository = (): ResultSpiResourceRepository => ({
  createOne: vi.fn(),
  deleteMany: vi.fn(),
  getMany: vi.fn(),
  updateMany: vi.fn(),
})

describe('ResultResourceService', () => {
  let mockRepository: ResultSpiResourceRepository
  let service: ResultResourceService
  let mockGid: ReturnType<typeof vi.mocked<typeof gid>>

  const validGid = exampleGid()

  beforeEach(() => {
    vi.clearAllMocks()
    mockRepository = createMockRepository()
    service = new ResultResourceService({ repository: mockRepository })
    mockGid = vi.mocked(gid)
    mockGid.mockReturnValue(validGid)
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
      const expectedResource = exampleResource()
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
      const expectedResource = exampleResource()
      vi.mocked(mockRepository.getMany).mockResolvedValue(
        ok({
          items: [expectedResource],
          itemsTotal: 1,
        }),
      )

      const result = await service.getOne(validGid)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.gid).toBe(expectedResource.gid)
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
      const expectedResources = [exampleResource(), exampleResource()]
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
        name: 'Updated Resource',
        timeZone: 'America/New_York',
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
      vi.mocked(mockRepository.updateMany).mockResolvedValue(ok(undefined))
      vi.mocked(mockRepository.getMany).mockResolvedValue(
        ok({
          items: [exampleResource()],
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
  })
})
