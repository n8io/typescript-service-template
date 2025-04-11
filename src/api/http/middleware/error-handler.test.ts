import { Hono } from 'hono'
import pg from 'pg'
import { PostgresError } from 'pg-error-enum'
import { ZodError } from 'zod'
import { DomainNotFoundError } from '../../../models/custom-error.ts'
import { ErrorCode } from '../../../models/error-code.ts'
import { databaseErrorMessages } from '../../../spi/repositories/database/error.ts'
import { errorHandler } from './error-handler.ts'

import * as SpiErrorUtils from '../../../spi/repositories/database/error.ts'
import * as GeneralErrorUtils from '../../../utils/errors.ts'

describe('errorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('should handle custom errors', async () => {
    vi.spyOn(GeneralErrorUtils, 'isCustomError').mockReturnValue(true)
    vi.spyOn(GeneralErrorUtils, 'isValidationError').mockReturnValue(false)
    vi.spyOn(SpiErrorUtils, 'isSpiDatabaseError').mockReturnValue(false)

    const error = new DomainNotFoundError('💥')
    const app = new Hono()

    app.get('/test', () => {
      throw error
    })

    app.onError(errorHandler())

    const res = await app.request('/test')

    expect(res.status).toEqual(error.httpStatusCode)

    await expect(res.json()).resolves.toEqual({
      code: error.code,
      message: error.message,
    })
  })

  it('should handle validation errors', async () => {
    vi.spyOn(GeneralErrorUtils, 'isCustomError').mockReturnValue(false)
    vi.spyOn(GeneralErrorUtils, 'isValidationError').mockReturnValue(true)
    vi.spyOn(SpiErrorUtils, 'isSpiDatabaseError').mockReturnValue(false)

    const error = new ZodError([
      {
        code: 'invalid_type',
        expected: 'string',
        path: ['test'],
        message: 'Expected string, received number',
        received: 'number',
      },
    ])
    const app = new Hono()

    app.get('/test', () => {
      throw error
    })

    app.onError(errorHandler())

    const res = await app.request('/test')

    expect(res.status).toEqual(400)

    await expect(res.json()).resolves.toEqual({
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Validation error',
      details: error.errors,
    })
  })

  describe('should handle spi errors correctly', async () => {
    beforeEach(() => {
      vi.spyOn(GeneralErrorUtils, 'isCustomError').mockReturnValue(false)
      vi.spyOn(GeneralErrorUtils, 'isValidationError').mockReturnValue(false)
      vi.spyOn(SpiErrorUtils, 'isSpiDatabaseError').mockReturnValue(true)
    })

    it('when error code is handled, should return the handled details', async () => {
      const app = new Hono()
      const handledCode = PostgresError.UNIQUE_VIOLATION

      app.get('/test', () => {
        const error = new pg.DatabaseError('🔥', 0, 'error')

        error.code = handledCode

        throw error
      })

      app.onError(errorHandler())

      const res = await app.request('/test')

      expect(res.status).toEqual(400)

      await expect(res.json()).resolves.toEqual({
        code: ErrorCode.SPI_DATABASE_ERROR,
        details: databaseErrorMessages.get(handledCode),
        message: 'Database error',
      })
    })

    it('when error code is unhandled, should return the unhandled details', async () => {
      const app = new Hono()

      app.get('/test', () => {
        const error = new pg.DatabaseError('🔥', 0, 'error')

        error.code = 'UNHANDLED_CODE'

        throw error
      })

      app.onError(errorHandler())

      const res = await app.request('/test')

      expect(res.status).toEqual(400)

      await expect(res.json()).resolves.toEqual({
        code: ErrorCode.SPI_DATABASE_ERROR,
        details: 'See logs for more details',
        message: 'Database error',
      })
    })
  })

  describe('should handle unhandled errors correctly', async () => {
    it('should handle customer errors', async () => {
      vi.spyOn(GeneralErrorUtils, 'isValidationError').mockReturnValue(false)
      vi.spyOn(SpiErrorUtils, 'isSpiDatabaseError').mockReturnValue(false)
      vi.spyOn(GeneralErrorUtils, 'isCustomError').mockReturnValue(false)

      const app = new Hono()

      app.get('/test', () => {
        throw new Error('🔥')
      })

      app.onError(errorHandler())

      const res = await app.request('/test')

      expect(res.status).toEqual(500)

      await expect(res.json()).resolves.toEqual({
        code: ErrorCode.UNHANDLED_EXCEPTION,
        message: 'An unhandled exception occurred',
      })
    })
  })
})
