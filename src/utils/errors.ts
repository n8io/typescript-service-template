import { ZodError } from 'zod'
import { CustomError } from '../models/custom-error.ts'

const isCustomError = (error: unknown) => error instanceof CustomError
const isValidationError = (error: unknown): boolean => error instanceof ZodError

const MAX_STACK_TRACE_LINES = 10 as const

/**
 * Formats an error for logging with simplified details:
 * - Message
 * - Error code (if available)
 * - Limited stack trace (4 lines)
 * - No deeply nested causes
 */
const formatErrorForLogging = (error: unknown): Record<string, unknown> => {
  if (error instanceof Error) {
    const formatted: Record<string, unknown> = {
      message: error.message,
      name: error.name,
    }

    // Add error code if it's a CustomError
    if (isCustomError(error)) {
      const customError = error as CustomError
      formatted.code = customError.code
    }

    // Limit stack trace to first 4 lines and make paths relative
    if (error.stack) {
      const stackLines = error.stack.split('\n')
      // Take the first line (error message) + MAX_STACK_TRACE_LINES more lines
      const limitedStack = stackLines.slice(0, MAX_STACK_TRACE_LINES)
      // Remove file:// protocol and Docker absolute path prefix to make paths clickable in editor
      // Converts "file:///app/src/file.ts:123:45" to "src/file.ts:123:45"
      formatted.stack = limitedStack.map((line) => line.replace(/file:\/\/\/app\//g, '')).join('\n')
    }

    return formatted
  }

  // For non-Error objects, just return as-is
  return { error }
}

export { formatErrorForLogging, isCustomError, isValidationError }
