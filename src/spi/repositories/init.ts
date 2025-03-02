import type { Config } from '../../config.ts'
import { ResourceRepository } from './resource/index.ts'

const initRepositories = async (config: Config) => {
  return {
    resource: new ResourceRepository({
      db: {
        connection: {
          url: config.DATABASE_URL,
        },
      },
    }),
  }
}

export { initRepositories }
