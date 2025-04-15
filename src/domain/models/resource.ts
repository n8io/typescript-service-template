import { z } from 'zod'
import { exampleAuditRecord } from '../../models/audit-record.ts'
import { schemaEntity } from '../../models/entity.ts'
import { gid } from '../../utils/generators/gid.ts'
import { validation } from '../../utils/validation.ts'

const schemaResource = schemaEntity.extend({
  gid: validation.string.default(gid),
  name: validation.string,
  timeZone: validation.timeZone.nullable(),
})

type Resource = Prettify<z.infer<typeof schemaResource>>

const exampleResource = (overrides: Partial<Resource> = {}): Resource => ({
  gid: 'gid',
  name: 'name',
  timeZone: 'UTC',
  createdAt: new Date(),
  createdBy: exampleAuditRecord({ type: 'USER' }),
  updatedAt: new Date(),
  updatedBy: exampleAuditRecord({ type: 'SYSTEM' }),
  ...overrides,
})

const resourceSortableFields: (keyof Resource)[] = ['createdAt', 'gid', 'name', 'timeZone', 'updatedAt']

export { exampleResource, resourceSortableFields, schemaResource }
export type { Resource }
