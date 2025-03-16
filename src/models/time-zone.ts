import { z } from 'zod'

const schemaTimeZone = z.string().refine(
  (value) => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: value })

      return true
    } catch {
      return false
    }
  },
  {
    message: 'Invalid time zone',
  },
)

type TimeZone = z.infer<typeof schemaTimeZone>

export type { TimeZone }
export { schemaTimeZone }
