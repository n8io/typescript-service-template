import type { Domain } from '../../domain/init.ts'
import { exampleConfig } from '../../models/config.ts'
import { initHttp } from './init.ts'

vi.mock('../../utils/config.ts', () => ({
  config: exampleConfig(),
}))

describe('initHttp', () => {
  const mockDomain = {
    services: {
      resource: {},
    },
  } as Domain

  it('should create an instance of Hono', () => {
    const app = initHttp(mockDomain)

    expect(app).toBeDefined()
  })

  it("should have a health endpoint that returns 'OK'", async () => {
    const app = initHttp(mockDomain)
    const response = await app.request('/health')

    expect(response.status).toBe(200)

    const jsonResponse = await response.json()

    expect(jsonResponse).toEqual({ message: 'OK' })
  })

  it('should have registered all the expected routes', async () => {
    const app = initHttp(mockDomain)

    expect(app.routes).toMatchInlineSnapshot(`
      [
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
