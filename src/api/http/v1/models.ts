import type { Domain } from '../../../domain/init.ts'

type Env = {
  // biome-ignore lint/style/useNamingConvention: Hono uses PascalCase
  Variables: {
    clientId: string
    requestBody: unknown
    services: Domain['services']
  }
}

const version = 'v1'

export type { Env }
export { version }
