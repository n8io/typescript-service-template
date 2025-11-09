// Must be in the root of the project to make sure all schemas have access to the openapi extension
// This import extends Zod schemas with OpenAPI metadata methods
import 'zod-openapi/extend'

import { initApi } from './api/init.ts'
import { initDomain } from './domain/init.ts'
import { initSpi } from './spi/init.ts'
import { AppStateManager } from './utils/app-state-manager.ts'
import { config } from './utils/config.ts'

/**
 * Initializes and starts the application.
 *
 * Initialization follows a dependency injection pattern with layers initialized in order:
 * 1. AppStateManager - Manages application lifecycle and graceful shutdown
 * 2. SPI Layer - Infrastructure implementations (database, external services)
 * 3. Domain Layer - Business logic services (depends on SPI)
 * 4. API Layer - HTTP routes and middleware (depends on Domain)
 *
 * This order ensures dependencies are available when needed and follows the
 * Domain-Driven Design architecture pattern.
 *
 * @returns The AppStateManager instance for managing application state
 */
const start = async () => {
  // Initialize application state manager for lifecycle management
  const appStateManager = new AppStateManager()

  // Initialize SPI layer (infrastructure) - requires appStateManager and config
  const spi = await initSpi({ appStateManager, config })

  // Initialize domain layer (business logic) - requires SPI repositories
  const domain = await initDomain(spi)

  // Initialize API layer (HTTP endpoints) - requires domain services
  // The API is assigned to _api to indicate it's initialized but not directly used here
  // The server is started within initApi
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
