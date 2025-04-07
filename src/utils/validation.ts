import { z } from 'zod'

const string = z.string().trim().min(1)
const date = z.coerce.date()
const email = string.email().toLowerCase()
const number = z.coerce.number()
const url = string.url().toLowerCase()
const uuid = z.string().uuid().toLowerCase()

const bool = z.preprocess(
  (value) => ['1', 't', 'true', 'yes', 'y'].includes(value?.toString().toLowerCase().trim() ?? 'false'),
  z.boolean(),
)

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })

const country = string
  .refine(
    (value) => {
      try {
        const name = regionNames.of(value.toUpperCase())
        return name !== undefined && name !== value.toUpperCase()
      } catch {
        return false
      }
    },
    (value) => ({
      message: `The given value (${value}) is not a valid two-letter country code`,
    }),
  )
  .transform((value) => value.toUpperCase())

const locale = string
  .refine(
    (locale: string) => {
      const tmpLocal = new Intl.Segmenter(locale).resolvedOptions().locale

      return Boolean(tmpLocal.toLowerCase() === locale.toLowerCase() && tmpLocal.split('-').length >= 2)
    },
    (value) => ({
      message: `The given value (${value}) is not a valid locale`,
    }),
  )
  .transform((locale) => new Intl.Segmenter(locale).resolvedOptions().locale)

const timeZone = string
  .refine(
    (timeZone: string) => {
      try {
        Intl.DateTimeFormat(undefined, { timeZone })
      } catch {
        return false
      }

      return true
    },
    (value) => ({
      message: `The given value (${value}) is not a valid IANA time zone`,
    }),
  )
  .transform((timeZone) => Intl.DateTimeFormat(undefined, { timeZone }).resolvedOptions().timeZone)

const validation = {
  bool,
  country,
  date,
  email,
  locale,
  number,
  string,
  timeZone,
  url,
  uuid,
} as const

const paginate = z.object({
  hasMore: validation.bool,
  itemsTotal: validation.number,
  page: validation.number,
  pageSize: validation.number,
  pagesTotal: validation.number,
})

export { paginate, validation }
