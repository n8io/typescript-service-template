import type { Context, ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { ZodError } from 'zod'
import type { CustomError } from '../../../models/custom-error.ts'
import { ErrorCode } from '../../../models/error-code.ts'
import { ErrorMessage } from '../../../models/error-messages.ts'
import { HttpStatus } from '../../../models/http-status.ts'
import { isSpiDatabaseError } from '../../../spi/repositories/database/error.ts'
import { isCustomError, isValidationError } from '../../../utils/errors.ts'
import { logger } from '../../../utils/logger.ts'

const isHttpException = (error: unknown): error is HTTPException => error instanceof HTTPException

const isServerError = (statusCode: number): boolean => statusCode >= HttpStatus.INTERNAL_SERVER_ERROR

/**
 * Handles validation errors with ZodError cause (e.g., DomainValidationError).
 * Returns a structured validation error response with a message field.
 */
const handleValidationError = (customError: CustomError, statusCode: ContentfulStatusCode, ctx: Context) => {
  const zodError = customError.cause as ZodError

  return ctx.json(
    {
      code: ErrorCode.VALIDATION_ERROR,
      message: ErrorMessage.VALIDATION_ERROR,
      details: zodError.errors,
    },
    statusCode,
  )
}

const errorHandler = (): ErrorHandler => (error, ctx) => {
  if (isValidationError(error)) {
    const validationError = error as ZodError

    return ctx.json(
      {
        code: ErrorCode.VALIDATION_ERROR,
        message: ErrorMessage.VALIDATION_ERROR,
        details: validationError.errors,
      },
      HttpStatus.BAD_REQUEST,
    )
  }

  // Note: Direct database errors should not reach here as they should be wrapped in SpiDatabaseError
  // This check is kept as a safety net, but we never want to expose database details
  if (isSpiDatabaseError(error)) {
    // Always return generic message to prevent leaking database details
    return ctx.json(
      {
        code: ErrorCode.SPI_DATABASE_ERROR,
        message: ErrorMessage.DATABASE_OPERATION_FAILED,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    )
  }

  // Handle HTTPException from resultToResponse
  if (isHttpException(error)) {
    const httpException = error as HTTPException
    const statusCode = httpException.status
    const cause = httpException.cause

    // Extract CustomError from HTTPException cause
    if (isCustomError(cause)) {
      const customError = cause as CustomError

      // Handle validation errors with ZodError cause (e.g., DomainValidationError)
      if (
        customError.code === ErrorCode.VALIDATION_ERROR &&
        customError.cause &&
        isValidationError(customError.cause)
      ) {
        return handleValidationError(customError, statusCode, ctx)
      }

      // For SpiDatabaseError, return the client-safe message even for 500-level errors
      // since it's already been sanitized in handleDatabaseError
      if (customError.code === ErrorCode.SPI_DATABASE_ERROR) {
        return ctx.json(
          {
            code: customError.code,
            message: customError.message,
          },
          statusCode,
        )
      }

      // For 500-level errors, return generic message but keep error code
      if (isServerError(statusCode)) {
        return ctx.json(
          {
            code: customError.code,
            message: ErrorMessage.INTERNAL_SERVER_ERROR,
          },
          statusCode,
        )
      }

      // For non-500 errors, return the actual error message
      return ctx.json(
        {
          code: customError.code,
          message: customError.message,
        },
        statusCode,
      )
    }

    // HTTPException without CustomError cause (shouldn't happen, but handle it)
    // Try to parse the message JSON to extract the original error message
    let errorMessage: string = ErrorMessage.UNHANDLED_EXCEPTION
    try {
      const parsedMessage = JSON.parse(httpException.message) as { code?: string; message?: string }
      if (parsedMessage.message) {
        errorMessage = parsedMessage.message
      }
    } catch {
      // If parsing fails, use the raw message for non-server errors
      if (!isServerError(statusCode)) {
        errorMessage = httpException.message
      }
    }

    return ctx.json(
      {
        code: ErrorCode.UNHANDLED_EXCEPTION,
        message: errorMessage,
      },
      statusCode,
    )
  }

  if (isCustomError(error)) {
    const customError = error as CustomError
    const statusCode = (customError.httpStatusCode ?? HttpStatus.INTERNAL_SERVER_ERROR) as ContentfulStatusCode

    // Handle validation errors with ZodError cause (e.g., DomainValidationError)
    if (customError.code === ErrorCode.VALIDATION_ERROR && customError.cause && isValidationError(customError.cause)) {
      return handleValidationError(customError, statusCode, ctx)
    }

    // For SpiDatabaseError, return the client-safe message even for 500-level errors
    // since it's already been sanitized in handleDatabaseError
    if (customError.code === ErrorCode.SPI_DATABASE_ERROR) {
      return ctx.json(
        {
          code: customError.code,
          message: customError.message,
        },
        statusCode,
      )
    }

    // For 500-level errors, return generic message but keep error code
    if (isServerError(statusCode)) {
      return ctx.json(
        {
          code: customError.code,
          message: ErrorMessage.INTERNAL_SERVER_ERROR,
        },
        statusCode,
      )
    }

    // For non-500 errors, return the actual error message
    return ctx.json(
      {
        code: customError.code,
        message: customError.message,
      },
      statusCode,
    )
  }

  logger.error({ err: error }, 'Unhandled exception:')

  return ctx.json(
    {
      code: ErrorCode.UNHANDLED_EXCEPTION,
      message: ErrorMessage.UNHANDLED_EXCEPTION,
    },
    HttpStatus.INTERNAL_SERVER_ERROR,
  )
}

export { errorHandler }
