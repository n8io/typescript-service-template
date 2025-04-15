import { Hono } from 'hono'
import { compress } from 'hono/compress'
import { cors } from 'hono/cors'
import { requestId } from 'hono/request-id'
import { timeout } from 'hono/timeout'
import { timing } from 'hono/timing'
import type { Domain } from '../../../domain/init.ts'
import type { Env } from '../v1/models.ts'
import { initDomain } from './domain/init.ts'
import { errorHandler } from './error-handler.ts'
import { logger } from './logger.ts'

const tenSecondsInMs = 10 * 1_000

const initMiddleware = (domain: Domain): Hono<Env> => {
  const app = new Hono<Env>()

  app.use(requestId())
  app.use(logger())
  app.use(cors())
  app.use(timeout(tenSecondsInMs))
  app.use(compress())
  app.use(timing())

  // Initialize the domain with the app context
  app.use(initDomain(domain))

  // Handle thrown errors
  app.onError(errorHandler())

  return app
}

export { initMiddleware }
