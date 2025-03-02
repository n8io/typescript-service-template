import { z } from 'zod'
import { schemaAuditRecord } from './audit-record.ts'

const schemaEntity = z.object({
  createdAt: z.coerce.date(),
  createdBy: schemaAuditRecord,
  gid: z.string(),
  updatedAt: z.coerce.date(),
  updatedBy: schemaAuditRecord,
})

type Entity = Prettify<z.infer<typeof schemaEntity>>

export type { Entity }
export { schemaEntity }
