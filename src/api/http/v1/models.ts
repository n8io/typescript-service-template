import type { ResourceService } from '../../../domain/services/resource.ts'

type Env = {
  // biome-ignore lint/style/useNamingConvention: Hono uses PascalCase
  Variables: {
    services: {
      resource: ResourceService
    }
  }
}

export type { Env }
