import { z } from 'zod'
import { validation } from '../utils/validation.ts'
import { schemaAuditRecord } from './audit-record.ts'

const schemaEntity = z.object({
  createdAt: validation.date,
  createdBy: schemaAuditRecord,
  gid: validation.gid,
  updatedAt: validation.date,
  updatedBy: schemaAuditRecord,
})

export { schemaEntity }
