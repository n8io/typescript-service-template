import type { Config } from '../../utils/config.ts'
import { makeDatabase, runMigrations } from './database/index.ts'
import { ResourceRepository } from './resource.ts'

const initRepositories = async (config: Config) => {
  const db = makeDatabase(config)

  await runMigrations(db)

  return {
    resource: new ResourceRepository({ db }),
  }
}

export { initRepositories }
