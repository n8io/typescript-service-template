import { Hono } from 'hono'
import { err, ok } from 'neverthrow'
import { describe, expect, it } from 'vitest'
import { DomainNotFoundError } from '../../../models/custom-error.ts'
import { ErrorCode } from '../../../models/error-code.ts'
import { errorHandler } from '../middleware/error-handler.ts'
import { resultToNoContentResponse, resultToResponse } from './result-to-response.ts'

describe('resultToResponse', () => {
  describe('resultToResponse', () => {
    it('should return unwrapped value when Result is Ok', async () => {
      const app = new Hono()
      const testData = { id: '123', name: 'Test Resource' }
      const result = ok(testData)

      app.get('/test', (ctx) => resultToResponse(ctx, result))
      app.onError(errorHandler())

      const res = await app.request('/test')
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data).toEqual(testData)
    })

    it('should throw HTTPException when Result is Err with CustomError', async () => {
      const app = new Hono()
      const error = new DomainNotFoundError('Resource not found')
      const result = err(error)

      app.get('/test-error', (ctx) => resultToResponse(ctx, result))
      app.onError(errorHandler())

      const res = await app.request('/test-error')
      const data = await res.json()

      expect(res.status).toBe(404)
      expect(data).toEqual({
        code: error.code,
        message: error.message,
      })
    })

    it('should throw HTTPException for unknown error types', async () => {
      const app = new Hono()
      const unknownError = new Error('Unknown error')
      const result = err(unknownError)

      app.get('/test-unknown', (ctx) => resultToResponse(ctx, result))
      app.onError(errorHandler())

      const res = await app.request('/test-unknown')
      const data = await res.json()

      expect(res.status).toBe(500)
      expect(data).toEqual({
        code: ErrorCode.UNHANDLED_EXCEPTION,
        message: 'An unhandled exception occurred, see logs for more details.',
      })
    })
  })

  describe('resultToNoContentResponse', () => {
    it('should return 204 No Content when Result is Ok', async () => {
      const app = new Hono()
      const result = ok(undefined)

      app.delete('/test', (ctx) => resultToNoContentResponse(ctx, result))
      app.onError(errorHandler())

      const res = await app.request('/test', { method: 'DELETE' })

      expect(res.status).toBe(204)
      expect(await res.text()).toBe('')
    })

    it('should throw HTTPException when Result is Err with CustomError', async () => {
      const app = new Hono()
      const error = new DomainNotFoundError('Resource not found')
      const result = err(error)

      app.delete('/test-error', (ctx) => resultToNoContentResponse(ctx, result))
      app.onError(errorHandler())

      const res = await app.request('/test-error', { method: 'DELETE' })
      const data = await res.json()

      expect(res.status).toBe(404)
      expect(data).toEqual({
        code: error.code,
        message: error.message,
      })
    })

    it('should throw HTTPException for unknown error types', async () => {
      const app = new Hono()
      const unknownError = new Error('Unknown error')
      const result = err(unknownError)

      app.delete('/test-unknown', (ctx) => resultToNoContentResponse(ctx, result))
      app.onError(errorHandler())

      const res = await app.request('/test-unknown', { method: 'DELETE' })
      const data = await res.json()

      expect(res.status).toBe(500)
      expect(data).toEqual({
        code: ErrorCode.UNHANDLED_EXCEPTION,
        message: 'An unhandled exception occurred, see logs for more details.',
      })
    })
  })
})
