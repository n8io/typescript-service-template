import * as Pino from 'hono-pino'
import { exampleConfig } from '../../../models/config.ts'

vi.mock('hono-pino', () => ({ pinoLogger: vi.fn() }))
vi.mock('../../../utils/url-search-params/to-object.ts')

vi.mock('../../../utils/config.ts', async () => ({
  config: exampleConfig(),
}))

import { logger } from './logger.ts'

describe('logger middleware', () => {
  it('should create a logger with default settings', () => {
    const pinoLogger = vi.spyOn(Pino, 'pinoLogger').mockReturnValue(() => Promise.resolve(undefined))

    logger()

    expect(pinoLogger).toHaveBeenCalledWith({
      http: {
        onReqBindings: expect.any(Function),
      },
      pino: {
        enabled: expect.any(Boolean),
        level: 'info',
        transport: {
          options: {
            colorize: true,
            ignore: 'pid,hostname',
          },
          target: 'pino-pretty',
        },
      },
    })
  })
})
