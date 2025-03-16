import { z } from 'zod'
import { validation } from '../utils/validation.ts'
import { schemaAuditRecord } from './audit-record.ts'

const schemaEntity = z.object({
  createdAt: validation.date,
  createdBy: schemaAuditRecord,
  gid: validation.string,
  updatedAt: validation.date,
  updatedBy: schemaAuditRecord,
})

type Entity = Prettify<z.infer<typeof schemaEntity>>

export type { Entity }
export { schemaEntity }
