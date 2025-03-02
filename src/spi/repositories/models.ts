import { z } from 'zod'

const schemaDbRecord = z.object({
  id: z.string(),
})

export { schemaDbRecord }
