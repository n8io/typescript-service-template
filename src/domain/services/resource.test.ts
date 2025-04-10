import { DomainNotFoundError } from '../../models/custom-error.ts'
import { exampleResource } from '../models/resource.ts'
import type { SpiResourceRepository } from '../spi-ports/resource-repository.ts'
import { ResourceService } from './resource.ts'

describe('ResourceService', () => {
  const mockResource = exampleResource()
  describe('createOne', () => {
    it('should create a resource and return it', async () => {
      const mockRepository = {
        createOne: vi.fn(),
        getMany: vi.fn().mockResolvedValue({ items: [mockResource], itemsTotal: 1 }),
      } as unknown as SpiResourceRepository

      const resourceService = new ResourceService({
        repository: mockRepository,
      })

      await resourceService.createOne(mockResource)

      expect(mockRepository.createOne).toHaveBeenCalledWith({
        ...mockResource,
        createdAt: expect.any(Date),
        gid: expect.any(String),
        updatedAt: expect.any(Date),
        updatedBy: mockResource.createdBy,
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

      await expect(() => resourceService.createOne(invalidRequest)).rejects.toThrowError()
    })

    it('should throw an error if the resource cannot be created', async () => {
      const error = new Error('💥')

      const mockRepository = {
        createOne: vi.fn().mockRejectedValue(error),
      } as unknown as SpiResourceRepository

      const resourceService = new ResourceService({
        repository: mockRepository,
      })

      await expect(() => resourceService.createOne(mockResource)).rejects.toThrowError(error)
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

      const gid = 'GID'
      const response = await resourceService.getOne(gid)

      expect(mockRepository.getMany).toHaveBeenCalledWith({
        filters: {
          gid: {
            eq: gid,
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
})
