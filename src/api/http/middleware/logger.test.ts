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
        header: vi.fn().mockReturnValue(null),
        method: 'GET',
        raw: {
          clone: vi.fn(),
        },
        url: 'http://example.com/test?param1=value1&param2=value2',
      },
      get: vi.fn().mockReturnValue(undefined),
    } as unknown as Context

    const expectedBindings = {
      req: {
        body: undefined,
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
    expect(mockContext.get).toHaveBeenCalledWith('requestBody')
  })

  it('should include request body for POST requests with JSON content', () => {
    const urlSearchParamsToObjectSpy = vi.spyOn(Utils, 'urlSearchParamsToObject').mockReturnValue({})
    const mockBody = { name: 'test', value: 123 }

    const mockContext = {
      req: {
        header: vi.fn().mockReturnValue('application/json'),
        method: 'POST',
        raw: {
          clone: vi.fn(),
        },
        url: 'http://example.com/test',
      },
      get: vi.fn().mockReturnValue(mockBody),
    } as unknown as Context

    const result = onReqBindings(mockContext)

    expect(result.req.body).toEqual(mockBody)
    expect(urlSearchParamsToObjectSpy).toHaveBeenCalled()
    expect(mockContext.get).toHaveBeenCalledWith('requestBody')
  })

  it('should include request body for PUT requests with text content', () => {
    const urlSearchParamsToObjectSpy = vi.spyOn(Utils, 'urlSearchParamsToObject').mockReturnValue({})
    const mockBody = 'plain text body'

    const mockContext = {
      req: {
        header: vi.fn().mockReturnValue('text/plain'),
        method: 'PUT',
        raw: {
          clone: vi.fn(),
        },
        url: 'http://example.com/test',
      },
      get: vi.fn().mockReturnValue(mockBody),
    } as unknown as Context

    const result = onReqBindings(mockContext)

    expect(result.req.body).toBe(mockBody)
    expect(urlSearchParamsToObjectSpy).toHaveBeenCalled()
    expect(mockContext.get).toHaveBeenCalledWith('requestBody')
  })

  it('should not include body for GET requests', () => {
    const urlSearchParamsToObjectSpy = vi.spyOn(Utils, 'urlSearchParamsToObject').mockReturnValue({})

    const mockContext = {
      req: {
        header: vi.fn().mockReturnValue(null),
        method: 'GET',
        raw: {
          clone: vi.fn(),
        },
        url: 'http://example.com/test',
      },
      get: vi.fn().mockReturnValue(undefined),
    } as unknown as Context

    const result = onReqBindings(mockContext)

    expect(result.req.body).toBeUndefined()
    expect(urlSearchParamsToObjectSpy).toHaveBeenCalled()
    expect(mockContext.get).toHaveBeenCalledWith('requestBody')
  })

  it('should handle missing body in context gracefully', () => {
    const urlSearchParamsToObjectSpy = vi.spyOn(Utils, 'urlSearchParamsToObject').mockReturnValue({})

    const mockContext = {
      req: {
        header: vi.fn().mockReturnValue('application/json'),
        method: 'POST',
        raw: {
          clone: vi.fn(),
        },
        url: 'http://example.com/test',
      },
      get: vi.fn().mockReturnValue(undefined),
    } as unknown as Context

    const result = onReqBindings(mockContext)

    expect(result.req.body).toBeUndefined()
    expect(urlSearchParamsToObjectSpy).toHaveBeenCalled()
    expect(mockContext.get).toHaveBeenCalledWith('requestBody')
  })
})
