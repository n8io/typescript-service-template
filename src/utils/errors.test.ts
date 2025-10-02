import { z } from 'zod'
import { ApiRequestMissingRequiredHeader } from '../models/custom-error.ts'
import { createDomainNotFoundError } from '../models/domain-errors.ts'
import { isAppError, isCustomError, isValidationError } from './errors.ts'

describe('isCustomError', () => {
  it('should return true for CustomError instances', () => {
    const error = new ApiRequestMissingRequiredHeader('test-header')

    expect(isCustomError(error)).toBe(true)
  })

  it('should return false for other errors', () => {
    const error = new Error('Some other error')

    expect(isCustomError(error)).toBe(false)
  })
})

describe('isAppError', () => {
  it('should return true for AppError instances', () => {
    const error = createDomainNotFoundError('Custom error', 'test', 'test-id')

    expect(isAppError(error)).toBe(true)
  })

  it('should return false for other errors', () => {
    const error = new Error('Some other error')

    expect(isAppError(error)).toBe(false)
  })
})

describe('isValidationError', () => {
  it('should return true for ZodError instances', () => {
    const schema = z.boolean()
    const error = schema.safeParse('not a boolean').error

    expect(isValidationError(error)).toBe(true)
  })

  it('should return false for other errors', () => {
    const error = new Error('Some other error')

    expect(isValidationError(error)).toBe(false)
  })
})
