import type { Result } from 'neverthrow'
import { err, ok } from 'neverthrow'
import type { HttpStatus } from './http-status.ts'

// Base error types for the application
export type AppError = {
  code: string
  message: string
  httpStatusCode?: HttpStatus
  cause?: unknown
}

// Generic success result
export const success = <T>(value: T): Result<T, never> => ok(value)

// Generic error result
export const failure = <E extends AppError>(error: E): Result<never, E> => err(error)

export type { Result }
export { err, ok }
