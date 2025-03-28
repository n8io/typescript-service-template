import { describe, expect, it } from 'vitest'
import { toPaginatedSchema, validation } from './validation.ts'

describe('validation', () => {
  describe('boolean', () => {
    const schema = validation.boolean

    it('should return true for valid boolean values', () => {
      expect(schema.parse('1')).toBe(true)
      expect(schema.parse('t')).toBe(true)
      expect(schema.parse('true')).toBe(true)
      expect(schema.parse('yes')).toBe(true)
      expect(schema.parse('y')).toBe(true)
    })

    it('should return false for invalid boolean values', () => {
      expect(schema.parse(undefined)).toBe(false)
      expect(schema.parse('0')).toBe(false)
      expect(schema.parse('f')).toBe(false)
      expect(schema.parse('false')).toBe(false)
      expect(schema.parse('no')).toBe(false)
      expect(schema.parse('n')).toBe(false)
    })

    it('should return a boolean value for boolean values', () => {
      expect(schema.parse(true)).toBe(true)
      expect(schema.parse(false)).toBe(false)
    })

    it('should return false for non-boolean values', () => {
      expect(schema.parse('hello')).toBe(false)
      expect(schema.parse(123)).toBe(false)
      expect(schema.parse({})).toBe(false)
    })
  })

  describe('country', () => {
    const schema = validation.country

    it('should return a string for valid country codes', () => {
      expect(schema.parse('US')).toBe('US')
      expect(schema.parse('us')).toBe('US')
    })

    it('should throw an error for invalid country codes', () => {
      const results = schema.safeParse('invalid')

      expect(results.success).toBe(false)

      if (results.error?.issues?.[0]) {
        expect(results.error.issues[0].message).toBe('The given value (invalid) is not a valid two-letter country code')
      }
    })

    it('should throw an error for invalid types', () => {
      expect(() => schema.parse(123)).toThrow()
      expect(() => schema.parse({})).toThrow()
    })
  })

  describe('date', () => {
    const schema = validation.date

    it('should return a Date object for valid date strings', () => {
      expect(schema.parse('2022-12-31')).toEqual(new Date('2022-12-31'))
    })

    it('should throw an error for invalid date strings', () => {
      expect(() => schema.parse('hello')).toThrow()
      expect(() => schema.parse({})).toThrow()
    })
  })

  describe('email', () => {
    const schema = validation.email

    it('should return a string for valid email addresses', () => {
      expect(schema.parse('test@example.com')).toBe('test@example.com')
    })

    it('should return a lowercase string for valid email addresses', () => {
      expect(schema.parse('tEsT@exAmple.coM')).toBe('test@example.com')
    })

    it('should throw an error for invalid email addresses', () => {
      expect(() => schema.parse('hello')).toThrow()
      expect(() => schema.parse({})).toThrow()
    })
  })

  describe('number', () => {
    const schema = validation.number

    it('should return a number for valid numbers', () => {
      expect(schema.parse(123)).toBe(123)
    })

    it('should return a number for valid strings that can be coerced to numbers', () => {
      expect(schema.parse('123')).toBe(123)
    })

    it('should throw an error for invalid numbers', () => {
      expect(() => schema.parse('hello')).toThrow()
      expect(() => schema.parse({})).toThrow()
    })
  })

  describe('url', () => {
    const schema = validation.url

    it('should return a string for valid URLs', () => {
      expect(schema.parse('https://example.com')).toBe('https://example.com')
    })

    it('should throw an error for invalid URLs', () => {
      expect(() => schema.parse('hello')).toThrow()
      expect(() => schema.parse({})).toThrow()
    })
  })

  describe('uuid', () => {
    const schema = validation.uuid

    it('should return a string for valid UUIDs', () => {
      expect(schema.parse('550e8400-e29b-41d4-a716-446655440000')).toBe('550e8400-e29b-41d4-a716-446655440000')
    })

    it('should return a lowercase string for valid UUIDs', () => {
      expect(schema.parse('550E8400-E29B-41D4-A716-446655440000')).toBe('550e8400-e29b-41d4-a716-446655440000')
    })

    it('should throw an error for invalid UUIDs', () => {
      expect(() => schema.parse('hello')).toThrow()
      expect(() => schema.parse({})).toThrow()
    })
  })

  describe('locale', () => {
    const schema = validation.locale

    it('should return a string for valid locales', () => {
      expect(schema.parse('en-US')).toBe('en-US')
    })

    it('should throw an error for invalid locales', () => {
      expect(() => schema.parse('en')).toThrow()
      expect(() => schema.parse('hello')).toThrow()
      expect(() => schema.parse({})).toThrow()
    })
  })

  describe('timeZone', () => {
    const schema = validation.timeZone

    it('should return a string for valid time zones', () => {
      expect(schema.parse('America/New_York')).toBe('America/New_York')
    })

    it('should throw an error for invalid time zones', () => {
      expect(() => schema.parse('hello')).toThrow()
      expect(() => schema.parse({})).toThrow()
    })
  })

  describe('toPaginatedSchema', () => {
    it('should return a paginated schema for a given schema', () => {
      const schema = validation.string
      const paginatedSchema = toPaginatedSchema(schema)

      expect(
        paginatedSchema.parse({
          items: ['hello', 'world'],
          hasMore: false,
          itemsTotal: 2,
          page: 0,
          pageSize: 10,
          pagesTotal: 1,
        }),
      ).toEqual({
        hasMore: false,
        items: ['hello', 'world'],
        itemsTotal: 2,
        page: 0,
        pageSize: 10,
        pagesTotal: 1,
      })
    })
  })
})
