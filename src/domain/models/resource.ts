import { z } from 'zod'
import { schemaEntity } from './entity.ts'
import { schemaTimeZone } from './time-zone.ts'

const schemaResource = schemaEntity.extend({
  name: z.string(),
  timeZone: schemaTimeZone,
})

type Resource = Prettify<z.infer<typeof schemaResource>>

export { schemaResource }
export type { Resource }
