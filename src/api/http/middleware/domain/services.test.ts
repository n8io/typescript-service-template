import { Hono } from 'hono'
import type { Domain } from '../../../../domain/init.ts'
import type { Env } from '../../v1/models.ts'
import { services } from './services.ts'

describe('services', () => {
  it('should create a middleware that sets the services in the context', async () => {
    const mockDomain = {
      services: {
        resource: {},
      },
    } as Domain

    const app = new Hono<Env>()

    app.use('*', services(mockDomain))
    app.get('/', (c) => c.json(c.get('services')))

    const res = await app.request('/')
    const actual = await res.json()

    expect(res.status).toBe(200)
    expect(actual).toEqual(mockDomain.services)
  })
})
