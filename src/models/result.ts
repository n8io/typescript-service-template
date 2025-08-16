import type { Result } from 'neverthrow'
import { err, ok } from 'neverthrow'

// Base error types for the application
export type AppError = {
  code: string
  message: string
  httpStatusCode?: number
  cause?: unknown
}

// Generic success result
export const success = <T>(value: T): Result<T, never> => ok(value)

// Generic error result
export const failure = <E extends AppError>(error: E): Result<never, E> => err(error)

// Type guard for AppError
export const isAppError = (error: unknown): error is AppError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof (error as AppError).code === 'string' &&
    typeof (error as AppError).message === 'string'
  )
}

// Utility to convert thrown errors to Result
export const safe = <T>(fn: () => T): Result<T, AppError> => {
  try {
    const result = fn()
    return ok(result)
  } catch (error) {
    if (isAppError(error)) {
      return err(error)
    }
    return err({
      code: 'UNHANDLED_EXCEPTION',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      cause: error,
    })
  }
}

// Utility for async operations
export const safeAsync = async <T>(fn: () => Promise<T>): Promise<Result<T, AppError>> => {
  try {
    const result = await fn()
    return ok(result)
  } catch (error) {
    if (isAppError(error)) {
      return err(error)
    }
    return err({
      code: 'UNHANDLED_EXCEPTION',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      cause: error,
    })
  }
}

export type { Result }
export { err, ok }
