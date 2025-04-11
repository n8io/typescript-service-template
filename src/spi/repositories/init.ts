import type { AppStateManager } from '../../utils/app-state-manager.ts'
import type { Config } from '../../utils/config.ts'
import { makeDatabase, runMigrations } from './database/init.ts'
import { ResourceRepository } from './resource.ts'

type RepositoryDependencies = {
  appStateManager: AppStateManager
  config: Config
}

const initRepositories = async (dependencies: RepositoryDependencies) => {
  const db = makeDatabase(dependencies)

  await runMigrations(db)

  return {
    resource: new ResourceRepository({ db }),
  }
}

export { initRepositories }
