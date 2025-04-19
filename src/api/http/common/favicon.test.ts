import { Hono } from 'hono'
import { favicon } from './favicon.ts'

describe('favicon', () => {
  it('should return a valid SVG image for the given emoji', async () => {
    const handler = favicon('🚀')
    const app = new Hono()

    app.get('/favicon.ico', handler)

    const response = await app.request('/favicon.ico')

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/svg+xml')

    const body = await response.text()

    expect(body).toMatchInlineSnapshot(
      `"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.9125em" x="0.1em" font-size="90">🚀</text></svg>"`,
    )
  })
})
