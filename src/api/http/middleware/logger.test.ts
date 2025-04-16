import type { Context } from 'hono'
import * as Pino from 'hono-pino'
import { exampleConfig } from '../../../models/config.ts'
import * as GetPinoConfig from '../../../utils/logger.ts'
import * as Utils from '../../../utils/url-search-params/to-object.ts'
import { logger, onReqBindings } from './logger.ts'

vi.mock('hono-pino', () => ({ pinoLogger: vi.fn() }))
vi.mock('../../../utils/url-search-params/to-object.ts')
vi.mock('../../../utils/logger.ts')

vi.mock('../../../utils/config.ts', async () => ({
  config: exampleConfig(),
}))

describe('logger', () => {
  const mockPinoConfig = {
    enabled: true,
    level: 'info',
    transport: undefined,
  }

  it('should create a logger with the expected params', () => {
    const pinoLogger = vi.spyOn(Pino, 'pinoLogger').mockReturnValue(() => Promise.resolve(undefined))
    const getPinoConfigSpy = vi.spyOn(GetPinoConfig, 'getPinoConfig').mockReturnValue(mockPinoConfig)

    vi.stubEnv('NODE_ENV', 'production')

    logger()

    expect(pinoLogger).toHaveBeenCalledWith({
      http: {
        onReqBindings: expect.any(Function),
      },
      pino: mockPinoConfig,
    })

    expect(getPinoConfigSpy).toHaveBeenCalledTimes(1)
  })
})

describe('onReqBindings', () => {
  it('should return the correct request bindings', () => {
    const urlSearchParamsToObjectSpy = vi.spyOn(Utils, 'urlSearchParamsToObject').mockReturnValue({
      param1: 'value1',
      param2: 'value2',
    })

    const mockContext = {
      req: {
        url: 'http://example.com/test?param1=value1&param2=value2',
        method: 'GET',
      },
    } as Context

    const expectedBindings = {
      req: {
        method: 'GET',
        search: {
          param1: 'value1',
          param2: 'value2',
        },
        url: '/test?param1=value1&param2=value2',
      },
    }

    const result = onReqBindings(mockContext)

    expect(result).toEqual(expectedBindings)
    expect(urlSearchParamsToObjectSpy).toHaveBeenCalledWith(new URL(mockContext.req.url).searchParams)
  })
})
