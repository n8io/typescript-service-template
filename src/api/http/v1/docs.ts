import { Scalar } from '@scalar/hono-api-reference'
import { makeApp } from './app.ts'
import { version } from './models.ts'

const docs = makeApp()

docs.get(
  '/',
  Scalar({
    defaultOpenAllTags: true,
    url: `/api/${version}/openapi`,
  }),
)

export { docs }
