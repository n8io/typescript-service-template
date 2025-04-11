import { type ErrorHandler } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { DatabaseError } from 'pg'
import { ZodError } from 'zod'
import { CustomError } from '../../../models/custom-error.ts'
import { ErrorCode } from '../../../models/error-code.ts'
import { HttpStatus } from '../../../models/http-status.ts'
import { databaseErrorMessages, isSpiDatabaseError } from '../../../spi/repositories/database/error.ts'
import { isCustomError, isValidationError } from '../../../utils/errors.ts'

const errorHandler = (): ErrorHandler => (error, ctx) => {
  if (isValidationError(error)) {
    const validationError = error as ZodError

    console.error('Validation error:', validationError.message)

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

    // TODO: Use logger
    console.error('Database error:', spiDatabaseError.message)

    let details = databaseErrorMessages.get(spiDatabaseError.code as string)

    if (!details) {
      details = 'See logs for more details'
    }

    return ctx.json(
      {
        code: ErrorCode.SPI_DATABASE_ERROR,
        details,
        message: 'Database error',
      },
      HttpStatus.BAD_REQUEST,
    )
  }

  if (isCustomError(error)) {
    const customError = error as CustomError

    // TODO: Use logger
    console.error(customError)

    return ctx.json(
      {
        code: customError.code,
        message: customError.message,
      },
      customError.httpStatusCode as ContentfulStatusCode,
    )
  }

  // TODO: Use logger
  console.error('Unhandled exception:', error)

  return ctx.json(
    {
      code: ErrorCode.UNHANDLED_EXCEPTION,
      message: 'An unhandled exception occurred',
    },
    HttpStatus.INTERNAL_SERVER_ERROR,
  )
}

export { errorHandler }
