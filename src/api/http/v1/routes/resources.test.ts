import { exampleResource } from '../../../../domain/models/resource.ts'
import { createDomainNotFoundError } from '../../../../models/domain-errors.ts'
import { err, ok } from '../../../../models/result.ts'
import { errorHandler } from '../../middleware/error-handler.ts'
import { makeApp } from '../app.ts'
import { resources } from './resources.ts'

describe('resources', () => {
  const mockResource = exampleResource()

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

      // Attach mock services middleware
      app.use('*', async (ctx, next) => {
        // @ts-expect-error ???
        ctx.set('services', mockServices)
        await next()
      })

      // Apply error handler BEFORE mounting routes
      app.onError(errorHandler())

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

    it('should handle domain errors when getting resources', async () => {
      const domainError = createDomainNotFoundError('Failed to retrieve entities', 'entities', 'retrieval_failed')
      const mockServices = {
        resource: {
          getMany: vi.fn().mockResolvedValue(err(domainError)),
        },
      }

      const app = makeApp()

      // Attach mock services middleware
      app.use('*', async (ctx, next) => {
        // @ts-expect-error ???
        ctx.set('services', mockServices)
        await next()
      })

      // Apply error handler BEFORE mounting routes
      app.onError(errorHandler())

      // Mount the resources route
      app.route('/', resources)

      const res = await app.request('/')

      expect(res.status).toBe(404)
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
          createOne: vi.fn().mockResolvedValue(ok(mockResource)),
        },
      }

      const app = makeApp()

      // Attach mock services middleware
      app.use('*', async (ctx, next) => {
        // @ts-expect-error ???
        ctx.set('services', mockServices)
        await next()
      })

      // Apply error handler BEFORE mounting routes
      app.onError(errorHandler())

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

    it('should handle domain errors when creating resource', async () => {
      const request = {}
      const domainError = createDomainNotFoundError('Failed to create entity', 'entity', 'creation_failed')
      const mockServices = {
        resource: {
          createOne: vi.fn().mockResolvedValue(err(domainError)),
        },
      }

      const app = makeApp()

      // Attach mock services middleware
      app.use('*', async (ctx, next) => {
        // @ts-expect-error ???
        ctx.set('services', mockServices)
        await next()
      })

      // Apply error handler BEFORE mounting routes
      app.onError(errorHandler())

      // Mount the resources route
      app.route('/', resources)

      const res = await app.request('/', {
        method: 'POST',
        body: JSON.stringify(request),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(res.status).toBe(404)
      expect(mockServices.resource.createOne).toHaveBeenCalledWith(request)
    })
  })

  describe('GET /:gid', () => {
    it('should return a single resource by id', async () => {
      const gid = 'GID'

      const mockServices = {
        resource: {
          getOne: vi.fn().mockResolvedValue(ok(mockResource)),
        },
      }

      const app = makeApp()

      // Attach mock services middleware
      app.use('*', async (ctx, next) => {
        // @ts-expect-error ???
        ctx.set('services', mockServices)
        await next()
      })

      // Apply error handler BEFORE mounting routes
      app.onError(errorHandler())

      // Mount the resources route
      app.route('/', resources)

      const res = await app.request(`/${gid}`)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data).toEqual(JSON.parse(JSON.stringify(mockResource)))
      expect(mockServices.resource.getOne).toHaveBeenCalledWith(gid)
    })

    it('should handle domain errors when getting resource by id', async () => {
      const gid = 'GID'
      const domainError = createDomainNotFoundError(`Entity with gid ${gid} not found`, 'entity', gid)
      const mockServices = {
        resource: {
          getOne: vi.fn().mockResolvedValue(err(domainError)),
        },
      }

      const app = makeApp()

      // Attach mock services middleware
      app.use('*', async (ctx, next) => {
        // @ts-expect-error ???
        ctx.set('services', mockServices)
        await next()
      })

      // Apply error handler BEFORE mounting routes
      app.onError(errorHandler())

      // Mount the resources route
      app.route('/', resources)

      const res = await app.request(`/${gid}`)

      expect(res.status).toBe(404)
      expect(mockServices.resource.getOne).toHaveBeenCalledWith(gid)
    })
  })

  describe('PATCH /:gid', () => {
    it('should update a resource by id and return the updated resource', async () => {
      const gid = 'GID'

      const mockServices = {
        resource: {
          updateOne: vi.fn().mockResolvedValue(ok(mockResource)),
        },
      }

      const app = makeApp()

      // Attach mock services middleware
      app.use('*', async (ctx, next) => {
        // @ts-expect-error ???
        ctx.set('services', mockServices)
        await next()
      })

      // Apply error handler BEFORE mounting routes
      app.onError(errorHandler())

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

    it('should handle domain errors when updating resource', async () => {
      const gid = 'GID'
      const domainError = createDomainNotFoundError('Failed to update entity', 'entity', 'update_failed')
      const mockServices = {
        resource: {
          updateOne: vi.fn().mockResolvedValue(err(domainError)),
        },
      }

      const app = makeApp()

      // Attach mock services middleware
      app.use('*', async (ctx, next) => {
        // @ts-expect-error ???
        ctx.set('services', mockServices)
        await next()
      })

      // Apply error handler BEFORE mounting routes
      app.onError(errorHandler())

      // Mount the resources route
      app.route('/', resources)

      const res = await app.request(`/${gid}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: 'UPDATED_NAME' }),
      })

      expect(res.status).toBe(404)
      expect(mockServices.resource.updateOne).toHaveBeenCalledWith(gid, { name: 'UPDATED_NAME' })
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

      // Attach mock services middleware
      app.use('*', async (ctx, next) => {
        // @ts-expect-error ???
        ctx.set('services', mockServices)
        await next()
      })

      // Apply error handler BEFORE mounting routes
      app.onError(errorHandler())

      // Mount the resources route
      app.route('/', resources)

      const res = await app.request(`/${gid}`, {
        method: 'DELETE',
      })

      expect(res.status).toBe(204)
      expect(mockServices.resource.deleteOne).toHaveBeenCalledWith(gid)
    })

    it('should handle domain errors when deleting resource', async () => {
      const gid = 'GID'
      const domainError = createDomainNotFoundError('Failed to delete entity', 'entity', 'deletion_failed')
      const mockServices = {
        resource: {
          deleteOne: vi.fn().mockResolvedValue(err(domainError)),
        },
      }

      const app = makeApp()

      // Attach mock services middleware
      app.use('*', async (ctx, next) => {
        // @ts-expect-error ???
        ctx.set('services', mockServices)
        await next()
      })

      // Apply error handler BEFORE mounting routes
      app.onError(errorHandler())

      // Mount the resources route
      app.route('/', resources)

      const res = await app.request(`/${gid}`, {
        method: 'DELETE',
      })

      expect(res.status).toBe(404)
      expect(mockServices.resource.deleteOne).toHaveBeenCalledWith(gid)
    })
  })
})
