import type { Domain } from '../../domain/init.ts'
import type { AppStateManager } from '../../utils/app-state-manager.ts'
import { initCommon } from './common/init.ts'
import { generateAllOpenApiSpecs } from './generate-all-openapi-specs.ts'
import { makeApp } from './v1/app.ts'
import { initV1 } from './v1/init.ts'

type Dependencies = {
  appStateManager: AppStateManager
  domain: Domain
}

const initHttp = async ({ appStateManager, domain }: Dependencies) => {
  const app = makeApp({ strict: false })

  app.route('/', initCommon({ appStateManager }))
  app.route('/', initV1({ app, domain }))

  await generateAllOpenApiSpecs(app)

  return app
}

export { initHttp }
