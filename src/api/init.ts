import { serve } from '@hono/node-server'
import type { Closable } from '../app-state-manager.ts'
import type { Domain } from '../domain/init.ts'
import { makeServer } from './http/server.ts'

type Api = {
  server: ReturnType<typeof serve>
}

const initApi = async (domain: Domain) => {
  const app = makeServer(domain)

  const options: Parameters<typeof serve>[0] = {
    fetch: app.fetch,
    port: 3000,
  }

  const server = serve(options, (info) => console.log(`🚀 Server is running on http://localhost:${info.port}`))

  const closeableServer: Closable = {
    close: server.close,
  }

  return { server: closeableServer }
}

export { initApi }
export type { Api }
