import type { Domain } from '../../domain/index.ts'
import { makeApp } from './app.ts'

describe('makeApp', () => {
  const mockDomain = {
    services: {
      resource: {},
    },
  } as Domain

  it('should create an instance of Hono', () => {
    const app = makeApp(mockDomain)

    expect(app).toBeDefined()
  })

  it("should have a health endpoint that returns 'OK'", async () => {
    const app = makeApp(mockDomain)
    const response = await app.request('/health')

    expect(response.status).toBe(200)

    const jsonResponse = await response.json()

    expect(jsonResponse).toEqual({ message: 'OK' })
  })

  it('should have registered all the expected routes', async () => {
    const app = makeApp(mockDomain)

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
