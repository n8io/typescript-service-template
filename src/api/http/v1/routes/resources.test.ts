import { HTTPException } from 'hono/http-exception'
import { err, ok } from 'neverthrow'
import { exampleResource } from '../../../../domain/models/resource.ts'
import { DomainNotFoundError } from '../../../../models/custom-error.ts'
import { exampleGid } from '../../../../utils/factories/gid.ts'
import { errorHandler } from '../../middleware/error-handler.ts'
import { makeApp } from '../app.ts'
import { resources } from './resources.ts'

// Mock the errorHandler
const mockErrorHandler = vi.fn((error: Error, ctx: { json: (data: unknown, status?: number) => Response }) => {
  // Handle HTTPException with DomainNotFoundError cause
  if (error instanceof HTTPException && error.cause instanceof DomainNotFoundError) {
    const customError = error.cause as DomainNotFoundError
    return ctx.json(
      {
        code: customError.code,
        message: customError.message,
      },
      error.status,
    )
  }

  // Handle DomainNotFoundError directly
  if (error instanceof DomainNotFoundError) {
    return ctx.json(
      {
        code: error.code,
        message: error.message,
      },
      404,
    )
  }

  return ctx.json(
    {
      code: 'UNHANDLED_EXCEPTION',
      message: 'An unhandled exception occurred',
    },
    500,
  )
})

vi.mock('../../middleware/error-handler.ts', () => ({
  errorHandler: () => mockErrorHandler,
}))

// Import the mocked errorHandler

describe('resources', () => {
  const mockResource = exampleResource()

  beforeEach(() => {
    mockErrorHandler.mockClear()
  })

  describe('GET /', () => {
    it('should return a list of resources', async () => {
      const mockResponse = {
        hasMore: false,
        items: [mockResource],
        itemsTotal: 1,
        page: 1,
        pageSize: 1,
        pagesTotal: 1,
      }

      const mockServices = {
        resource: {
          getMany: vi.fn().mockResolvedValue(ok(mockResponse)),
        },
      }

      const app = makeApp()

      app.onError(errorHandler())

      // Attach mock services middleware
      app.use('*', async (ctx, next) => {
        // @ts-expect-error ???
        ctx.set('services', mockServices)
        await next()
      })

      // Mount the resources route
      app.route('/', resources)

      const res = await app.request('/')
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data).toEqual(JSON.parse(JSON.stringify(mockResponse)))

      expect(mockServices.resource.getMany).toHaveBeenCalledWith({
        filters: {},
      })
    })
  })

  describe('GET /:gid', () => {
    it('should return a resource by id', async () => {
      const gid = 'GID'

      const mockServices = {
        resource: {
          getOne: vi.fn().mockResolvedValue(ok(mockResource)),
        },
      }

      const app = makeApp()

      app.onError(errorHandler())

      // Attach mock services middleware
      app.use('*', async (ctx, next) => {
        // @ts-expect-error ???
        ctx.set('services', mockServices)
        await next()
      })

      // Mount the resources route
      app.route('/', resources)

      const res = await app.request(`/${gid}`)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data).toEqual(JSON.parse(JSON.stringify(mockResource)))

      expect(mockServices.resource.getOne).toHaveBeenCalledWith(gid)
    })

    it('should throw an error if the resource cannot be found', async () => {
      const gid = exampleGid()
      const error = new DomainNotFoundError(`Entity with gid ${gid} not found`)

      const mockServices = {
        resource: {
          getOne: vi.fn().mockResolvedValue(err(error)),
        },
      }

      const app = makeApp()

      app.onError(errorHandler())

      // Attach mock services middleware
      app.use('*', async (ctx, next) => {
        // @ts-expect-error ???
        ctx.set('services', mockServices)
        await next()
      })

      // Mount the resources route
      app.route('/', resources)

      const res = await app.request(`/${gid}`)
      const data = await res.json()

      expect(res.status).toBe(404)
      expect(data).toEqual({
        code: error.code,
        message: error.message,
      })
      expect(mockServices.resource.getOne).toHaveBeenCalledWith(gid)
    })

    it('should throw an error if the get operation fails', async () => {
      const gid = 'GID'
      const error = new Error('💥')

      const mockServices = {
        resource: {
          getOne: vi.fn().mockResolvedValue(err(error)),
        },
      }

      const app = makeApp()

      app.onError(errorHandler())

      // Attach mock services middleware
      app.use('*', async (ctx, next) => {
        // @ts-expect-error ???
        ctx.set('services', mockServices)
        await next()
      })

      // Mount the resources route
      app.route('/', resources)

      const res = await app.request(`/${gid}`)
      const data = await res.json()

      expect(res.status).toBe(500)
      expect(data).toHaveProperty('code')
      expect(mockServices.resource.getOne).toHaveBeenCalledWith(gid)
    })
  })

  describe('POST /', () => {
    it('should create a resource', async () => {
      const createRequest = {
        name: 'Test Resource',
        timeZone: 'UTC',
        createdBy: 'user123',
      }

      const mockServices = {
        resource: {
          createOne: vi.fn().mockResolvedValue(ok(mockResource)),
        },
      }

      const app = makeApp()

      app.onError(errorHandler())

      // Attach mock services middleware
      app.use('*', async (ctx, next) => {
        // @ts-expect-error ???
        ctx.set('services', mockServices)
        await next()
      })

      // Mount the resources route
      app.route('/', resources)

      const res = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createRequest),
      })

      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data).toEqual(JSON.parse(JSON.stringify(mockResource)))
      expect(mockServices.resource.createOne).toHaveBeenCalledWith(createRequest)
    })

    it('should handle creation errors', async () => {
      const createRequest = {
        name: 'Test Resource',
        timeZone: 'UTC',
        createdBy: 'user123',
      }
      const error = new Error('Creation failed')

      const mockServices = {
        resource: {
          createOne: vi.fn().mockResolvedValue(err(error)),
        },
      }

      const app = makeApp()

      app.onError(errorHandler())

      // Attach mock services middleware
      app.use('*', async (ctx, next) => {
        // @ts-expect-error ???
        ctx.set('services', mockServices)
        await next()
      })

      // Mount the resources route
      app.route('/', resources)

      const res = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createRequest),
      })

      const data = await res.json()

      expect(res.status).toBe(500)
      expect(data).toHaveProperty('code')
      expect(mockServices.resource.createOne).toHaveBeenCalledWith(createRequest)
    })
  })

  describe('PATCH /:gid', () => {
    it('should update a resource', async () => {
      const gid = 'GID'
      const updateRequest = {
        name: 'Updated Resource',
        updatedBy: 'user123',
      }

      const mockServices = {
        resource: {
          updateOne: vi.fn().mockResolvedValue(ok(mockResource)),
        },
      }

      const app = makeApp()

      app.onError(errorHandler())

      // Attach mock services middleware
      app.use('*', async (ctx, next) => {
        // @ts-expect-error ???
        ctx.set('services', mockServices)
        await next()
      })

      // Mount the resources route
      app.route('/', resources)

      const res = await app.request(`/${gid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateRequest),
      })

      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data).toEqual(JSON.parse(JSON.stringify(mockResource)))
      expect(mockServices.resource.updateOne).toHaveBeenCalledWith(gid, updateRequest)
    })

    it('should handle update errors', async () => {
      const gid = 'GID'
      const updateRequest = {
        name: 'Updated Resource',
        updatedBy: 'user123',
      }
      const error = new DomainNotFoundError(`Entity with gid ${gid} not found`)

      const mockServices = {
        resource: {
          updateOne: vi.fn().mockResolvedValue(err(error)),
        },
      }

      const app = makeApp()

      app.onError(errorHandler())

      // Attach mock services middleware
      app.use('*', async (ctx, next) => {
        // @ts-expect-error ???
        ctx.set('services', mockServices)
        await next()
      })

      // Mount the resources route
      app.route('/', resources)

      const res = await app.request(`/${gid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateRequest),
      })

      const data = await res.json()

      expect(res.status).toBe(404)
      expect(data).toEqual({
        code: error.code,
        message: error.message,
      })
      expect(mockServices.resource.updateOne).toHaveBeenCalledWith(gid, updateRequest)
    })
  })

  describe('DELETE /:gid', () => {
    it('should delete a resource by id', async () => {
      const gid = 'GID'

      const mockServices = {
        resource: {
          deleteOne: vi.fn().mockResolvedValue(ok(undefined)),
        },
      }

      const app = makeApp()

      app.onError(errorHandler())

      // Attach mock services middleware
      app.use('*', async (ctx, next) => {
        // @ts-expect-error ???
        ctx.set('services', mockServices)
        await next()
      })

      // Mount the resources route
      app.route('/', resources)

      const res = await app.request(`/${gid}`, {
        method: 'DELETE',
      })

      expect(res.status).toBe(204)
      expect(mockServices.resource.deleteOne).toHaveBeenCalledWith(gid)
    })

    it('should throw an error if the resource cannot be found', async () => {
      const gid = exampleGid()
      const error = new DomainNotFoundError(`Entity with gid ${gid} not found`)

      const mockServices = {
        resource: {
          deleteOne: vi.fn().mockResolvedValue(err(error)),
        },
      }

      const app = makeApp()

      app.onError(errorHandler())

      // Attach mock services middleware
      app.use('*', async (ctx, next) => {
        // @ts-expect-error ???
        ctx.set('services', mockServices)
        await next()
      })

      // Mount the resources route
      app.route('/', resources)

      const res = await app.request(`/${gid}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      expect(res.status).toBe(404)
      expect(data).toEqual({
        code: error.code,
        message: error.message,
      })
      expect(mockServices.resource.deleteOne).toHaveBeenCalledWith(gid)
    })

    it('should throw an error if the delete operation fails', async () => {
      const gid = 'GID'
      const error = new Error('💥')

      const mockServices = {
        resource: {
          deleteOne: vi.fn().mockResolvedValue(err(error)),
        },
      }

      const app = makeApp()

      app.onError(errorHandler())

      // Attach mock services middleware
      app.use('*', async (ctx, next) => {
        // @ts-expect-error ???
        ctx.set('services', mockServices)
        await next()
      })

      // Mount the resources route
      app.route('/', resources)

      const res = await app.request(`/${gid}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      expect(res.status).toBe(500)
      expect(data).toHaveProperty('code')
      expect(mockServices.resource.deleteOne).toHaveBeenCalledWith(gid)
    })
  })
})
