import type { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createMiddleware } from 'hono/factory'
import { logger } from 'hono/logger'
import type { Domain } from '../../../domain/init.ts'
import type { Env } from './models.ts'

const dependencies = (domain: Domain) => {
  const services: Env['Variables']['services'] = {
    resource: domain.services.resource,
  }

  return createMiddleware(async (c, next) => {
    c.set('services', services)
    await next()
  })
}

const initMiddleware = (app: Hono<Env>, domain: Domain) => {
  app.use(logger())
  app.use(cors())
  app.use(dependencies(domain))
}

export { initMiddleware }
