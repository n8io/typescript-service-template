import { z } from 'zod'
import { OpenApiFormat } from '../api/http/models/openapi.ts'
import { exampleGid, isGid } from './generators/gid.ts'

const string = z.string().trim().min(1)

const date = z.coerce.date().openapi({
  example: new Date('1900-01-01T00:00:00.000Z'),
  format: OpenApiFormat.DATE_TIME,
})

const email = string.email().toLowerCase().openapi({
  example: 'em@il.com',
  format: OpenApiFormat.EMAIL,
})

const number = z.coerce.number().openapi({
  example: 1,
  format: OpenApiFormat.INT32,
})

const url = string.url().toLowerCase().openapi({
  example: 'https://example.com',
  format: OpenApiFormat.URI,
})

const uuid = z.string().uuid().toLowerCase().openapi({
  example: '00000000-0000-0000-0000-000000000000',
  format: OpenApiFormat.UUID,
})

const bool = z
  .preprocess(
    (value) => ['1', 't', 'true', 'yes', 'y'].includes(value?.toString().toLowerCase().trim() ?? 'false'),
    z.boolean(),
  )
  .openapi({
    example: true,
    format: OpenApiFormat.BINARY,
  }) as z.ZodEffects<z.ZodBoolean, boolean, boolean>

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
  .openapi({ example: 'US' })

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
  .openapi({ example: 'en-US' })

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
  .openapi({ example: 'America/New_York' })

const gid = string
  .refine(isGid, (value) => ({
    message: `The given value (${value}) is not a valid GID. GIDs are globally unique identifiers that are formatted as 3-4 digits, a dot, and then the UUID. E.g. 123.00000000-0000-0000-0000-000000000000`,
  }))
  .openapi({
    example: exampleGid(false),
  })

const validation = {
  bool,
  country,
  date,
  email,
  gid,
  locale,
  number,
  string,
  timeZone,
  url,
  uuid,
} as const

const paginate = z
  .object({
    hasMore: validation.bool,
    itemsTotal: validation.number.int().nonnegative(),
    page: validation.number.int().nonnegative(),
    pageSize: validation.number.int().nonnegative(),
    pagesTotal: validation.number.int().nonnegative(),
  })
  .strict()

export { paginate, validation }
