import { z } from 'zod'
import { exampleGid } from '../utils/generators/gid.ts'

import 'zod-openapi/extend'

const AuditRecordType = {
  SYSTEM: 'SYSTEM',
  USER: 'USER',
} as const

const schemaAuditRecordSystem = z
  .object({
    system: z.string().openapi({ description: 'The system that performed the action', example: 'SYSTEM' }),
    type: z.literal(AuditRecordType.SYSTEM).openapi({ title: 'System', example: AuditRecordType.SYSTEM }),
  })
  .openapi({
    description: 'A system that performed the action',
    ref: 'AuditRecordSystem',
  })

type AuditRecordSystem = Prettify<z.infer<typeof schemaAuditRecordSystem>>

const exampleAuditRecordSystem = (overrides: Partial<AuditRecordSystem> = {}): AuditRecordSystem => ({
  system: 'SYSTEM',
  type: AuditRecordType.SYSTEM,
  ...overrides,
})

const schemaAuditRecordUser = z
  .object({
    email: z
      .string()
      .email()
      .optional()
      .openapi({ description: 'The email of the user who performed the action', title: 'Email', example: 'em@il.com' }),
    gid: z.string().openapi({ example: exampleGid(false) }),
    type: z.literal(AuditRecordType.USER).openapi({ title: 'User', example: AuditRecordType.USER }),
  })
  .openapi({
    description: 'A user who performed the action',
    ref: 'AuditRecordUser',
  })

type AuditRecordUser = Prettify<z.infer<typeof schemaAuditRecordUser>>

const exampleAuditRecordUser = (overrides: Partial<AuditRecordUser> = {}): AuditRecordUser => ({
  email: 'em@il.com', // Optional
  gid: exampleGid(),
  type: AuditRecordType.USER,
  ...overrides,
})

const schemaAuditRecord = z.discriminatedUnion('type', [schemaAuditRecordSystem, schemaAuditRecordUser])

type AuditRecord = Prettify<z.infer<typeof schemaAuditRecord>>

const exampleAuditRecord = (overrides: Partial<AuditRecord> = {}): AuditRecord => {
  if (overrides.type === AuditRecordType.USER) {
    return exampleAuditRecordUser(overrides as Partial<AuditRecordUser>)
  }

  return exampleAuditRecordSystem(overrides as Partial<AuditRecordSystem>)
}

export { exampleAuditRecord, schemaAuditRecord }
