import { serve } from '@hono/node-server'
import type { Domain } from '../domain/init.ts'
import type { AppStateManager, Closable } from '../utils/app-state-manager.ts'
import { config } from '../utils/config.ts'
import { logger } from '../utils/logger.ts'
import { initHttp } from './http/init.ts'

type Dependencies = {
  appStateManager: AppStateManager
  domain: Domain
}

const hostname = '0.0.0.0'

const initApi = (dependencies: Dependencies) => {
  const app = initHttp(dependencies)

  const options: Parameters<typeof serve>[0] = {
    fetch: app.fetch,
    hostname,
    port: config.PORT,
  }

  const server = serve(options, (info) => logger.info(`🚀 Server is running on http://localhost:${info.port}`))

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

  dependencies.appStateManager.registerClosableDependency(closeableServer)

  return { server }
}

export { initApi }
