import { Hono } from 'hono'
import type { Env } from '../models.ts'

const resources = new Hono<Env>()

resources.get('/:id', async (ctx) => {
  const id = ctx.req.param('id')
  const services = ctx.get('services')
  const resource = await services.resource.getOne(id)

  return ctx.json(resource)
})

export { resources }
