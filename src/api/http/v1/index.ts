import { Hono } from 'hono'
import type { Domain } from '../../../domain/init.ts'
import { initMiddleware } from './middleware.ts'
import type { Env } from './models.ts'
import { resources } from './routes/resources.ts'

const makeV1 = (domain: Domain) => {
  const v1 = new Hono<Env>()

  initMiddleware(v1, domain)

  v1.route('/resources', resources)

  return v1
}

export { makeV1 }
