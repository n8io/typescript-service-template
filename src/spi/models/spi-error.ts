import { CustomError } from '../../models/custom-error.ts'
import type { ErrorCode } from '../../models/error-code.ts'
import { HttpStatus } from '../../models/http-status.ts'

class SpiError extends CustomError {
  constructor(
    name: string,
    message: string,
    code: ErrorCode = 'UNHANDLED_EXCEPTION',
    httpStatusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    cause?: Error,
  ) {
    super(name, message, code, httpStatusCode, cause)
  }
}

class SpiDatabaseError extends SpiError {
  constructor(message: string, cause?: Error) {
    super('SpiDatabaseError', message, 'SPI_DATABASE_ERROR', HttpStatus.INTERNAL_SERVER_ERROR, cause)
  }
}
// class SpiExternalServiceError extends SpiError {
//   constructor(message: string, cause?: Error) {
//     super('SpiExternalServiceError', message, 'UNHANDLED_EXCEPTION', HttpStatus.INTERNAL_SERVER_ERROR, cause)
//   }
// }

class SpiValidationError extends SpiError {
  constructor(message: string, cause?: Error) {
    super('SpiValidationError', message, 'VALIDATION_ERROR', HttpStatus.BAD_REQUEST, cause)
  }
}

export { SpiDatabaseError, SpiValidationError }
