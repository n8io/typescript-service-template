import { createMiddleware } from 'hono/factory'
import * as HonoLogger from 'hono/logger'
import { ZodError } from 'zod'
import type { Domain } from '../../../domain/init.ts'
import { DomainNotFoundError } from '../../../models/custom-error.ts'
import { ErrorCode } from '../../../models/error-code.ts'
import * as DomainMiddleware from './domain.ts'
import { initMiddleware } from './init.ts'

vi.mock('hono/logger')
vi.mock('./domain.ts')

describe('initMiddleware', () => {
  describe('should handle custom errors correctly', async () => {
    const error = new DomainNotFoundError('💥')

    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.spyOn(HonoLogger, 'logger').mockImplementation(() => {
        return createMiddleware(async (_, next) => {
          next()
        })
      })

      vi.spyOn(DomainMiddleware, 'makeDomainMiddleware').mockImplementation(() => {
        return createMiddleware(async () => {
          throw error
        })
      })
    })

    it('should handle customer errors', async () => {
      const mockDomain = {} as Domain
      const app = initMiddleware(mockDomain)
      const res = await app.request('/test')

      expect(res.status).toEqual(error.httpStatusCode)

      await expect(res.json()).resolves.toEqual({
        code: error.code,
        message: error.message,
      })
    })
  })

  describe('should handle validation errors correctly', async () => {
    const error = new ZodError([
      {
        code: 'invalid_type',
        expected: 'string',
        path: ['test'],
        message: 'Expected string, received number',
        received: 'number',
      },
    ])

    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.spyOn(HonoLogger, 'logger').mockImplementation(() => {
        return createMiddleware(async (_, next) => {
          next()
        })
      })

      vi.spyOn(DomainMiddleware, 'makeDomainMiddleware').mockImplementation(() => {
        return createMiddleware(async () => {
          throw error
        })
      })
    })

    it('should handle customer errors', async () => {
      const mockDomain = {} as Domain
      const app = initMiddleware(mockDomain)
      const res = await app.request('/test')

      expect(res.status).toEqual(400)

      await expect(res.json()).resolves.toEqual({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation error',
        details: error.errors,
      })
    })
  })

  describe('should handle unhandled errors correctly', async () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.spyOn(HonoLogger, 'logger').mockImplementation(() => {
        return createMiddleware(async (_, next) => {
          next()
        })
      })

      vi.spyOn(DomainMiddleware, 'makeDomainMiddleware').mockImplementation(() => {
        return createMiddleware(async () => {
          throw new Error('💥')
        })
      })
    })

    it('should handle customer errors', async () => {
      const mockDomain = {} as Domain
      const app = initMiddleware(mockDomain)
      const res = await app.request('/test')

      expect(res.status).toEqual(500)

      await expect(res.json()).resolves.toEqual({
        code: ErrorCode.UNHANDLED_EXCEPTION,
        message: 'An unhandled exception occurred',
      })
    })
  })
})
