import type { Result } from 'neverthrow'
import { err, ok } from 'neverthrow'
import type { DatabaseError } from 'pg'
import type { Spi } from '../../spi/init.ts'
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

  const makeMockRepository = (
    overrides: Partial<{
      createOne: (request: unknown) => Promise<Result<typeof mockResource, DatabaseError>>
      deleteMany: (gids: string[]) => Promise<Result<void, DatabaseError>>
      getMany: (
        request: unknown,
      ) => Promise<Result<{ items: (typeof mockResource)[]; itemsTotal: number }, DatabaseError>>
      updateMany: (
        updates: unknown,
        updatedBy: unknown,
        updatedAt: Date,
      ) => Promise<Result<(typeof mockResource)[], DatabaseError>>
    }> = {},
  ): SpiResourceRepository => ({
    createOne: vi.fn().mockResolvedValue(ok(mockResource)),
    deleteMany: vi.fn().mockResolvedValue(ok(undefined)),
    getMany: vi.fn().mockResolvedValue(
      ok({
        items: [mockResource],
        itemsTotal: 1,
      }),
    ),
    updateMany: vi.fn().mockResolvedValue(ok([mockResource])),
    ...overrides,
  })

  const makeMockSpi = (
    overrides: Partial<{
      createOne: (request: unknown) => Promise<Result<typeof mockResource, DatabaseError>>
      deleteMany: (gids: string[]) => Promise<Result<void, DatabaseError>>
      getMany: (
        request: unknown,
      ) => Promise<Result<{ items: (typeof mockResource)[]; itemsTotal: number }, DatabaseError>>
      updateMany: (
        updates: unknown,
        updatedBy: unknown,
        updatedAt: Date,
      ) => Promise<Result<(typeof mockResource)[], DatabaseError>>
    }> = {},
  ): Spi => ({
    repositories: {
      resource: makeMockRepository(overrides) as Spi['repositories']['resource'],
    },
  })

  beforeEach(() => {
    vi.spyOn(Validation.validation.gid, 'parse').mockReturnValue(mockResource.gid)
  })

  describe('createOne', () => {
    it('should create a resource and return it', async () => {
      const mockSpi = makeMockSpi()
      const resourceService = new ResourceService(mockSpi)

      const createRequest = {
        name: mockResource.name,
        timeZone: mockResource.timeZone,
        createdBy: mockResource.createdBy,
      }

      const result = await resourceService.createOne(createRequest)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual(mockResource)
      }

      expect(mockSpi.repositories.resource.createOne).toHaveBeenCalledWith({
        ...createRequest,
        createdAt: expect.any(Date),
        gid: expect.any(String),
        updatedAt: expect.any(Date),
        updatedBy: createRequest.createdBy,
      })
    })

    it('should return error if the resource is invalid', async () => {
      const mockSpi = makeMockSpi()
      const resourceService = new ResourceService(mockSpi)
      const invalidRequest = {} as Parameters<typeof resourceService.createOne>[0]

      const result = await resourceService.createOne(invalidRequest)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.code).toBe('DOMAIN_VALIDATION_ERROR')
        expect(result.error.message).toContain('Required')
      }
    })

    it('should return error if the resource cannot be created', async () => {
      const dbError = new Error('Database constraint violation') as DatabaseError
      dbError.code = '23505' // Unique violation

      const mockSpi = makeMockSpi({ createOne: vi.fn().mockResolvedValue(err(dbError)) })
      const resourceService = new ResourceService(mockSpi)

      const createRequest = {
        name: mockResource.name,
        timeZone: mockResource.timeZone,
        createdBy: mockResource.createdBy,
      }

      const result = await resourceService.createOne(createRequest)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.code).toBe('DOMAIN_CONSTRAINT_VIOLATION')
        expect(result.error.message).toContain('already exists')
      }
    })
  })

  describe('getMany', () => {
    it('should return a paginated response of resources', async () => {
      const mockSpi = makeMockSpi()
      const resourceService = new ResourceService(mockSpi)

      const response = await resourceService.getMany({
        pagination: {
          page: 1,
          pageSize: 1,
        },
      })

      expect(mockSpi.repositories.resource.getMany).toHaveBeenCalledWith({
        pagination: {
          page: 1,
          pageSize: 1,
        },
      })

      expect(response.isOk()).toBe(true)
      if (response.isOk()) {
        expect(response.value).toEqual({
          hasMore: false,
          items: [mockResource],
          itemsTotal: 1,
          page: 1,
          pageSize: 1,
          pagesTotal: 1,
        })
      }
    })

    it('should return error if the resources cannot be retrieved', async () => {
      const dbError = new Error('Database error') as DatabaseError
      dbError.code = 'UNKNOWN_ERROR'

      const mockSpi = makeMockSpi({ getMany: vi.fn().mockResolvedValue(err(dbError)) })
      const resourceService = new ResourceService(mockSpi)

      const response = await resourceService.getMany({
        pagination: {
          page: 1,
          pageSize: 1,
        },
      })

      expect(response.isErr()).toBe(true)
      if (response.isErr()) {
        expect(response.error.code).toBe('DOMAIN_NOT_FOUND')
        expect(response.error.message).toBe('Failed to retrieve entities')
      }
    })
  })

  describe('getOne', () => {
    it('should return a resource when found', async () => {
      const mockSpi = makeMockSpi()
      const resourceService = new ResourceService(mockSpi)

      const response = await resourceService.getOne(mockResource.gid)

      expect(response.isOk()).toBe(true)
      if (response.isOk()) {
        expect(response.value).toEqual(mockResource)
      }
    })

    it('should return error if the resource is not found', async () => {
      const mockSpi = makeMockSpi({
        getMany: vi.fn().mockResolvedValue(
          ok({
            items: [],
            itemsTotal: 0,
          }),
        ),
      })
      const resourceService = new ResourceService(mockSpi)

      const response = await resourceService.getOne('non-existent-gid')

      expect(response.isErr()).toBe(true)
      if (response.isErr()) {
        expect(response.error.code).toBe('DOMAIN_NOT_FOUND')
        expect(response.error.message).toBe('Entity with gid non-existent-gid not found')
      }
    })

    it('should return error if the resource cannot be retrieved', async () => {
      const dbError = new Error('Database error') as DatabaseError
      dbError.code = 'UNKNOWN_ERROR'

      const mockSpi = makeMockSpi({ getMany: vi.fn().mockResolvedValue(err(dbError)) })
      const resourceService = new ResourceService(mockSpi)

      const response = await resourceService.getOne(mockResource.gid)

      expect(response.isErr()).toBe(true)
      if (response.isErr()) {
        expect(response.error.code).toBe('DOMAIN_NOT_FOUND')
        expect(response.error.message).toBe('Failed to retrieve entities')
      }
    })
  })

  describe('updateOne', () => {
    it('should update a resource and return it', async () => {
      const mockSpi = makeMockSpi()
      const resourceService = new ResourceService(mockSpi)

      const updateRequest = {
        name: 'Updated Resource',
        timeZone: 'UTC',
        updatedBy: mockResource.createdBy,
      }

      const result = await resourceService.updateOne(mockResource.gid, updateRequest)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual(mockResource)
      }

      expect(mockSpi.repositories.resource.updateMany).toHaveBeenCalledWith(
        [
          {
            gid: mockResource.gid,
            name: updateRequest.name,
            timeZone: updateRequest.timeZone,
          },
        ],
        updateRequest.updatedBy,
        expect.any(Date),
      )
    })

    it('should return error if the resource cannot be updated', async () => {
      const dbError = new Error('Database error') as DatabaseError
      dbError.code = 'UNKNOWN_ERROR'

      const mockSpi = makeMockSpi({ updateMany: vi.fn().mockResolvedValue(err(dbError)) })
      const resourceService = new ResourceService(mockSpi)

      const updateRequest = {
        name: 'Updated Resource',
        timeZone: 'UTC',
        updatedBy: mockResource.createdBy,
      }

      const result = await resourceService.updateOne(mockResource.gid, updateRequest)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.code).toBe('DOMAIN_NOT_FOUND')
        expect(result.error.message).toBe('Failed to update entity')
      }
    })
  })

  describe('deleteOne', () => {
    it('should delete a resource', async () => {
      const mockSpi = makeMockSpi()
      const resourceService = new ResourceService(mockSpi)

      const result = await resourceService.deleteOne(mockResource.gid)

      expect(result.isOk()).toBe(true)
      expect(mockSpi.repositories.resource.deleteMany).toHaveBeenCalledWith([mockResource.gid])
    })

    it('should return error if the resource cannot be deleted', async () => {
      const dbError = new Error('Database error') as DatabaseError
      dbError.code = 'UNKNOWN_ERROR'

      const mockSpi = makeMockSpi({ deleteMany: vi.fn().mockResolvedValue(err(dbError)) })
      const resourceService = new ResourceService(mockSpi)

      const result = await resourceService.deleteOne(mockResource.gid)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.code).toBe('DOMAIN_NOT_FOUND')
        expect(result.error.message).toBe('Failed to delete entity')
      }
    })
  })

  describe('propsMeta', () => {
    it('should have the correct properties for each operation', () => {
      const mockSpi = makeMockSpi()
      const service = new ResourceService(mockSpi)

      expect(service.propsMeta.create).toEqual(['name', 'timeZone', 'createdBy'])
      expect(service.propsMeta.filter).toEqual(['createdAt', 'gid', 'name', 'timeZone', 'updatedAt'])
      expect(service.propsMeta.sort).toEqual(['createdAt', 'gid', 'name', 'timeZone', 'updatedAt'])
      expect(service.propsMeta.update).toEqual(['name', 'timeZone', 'updatedBy'])
    })
  })

  describe('schemas', () => {
    it('should have the correct schemas', () => {
      const mockSpi = makeMockSpi()
      const service = new ResourceService(mockSpi)

      expect(service.schemas.core).toBe(ResourceService.schemas.core)
      expect(service.schemas.request.createOne).toBe(ResourceService.schemas.request.createOne)
      expect(service.schemas.request.getOne).toBe(ResourceService.schemas.request.getOne)
      expect(service.schemas.request.updateOne).toBe(ResourceService.schemas.request.updateOne)
      expect(service.schemas.response.getMany).toBe(ResourceService.schemas.response.getMany)
      expect(service.schemas.response.getOne).toBe(ResourceService.schemas.response.getOne)
    })
  })
})
