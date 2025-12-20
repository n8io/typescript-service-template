import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import pg from 'pg'
import { PostgresError } from 'pg-error-enum'
import { ZodError } from 'zod'
import { DomainValidationError } from '../../../domain/models/domain-error.ts'
import { AppConfigIncompleteError, DomainNotFoundError } from '../../../models/custom-error.ts'
import { ErrorCode } from '../../../models/error-code.ts'
import { ErrorMessage } from '../../../models/error-messages.ts'
import { HttpStatus } from '../../../models/http-status.ts'
import { SpiDatabaseError } from '../../../spi/models/spi-error.ts'
import * as SpiErrorUtils from '../../../spi/repositories/database/error.ts'
import * as GeneralErrorUtils from '../../../utils/errors.ts'
import { errorHandler } from './error-handler.ts'

vi.mock('../../../utils/logger.ts')

describe('errorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('should handle custom errors', () => {
    it('should return actual message for non-500 errors', async () => {
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

    it('should return generic message for 500-level errors', async () => {
      vi.spyOn(GeneralErrorUtils, 'isCustomError').mockReturnValue(true)
      vi.spyOn(GeneralErrorUtils, 'isValidationError').mockReturnValue(false)
      vi.spyOn(SpiErrorUtils, 'isSpiDatabaseError').mockReturnValue(false)

      const error = new AppConfigIncompleteError('💥')
      const app = new Hono()

      app.get('/test', () => {
        throw error
      })

      app.onError(errorHandler())

      const res = await app.request('/test')

      expect(res.status).toEqual(error.httpStatusCode)

      await expect(res.json()).resolves.toEqual({
        code: error.code,
        message: 'An internal server error occurred, see logs for more details.',
      })
    })

    it('should return client-safe message for SpiDatabaseError with appropriate status code', async () => {
      vi.spyOn(GeneralErrorUtils, 'isCustomError').mockReturnValue(true)
      vi.spyOn(GeneralErrorUtils, 'isValidationError').mockReturnValue(false)
      vi.spyOn(SpiErrorUtils, 'isSpiDatabaseError').mockReturnValue(false)

      // Unique constraint violations should return 400 (client error)
      const error = new SpiDatabaseError('Unique constraint violation: name', HttpStatus.BAD_REQUEST)
      const app = new Hono()

      app.get('/test', () => {
        throw error
      })

      app.onError(errorHandler())

      const res = await app.request('/test')

      expect(res.status).toEqual(HttpStatus.BAD_REQUEST)

      await expect(res.json()).resolves.toEqual({
        code: error.code,
        message: 'Unique constraint violation: name',
      })
    })

    it('should return structured validation errors for DomainValidationError with ZodError cause', async () => {
      vi.spyOn(GeneralErrorUtils, 'isCustomError').mockReturnValue(true)
      vi.spyOn(GeneralErrorUtils, 'isValidationError').mockImplementation((error) => {
        // Return true if error is a ZodError (for the cause check)
        return error instanceof ZodError
      })
      vi.spyOn(SpiErrorUtils, 'isSpiDatabaseError').mockReturnValue(false)

      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['name'],
          message: 'Required',
        },
        {
          code: 'unrecognized_keys',
          keys: ['nameX'],
          path: [],
          message: "Unrecognized key(s) in object: 'nameX'",
        },
      ])

      const error = new DomainValidationError('Create request validation failed', zodError)
      const app = new Hono()

      app.get('/test', () => {
        throw error
      })

      app.onError(errorHandler())

      const res = await app.request('/test')

      expect(res.status).toEqual(HttpStatus.BAD_REQUEST)

      await expect(res.json()).resolves.toEqual({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation error',
        details: zodError.errors,
      })
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

    it('when error code is handled, should return generic message to prevent leaking database details', async () => {
      const app = new Hono()
      const handledCode = PostgresError.UNIQUE_VIOLATION

      app.get('/test', () => {
        const error = new pg.DatabaseError('🔥', 0, 'error')

        error.code = handledCode
        error.detail = 'DATABASE_ERROR_DETAIL'

        throw error
      })

      app.onError(errorHandler())

      const res = await app.request('/test')

      // Direct database errors should return 500 with generic message to prevent leaking details
      expect(res.status).toEqual(500)

      await expect(res.json()).resolves.toEqual({
        code: ErrorCode.SPI_DATABASE_ERROR,
        message: 'Database operation failed',
      })
    })

    it('when error code is unhandled, should return generic message to prevent leaking database details', async () => {
      const app = new Hono()

      app.get('/test', () => {
        const error = new pg.DatabaseError('🔥', 0, 'error')

        error.code = 'UNHANDLED_CODE'

        throw error
      })

      app.onError(errorHandler())

      const res = await app.request('/test')

      // Direct database errors should return 500 with generic message to prevent leaking details
      expect(res.status).toEqual(500)

      await expect(res.json()).resolves.toEqual({
        code: ErrorCode.SPI_DATABASE_ERROR,
        message: 'Database operation failed',
      })
    })
  })

  describe('should handle HTTPException from resultToResponse', () => {
    it('should return actual message for non-500 errors', async () => {
      vi.spyOn(GeneralErrorUtils, 'isCustomError').mockImplementation((error) => {
        // Return true for the cause (CustomError), false for HTTPException itself
        return error instanceof DomainNotFoundError
      })
      vi.spyOn(GeneralErrorUtils, 'isValidationError').mockReturnValue(false)
      vi.spyOn(SpiErrorUtils, 'isSpiDatabaseError').mockReturnValue(false)

      const customError = new DomainNotFoundError('Resource not found')
      const httpException = new HTTPException(HttpStatus.NOT_FOUND, {
        message: JSON.stringify({
          code: customError.code,
          message: customError.message,
        }),
        cause: customError,
      })
      const app = new Hono()

      app.get('/test', () => {
        throw httpException
      })

      app.onError(errorHandler())

      const res = await app.request('/test')

      expect(res.status).toEqual(HttpStatus.NOT_FOUND)

      await expect(res.json()).resolves.toEqual({
        code: customError.code,
        message: customError.message,
      })
    })

    it('should return generic message for 500-level errors', async () => {
      vi.spyOn(GeneralErrorUtils, 'isCustomError').mockImplementation((error) => {
        // Return true for the cause (CustomError), false for HTTPException itself
        return error instanceof AppConfigIncompleteError
      })
      vi.spyOn(GeneralErrorUtils, 'isValidationError').mockReturnValue(false)
      vi.spyOn(SpiErrorUtils, 'isSpiDatabaseError').mockReturnValue(false)

      const customError = new AppConfigIncompleteError('💥')
      const httpException = new HTTPException(HttpStatus.INTERNAL_SERVER_ERROR, {
        message: JSON.stringify({
          code: customError.code,
          message: customError.message,
        }),
        cause: customError,
      })
      const app = new Hono()

      app.get('/test', () => {
        throw httpException
      })

      app.onError(errorHandler())

      const res = await app.request('/test')

      expect(res.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR)

      await expect(res.json()).resolves.toEqual({
        code: customError.code,
        message: 'An internal server error occurred, see logs for more details.',
      })
    })

    it('should return client-safe message for SpiDatabaseError with appropriate status code via HTTPException', async () => {
      vi.spyOn(GeneralErrorUtils, 'isCustomError').mockImplementation((error) => {
        return error instanceof SpiDatabaseError
      })
      vi.spyOn(GeneralErrorUtils, 'isValidationError').mockReturnValue(false)
      vi.spyOn(SpiErrorUtils, 'isSpiDatabaseError').mockReturnValue(false)

      // Unique constraint violations should return 400 (client error)
      const customError = new SpiDatabaseError('Unique constraint violation: name', HttpStatus.BAD_REQUEST)
      const httpException = new HTTPException(HttpStatus.BAD_REQUEST, {
        message: JSON.stringify({
          code: customError.code,
          message: customError.message,
        }),
        cause: customError,
      })
      const app = new Hono()

      app.get('/test', () => {
        throw httpException
      })

      app.onError(errorHandler())

      const res = await app.request('/test')

      expect(res.status).toEqual(HttpStatus.BAD_REQUEST)

      await expect(res.json()).resolves.toEqual({
        code: customError.code,
        message: 'Unique constraint violation: name',
      })
    })

    it('should return structured validation errors for DomainValidationError with ZodError cause via HTTPException', async () => {
      vi.spyOn(GeneralErrorUtils, 'isCustomError').mockImplementation((error) => {
        return error instanceof DomainValidationError
      })
      vi.spyOn(GeneralErrorUtils, 'isValidationError').mockImplementation((error) => {
        // Return true if error is a ZodError (for the cause check)
        return error instanceof ZodError
      })
      vi.spyOn(SpiErrorUtils, 'isSpiDatabaseError').mockReturnValue(false)

      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['name'],
          message: 'Required',
        },
        {
          code: 'unrecognized_keys',
          keys: ['nameX'],
          path: [],
          message: "Unrecognized key(s) in object: 'nameX'",
        },
      ])

      const customError = new DomainValidationError('Create request validation failed', zodError)
      const httpException = new HTTPException(HttpStatus.BAD_REQUEST, {
        message: JSON.stringify({
          code: customError.code,
          message: customError.message,
        }),
        cause: customError,
      })
      const app = new Hono()

      app.get('/test', () => {
        throw httpException
      })

      app.onError(errorHandler())

      const res = await app.request('/test')

      expect(res.status).toEqual(HttpStatus.BAD_REQUEST)

      await expect(res.json()).resolves.toEqual({
        code: ErrorCode.VALIDATION_ERROR,
        message: ErrorMessage.VALIDATION_ERROR,
        details: zodError.errors,
      })
    })
  })

  describe('should handle unhandled errors correctly', async () => {
    it('should handle unhandled errors', async () => {
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
        message: 'An unhandled exception occurred, see logs for more details.',
      })
    })
  })
})
