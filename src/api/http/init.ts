import type { Domain } from '../../domain/init.ts'
import type { AppStateManager } from '../../utils/app-state-manager.ts'
import { initCommon } from './common/init.ts'
import { makeApp } from './v1/app.ts'
import { initV1 } from './v1/init.ts'

type Dependencies = {
  appStateManager: AppStateManager
  domain: Domain
}

const initHttp = ({ appStateManager, domain }: Dependencies) => {
  const app = makeApp({ strict: false })

  app.route('/', initCommon({ appStateManager }))
  app.route('/', initV1({ app, domain }))

  return app
}

export { initHttp }
