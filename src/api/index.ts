import { serve } from '@hono/node-server'
import type { Domain } from '../domain/index.ts'
import type { Closable } from '../utils/app-state-manager/index.ts'
import { makeApp } from './http/app.ts'

const initApi = async (domain: Domain) => {
  const app = makeApp(domain)

  const options: Parameters<typeof serve>[0] = {
    fetch: app.fetch,
    port: 3000,
  }

  const server = serve(options, (info) => console.log(`🚀 Server is running on http://localhost:${info.port}`))

  const closeableServer: Closable = {
    close: () =>
      new Promise((resolve) => {
        server.close(() => {
          console.log('📕 Server closed.')

          resolve(undefined)
        })
      }),
  }

  return { server: closeableServer }
}

export { initApi }
