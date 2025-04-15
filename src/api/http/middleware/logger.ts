import type { Context } from 'hono'
import { pinoLogger } from 'hono-pino'
import { getPinoConfig } from '../../../utils/logger.ts'
import { urlSearchParamsToObject } from '../../../utils/url-search-params/to-object.ts'

const onReqBindings = (c: Context) => {
  const rawUrl = new URL(c.req.url)
  const method = c.req.method
  const params = urlSearchParamsToObject(rawUrl.searchParams)
  const search = Object.keys(params).length ? params : undefined
  const url = rawUrl.href.replace(rawUrl.origin, '')

  return {
    req: {
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

export { logger, onReqBindings }
