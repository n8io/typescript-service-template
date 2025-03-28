const ExitCode = {
  ERROR: 1,
  OK: 0,
} as const

type Closable = {
  close(): void
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
  private closableDependencies: Closable[]
  private monitorableDependencies: Monitorable[]

  isShuttingDown: boolean

  constructor() {
    this.isShuttingDown = false
    this.closableDependencies = []
    this.monitorableDependencies = []
    this.initializeSignalHandlers()
  }

  private async attemptGracefulShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      return
    }

    this.isShuttingDown = true

    console.info(`\n❌ Received ${signal}, starting graceful shutdown...`)

    try {
      await Promise.all(this.closableDependencies.map((dependency) => dependency.close()))

      console.info('🏁 Gracefully closed connections.')

      process.exitCode = ExitCode.OK
    } catch (error: unknown) {
      console.warn('💥 Something went wrong. We failed to shutdown gracefully.', error as Error)

      process.exitCode = ExitCode.ERROR
    }
  }

  private initializeSignalHandlers() {
    process.on('uncaughtException', (error) => console.error('💀 Fatal unhandled exception occurred', error))

    process.on('unhandledRejection', (reason) => {
      this.isShuttingDown = true

      const message = '😱 Oh no, there was an unhandled rejection'

      if (reason instanceof Error) {
        console.error(message, reason)
      } else {
        console.error(message, { reason })
      }
    })

    // These are our final attempts to close things gracefully which we should not wait on to complete
    process.on('exit', () => this.attemptGracefulShutdown('exit'))
    process.on('SIGTERM', () => this.attemptGracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => this.attemptGracefulShutdown('SIGINT'))
  }

  registerClosableDependency(dependency: Closable): void {
    this.closableDependencies.push(dependency)
  }

  registerMonitorableDependency(dependency: Monitorable): void {
    this.monitorableDependencies.push(dependency)
  }

  async getMonitorableDependencyStatuses(): Promise<MonitorableStatus[]> {
    const statusResults = await Promise.all(
      this.monitorableDependencies.map(
        async (dependency): Promise<MonitorableStatus> => ({
          isConnected: await dependency.isConnected(),
          name: dependency.name,
        }),
      ),
    )

    return statusResults
  }
}

export type { Closable }
export { AppStateManager }
