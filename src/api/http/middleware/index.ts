import { Hono } from 'hono'
import { compress } from 'hono/compress'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { timeout } from 'hono/timeout'
import { timing } from 'hono/timing'
import type { Domain } from '../../../domain/index.ts'
import type { Env } from '../v1/models.ts'
import { makeDomainMiddleware } from './domain.ts'

const tenSecondsInMs = 10 * 1_000

const initMiddleware = (domain: Domain): Hono<Env> => {
  const app = new Hono<Env>()

  app.use(requestId())
  app.use(logger())
  app.use(cors())
  app.use(secureHeaders())
  app.use(timeout(tenSecondsInMs))
  app.use(compress())
  app.use(timing())
  app.use(makeDomainMiddleware(domain))

  return app
}

export { initMiddleware }
