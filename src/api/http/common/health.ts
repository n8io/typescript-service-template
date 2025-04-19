import type { Handler } from 'hono'
import { LRUCache } from 'lru-cache'
import type { AppStateManager } from '../../../utils/app-state-manager.ts'

type Dependencies = {
  appStateManager: AppStateManager
}

const thirtySecondsInMs = 30 * 1_000

const cache = new LRUCache({
  max: 1,
  ttl: thirtySecondsInMs,
})

const getDependencyStatuses = async (appStateManager: AppStateManager) => {
  type DependencyStatus = Awaited<ReturnType<typeof appStateManager.getMonitorableDependencyStatuses>>[number]
  let dependencies: DependencyStatus[]

  if (cache.has('dependencies')) {
    dependencies = cache.get('dependencies') as DependencyStatus[]
  } else {
    dependencies = await appStateManager.getMonitorableDependencyStatuses()
    cache.set('dependencies', dependencies)
  }

  return dependencies
}

const health =
  ({ appStateManager }: Dependencies): Handler =>
  async (c) => {
    const dependencies = await getDependencyStatuses(appStateManager)
    const areDependenciesConnected = dependencies.every(({ isConnected }) => isConnected)
    const isAppHealthy = !appStateManager.isShuttingDown && areDependenciesConnected

    c.status(isAppHealthy ? 200 : 503)

    return c.json({
      timestamp: new Date(),
      isShuttingDown: appStateManager.isShuttingDown,
      dependencies,
    })
  }

export { cache, health }
