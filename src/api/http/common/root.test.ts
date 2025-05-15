import { Hono } from 'hono'
import { root } from './root.ts'

describe('root', () => {
  test('should return 200 status code', async () => {
    const handler = root()
    const app = new Hono()

    app.get('/', handler)

    const response = await app.request('/', {
      headers: {
        // biome-ignore lint/style/useNamingConvention: ???
        Accept: 'application/json',
      },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ message: 'ok' })
  })

  test('should return text plain if no accept header is provided', async () => {
    const handler = root()
    const app = new Hono()

    app.get('/', handler)

    const response = await app.request('/')

    expect(await response.text()).toEqual('✅')
  })

  test('should return json if accept header is application/json', async () => {
    const handler = root()
    const app = new Hono()

    app.get('/', handler)

    const response = await app.request('/', {
      headers: {
        // biome-ignore lint/style/useNamingConvention: ???
        Accept: 'application/json',
      },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ message: 'ok' })
  })
})
