import { createMiddleware } from 'hono/factory'
import type { Domain } from '../../../domain/init.ts'
import type { Env } from '../v1/models.ts'

const makeDomainMiddleware = (domain: Domain) => {
  const services: Env['Variables']['services'] = {
    resource: domain.services.resource,
  }

  return createMiddleware<Env>(async (ctx, next) => {
    ctx.set('services', services)

    await next()
  })
}

export { makeDomainMiddleware }
