import type { Domain } from '../../../domain/init.ts'
import { initMiddleware } from '../middleware/init.ts'
import type { makeApp } from './app.ts'
import { docs } from './docs.ts'
import { version } from './models.ts'
import { openapi } from './openapi/init.ts'
import { resources } from './routes/resources.ts'

type Dependencies = {
  app: ReturnType<typeof makeApp>
  domain: Domain
}

const initV1 = (dependencies: Dependencies) => {
  const { app } = dependencies

  initMiddleware(dependencies)

  app.route(`/api/${version}/resources`, resources)

  // This must be the last to capture all the
  // applied routes and models
  app.route(`/api/${version}/docs`, docs)
  app.get(`/api/${version}/openapi`, openapi(app))

  return app
}

export { initV1 }
