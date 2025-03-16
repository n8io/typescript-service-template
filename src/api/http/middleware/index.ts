import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import type { Domain } from '../../../domain/index.ts'
import type { Env } from '../v1/models.ts'
import { makeDomainMiddleware } from './domain.ts'

const initMiddleware = (domain: Domain): Hono<Env> => {
  const app = new Hono<Env>()

  app.use(logger())
  app.use(cors())
  app.use(makeDomainMiddleware(domain))

  return app
}

export { initMiddleware }
