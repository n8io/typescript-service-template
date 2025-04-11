import { Hono } from 'hono'
import { pinoLogger as logger } from 'hono-pino'
import { compress } from 'hono/compress'
import { cors } from 'hono/cors'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { timeout } from 'hono/timeout'
import { timing } from 'hono/timing'
import type { Domain } from '../../../domain/init.ts'
import { config } from '../../../utils/config.ts'
import type { Env } from '../v1/models.ts'
import { initDomain } from './domain/init.ts'
import { errorHandler } from './error-handler.ts'

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
      : /* v8 ignore next 2 */
        undefined,
  }

  app.use(requestId())
  app.use(logger({ pino }))
  app.use(cors())
  app.use(secureHeaders())
  app.use(timeout(tenSecondsInMs))
  app.use(compress())
  app.use(timing())
  app.use(initDomain(domain))

  // Handle thrown errors
  app.onError(errorHandler())

  return app
}

export { initMiddleware }
