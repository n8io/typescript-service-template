import { Hono } from 'hono'
import type { AppStateManager } from '../../../utils/app-state-manager.ts'
import { favicon } from './favicon.ts'
import { health } from './health.ts'
import { root } from './root.ts'

type Dependencies = {
  appStateManager: AppStateManager
}

const initCommon = ({ appStateManager }: Dependencies) => {
  const app = new Hono({ strict: false })

  app.get('/', root())
  app.get('/favicon.ico', favicon('💚'))
  app.get('/health', health({ appStateManager }))

  return app
}

export { initCommon }
