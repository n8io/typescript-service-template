import { exampleResource } from '../../../../domain/models/resource.ts'
import { DomainNotFoundError } from '../../../../models/custom-error.ts'
import { makeApp } from '../app.ts'
import { resources } from './resources.ts'

// Mock the errorHandler
const mockErrorHandler = vi.fn((error: Error, ctx: { json: (data: unknown, status?: number) => Response }) => {
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
import { errorHandler } from '../../middleware/error-handler.ts'

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
          getMany: vi.fn().mockResolvedValue(mockResponse),
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

  describe('POST /', () => {
    it('should create a new resource', async () => {
      const request = {}

      const mockServices = {
        resource: {
          createOne: vi.fn().mockResolvedValue(mockResource),
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
        body: JSON.stringify(request),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data).toEqual(JSON.parse(JSON.stringify(mockResource)))
      expect(mockServices.resource.createOne).toHaveBeenCalledWith(request)
    })
  })

  describe('GET /:gid', () => {
    it('should return a single resource by id', async () => {
      const gid = 'GID'

      const mockServices = {
        resource: {
          getOne: vi.fn().mockResolvedValue(mockResource),
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
  })

  describe('PATCH /:gid', () => {
    it('should update a resource by id and return the updated resource', async () => {
      const gid = 'GID'

      const mockServices = {
        resource: {
          updateOne: vi.fn().mockResolvedValue(mockResource),
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
        body: JSON.stringify({ name: 'UPDATED_NAME' }),
      })

      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data).toEqual(JSON.parse(JSON.stringify(mockResource)))
      expect(mockServices.resource.updateOne).toHaveBeenCalledWith(gid, { name: 'UPDATED_NAME' })
    })
  })

  describe('DELETE /:gid', () => {
    it('should delete a resource by id', async () => {
      const gid = 'GID'

      const mockServices = {
        resource: {
          deleteOne: vi.fn().mockResolvedValue(undefined),
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
      const gid = 'GID'

      const mockServices = {
        resource: {
          deleteOne: vi.fn().mockRejectedValue(new DomainNotFoundError(`Entity with gid ${gid} not found`)),
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

      expect(res.status).toBe(404)
      expect(mockServices.resource.deleteOne).toHaveBeenCalledWith(gid)
    })

    it('should throw an error if the delete operation fails', async () => {
      const gid = 'GID'
      const error = new Error('💥')

      const mockServices = {
        resource: {
          deleteOne: vi.fn().mockRejectedValue(error),
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

      expect(res.status).toBe(500)
      expect(mockServices.resource.deleteOne).toHaveBeenCalledWith(gid)
    })
  })
})
