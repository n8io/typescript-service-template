import { initApi } from './api/index.ts'
import { initDomain } from './domain/index.ts'
import { initSpi } from './spi/index.ts'
import { AppStateManager } from './utils/app-state-manager/index.ts'
import { config } from './utils/config.ts'

const start = async () => {
  const appState = new AppStateManager()
  const spi = await initSpi(config)
  const domain = await initDomain(spi)
  const api = await initApi(domain)

  appState.registerClosableDependency(api.server)
}

start()
