import pg from 'pg'
import { PostgresError } from 'pg-error-enum'
import { isSpiDatabaseError } from './error.ts'

describe('isSpiDatabaseError', () => {
  it('should return true for unique constraint errors', () => {
    const error = new pg.DatabaseError('Unique constraint violation', 0, 'error')

    error.code = PostgresError.UNIQUE_VIOLATION

    expect(isSpiDatabaseError(error)).toBe(true)
  })

  it('should return false for other errors', () => {
    const error = new Error('Some other error')
    expect(isSpiDatabaseError(error)).toBe(false)
  })

  it('should return false for errors without a code', () => {
    const error = new Error('Error without code')
    expect(isSpiDatabaseError(error)).toBe(false)
  })
})
