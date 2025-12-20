const ErrorMessage = {
  VALIDATION_ERROR: 'Validation error',
  DATABASE_OPERATION_FAILED: 'Database operation failed',
  INTERNAL_SERVER_ERROR: 'An internal server error occurred, see logs for more details.',
  UNHANDLED_EXCEPTION: 'An unhandled exception occurred, see logs for more details.',
} as const

type ErrorMessage = (typeof ErrorMessage)[keyof typeof ErrorMessage]

export { ErrorMessage }
