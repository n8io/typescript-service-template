import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { Result } from 'neverthrow'
import type { CustomError } from '../../../models/custom-error.ts'
import { ErrorCode } from '../../../models/error-code.ts'
import { ErrorMessage } from '../../../models/error-messages.ts'
import { HttpStatus } from '../../../models/http-status.ts'
import { isCustomError } from '../../../utils/errors.ts'

/**
 * Converts a neverthrow Result to an HTTP response.
 * Throws HTTPException for errors to be handled by Hono's error handler.
 *
 * @param ctx - The Hono context
 * @param result - The Result object to convert
 * @returns HTTP response with unwrapped data
 * @throws HTTPException for errors
 */
export const resultToResponse = <T extends Record<string, unknown> | unknown[], E>(
  ctx: Context,
  result: Result<T, E>,
) => {
  if (result.isOk()) {
    return ctx.json(result.value)
  }

  const error = result.error

  // Handle custom domain/SPI errors
  if (isCustomError(error)) {
    const customError = error as CustomError
    const httpStatusCode = (customError.httpStatusCode ?? HttpStatus.INTERNAL_SERVER_ERROR) as ContentfulStatusCode

    throw new HTTPException(httpStatusCode, {
      message: `${customError.code}: ${customError.message}`,
      cause: customError,
    })
  }

  // Handle unknown errors
  throw new HTTPException(HttpStatus.INTERNAL_SERVER_ERROR, {
    message: `${ErrorCode.UNHANDLED_EXCEPTION}: ${ErrorMessage.UNHANDLED_EXCEPTION}`,
    cause: error,
  })
}

/**
 * Converts a neverthrow Result to an HTTP response for operations that return void on success.
 * Throws HTTPException for errors to be handled by Hono's error handler.
 *
 * @param ctx - The Hono context
 * @param result - The Result<void, E> object to convert
 * @returns HTTP response with 204 No Content
 * @throws HTTPException for errors
 */
export const resultToNoContentResponse = <E>(_ctx: Context, result: Result<void, E>) => {
  if (result.isOk()) {
    return new Response(null, { status: 204 })
  }

  const error = result.error

  // Handle custom domain/SPI errors
  if (isCustomError(error)) {
    const customError = error as CustomError
    const httpStatusCode = (customError.httpStatusCode ?? HttpStatus.INTERNAL_SERVER_ERROR) as ContentfulStatusCode

    throw new HTTPException(httpStatusCode, {
      message: JSON.stringify({
        code: customError.code,
        message: customError.message,
      }),
      cause: customError,
    })
  }

  // Handle unknown errors
  throw new HTTPException(HttpStatus.INTERNAL_SERVER_ERROR, {
    message: JSON.stringify({
      code: ErrorCode.UNHANDLED_EXCEPTION,
      message: ErrorMessage.UNHANDLED_EXCEPTION,
    }),
    cause: error,
  })
}
