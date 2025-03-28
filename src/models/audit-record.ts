import { z } from 'zod'

const AuditRecordType = {
  SYSTEM: 'SYSTEM',
  USER: 'USER',
} as const

const schemaAuditRecordSystem = z.object({
  system: z.string(),
  type: z.literal(AuditRecordType.SYSTEM),
})

const schemaAuditRecordUser = z.object({
  email: z.string().email().optional(),
  gid: z.string(),
  type: z.literal(AuditRecordType.USER),
})

const schemaAuditRecord = z.discriminatedUnion('type', [schemaAuditRecordSystem, schemaAuditRecordUser])

export { schemaAuditRecord }
