import { DrizzleError } from 'drizzle-orm'
import pg from 'pg'
import { PostgresError } from 'pg-error-enum'

const isDatabaseError = (error: unknown) => error instanceof pg.DatabaseError || error instanceof DrizzleError
const isSpiDatabaseError = (error: unknown): boolean => isDatabaseError(error)

const databaseErrorMessages = new Map<string, string>([
  [PostgresError.CHECK_VIOLATION, 'Check constraint violation'],
  [PostgresError.DATATYPE_MISMATCH, 'Data type mismatch'],
  [PostgresError.FOREIGN_KEY_VIOLATION, 'Foreign key violation'],
  [PostgresError.NOT_NULL_VIOLATION, 'Not null violation'],
  [PostgresError.UNIQUE_VIOLATION, 'Unique constraint violation'],
])

export { databaseErrorMessages, isSpiDatabaseError }
