import { Hono } from 'hono'
import type { Domain } from '../../domain/index.ts'
import { makeV1 } from './v1/index.ts'
import type { Env } from './v1/models.ts'

const makeApp = (domain: Domain) => {
  const app = new Hono<Env>()

  app.get('/health', (c) => c.json({ message: 'OK' }))
  app.route('/api/v1', makeV1(domain))

  return app
}

export { makeApp }
