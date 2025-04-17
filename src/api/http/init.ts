import { Hono } from 'hono'
import type { Domain } from '../../domain/init.ts'
import type { AppStateManager } from '../../utils/app-state-manager.ts'
import { health } from './middleware/health.ts'
import { initV1 } from './v1/init.ts'
import type { Env } from './v1/models.ts'

type Dependencies = {
  appStateManager: AppStateManager
  domain: Domain
}

const initHttp = ({ appStateManager, domain }: Dependencies) => {
  const app = new Hono<Env>({ strict: false })

  app.get('/health', health({ appStateManager }))
  app.route('/api/v1', initV1(domain))

  return app
}

export { initHttp }
