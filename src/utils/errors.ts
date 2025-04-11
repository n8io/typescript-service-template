import { ZodError } from 'zod'
import { CustomError } from '../models/custom-error.ts'

const isCustomError = (error: unknown) => error instanceof CustomError
const isValidationError = (error: unknown): boolean => error instanceof ZodError

export { isCustomError, isValidationError }
