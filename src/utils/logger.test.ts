import { pino } from 'pino'
import { createLogger } from './logger.ts'

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
      level: 'info',
      transport: undefined,
    })
  })
})
