import { type LoggerOptions, pino } from 'pino'

const prettyTransport = {
  options: {
    colorize: true,
    ignore: 'pid,hostname',
  },
  target: 'pino-pretty',
} as const

const getPinoConfig = (): LoggerOptions => {
  // biome-ignore lint/nursery/noProcessEnv: Access process env directly because this is top level, core utility
  const { LOG_LEVEL, NODE_ENV } = process.env
  const enabled = NODE_ENV !== 'test'
  const areLogsPretty = NODE_ENV !== 'production'
  const level = LOG_LEVEL ?? 'info'

  /* v8 ignore next 1 */
  const transport = areLogsPretty ? prettyTransport : undefined

  return {
    enabled,
    level,
    transport,
  }
}

const createLogger = () => pino(getPinoConfig())
const logger = createLogger()

export { logger, createLogger, getPinoConfig }
