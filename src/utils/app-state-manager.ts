import { logger } from './logger.ts'

const ExitCode = {
  ERROR: 1,
  OK: 0,
} as const

type Closable = {
  close(): Promise<void> | void
}

type MonitorableStatus = {
  isConnected: boolean
  name: string
}

type Monitorable = {
  isConnected(): Promise<boolean>
  name: string
}

class AppStateManager {
  private closeables: Closable[]
  private monitorables: Monitorable[]

  isShuttingDown: boolean

  constructor() {
    this.isShuttingDown = false
    this.closeables = []
    this.monitorables = []
    this.initializeSignalHandlers()
  }

  private async attemptGracefulShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      return
    }

    this.isShuttingDown = true

    logger.info(`❌ Received ${signal}, starting graceful shutdown...`)

    const results = await Promise.allSettled(this.closeables.map((dependency) => dependency.close()))
    const rejected = results.filter((result) => result.status === 'rejected')

    for (const rejection of rejected) {
      logger.warn(
        { rejection },
        '💥 Something went wrong. We failed to shutdown something gracefully. See the error for details.',
      )
    }

    if (rejected.length > 0) {
      process.exitCode = ExitCode.ERROR

      return
    }

    logger.info('🏁 Gracefully closed all connections.')
    process.exitCode = ExitCode.OK
  }

  private initializeSignalHandlers() {
    process.on('uncaughtException', (err) => logger.error({ err }, '💀 Fatal unhandled exception occurred'))

    process.on('unhandledRejection', (err) => {
      this.isShuttingDown = true

      const message = '😱 Oh no, there was an unhandled rejection'

      if (err instanceof Error) {
        logger.error({ err }, message)
      } else {
        logger.error({ reason: err }, message)
      }
    })

    // These are our final attempts to close things gracefully which we should not wait on to complete
    process.on('exit', () => this.attemptGracefulShutdown('exit'))
    process.on('SIGTERM', () => this.attemptGracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => this.attemptGracefulShutdown('SIGINT'))
  }

  registerClosableDependency(dependency: Closable): void {
    this.closeables.push(dependency)
  }

  registerMonitorableDependency(dependency: Monitorable): void {
    this.monitorables.push(dependency)
  }

  async getMonitorableDependencyStatuses(): Promise<MonitorableStatus[]> {
    const statusResults = await Promise.all(
      this.monitorables.map(
        async (dependency): Promise<MonitorableStatus> => ({
          isConnected: await dependency.isConnected(),
          name: dependency.name,
        }),
      ),
    )

    return statusResults
  }
}

export type { Closable, Monitorable, MonitorableStatus }
export { AppStateManager }
