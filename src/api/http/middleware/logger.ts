import type { Context } from 'hono'
import { createMiddleware } from 'hono/factory'
import { pinoLogger } from 'hono-pino'
import { getPinoConfig } from '../../../utils/logger.ts'
import { urlSearchParamsToObject } from '../../../utils/url-search-params/to-object.ts'

const REQUEST_BODY_KEY = 'requestBody'

const readRequestBody = async (c: Context): Promise<unknown> => {
  const contentType = c.req.header('content-type') ?? ''

  // Only read body for methods that typically have bodies
  if (!['POST', 'PUT', 'PATCH'].includes(c.req.method)) {
    return undefined
  }

  // Skip reading body for non-json content types
  if (!contentType.includes('application/json')) {
    return undefined
  }

  return c.req.json()
}

const requestBodyMiddleware = createMiddleware(async (c, next) => {
  try {
    const body = await readRequestBody(c)

    if (body !== undefined) {
      c.set(REQUEST_BODY_KEY, body)
    }
  } catch {
    // If reading body fails (e.g., invalid JSON), skip logging it
  }

  await next()
})

const onReqBindings = (c: Context) => {
  const rawUrl = new URL(c.req.url)
  const method = c.req.method
  const params = urlSearchParamsToObject(rawUrl.searchParams)
  const search = Object.keys(params).length ? params : undefined
  const url = rawUrl.href.replace(rawUrl.origin, '')
  const body = c.get(REQUEST_BODY_KEY)

  return {
    req: {
      ...(body !== undefined && { body }),
      method,
      search,
      url,
    },
  }
}

const logger = () => {
  const pino = getPinoConfig()
  const http = { onReqBindings }
  const pinoMiddleware = pinoLogger({ http, pino })

  // Chain the request body middleware before pino logger
  return createMiddleware(async (c, next) => {
    await requestBodyMiddleware(c, async () => {
      await pinoMiddleware(c, next)
    })
  })
}

export { logger, onReqBindings, requestBodyMiddleware }
