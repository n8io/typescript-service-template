import { Hono } from 'hono'
import type { Domain } from '../../domain/index.ts'
import { makeV1 } from './v1/index.ts'
import type { Env } from './v1/models.ts'

const makeApp = (domain: Domain) => {
  const app = new Hono<Env>().basePath('/api')

  app.route('/v1', makeV1(domain))

  return app
}

export { makeApp }
