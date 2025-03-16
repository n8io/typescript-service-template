import { z } from 'zod'
import { schemaEntity } from '../../models/entity.ts'
import { schemaTimeZone } from '../../models/time-zone.ts'
import { validation } from '../../utils/validation.ts'

const schemaResource = schemaEntity.extend({
  name: validation.string,
  timeZone: schemaTimeZone,
})

type Resource = Prettify<z.infer<typeof schemaResource>>

export { schemaResource }
export type { Resource }
