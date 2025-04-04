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

const exampleAuditRecordSystem = (overrides: Partial<AuditRecordSystem> = {}): AuditRecordSystem => ({
  system: 'SYSTEM',
  type: AuditRecordType.SYSTEM,
  ...overrides,
})

const schemaAuditRecordUser = z.object({
  email: z.string().email().optional(),
  gid: z.string(),
  type: z.literal(AuditRecordType.USER),
})

type AuditRecordUser = Prettify<z.infer<typeof schemaAuditRecordUser>>

const exampleAuditRecordUser = (overrides: Partial<AuditRecordUser> = {}): AuditRecordUser => ({
  email: 'em@il.com', // Optional
  gid: 'AUDIT_RECORD_USER_GID',
  type: AuditRecordType.USER,
  ...overrides,
})

const schemaAuditRecord = z.discriminatedUnion('type', [schemaAuditRecordSystem, schemaAuditRecordUser])

type AuditRecord = Prettify<z.infer<typeof schemaAuditRecord>>

const _exampleAuditRecord = (overrides: Partial<AuditRecord> = {}): AuditRecord => {
  if (overrides.type === AuditRecordType.SYSTEM) {
    return exampleAuditRecordUser(overrides as Partial<AuditRecordUser>)
  }

  return exampleAuditRecordSystem(overrides as Partial<AuditRecordSystem>)
}

export { schemaAuditRecord }
