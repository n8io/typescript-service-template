import { Hono } from 'hono'
import type { Env } from '../../v1/models.ts'
import { REQUEST_HEADER_CLIENT_ID, clientId } from './client-id.ts'

describe('clientId', () => {
  it('should return successfully when providing the client id header', async () => {
    const app = new Hono<Env>()

    app.use('*', clientId())
    app.get('/', (c) => c.json(c.req.header(REQUEST_HEADER_CLIENT_ID)))

    const res = await app.request('/', {
      headers: {
        [REQUEST_HEADER_CLIENT_ID]: REQUEST_HEADER_CLIENT_ID,
      },
    })

    expect(res.status).toBe(200)
  })

  it('should throw an error when not providing the client id header', async () => {
    const app = new Hono<Env>()

    app.use('*', clientId())
    app.get('/', (c) => c.json(c.req.header(REQUEST_HEADER_CLIENT_ID)))

    let wasErrorThrown = false

    app.onError((_err, c) => {
      wasErrorThrown = true

      return c.text('fail')
    })

    await app.request('/')

    expect(wasErrorThrown).toBe(true)
  })
})
