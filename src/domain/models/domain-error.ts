import { CustomError } from '../../models/custom-error.ts'
import type { ErrorCode } from '../../models/error-code.ts'
import { HttpStatus } from '../../models/http-status.ts'

class DomainError extends CustomError {
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
// class DomainBusinessRuleError extends DomainError {
//   constructor(message: string, cause?: Error) {
//     super('DomainBusinessRuleError', message, 'UNHANDLED_EXCEPTION', HttpStatus.BAD_REQUEST, cause)
//   }
// }

class DomainNotFoundError extends DomainError {
  constructor(message: string, cause?: Error) {
    super('DomainNotFoundError', message, 'DOMAIN_NOT_FOUND', HttpStatus.NOT_FOUND, cause)
  }
}

class DomainValidationError extends DomainError {
  constructor(message: string, cause?: Error) {
    super('DomainValidationError', message, 'VALIDATION_ERROR', HttpStatus.BAD_REQUEST, cause)
  }
}

export { DomainNotFoundError, DomainValidationError }
