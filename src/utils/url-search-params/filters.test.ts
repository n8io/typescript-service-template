import { z } from 'zod'
import { validation } from '../validation.ts'
import { urlSearchParamsToFilters } from './filters.ts'

describe('urlSearchParamsToFilters', () => {
  it('should parse the kitchen sink of url search params', () => {
    // ✅ Example schema
    const baseSchema = z.object({
      createdAt: z.coerce.date(),
      description: z.string(),
      email: z.string().email(),
      id: z.number().int(),
      isEnabled: z.boolean(),
      name: z.string().trim(),
      updatedAt: z.coerce.date(),
    })

    const params = new URLSearchParams()

    params.append('createdAt:gt', '2020-01-01T00:00Z')
    params.append('description:search', '🌮,🌭')
    params.append(' email', 'joe.smith@example.com')
    params.append('email:search', 'gmail.com')
    params.append('id', '123')
    params.append('id:gt', '0')
    params.append('id:lte', '1000000')
    params.append('isEnabled ', 'false')
    params.append('isEnabled:in', 'true')
    params.append('name', 'John')
    params.append('name', 'Jane')
    params.append('name:in', 'Jason')
    params.append('name', 'Jacob, John, Jenny')
    params.append('name:nin', 'Jeremy')
    params.append('name:neq', 'Jeff')
    params.append('updatedAt:gte', '2025-01-01T00:00Z')
    params.append('updatedAt:lt', '2025-02-01T00:00Z')

    const filters = urlSearchParamsToFilters(params, { baseSchema })

    expect(filters).toEqual({
      createdAt: { gt: new Date('2020-01-01T00:00Z') },
      description: {
        search: '🌮,🌭',
      },
      email: {
        eq: 'joe.smith@example.com',
        search: 'gmail.com',
      },
      id: { eq: 123, gt: 0, lte: 1_000_000 },
      isEnabled: { in: [false, true] },
      name: {
        in: ['Jacob', 'Jane', 'Jason', 'Jenny', 'John'],
        nin: ['Jeff', 'Jeremy'],
      },
      updatedAt: {
        gte: new Date('2025-01-01T00:00Z'),
        lt: new Date('2025-02-01T00:00Z'),
      },
    })
  })

  it('should allow null in combination with other non-null values when the base schema allows it', () => {
    const baseSchema = z.object({
      name: z.string().nullable(),
    })

    const params = new URLSearchParams()

    params.append('name', 'John,null')

    const filters = urlSearchParamsToFilters(params, { baseSchema })

    expect(filters).toEqual({
      name: { in: ['John', null] },
    })
  })

  it('should allow a single null value when the base schema allows it', () => {
    const baseSchema = z.object({
      name: z.string().nullable(),
    })

    const params = new URLSearchParams()

    params.append('name', 'null')

    const filters = urlSearchParamsToFilters(params, { baseSchema })

    expect(filters).toEqual({
      name: { eq: null },
    })
  })

  it('should handle empty query params gracefully', () => {
    const baseSchema = z.object({
      name: z.string(),
    })

    const params = new URLSearchParams()
    const filters = urlSearchParamsToFilters(params, { baseSchema })

    expect(filters).toEqual({})
  })

  it('should handle filters that do not provide any operation as equal to', () => {
    const baseSchema = z.object({
      name: z.string(),
    })

    const params = new URLSearchParams()

    params.append('name', 'John')

    const filters = urlSearchParamsToFilters(params, { baseSchema })

    expect(filters).toEqual({
      name: { eq: 'John' },
    })
  })

  it('should not throw when not given any query parameters', () => {
    const baseSchema = z.object({
      name: z.string(),
    })

    const params = new URLSearchParams()
    const filters = urlSearchParamsToFilters(params, { baseSchema })

    expect(filters).toEqual({})
  })

  it('should throw when given an invalid filter field', () => {
    const baseSchema = z.object({
      name: z.string(),
    })

    const params = new URLSearchParams()

    params.append('invalidField', 'John')

    expect(() => urlSearchParamsToFilters(params, { baseSchema })).toThrowError()
  })

  it('should throw when given an invalid operator', () => {
    const baseSchema = z.object({
      name: z.string(),
    })

    const params = new URLSearchParams()

    params.append('name:invalid', 'John')

    expect(() => urlSearchParamsToFilters(params, { baseSchema })).toThrowError('Unsupported operator: invalid')
  })

  it('should throw an error when passing null to search operation', () => {
    const baseSchema = z.object({
      name: z.string(),
    })

    const params = new URLSearchParams()

    params.append('name:search', 'null')

    expect(() => urlSearchParamsToFilters(params, { baseSchema })).toThrowError()
  })

  it('should not allow searching non-string types', () => {
    const baseSchema = z.object({
      age: z.number(),
    })

    const params = new URLSearchParams()

    params.append('age:search', '123')

    expect(() => urlSearchParamsToFilters(params, { baseSchema })).toThrowError(
      'Operation "search" is not valid for field "age"',
    )
  })

  it('should throw an error if the field operator is not supported', () => {
    const baseSchema = z.object({
      name: z.string(),
    })

    const params = new URLSearchParams()

    params.append('name:notSupportedOp', 'value')

    expect(() => urlSearchParamsToFilters(params, { baseSchema })).toThrowError('Unsupported operator: notSupportedOp')
  })

  it('should handle common custom validation schemas properly', () => {
    const baseSchema = z.object({
      bool: validation.bool,
      country: validation.country,
      date: validation.date,
      email: validation.email,
      enum: validation.string.toUpperCase().pipe(z.enum(['ENUM_1', 'ENUM_2'])),
      number: validation.number,
      string: validation.string,
      timeZone: validation.timeZone,
      url: validation.url,
      uuid: validation.uuid,
    })

    const params = new URLSearchParams()

    params.append('bool', 'false')
    params.append('country', 'US')
    params.append('date', '2023-10-01')
    params.append('email', 'test@example.com')
    params.append('enum', 'enum_1')
    params.append('number', '1234567890')
    params.append('string', 'test')
    params.append('timeZone', 'America/New_York')
    params.append('url', 'https://example.com')
    params.append('uuid', '123e4567-e89b-12d3-a456-426614174000')

    const filters = urlSearchParamsToFilters(params, { baseSchema })

    expect(filters).toEqual({
      bool: {
        eq: false,
      },
      country: {
        eq: 'US',
      },
      date: {
        eq: new Date('2023-10-01'),
      },
      email: {
        eq: 'test@example.com',
      },
      enum: {
        eq: 'ENUM_1',
      },
      number: {
        eq: 1234567890,
      },
      string: {
        eq: 'test',
      },
      timeZone: {
        eq: 'America/New_York',
      },
      url: {
        eq: 'https://example.com',
      },
      uuid: {
        eq: '123e4567-e89b-12d3-a456-426614174000',
      },
    })
  })

  it('should throw an error when multiple values are passed to a single value operator', () => {
    const baseSchema = z.object({
      age: z.number(),
    })

    const params = new URLSearchParams()

    params.append('age:gt', '1')
    params.append('age:gt', '2')

    expect(() => urlSearchParamsToFilters(params, { baseSchema })).toThrowError(
      'The "gt" does not support multiple values',
    )
  })
})
