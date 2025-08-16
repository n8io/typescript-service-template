import type { AppError } from './result.ts'

type SpiDatabaseError = AppError & {
  code: 'SPI_DATABASE_ERROR'
  databaseCode?: string
  detail?: string
}

type SpiConnectionError = AppError & {
  code: 'SPI_CONNECTION_ERROR'
  operation: string
}

type SpiValidationError = AppError & {
  code: 'SPI_VALIDATION_ERROR'
  field: string
  value: unknown
  constraint: string
}

type SpiNotFoundError = AppError & {
  code: 'SPI_NOT_FOUND'
  resource: string
  identifier: string
}

type SpiError = SpiDatabaseError | SpiConnectionError | SpiValidationError | SpiNotFoundError

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

const createSpiConnectionError = (message: string, operation: string, cause?: unknown): SpiConnectionError => ({
  code: 'SPI_CONNECTION_ERROR',
  message,
  operation,
  httpStatusCode: 500,
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

const createSpiNotFoundError = (message: string, resource: string, identifier: string): SpiNotFoundError => ({
  code: 'SPI_NOT_FOUND',
  message,
  resource,
  identifier,
  httpStatusCode: 404,
})

export { createSpiConnectionError, createSpiDatabaseError, createSpiNotFoundError, createSpiValidationError }
export type { SpiConnectionError, SpiDatabaseError, SpiError, SpiNotFoundError, SpiValidationError }
