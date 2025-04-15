import * as Compress from 'hono/compress'
import * as Cors from 'hono/cors'
import * as RequestId from 'hono/request-id'
import * as Timeout from 'hono/timeout'
import * as Timing from 'hono/timing'
import type { Domain } from '../../../domain/init.ts'
import { exampleConfig } from '../../../models/config.ts'
import * as InitDomain from './domain/init.ts'
import * as ErrorHandler from './error-handler.ts'
import { initMiddleware } from './init.ts'
import * as Logger from './logger.ts'

vi.mock('../../../utils/config.ts', async () => ({
  config: exampleConfig(),
}))

vi.mock('hono/compress')
vi.mock('hono/cors')
vi.mock('hono/request-id')
vi.mock('hono/timeout')
vi.mock('hono/timing')
vi.mock('./domain/init.ts')
vi.mock('./error-handler.ts')

describe('initMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // @ts-expect-error ???
    vi.spyOn(Logger, 'logger').mockReturnValue(() => {})
    // @ts-expect-error ???
    vi.spyOn(Compress, 'compress').mockReturnValue(() => {})
    // @ts-expect-error ???
    vi.spyOn(Cors, 'cors').mockReturnValue(() => {})
    // @ts-expect-error ???
    vi.spyOn(RequestId, 'requestId').mockReturnValue(() => {})
    // @ts-expect-error ???
    vi.spyOn(Timeout, 'timeout').mockReturnValue(() => {})
    // @ts-expect-error ???
    vi.spyOn(Timing, 'timing').mockReturnValue(() => {})
    // @ts-expect-error ???
    vi.spyOn(InitDomain, 'initDomain').mockReturnValue(() => {})
    // @ts-expect-error ???
    vi.spyOn(ErrorHandler, 'errorHandler').mockReturnValue(() => {})
  })

  it('should initialize middleware with default settings', () => {
    const domain = {} as Domain
    const app = initMiddleware(domain)

    expect(app).toBeDefined()

    expect(Logger.logger).toHaveBeenCalled()
    expect(Compress.compress).toHaveBeenCalled()
    expect(Cors.cors).toHaveBeenCalled()
    expect(RequestId.requestId).toHaveBeenCalled()
    expect(Timeout.timeout).toHaveBeenCalledWith(10_000)
    expect(Timing.timing).toHaveBeenCalled()
  })
})
