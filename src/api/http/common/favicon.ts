import type { MiddlewareHandler } from 'hono'

const favicon =
  (emoji: string): MiddlewareHandler =>
  async (c) => {
    c.header('Content-Type', 'image/svg+xml')

    return c.body(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.9125em" x="0.1em" font-size="90">${emoji}</text></svg>`,
    )
  }

export { favicon }
