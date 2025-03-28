import { z } from 'zod'
import { validation } from '../../utils/validation.ts'

const schemaDbRecord = z.object({
  id: validation.string,
})

export { schemaDbRecord }
