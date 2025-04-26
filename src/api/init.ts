import { serve } from '@hono/node-server'
import type { Domain } from '../domain/init.ts'
import type { AppStateManager, Closable } from '../utils/app-state-manager.ts'
import { config } from '../utils/config.ts'
import { logger } from '../utils/logger.ts'
import { generateAllSpecs } from './generate-all-openapi-specs.ts'
import { initHttp } from './http/init.ts'

type Dependencies = {
  appStateManager: AppStateManager
  domain: Domain
}

const hostname = '0.0.0.0'

const initApi = async (dependencies: Dependencies) => {
  const app = await initHttp(dependencies)

  await generateAllSpecs(app)

  const { appStateManager } = dependencies

  const options: Parameters<typeof serve>[0] = {
    fetch: app.fetch,
    hostname,
    port: config.PORT,
  }

  const server = serve(options, ({ address, port }) => logger.info(`🚀 Server is running on http://${address}:${port}`))

  const closeableServer: Closable = {
    close: async () => {
      logger.info('📕 Closing server connections...')

      return new Promise((resolve) =>
        server.close(() => {
          logger.info('✔️ Server closed.')

          resolve(undefined)
        }),
      )
    },
  }

  appStateManager.registerClosableDependency(closeableServer)

  return { server }
}

export { initApi }
