import type { Handler } from 'hono'
import { accepts } from 'hono/accepts'

const root = (): Handler => (c) => {
  const type = accepts(c, {
    header: 'Accept',
    supports: ['application/json', 'text/plain'],
    default: 'text/plain',
  })

  if (type === 'application/json') {
    return c.json({ message: 'ok' })
  }

  return c.text('✅')
}

export { root }
