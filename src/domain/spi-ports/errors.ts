import type { AppError } from '../../models/result.ts'

type SpiDatabaseError = AppError & {
  code: 'SPI_DATABASE_ERROR'
  databaseCode?: string
  detail?: string
}

type SpiValidationError = AppError & {
  code: 'SPI_VALIDATION_ERROR'
  field: string
  value: unknown
  constraint: string
}

type SpiError = SpiDatabaseError | SpiValidationError

// Factory functions for creating SPI errors
const createSpiDatabaseError = (
  message: string,
  databaseCode?: string,
  detail?: string,
  cause?: unknown,
): SpiDatabaseError => ({
  code: 'SPI_DATABASE_ERROR',
  message,
  databaseCode,
  detail,
  httpStatusCode: 400,
  cause,
})

const createSpiValidationError = (
  message: string,
  field: string,
  value: unknown,
  constraint: string,
): SpiValidationError => ({
  code: 'SPI_VALIDATION_ERROR',
  message,
  field,
  value,
  constraint,
  httpStatusCode: 400,
})

export { createSpiDatabaseError, createSpiValidationError }
export type { SpiDatabaseError, SpiError }
