import type { DatabaseError } from 'pg'
import { PostgresError } from 'pg-error-enum'
import { ZodError } from 'zod'
import { CustomError } from '../models/custom-error.ts'
import type { DomainError } from '../models/domain-errors.ts'
import { createDomainConstraintViolationError, createDomainValidationError } from '../models/domain-errors.ts'
import type { AppError } from '../models/result.ts'

const isCustomError = (error: unknown): error is CustomError => error instanceof CustomError
const isValidationError = (error: unknown): error is ZodError => error instanceof ZodError
const isAppError = (error: unknown): error is AppError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'httpStatusCode' in error &&
    typeof (error as AppError).code === 'string' &&
    typeof (error as AppError).message === 'string' &&
    typeof (error as AppError).httpStatusCode === 'number'
  )
}

/**
 * Maps SPI database errors to appropriate domain errors
 * This provides a scalable way to handle different types of database errors
 * across all domain services
 */
const mapSpiDatabaseErrorToDomainError = (error: DatabaseError, detail: string): DomainError => {
  switch (error.code) {
    case PostgresError.UNIQUE_VIOLATION:
      return createDomainConstraintViolationError(detail, 'unique')

    case PostgresError.CHECK_VIOLATION:
      return createDomainValidationError(detail, 'check')

    case PostgresError.NOT_NULL_VIOLATION:
      return createDomainValidationError(detail, 'not_null')

    case PostgresError.FOREIGN_KEY_VIOLATION:
      return createDomainConstraintViolationError(detail, 'foreign_key')

    case PostgresError.DATATYPE_MISMATCH:
      return createDomainValidationError(detail, 'data_type')

    default:
      // For unhandled database errors, return a generic constraint violation
      // This maintains the pattern while allowing for future expansion
      return createDomainConstraintViolationError(detail, 'unknown')
  }
}

export { isAppError, isCustomError, isValidationError, mapSpiDatabaseErrorToDomainError }
