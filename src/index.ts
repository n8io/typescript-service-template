import { initApi } from './api/init.ts'
import { initDomain } from './domain/init.ts'
import { initSpi } from './spi/init.ts'
import { AppStateManager } from './utils/app-state-manager.ts'
import { config } from './utils/config.ts'

const start = async () => {
  const appStateManager = new AppStateManager()
  const spi = await initSpi({ appStateManager, config })
  const domain = await initDomain(spi)
  const _api = await initApi({ appStateManager, domain })

  return appStateManager
}

/* v8 ignore start */
if (config.NODE_ENV !== 'test') {
  // We disable this code when running tests
  start()
}
/* v8 ignore end */

export { start }
