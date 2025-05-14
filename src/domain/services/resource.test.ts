import { describe, expect, it, vi } from 'vitest'
import { exampleAuditRecord } from '../../models/audit-record.ts'
import { DomainNotFoundError } from '../../models/custom-error.ts'
import * as Validation from '../../utils/validation.ts'
import { exampleResource } from '../models/resource.ts'
import type { SpiResourceRepository } from '../spi-ports/resource-repository.ts'
import { ResourceService } from './resource.ts'

vi.mock('../../utils/validation.ts', async (importOriginal) => {
  const orig = (await importOriginal()) as typeof Validation
  return {
    ...orig,
    validation: {
      ...orig.validation,
      gid: {
        ...orig.validation.gid,
        parse: vi.fn().mockReturnValue('GID'),
      },
    },
  }
})

describe('ResourceService', () => {
  const mockResource = exampleResource()

  beforeEach(() => {
    vi.spyOn(Validation.validation.gid, 'parse').mockReturnValue('GID')
  })

  describe('createOne', () => {
    it('should create a resource and return it', async () => {
      const mockRepository = {
        createOne: vi.fn().mockResolvedValue(mockResource),
        getMany: vi.fn().mockResolvedValue({ items: [mockResource], itemsTotal: 1 }),
      } as unknown as SpiResourceRepository

      const resourceService = new ResourceService({
        repository: mockRepository,
      })

      const createRequest = {
        name: mockResource.name,
        timeZone: mockResource.timeZone,
        createdBy: mockResource.createdBy,
      }

      await resourceService.createOne(createRequest)

      expect(mockRepository.createOne).toHaveBeenCalledWith({
        ...createRequest,
        createdAt: expect.any(Date),
        gid: expect.any(String),
        updatedAt: expect.any(Date),
        updatedBy: createRequest.createdBy,
      })
    })

    it('should throw an error if the resource is invalid', async () => {
      const mockRepository = {
        createOne: vi.fn(),
      } as unknown as SpiResourceRepository

      const resourceService = new ResourceService({
        repository: mockRepository,
      })

      const invalidRequest = {} as Parameters<typeof resourceService.createOne>[0]

      await expect(() => resourceService.createOne(invalidRequest)).rejects.toThrow()
    })

    it('should throw an error if the resource cannot be created', async () => {
      const error = new Error('💥')

      const mockRepository = {
        createOne: vi.fn().mockRejectedValue(error),
        getMany: vi.fn().mockResolvedValue({ items: [mockResource], itemsTotal: 1 }),
      } as unknown as SpiResourceRepository

      const resourceService = new ResourceService({
        repository: mockRepository,
      })

      const createRequest = {
        name: mockResource.name,
        timeZone: mockResource.timeZone,
        createdBy: mockResource.createdBy,
      }

      await expect(() => resourceService.createOne(createRequest)).rejects.toThrowError(error)
    })
  })

  describe('getMany', () => {
    it('should return a paginated response of resources', async () => {
      const mockRepository = {
        getMany: vi.fn().mockResolvedValue({ items: [mockResource], itemsTotal: 1 }),
      } as unknown as SpiResourceRepository

      const resourceService = new ResourceService({
        repository: mockRepository,
      })

      const response = await resourceService.getMany({
        pagination: {
          page: 1,
          pageSize: 1,
        },
      })

      expect(mockRepository.getMany).toHaveBeenCalledWith({
        pagination: {
          page: 1,
          pageSize: 1,
        },
      })

      expect(response).toEqual({
        hasMore: false,
        items: [mockResource],
        itemsTotal: 1,
        page: 1,
        pageSize: 1,
        pagesTotal: 1,
      })
    })

    it('should throw an error if the resources cannot be retrieved', async () => {
      const error = new Error('💥')

      const mockRepository = {
        getMany: vi.fn().mockRejectedValue(error),
      } as unknown as SpiResourceRepository

      const resourceService = new ResourceService({
        repository: mockRepository,
      })

      await expect(() => resourceService.getMany({ pagination: { page: 1, pageSize: 1 } })).rejects.toThrowError(error)
    })
  })

  describe('getOne', () => {
    it('should return a resource by gid', async () => {
      const mockRepository = {
        getMany: vi.fn().mockResolvedValue({ items: [mockResource], itemsTotal: 1 }),
      } as unknown as SpiResourceRepository

      const resourceService = new ResourceService({
        repository: mockRepository,
      })

      const response = await resourceService.getOne('GID')

      expect(mockRepository.getMany).toHaveBeenCalledWith({
        filters: {
          gid: {
            eq: 'GID',
          },
        },
        pagination: {
          page: 1,
          pageSize: 1,
        },
      })

      expect(response).toEqual(mockResource)
    })

    it('should throw an error if the request fails', async () => {
      const error = new Error('💥')

      const mockRepository = {
        getMany: vi.fn().mockRejectedValue(error),
      } as unknown as SpiResourceRepository

      const resourceService = new ResourceService({
        repository: mockRepository,
      })

      await expect(() => resourceService.getOne('GID')).rejects.toThrowError(error)
    })

    it('should throw an error if the resource cannot be found', async () => {
      const mockRepository = {
        getMany: vi.fn().mockResolvedValue({ items: [], itemsTotal: 0 }),
      } as unknown as SpiResourceRepository

      const resourceService = new ResourceService({
        repository: mockRepository,
      })

      await expect(() => resourceService.getOne('GID')).rejects.toThrowError(DomainNotFoundError)
    })
  })

  describe('updateOne', () => {
    it('should update the resource and return the updated resource', async () => {
      const mockResource = exampleResource()
      vi.spyOn(Validation.validation.gid, 'parse').mockReturnValue(mockResource.gid)

      const mockRepository = {
        getMany: vi.fn().mockResolvedValue({ items: [mockResource], itemsTotal: 1 }),
        updateOne: vi.fn().mockResolvedValue({ ...mockResource, name: 'UPDATED_NAME' }),
      } as unknown as SpiResourceRepository

      const resourceService = new ResourceService({
        repository: mockRepository,
      })

      const update = { name: 'UPDATED_NAME', updatedBy: exampleAuditRecord() }

      const result = await resourceService.updateOne(mockResource.gid, update)

      expect(mockRepository.updateOne).toHaveBeenCalledWith(mockResource.gid, {
        ...update,
        updatedAt: expect.any(Date),
      })
      expect(result).toEqual(mockResource)
    })

    it('should throw an error if the update fails', async () => {
      const mockResource = exampleResource()
      const error = new Error('💥')

      vi.spyOn(Validation.validation.gid, 'parse').mockReturnValue(mockResource.gid)

      const mockRepository = {
        getMany: vi.fn().mockResolvedValue({ items: [mockResource], itemsTotal: 1 }),
        updateOne: vi.fn().mockRejectedValue(error),
      } as unknown as SpiResourceRepository

      const resourceService = new ResourceService({
        repository: mockRepository,
      })

      const update = { name: 'UPDATED_NAME', updatedBy: exampleAuditRecord() }

      await expect(() => resourceService.updateOne(mockResource.gid, update)).rejects.toThrowError(error)
    })
  })

  it('should instantiate with the correct repository and schemas', () => {
    const mockRepository = {} as SpiResourceRepository
    const service = new ResourceService({ repository: mockRepository })
    expect(service).toBeInstanceOf(ResourceService)
    // Optionally check that schemas are wired up
    expect(ResourceService.schemas).toBeDefined()
    expect(ResourceService.propsMeta).toBeDefined()
  })

  // Add any domain-specific or integration tests here if needed
})
