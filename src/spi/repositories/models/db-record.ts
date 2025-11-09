import { z } from 'zod'
import { id } from '../../../utils/factories/id.ts'
import { validation } from '../../../utils/validation.ts'

const schemaDbRecord = z.object({
  id: validation.string.default(id),
})

export { schemaDbRecord }
