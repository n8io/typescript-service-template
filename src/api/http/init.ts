import { httpInstrumentationMiddleware } from '@hono/otel'
import pkgJson from '../../../package.json' with { type: 'json' }
import type { Domain } from '../../domain/init.ts'
import type { AppStateManager } from '../../utils/app-state-manager.ts'
import { initCommon } from './common/init.ts'
import { generateAllOpenApiSpecs } from './generate-all-openapi-specs.ts'
import { REQUEST_HEADER_CLIENT_ID, REQUEST_HEADER_REQUEST_ID } from './models/request.ts'
import { makeApp } from './v1/app.ts'
import { initV1 } from './v1/init.ts'

type Dependencies = {
  appStateManager: AppStateManager
  domain: Domain
}

const initHttp = async ({ appStateManager, domain }: Dependencies) => {
  const app = makeApp({ strict: false })

  const instrumentationConfig = {
    serviceName: pkgJson.name,
    serviceVersion: pkgJson.version,
    captureRequestHeaders: [REQUEST_HEADER_CLIENT_ID, REQUEST_HEADER_REQUEST_ID],
  }

  app.route('/', initCommon({ appStateManager }))
  app.use(httpInstrumentationMiddleware(instrumentationConfig))
  app.route('/', initV1({ app, domain }))

  await generateAllOpenApiSpecs(app)

  return app
}

export { initHttp }
