import { Hono } from 'hono'
import { pinoLogger as logger } from 'hono-pino'
import { compress } from 'hono/compress'
import { cors } from 'hono/cors'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { timeout } from 'hono/timeout'
import { timing } from 'hono/timing'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { ZodError } from 'zod'
import type { Domain } from '../../../domain/init.ts'
import { CustomError } from '../../../models/custom-error.ts'
import { ErrorCode } from '../../../models/error-code.ts'
import { config } from '../../../utils/config.ts'
import type { Env } from '../v1/models.ts'
import { initDomain } from './domain/init.ts'

const tenSecondsInMs = 10 * 1_000

const initMiddleware = (domain: Domain): Hono<Env> => {
  const app = new Hono<Env>()
  const areLogsPretty = process.env.NODE_ENV !== 'production'

  const pino = {
    enabled: !config.IS_TEST_CONTEXT,
    level: 'info',
    transport: areLogsPretty
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        }
      : undefined,
  }

  app.use(requestId())
  app.use(logger({ pino }))
  app.use(cors())
  app.use(secureHeaders())
  app.use(timeout(tenSecondsInMs))
  app.use(compress())
  app.use(timing())
  app.use(initDomain(domain))

  app.onError((err, c) => {
    if (err instanceof CustomError) {
      console.error(err)

      return c.json(
        {
          code: err.code,
          message: err.message,
        },
        err.httpStatusCode as ContentfulStatusCode,
      )
    }

    if (err instanceof ZodError) {
      console.error('Validation error:', err.message)

      return c.json(
        {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Validation error',
          details: err.errors,
        },
        400,
      )
    }

    // console.error('Unhandled exception:', err)

    return c.json(
      {
        code: ErrorCode.UNHANDLED_EXCEPTION,
        message: 'An unhandled exception occurred',
      },
      500,
    )
  })

  return app
}

export { initMiddleware }
