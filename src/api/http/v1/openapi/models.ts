import { z } from 'zod'

import 'zod-openapi/extend'

const schemaRequestHeaderClientId = z.string().trim().min(1).openapi({ example: '<unique-client-id>' })
const schemaRequestHeaderRequestId = z.string().trim().min(1).openapi({ example: '<unique-request-id>' })

export { schemaRequestHeaderClientId, schemaRequestHeaderRequestId }
