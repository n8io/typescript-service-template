import pg from 'pg'
import { PostgresError } from 'pg-error-enum'
import { HttpStatus } from '../../../models/http-status.ts'
import {
  extractConstraintName,
  extractFieldNameFromConstraint,
  getDatabaseError,
  getDatabaseErrorHttpStatus,
  isSpiDatabaseError,
} from './error.ts'

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

describe('extractFieldNameFromConstraint', () => {
  it('should extract field name from udx_resources_name pattern', () => {
    expect(extractFieldNameFromConstraint('udx_resources_name')).toBe('name')
  })

  it('should extract field name from udx_table_field pattern', () => {
    expect(extractFieldNameFromConstraint('udx_table_field')).toBe('field')
  })

  it('should return undefined for invalid patterns', () => {
    expect(extractFieldNameFromConstraint('invalid_pattern')).toBeUndefined()
  })

  it('should return undefined for undefined input', () => {
    expect(extractFieldNameFromConstraint(undefined)).toBeUndefined()
  })
})

describe('extractConstraintName', () => {
  it('should extract constraint name from constraint property', () => {
    const error = new pg.DatabaseError('Error', 0, 'error')
    // biome-ignore lint/suspicious/noExplicitAny: Testing constraint property
    ;(error as any).constraint = 'udx_resources_name'

    expect(extractConstraintName(error)).toBe('udx_resources_name')
  })

  it('should extract constraint name from error message', () => {
    const error = new pg.DatabaseError(
      'duplicate key value violates unique constraint "udx_resources_name"',
      0,
      'error',
    )

    expect(extractConstraintName(error)).toBe('udx_resources_name')
  })

  it('should prioritize constraint property over message parsing', () => {
    const error = new pg.DatabaseError(
      'duplicate key value violates unique constraint "udx_resources_name"',
      0,
      'error',
    )
    // biome-ignore lint/suspicious/noExplicitAny: Testing constraint property
    ;(error as any).constraint = 'udx_resources_email'

    expect(extractConstraintName(error)).toBe('udx_resources_email')
  })

  it('should return undefined when constraint cannot be extracted', () => {
    const error = new pg.DatabaseError('Some other error', 0, 'error')

    expect(extractConstraintName(error)).toBeUndefined()
  })

  it('should extract constraint name from outer error message when error is wrapped', () => {
    const dbError = new pg.DatabaseError('Some error', 0, 'error')
    dbError.code = PostgresError.UNIQUE_VIOLATION
    const wrappedError = new Error(
      'Failed query: insert into ... : duplicate key value violates unique constraint "udx_resources_name"',
    )
    wrappedError.cause = dbError

    expect(extractConstraintName(dbError, wrappedError)).toBe('udx_resources_name')
  })
})

describe('getDatabaseError', () => {
  it('should return DatabaseError when error is directly a DatabaseError', () => {
    const error = new pg.DatabaseError('Error', 0, 'error')
    error.code = PostgresError.UNIQUE_VIOLATION

    expect(getDatabaseError(error)).toBe(error)
  })

  it('should extract DatabaseError from cause chain', () => {
    const dbError = new pg.DatabaseError('Error', 0, 'error')
    dbError.code = PostgresError.UNIQUE_VIOLATION
    const wrappedError = new Error('Wrapped error')
    wrappedError.cause = dbError

    expect(getDatabaseError(wrappedError)).toBe(dbError)
  })

  it('should traverse multiple levels of cause chain', () => {
    const dbError = new pg.DatabaseError('Error', 0, 'error')
    dbError.code = PostgresError.UNIQUE_VIOLATION
    const middleError = new Error('Middle error')
    middleError.cause = dbError
    const outerError = new Error('Outer error')
    outerError.cause = middleError

    expect(getDatabaseError(outerError)).toBe(dbError)
  })

  it('should return undefined when no DatabaseError is found', () => {
    const error = new Error('Some error')

    expect(getDatabaseError(error)).toBeUndefined()
  })
})

describe('getDatabaseErrorHttpStatus', () => {
  it('should return BAD_REQUEST for client error codes', () => {
    expect(getDatabaseErrorHttpStatus(PostgresError.UNIQUE_VIOLATION)).toBe(HttpStatus.BAD_REQUEST)
    expect(getDatabaseErrorHttpStatus(PostgresError.CHECK_VIOLATION)).toBe(HttpStatus.BAD_REQUEST)
    expect(getDatabaseErrorHttpStatus(PostgresError.DATATYPE_MISMATCH)).toBe(HttpStatus.BAD_REQUEST)
    expect(getDatabaseErrorHttpStatus(PostgresError.FOREIGN_KEY_VIOLATION)).toBe(HttpStatus.BAD_REQUEST)
    expect(getDatabaseErrorHttpStatus(PostgresError.NOT_NULL_VIOLATION)).toBe(HttpStatus.BAD_REQUEST)
  })

  it('should return INTERNAL_SERVER_ERROR for unhandled error codes', () => {
    expect(getDatabaseErrorHttpStatus('UNHANDLED_CODE')).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
    expect(getDatabaseErrorHttpStatus(undefined)).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
  })
})
