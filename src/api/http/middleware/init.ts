import { compress } from 'hono/compress'
import { cors } from 'hono/cors'
import { requestId } from 'hono/request-id'
import { timeout } from 'hono/timeout'
import { timing } from 'hono/timing'
import type { Domain } from '../../../domain/init.ts'
import type { makeApp } from '../v1/app.ts'
import { initDomain } from './domain/init.ts'
import { errorHandler } from './error-handler.ts'
import { logger, requestBodyMiddleware } from './logger.ts'

const tenSecondsInMs = 10 * 1_000

type Dependencies = {
  app: ReturnType<typeof makeApp>
  domain: Domain
}

const initMiddleware = ({ app, domain }: Dependencies): Dependencies['app'] => {
  app.use(requestId())
  app.use(requestBodyMiddleware)
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
