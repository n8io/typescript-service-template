import { z } from 'zod'
import { exampleAuditRecord } from '../../models/audit-record.ts'
import { schemaEntity } from '../../models/entity.ts'
import { exampleGid, gid } from '../../utils/generators/gid.ts'
import { validation } from '../../utils/validation.ts'

import 'zod-openapi/extend'

const schemaResource = schemaEntity
  .extend({
    gid: validation.string.default(gid).openapi({
      default: undefined,
      example: exampleGid(false),
      description: 'The unique identifier for the resource',
    }),
    name: validation.string.openapi({ description: 'The name of the resource', example: 'Jane Doe' }),
    timeZone: validation.timeZone.nullable().openapi({
      effectType: 'same',
      description: 'The time zone of the resource',
      example: 'America/New_York',
      type: 'string',
    }),
  })
  .openapi({
    ref: 'Resource', // This is the name of the model in the OpenAPI spec
  })

type Resource = Prettify<z.infer<typeof schemaResource>>

const exampleResource = (overrides: Partial<Resource> = {}): Resource => ({
  gid: exampleGid(false),
  name: 'Jane Doe',
  timeZone: 'America/New_York',
  createdAt: new Date(),
  createdBy: exampleAuditRecord({ type: 'USER' }),
  updatedAt: new Date(),
  updatedBy: exampleAuditRecord({ type: 'SYSTEM' }),
  ...overrides,
})

schemaResource.openapi({
  description: 'A resource entity',
  example: exampleResource(),
})

export { exampleResource, schemaResource }
export type { Resource }
