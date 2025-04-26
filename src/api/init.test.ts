import * as HonoServer from '@hono/node-server'
import type { Domain } from '../domain/init.ts'
import type { AppStateManager } from '../utils/app-state-manager.ts'
import { initApi } from './init.ts'

vi.mock('@hono/node-server', () => ({
  serve: vi.fn().mockReturnValue({
    close: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('./generate-all-openapi-specs.ts', () => ({
  generateAllSpecs: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('./http/init.ts', () => ({
  initHttp: () => ({
    fetch: vi.fn(),
  }),
}))

vi.mock('../utils/config.ts', () => ({
  config: {
    PORT: 3000,
  },
}))

vi.mock('../utils/logger.ts')

describe('initApi', () => {
  it('should initialize the API and return a server instance', async () => {
    const serveSpy = vi.spyOn(HonoServer, 'serve').mockReturnValue({
      close: vi.fn().mockResolvedValue(undefined),
    } as unknown as HonoServer.ServerType)

    const mockAppStateManager: AppStateManager = {
      registerClosableDependency: vi.fn().mockResolvedValue(undefined),
    } as unknown as AppStateManager

    const mockDomain = {} as Domain

    const dependencies = {
      appStateManager: mockAppStateManager,
      domain: mockDomain,
    }

    const { server } = await initApi(dependencies)

    expect(server).toBeDefined()

    expect(serveSpy).toHaveBeenCalledWith(
      {
        fetch: expect.any(Function),
        hostname: '0.0.0.0',
        port: 3000,
      },
      expect.any(Function),
    )

    expect(mockAppStateManager.registerClosableDependency).toHaveBeenCalledWith({
      close: expect.any(Function),
    })
  })
})
