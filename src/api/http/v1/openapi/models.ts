import { z } from 'zod'

const schemaRequestHeaderClientId = z.string().trim().min(1).openapi({ example: '<unique-client-id>' })
const schemaRequestHeaderRequestId = z.string().trim().min(1).openapi({ example: '<unique-request-id>' })

export { schemaRequestHeaderClientId, schemaRequestHeaderRequestId }
