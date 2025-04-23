import { createMiddleware } from 'hono/factory'
import { ApiRequestMissingRequiredHeader } from '../../../../models/custom-error.ts'
import { validation } from '../../../../utils/validation.ts'
import { REQUEST_HEADER_CLIENT_ID } from '../../models/request.ts'
import type { Env } from '../../v1/models.ts'

const schemaRequestHeaderClientId = validation.string.min(1)

const clientId = () =>
  createMiddleware<Env>(async (ctx, next) => {
    const results = schemaRequestHeaderClientId.safeParse(ctx.req.header(REQUEST_HEADER_CLIENT_ID))

    if (!results.success) {
      throw new ApiRequestMissingRequiredHeader(REQUEST_HEADER_CLIENT_ID)
    }

    ctx.set('clientId', results.data)

    await next()
  })

export { clientId }
