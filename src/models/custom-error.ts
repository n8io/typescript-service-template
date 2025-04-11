import type { ZodError } from 'zod'
import { ErrorCode } from './error-code.ts'
import { HttpStatus } from './http-status.ts'

class CustomError extends Error {
  code?: string
  httpStatusCode?: HttpStatus

  override cause?: unknown

  constructor(
    name: string,
    message: string,
    code: ErrorCode = 'UNHANDLED_EXCEPTION',
    httpStatusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    cause?: Error,
  ) {
    super(message)
    this.code = code
    this.httpStatusCode = httpStatusCode
    this.name = name
    this.cause = cause
  }

  override toString() {
    return `[${this.name}] ${this.message}${this.cause ? ` / cause: ${this.cause}` : ''}`
  }
}

class ApiRequestMissingRequiredHeader extends CustomError {
  constructor(header: string) {
    super(
      'ApiMissingClientId',
      `Request is missing the required "${header}" header`,
      'API_REQUEST_HEADER_MISSING',
      HttpStatus.BAD_REQUEST,
    )
  }
}

class ApiUnsupportedOperatorError extends CustomError {
  constructor(operator: string) {
    super(
      'UnsupportedOperatorError',
      `Unsupported operator: ${operator}`,
      'API_UNSUPPORTED_FILTER_OPERATOR',
      HttpStatus.BAD_REQUEST,
    )
  }
}

class ApiUnsupportedFieldError extends CustomError {
  constructor(field: string) {
    super(
      'UnsupportedFieldError',
      `Unsupported field: ${field}`,
      'API_UNSUPPORTED_FILTER_FIELD',
      HttpStatus.BAD_REQUEST,
    )
  }
}

class ApiUnsupportedFieldOperatorError extends CustomError {
  constructor(field: string, operator: string) {
    super(
      'UnsupportedFieldOperatorError',
      `Unsupported operator "${operator}" for field "${field}"`,
      'API_UNSUPPORTED_FILTER_FIELD_OPERATOR',
      HttpStatus.BAD_REQUEST,
    )
  }
}

class ApiUnsupportedMultipleValueOperatorError extends CustomError {
  constructor(operator: string) {
    super(
      'UnsupportedMultipleValueOperatorError',
      `The "${operator}" does not support multiple values`,
      'API_UNSUPPORTED_FILTER_MULTIPLE_VALUE_OPERATOR',
      HttpStatus.BAD_REQUEST,
    )
  }
}

class ApiUnsupportedSortFieldError extends CustomError {
  constructor(field: string) {
    super(
      'UnsupportedSortFieldError',
      `The sorting by the field "${field}" is not supported`,
      'API_UNSUPPORTED_SORT_FIELD',
      HttpStatus.BAD_REQUEST,
    )
  }
}

class AppConfigIncompleteError extends CustomError {
  constructor(error: ZodError) {
    super(
      'AppConfigIncompleteError',
      `The application configuration is incomplete: ${error.issues.map(({ message, path }) => `${path.join('.')} ${message.toLowerCase()}`).join(' / ')}`,
      'APP_CONFIG_INCOMPLETE',
      HttpStatus.INTERNAL_SERVER_ERROR,
    )
  }
}

class DomainNotFoundError extends CustomError {
  constructor(message: string) {
    super('DomainNotFoundError', message, 'DOMAIN_NOT_FOUND', HttpStatus.NOT_FOUND)
  }
}

export {
  ApiRequestMissingRequiredHeader,
  ApiUnsupportedFieldError,
  ApiUnsupportedFieldOperatorError,
  ApiUnsupportedMultipleValueOperatorError,
  ApiUnsupportedOperatorError,
  ApiUnsupportedSortFieldError,
  AppConfigIncompleteError,
  CustomError,
  DomainNotFoundError,
}
