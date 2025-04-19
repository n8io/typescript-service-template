import type { Domain } from '../../domain/init.ts'
import { exampleConfig } from '../../models/config.ts'
import type { AppStateManager } from '../../utils/app-state-manager.ts'
import { initHttp } from './init.ts'

vi.mock('../../utils/config.ts', () => ({
  config: exampleConfig(),
}))

describe('initHttp', () => {
  const mockAppStateManager = {} as AppStateManager

  const mockDomain = {
    services: {
      resource: {},
    },
  } as Domain

  const dependencies = {
    appStateManager: mockAppStateManager,
    domain: mockDomain,
  }

  it('should create an instance of Hono', () => {
    const app = initHttp(dependencies)

    expect(app).toBeDefined()
  })

  it('should have registered all the expected routes', async () => {
    const app = initHttp(dependencies)

    expect(app.routes).toMatchInlineSnapshot(`
      [
        {
          "handler": [Function],
          "method": "GET",
          "path": "/",
        },
        {
          "handler": [Function],
          "method": "GET",
          "path": "/favicon.ico",
        },
        {
          "handler": [Function],
          "method": "GET",
          "path": "/health",
        },
        {
          "handler": [Function],
          "method": "ALL",
          "path": "/api/v1/*",
        },
        {
          "handler": [Function],
          "method": "ALL",
          "path": "/api/v1/*",
        },
        {
          "handler": [Function],
          "method": "ALL",
          "path": "/api/v1/*",
        },
        {
          "handler": [Function],
          "method": "ALL",
          "path": "/api/v1/*",
        },
        {
          "handler": [Function],
          "method": "ALL",
          "path": "/api/v1/*",
        },
        {
          "handler": [Function],
          "method": "ALL",
          "path": "/api/v1/*",
        },
        {
          "handler": [Function],
          "method": "ALL",
          "path": "/api/v1/*",
        },
        {
          "handler": [Function],
          "method": "GET",
          "path": "/api/v1/resources",
        },
        {
          "handler": [Function],
          "method": "POST",
          "path": "/api/v1/resources",
        },
        {
          "handler": [Function],
          "method": "GET",
          "path": "/api/v1/resources/:gid",
        },
      ]
    `)
  })
})
