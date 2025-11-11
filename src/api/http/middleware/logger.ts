import type { Context } from 'hono'
import { pinoLogger } from 'hono-pino'
import { getPinoConfig } from '../../../utils/logger.ts'
import { urlSearchParamsToObject } from '../../../utils/url-search-params/to-object.ts'
import type { Env } from '../v1/models.ts'

const requestBody = 'requestBody'

const methodsWithRequestBody = new Set(['POST', 'PUT', 'PATCH'])

const getRequestBody = async (c: Context): Promise<unknown | undefined> => {
  if (!methodsWithRequestBody.has(c.req.method.toUpperCase())) {
    return undefined
  }

  try {
    const clonedRequest = c.req.raw.clone()
    const contentType = c.req.header('content-type') ?? ''

    if (contentType.includes('application/json')) {
      return await clonedRequest.json()
    }

    if (contentType.includes('text/') || contentType.includes('application/x-www-form-urlencoded')) {
      return await clonedRequest.text()
    }

    return undefined
  } catch {
    return undefined
  }
}

const requestBodyMiddleware = async (c: Context<Env>, next: () => Promise<void>) => {
  const body = await getRequestBody(c)

  c.set(requestBody, body)
  await next()
}

const onReqBindings = (c: Context<Env>) => {
  const rawUrl = new URL(c.req.url)
  const method = c.req.method
  const params = urlSearchParamsToObject(rawUrl.searchParams)
  const search = Object.keys(params).length ? params : undefined
  const url = rawUrl.href.replace(rawUrl.origin, '')
  const body = c.get(requestBody)

  return {
    req: {
      body,
      method,
      search,
      url,
    },
  }
}

const logger = () => {
  const pino = getPinoConfig()
  const http = { onReqBindings }

  return pinoLogger({ http, pino })
}

export { logger, onReqBindings, requestBodyMiddleware }
