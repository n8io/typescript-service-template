import { Hono } from 'hono'
import { createMiddleware } from 'hono/factory'
import type { Domain } from '../../../../domain/init.ts'
import * as ClientId from './client-id.ts'
import { initDomain } from './init.ts'
import * as Services from './services.ts'

vi.mock('./client-id.ts')
vi.mock('./services.ts')

describe('initDomain', () => {
  it('should create a middleware that combines clientId and services', async () => {
    const mockDomain: Domain = {
      services: {
        resource: {},
      },
    } as Domain

    const app = new Hono()
    const clientIdSpy = vi.spyOn(ClientId, 'clientId').mockReturnValue(createMiddleware(async (_, next) => next()))
    const servicesSpy = vi.spyOn(Services, 'services').mockReturnValue(createMiddleware(async (_, next) => next()))

    app.use('*', initDomain(mockDomain))
    app.get('/', (c) => c.text('ok'))

    await expect(app.request('/')).resolves.toBeDefined()

    expect(clientIdSpy).toHaveBeenCalledTimes(1)
    expect(servicesSpy).toHaveBeenCalledTimes(1)
  })
})
