import { context, trace } from '@opentelemetry/api'
import { type LoggerOptions, pino } from 'pino'

const pretty = {
  options: {
    colorize: true,
    ignore: 'pid,hostname',
  },
  target: 'pino-pretty',
} as const

const getBindings = () => {
  const span = trace.getSpan(context.active())
  const spanContext = span?.spanContext()

  if (!spanContext) {
    return {}
  }

  return {
    // biome-ignore lint/style/useNamingConvention: <explanation>
    span_id: spanContext.spanId,
    // biome-ignore lint/style/useNamingConvention: <explanation>
    trace_id: spanContext.traceId,
  }
}

const getPinoConfig = (): LoggerOptions => {
  // biome-ignore lint/nursery/noProcessEnv: Access process env directly because this is a top level, core utility
  const { LOG_LEVEL: level = 'info', NODE_ENV } = process.env
  const enabled = NODE_ENV !== 'test'
  const areLogsPretty = NODE_ENV !== 'production'

  /* v8 ignore next 1 */
  const transport = areLogsPretty ? pretty : undefined
  const formatters = { bindings: getBindings }

  return {
    enabled,
    formatters,
    level,
    transport,
  }
}

const createLogger = () => pino(getPinoConfig())
const logger = createLogger()

export { logger, createLogger, getBindings, getPinoConfig }
