import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { Result } from 'neverthrow'
import type { CustomError } from '../../../models/custom-error.ts'
import { ErrorCode } from '../../../models/error-code.ts'
import { HttpStatus } from '../../../models/http-status.ts'
import { isCustomError } from '../../../utils/errors.ts'

/**
 * Converts a neverthrow Result to an HTTP response.
 *
 * @param ctx - The Hono context
 * @param result - The Result object to convert
 * @returns HTTP response with unwrapped data or appropriate error
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

    return ctx.json(
      {
        code: customError.code,
        message: customError.message,
      },
      customError.httpStatusCode as ContentfulStatusCode,
    )
  }

  // Handle unknown errors
  return ctx.json(
    {
      code: ErrorCode.UNHANDLED_EXCEPTION,
      message: 'An unhandled exception occurred, see logs for more details.',
    },
    HttpStatus.INTERNAL_SERVER_ERROR,
  )
}

/**
 * Converts a neverthrow Result to an HTTP response for operations that return void on success.
 *
 * @param ctx - The Hono context
 * @param result - The Result<void, E> object to convert
 * @returns HTTP response with 204 No Content or appropriate error
 */
export const resultToNoContentResponse = <E>(ctx: Context, result: Result<void, E>) => {
  if (result.isOk()) {
    return new Response(null, { status: 204 })
  }

  const error = result.error

  // Handle custom domain/SPI errors
  if (isCustomError(error)) {
    const customError = error as CustomError

    return ctx.json(
      {
        code: customError.code,
        message: customError.message,
      },
      customError.httpStatusCode as ContentfulStatusCode,
    )
  }

  // Handle unknown errors
  return ctx.json(
    {
      code: ErrorCode.UNHANDLED_EXCEPTION,
      message: 'An unhandled exception occurred, see logs for more details.',
    },
    HttpStatus.INTERNAL_SERVER_ERROR,
  )
}
