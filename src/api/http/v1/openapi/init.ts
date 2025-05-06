import type { Handler } from 'hono'
import openapiSpec from '../../../../../specs/v1/openapi.json' with { type: 'json' }

const openapi: Handler = (c) => c.json(openapiSpec)

export { openapi }
