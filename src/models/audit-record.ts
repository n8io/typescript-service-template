import { z } from 'zod'

const AuditRecordType = {
  SYSTEM: 'SYSTEM',
  USER: 'USER',
} as const

const schemaAuditRecordSystem = z.object({
  system: z.string(),
  type: z.literal(AuditRecordType.SYSTEM),
})

type AuditRecordSystem = Prettify<z.infer<typeof schemaAuditRecordSystem>>

const schemaAuditRecordUser = z.object({
  email: z.string().email().optional(),
  gid: z.string(),
  type: z.literal(AuditRecordType.USER),
})

type AuditRecordUser = Prettify<z.infer<typeof schemaAuditRecordUser>>

const schemaAuditRecord = z.discriminatedUnion('type', [schemaAuditRecordSystem, schemaAuditRecordUser])

type AuditRecord = Prettify<z.infer<typeof schemaAuditRecord>>

export type { AuditRecord, AuditRecordSystem, AuditRecordUser }
export { schemaAuditRecord }
