import { serve } from '@hono/node-server'
import type { Domain } from '../domain/init.ts'
import type { Closable } from '../utils/app-state-manager.ts'
import { logger } from '../utils/logger.ts'
import { initHttp } from './http/init.ts'

const initApi = (domain: Domain) => {
  const app = initHttp(domain)

  const options: Parameters<typeof serve>[0] = {
    fetch: app.fetch,
    hostname: '0.0.0.0',
    port: 3000,
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

  return { server: closeableServer }
}

export { initApi }
