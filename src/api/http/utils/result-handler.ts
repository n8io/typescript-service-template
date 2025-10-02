import type { Result } from 'neverthrow'
import type { AppError } from '../../../models/result.ts'

export const handleResult = <T>(result: Result<T, AppError>): T => {
  if (result.isErr()) {
    throw result.error
  }
  return result.value
}

export const handleVoidResult = (result: Result<void, AppError>): void => {
  if (result.isErr()) {
    throw result.error
  }
}
