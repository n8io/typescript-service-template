import type { Domain } from '../../../domain/init.ts'

type Env = {
  // biome-ignore lint/style/useNamingConvention: Hono uses PascalCase
  Variables: {
    services: Domain['services']
  }
}

export type { Env }
