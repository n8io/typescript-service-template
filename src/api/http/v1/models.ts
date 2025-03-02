import type { ResourceService } from '../../../domain/services/resources.ts'

type Env = {
  // biome-ignore lint/style/useNamingConvention: <explanation>
  Variables: {
    services: {
      resource: ResourceService
    }
  }
}

export type { Env }
