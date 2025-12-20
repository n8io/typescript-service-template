import { DrizzleError } from 'drizzle-orm'
import pg from 'pg'
import { PostgresError } from 'pg-error-enum'
import { HttpStatus } from '../../../models/http-status.ts'

const isDatabaseError = (error: unknown) => error instanceof pg.DatabaseError || error instanceof DrizzleError

/**
 * Regex pattern for extracting field name from constraint name.
 * Pattern: udx_{table}_{field} -> extracts field
 */
const CONSTRAINT_FIELD_NAME_PATTERN = /^udx_[^_]+_(.+)$/

/**
 * Regex pattern for extracting constraint name from error messages.
 * Pattern: "duplicate key value violates unique constraint \"constraint_name\""
 */
const UNIQUE_CONSTRAINT_PATTERN = /unique constraint "([^"]+)"/i

/**
 * Extended DatabaseError type that includes the constraint property.
 * PostgreSQL DatabaseError has a constraint property, but it's not in the type definition.
 */
type DatabaseErrorWithConstraint = pg.DatabaseError & {
  constraint?: string
}

/**
 * Checks if an error is a PostgreSQL database error, including checking the cause chain
 * for wrapped errors (e.g., drizzle-orm wraps pg.DatabaseError)
 */
const isSpiDatabaseError = (error: unknown): boolean => {
  if (isDatabaseError(error)) {
    return true
  }

  // Check if error has a cause that is a DatabaseError (for wrapped errors)
  if (error instanceof Error && error.cause) {
    return isDatabaseError(error.cause)
  }

  return false
}

/**
 * Extracts the underlying pg.DatabaseError from an error, checking the cause chain if needed.
 * Traverses the cause chain recursively to find wrapped database errors.
 */
const getDatabaseError = (error: unknown): pg.DatabaseError | undefined => {
  if (isDatabaseError(error)) {
    return error as pg.DatabaseError
  }

  // Traverse the cause chain to find a DatabaseError
  let currentError: unknown = error instanceof Error ? error.cause : undefined
  const visited = new Set<unknown>()

  while (currentError && !visited.has(currentError)) {
    visited.add(currentError)

    if (isDatabaseError(currentError)) {
      return currentError as pg.DatabaseError
    }

    // Move to the next level in the cause chain
    if (currentError instanceof Error && currentError.cause) {
      currentError = currentError.cause
    } else {
      break
    }
  }

  return undefined
}

const databaseErrorMessages = new Map<string, string>([
  [PostgresError.CHECK_VIOLATION, 'Check constraint violation'],
  [PostgresError.DATATYPE_MISMATCH, 'Data type mismatch'],
  [PostgresError.FOREIGN_KEY_VIOLATION, 'Foreign key violation'],
  [PostgresError.NOT_NULL_VIOLATION, 'Not null violation'],
  [PostgresError.UNIQUE_VIOLATION, 'Unique constraint violation'],
])

/**
 * Maps database error codes to appropriate HTTP status codes.
 * Client errors (400) are for issues with the request data.
 * Server errors (500) are for unhandled database issues.
 */
const databaseErrorHttpStatus = new Map<string, HttpStatus>([
  [PostgresError.CHECK_VIOLATION, HttpStatus.BAD_REQUEST],
  [PostgresError.DATATYPE_MISMATCH, HttpStatus.BAD_REQUEST],
  [PostgresError.FOREIGN_KEY_VIOLATION, HttpStatus.BAD_REQUEST],
  [PostgresError.NOT_NULL_VIOLATION, HttpStatus.BAD_REQUEST],
  [PostgresError.UNIQUE_VIOLATION, HttpStatus.BAD_REQUEST],
])

/**
 * Gets the appropriate HTTP status code for a database error code.
 * Returns BAD_REQUEST (400) for client errors, INTERNAL_SERVER_ERROR (500) for unhandled errors.
 */
const getDatabaseErrorHttpStatus = (errorCode: string | undefined): HttpStatus => {
  if (errorCode && databaseErrorHttpStatus.has(errorCode)) {
    // biome-ignore lint/style/noNonNullAssertion: errorCode is guaranteed to be defined
    return databaseErrorHttpStatus.get(errorCode)!
  }

  return HttpStatus.INTERNAL_SERVER_ERROR
}

/**
 * Extracts the field name from a constraint name.
 * Handles patterns like "udx_resources_name" -> "name"
 * or "udx_table_field" -> "field"
 */
const extractFieldNameFromConstraint = (constraintName: string | undefined): string | undefined => {
  if (!constraintName) {
    return undefined
  }

  // Pattern: udx_{table}_{field} -> extract field
  const match = constraintName.match(CONSTRAINT_FIELD_NAME_PATTERN)
  if (match?.[1]) {
    return match[1]
  }

  return undefined
}

/**
 * Extracts the constraint name from a PostgreSQL DatabaseError.
 * Checks both the constraint property and parses from the error message.
 * Also checks the outer error message if the error is wrapped.
 */
const extractConstraintName = (dbError: pg.DatabaseError, outerError?: unknown): string | undefined => {
  // Check constraint property first (PostgreSQL DatabaseError has this but it's not in the type definition)
  const dbErrorWithConstraint = dbError as DatabaseErrorWithConstraint
  if (dbErrorWithConstraint.constraint) {
    return dbErrorWithConstraint.constraint
  }

  // Check the database error message
  // Pattern: "duplicate key value violates unique constraint \"constraint_name\""
  const dbMessageMatch = dbError.message.match(UNIQUE_CONSTRAINT_PATTERN)
  if (dbMessageMatch?.[1]) {
    return dbMessageMatch[1]
  }

  // Fallback: check the outer error message (for wrapped errors)
  if (outerError instanceof Error) {
    const outerMessageMatch = outerError.message.match(UNIQUE_CONSTRAINT_PATTERN)
    if (outerMessageMatch?.[1]) {
      return outerMessageMatch[1]
    }
  }

  return undefined
}

export {
  databaseErrorMessages,
  extractConstraintName,
  extractFieldNameFromConstraint,
  getDatabaseError,
  getDatabaseErrorHttpStatus,
  isSpiDatabaseError,
}
