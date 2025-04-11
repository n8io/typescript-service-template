import { z } from 'zod'
import { DomainNotFoundError } from '../models/custom-error.ts'
import { isCustomError, isValidationError } from './errors.ts'

describe('isCustomError', () => {
  it('should return true for CustomError instances', () => {
    const error = new DomainNotFoundError('Custom error')

    expect(isCustomError(error)).toBe(true)
  })

  it('should return false for other errors', () => {
    const error = new Error('Some other error')

    expect(isCustomError(error)).toBe(false)
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
