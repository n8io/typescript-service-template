import { Hono } from 'hono'
import type { Domain } from '../../domain/init.ts'
import { initV1 } from './v1/init.ts'
import type { Env } from './v1/models.ts'

const makeApp = (domain: Domain) => {
  const app = new Hono<Env>({ strict: false })

  app.get('/health', (c) => c.json({ message: 'OK' }))
  app.route('/api/v1', initV1(domain))

  return app
}

export { makeApp }
