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
    const app = await initHttp(dependencies)

    expect(app.routes).toMatchInlineSnapshot(`
      [
        {
          "basePath": "/",
          "handler": [Function],
          "method": "GET",
          "path": "/",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "GET",
          "path": "/favicon.ico",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "GET",
          "path": "/health",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "ALL",
          "path": "/*",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "ALL",
          "path": "/*",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "ALL",
          "path": "/*",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "ALL",
          "path": "/*",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "ALL",
          "path": "/*",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "ALL",
          "path": "/*",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "ALL",
          "path": "/*",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "ALL",
          "path": "/*",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "ALL",
          "path": "/*",
        },
        {
          "basePath": "/api/v1/resources",
          "handler": [Function],
          "method": "POST",
          "path": "/api/v1/resources",
        },
        {
          "basePath": "/api/v1/resources",
          "handler": [Function],
          "method": "POST",
          "path": "/api/v1/resources",
        },
        {
          "basePath": "/api/v1/resources",
          "handler": [Function],
          "method": "DELETE",
          "path": "/api/v1/resources/:gid",
        },
        {
          "basePath": "/api/v1/resources",
          "handler": [Function],
          "method": "DELETE",
          "path": "/api/v1/resources/:gid",
        },
        {
          "basePath": "/api/v1/resources",
          "handler": [Function],
          "method": "GET",
          "path": "/api/v1/resources",
        },
        {
          "basePath": "/api/v1/resources",
          "handler": [Function],
          "method": "GET",
          "path": "/api/v1/resources",
        },
        {
          "basePath": "/api/v1/resources",
          "handler": [Function],
          "method": "GET",
          "path": "/api/v1/resources/:gid",
        },
        {
          "basePath": "/api/v1/resources",
          "handler": [Function],
          "method": "GET",
          "path": "/api/v1/resources/:gid",
        },
        {
          "basePath": "/api/v1/resources",
          "handler": [Function],
          "method": "PATCH",
          "path": "/api/v1/resources/:gid",
        },
        {
          "basePath": "/api/v1/resources",
          "handler": [Function],
          "method": "PATCH",
          "path": "/api/v1/resources/:gid",
        },
        {
          "basePath": "/api/v1/docs",
          "handler": [Function],
          "method": "GET",
          "path": "/api/v1/docs",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "GET",
          "path": "/api/v1/openapi",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "GET",
          "path": "/",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "GET",
          "path": "/favicon.ico",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "GET",
          "path": "/health",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "ALL",
          "path": "/*",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "ALL",
          "path": "/*",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "ALL",
          "path": "/*",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "ALL",
          "path": "/*",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "ALL",
          "path": "/*",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "ALL",
          "path": "/*",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "ALL",
          "path": "/*",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "ALL",
          "path": "/*",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "ALL",
          "path": "/*",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "POST",
          "path": "/api/v1/resources",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "POST",
          "path": "/api/v1/resources",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "DELETE",
          "path": "/api/v1/resources/:gid",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "DELETE",
          "path": "/api/v1/resources/:gid",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "GET",
          "path": "/api/v1/resources",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "GET",
          "path": "/api/v1/resources",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "GET",
          "path": "/api/v1/resources/:gid",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "GET",
          "path": "/api/v1/resources/:gid",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "PATCH",
          "path": "/api/v1/resources/:gid",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "PATCH",
          "path": "/api/v1/resources/:gid",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "GET",
          "path": "/api/v1/docs",
        },
        {
          "basePath": "/",
          "handler": [Function],
          "method": "GET",
          "path": "/api/v1/openapi",
        },
      ]
    `)
  })
})
