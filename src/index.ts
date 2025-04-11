import { initApi } from './api/init.ts'
import { initDomain } from './domain/init.ts'
import { initSpi } from './spi/init.ts'
import { AppStateManager } from './utils/app-state-manager.ts'
import { config } from './utils/config.ts'

const start = async () => {
  const appStateManager = new AppStateManager()
  const spi = await initSpi({ appStateManager, config })
  const domain = await initDomain(spi)
  const api = await initApi(domain)

  appStateManager.registerClosableDependency(api.server)

  return appStateManager
}

export { start }
