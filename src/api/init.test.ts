import * as HonoServer from '@hono/node-server'
import type { Domain } from '../domain/init.ts'
import { initApi } from './init.ts'

vi.mock('@hono/node-server', () => ({
  serve: vi.fn().mockReturnValue({
    close: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('./http/init.ts', () => ({
  initHttp: () => ({
    fetch: vi.fn(),
  }),
}))

vi.mock('../utils/logger.ts')

describe('initApi', () => {
  it('should initialize the API and return a server instance', async () => {
    const serveSpy = vi.spyOn(HonoServer, 'serve').mockReturnValue({
      close: vi.fn().mockResolvedValue(undefined),
    } as unknown as HonoServer.ServerType)

    const mockDomain = {} as Domain
    const { server } = await initApi(mockDomain)

    expect(serveSpy).toHaveBeenCalledWith(
      {
        fetch: expect.any(Function),
        hostname: '0.0.0.0',
        port: 3000,
      },
      expect.any(Function),
    )

    expect(server.close).toBeDefined()

    server.close()
  })
})
