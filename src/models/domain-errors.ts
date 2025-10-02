import { HttpStatus } from './http-status.ts'
import type { AppError } from './result.ts'

class DomainNotFoundError extends Error implements AppError {
  readonly code = 'DOMAIN_NOT_FOUND' as const
  readonly resource: string
  readonly identifier: string
  readonly httpStatusCode = HttpStatus.NOT_FOUND

  constructor(message: string, resource: string, identifier: string) {
    super(message)
    this.name = 'DomainNotFoundError'
    this.resource = resource
    this.identifier = identifier
  }
}

class DomainValidationError extends Error implements AppError {
  readonly code = 'DOMAIN_VALIDATION_ERROR' as const
  readonly constraint: string
  readonly httpStatusCode = HttpStatus.BAD_REQUEST

  constructor(message: string, constraint: string) {
    super(message)
    this.name = 'DomainValidationError'
    this.constraint = constraint
  }
}

class DomainConstraintViolationError extends Error implements AppError {
  readonly code = 'DOMAIN_CONSTRAINT_VIOLATION' as const
  readonly constraint: string
  readonly httpStatusCode = HttpStatus.CONFLICT

  constructor(message: string, constraint: string) {
    super(message)
    this.name = 'DomainConstraintViolationError'
    this.constraint = constraint
  }
}

class DomainBusinessRuleError extends Error implements AppError {
  readonly code = 'DOMAIN_BUSINESS_RULE_ERROR' as const
  readonly rule: string
  readonly context: Record<string, unknown>
  readonly httpStatusCode = HttpStatus.UNPROCESSABLE_ENTITY

  constructor(message: string, rule: string, context: Record<string, unknown>) {
    super(message)
    this.name = 'DomainBusinessRuleError'
    this.rule = rule
    this.context = context
  }
}

type DomainError =
  | DomainNotFoundError
  | DomainValidationError
  | DomainConstraintViolationError
  | DomainBusinessRuleError

// Factory functions for creating domain errors
const createDomainNotFoundError = (message: string, resource: string, identifier: string): DomainNotFoundError =>
  new DomainNotFoundError(message, resource, identifier)

const createDomainValidationError = (message: string, constraint: string): DomainValidationError =>
  new DomainValidationError(message, constraint)

const createDomainConstraintViolationError = (message: string, constraint: string): DomainConstraintViolationError =>
  new DomainConstraintViolationError(message, constraint)

export { createDomainConstraintViolationError, createDomainNotFoundError, createDomainValidationError }
export type { DomainError }
