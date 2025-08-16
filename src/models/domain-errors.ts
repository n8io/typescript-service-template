import type { AppError } from './result.ts'

type DomainNotFoundError = AppError & {
  code: 'DOMAIN_NOT_FOUND'
  resource: string
  identifier: string
}

type DomainValidationError = AppError & {
  code: 'DOMAIN_VALIDATION_ERROR'
  field: string
  value: unknown
  constraint: string
}

type DomainBusinessRuleError = AppError & {
  code: 'DOMAIN_BUSINESS_RULE_ERROR'
  rule: string
  context: Record<string, unknown>
}

type DomainError = DomainNotFoundError | DomainValidationError | DomainBusinessRuleError

// Factory functions for creating domain errors
const createDomainNotFoundError = (message: string, resource: string, identifier: string): DomainNotFoundError => ({
  code: 'DOMAIN_NOT_FOUND',
  message,
  resource,
  identifier,
  httpStatusCode: 404,
})

const createDomainValidationError = (
  message: string,
  field: string,
  value: unknown,
  constraint: string,
): DomainValidationError => ({
  code: 'DOMAIN_VALIDATION_ERROR',
  message,
  field,
  value,
  constraint,
  httpStatusCode: 400,
})

const createDomainBusinessRuleError = (
  message: string,
  rule: string,
  context: Record<string, unknown>,
): DomainBusinessRuleError => ({
  code: 'DOMAIN_BUSINESS_RULE_ERROR',
  message,
  rule,
  context,
  httpStatusCode: 422,
})

export { createDomainBusinessRuleError, createDomainNotFoundError, createDomainValidationError }
export type { DomainBusinessRuleError, DomainError, DomainNotFoundError, DomainValidationError }
