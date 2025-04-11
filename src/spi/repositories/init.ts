import type { AppStateManager } from '../../utils/app-state-manager.ts'
import type { Config } from '../../utils/config.ts'
import { initDatabase } from './database/init.ts'
import { runMigrations } from './database/run-migrations.ts'
import { ResourceRepository } from './resource.ts'

type RepositoryDependencies = {
  appStateManager: AppStateManager
  config: Config
}

const initRepositories = async (dependencies: RepositoryDependencies) => {
  const db = initDatabase(dependencies)

  await runMigrations(db)

  return {
    resource: new ResourceRepository({ db }),
  }
}

export { initRepositories }
