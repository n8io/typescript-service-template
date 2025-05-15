import { context, trace } from '@opentelemetry/api'
import { AsyncHooksContextManager } from '@opentelemetry/context-async-hooks'
import { BasicTracerProvider } from '@opentelemetry/sdk-trace-node'
import { pino } from 'pino'
import { createLogger, getBindings } from './logger.ts'

vi.mock('pino', () => ({
  pino: vi.fn(),
}))

describe('createLogger', () => {
  const mockedPino = pino as unknown as ReturnType<typeof createLogger>

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('uses default level "info" and pretty transport in non-production', () => {
    vi.stubEnv('NODE_ENV', 'development')

    createLogger()

    expect(mockedPino).toHaveBeenCalledWith({
      enabled: expect.any(Boolean),
      formatters: expect.objectContaining({
        bindings: expect.any(Function),
      }),
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
        },
      },
    })
  })

  it('uses LOG_LEVEL if set', () => {
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('LOG_LEVEL', 'debug')

    createLogger()

    expect(mockedPino).toHaveBeenCalledWith(expect.objectContaining({ level: 'debug' }))
  })

  it('does not use transport in production', () => {
    vi.stubEnv('NODE_ENV', 'production')

    createLogger()

    expect(mockedPino).toHaveBeenCalledWith({
      enabled: true,
      formatters: expect.objectContaining({
        bindings: expect.any(Function),
      }),
      level: 'info',
      transport: undefined,
    })
  })
})

describe('getBindings', () => {
  beforeEach(() => {
    // Enable context propagation for context.with to work
    const contextManager = new AsyncHooksContextManager()
    context.setGlobalContextManager(contextManager.enable())

    const provider = new BasicTracerProvider()
    trace.setGlobalTracerProvider(provider)
  })

  it('should return empty object when no span is active', () => {
    expect(getBindings()).toEqual({})
  })

  it('should return trace_id and span_id when span is active', () => {
    const tracer = trace.getTracer('test')
    const span = tracer.startSpan('test-span')

    // biome-ignore lint/suspicious/noExplicitAny: ???
    let result: any

    context.with(trace.setSpan(context.active(), span), () => {
      result = getBindings()
    })

    const { traceId, spanId } = span.spanContext()

    expect(result).toEqual({
      // biome-ignore lint/style/useNamingConvention: ???
      span_id: spanId,
      // biome-ignore lint/style/useNamingConvention: ???
      trace_id: traceId,
    })

    span.end()
  })
})
