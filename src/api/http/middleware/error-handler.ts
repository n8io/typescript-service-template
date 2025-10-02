import type { ErrorHandler } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { DatabaseError } from 'pg'
import { pick } from 'remeda'
import type { ZodError } from 'zod'
import type { CustomError } from '../../../models/custom-error.ts'
import { ErrorCode } from '../../../models/error-code.ts'
import { HttpStatus } from '../../../models/http-status.ts'
import type { AppError } from '../../../models/result.ts'
import { isSpiDatabaseError } from '../../../spi/repositories/database/error.ts'
import { isAppError, isCustomError, isValidationError } from '../../../utils/errors.ts'
import { logger } from '../../../utils/logger.ts'

const errorHandler = (): ErrorHandler => (error, ctx) => {
  if (isValidationError(error)) {
    const validationError = error as ZodError

    return ctx.json(
      {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation error',
        details: validationError.errors,
      },
      HttpStatus.BAD_REQUEST,
    )
  }

  if (isSpiDatabaseError(error)) {
    const spiDatabaseError = error as DatabaseError
    const message = spiDatabaseError.detail ?? 'Unhandled database error, see logs for details.'

    logger.error(message)

    return ctx.json(
      {
        code: ErrorCode.SPI_DATABASE_ERROR,
        ...pick(spiDatabaseError, ['constraint']),
        message,
      },
      HttpStatus.BAD_REQUEST,
    )
  }

  if (isAppError(error)) {
    const appError = error as AppError

    logger.error(appError)

    return ctx.json(
      {
        code: appError.code,
        // @ts-expect-error - Add constraint when present
        ...pick(appError, ['constraint']),
        message: appError.message,
      },
      (appError.httpStatusCode as ContentfulStatusCode) ?? HttpStatus.INTERNAL_SERVER_ERROR,
    )
  }

  if (isCustomError(error)) {
    const customError = error as CustomError

    logger.error(customError)

    return ctx.json(
      {
        code: customError.code,
        message: customError.message,
      },
      customError.httpStatusCode as ContentfulStatusCode,
    )
  }

  logger.error('Unhandled exception:', error)

  return ctx.json(
    {
      code: ErrorCode.UNHANDLED_EXCEPTION,
      message: 'An unhandled exception occurred, see logs for details.',
    },
    HttpStatus.INTERNAL_SERVER_ERROR,
  )
}

export { errorHandler }
