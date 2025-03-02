import { Hono } from 'hono'
import type { Env } from '../models.ts'

const resources = new Hono<Env>()

resources.get('/:id', async (c) => {
  const id = c.req.param('id')
  const services = c.get('services')
  const resource = await services.resource.getOne(id)

  return c.json(resource)
})

export { resources }
