import { initApi } from './api/init.ts'
import { AppStateManager } from './app-state-manager.ts'
import { config } from './config.ts'
import { initDomain } from './domain/init.ts'
import { initSpi } from './spi/init.ts'

const start = async () => {
  const appState = new AppStateManager()

  const spi = await initSpi(config)
  const domain = await initDomain(spi)
  const api = await initApi(domain)

  appState.registerClosableDependency(api.server)
}

export { start }
