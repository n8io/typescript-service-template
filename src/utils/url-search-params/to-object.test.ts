import { urlSearchParamsToObject } from './to-object.ts'

describe('urlSearchParamsToObject', () => {
  it('should convert URLSearchParams to object', () => {
    const params = new URLSearchParams('a=1&b=2&c=3')
    const result = urlSearchParamsToObject(params)

    expect(result).toEqual({
      a: '1',
      b: '2',
      c: '3',
    })
  })

  it('should handle multiple values for the same key', () => {
    const params = new URLSearchParams('a=1&a=2&a=3')
    const result = urlSearchParamsToObject(params)

    expect(result).toEqual({
      a: ['1', '2', '3'],
    })
  })

  it('should handle comma-separated values', () => {
    const params = new URLSearchParams('a=1,2,3')
    const result = urlSearchParamsToObject(params)

    expect(result).toEqual({
      a: ['1', '2', '3'],
    })
  })

  it('should handle empty values', () => {
    const params = new URLSearchParams('a=&b=2')
    const result = urlSearchParamsToObject(params)

    expect(result).toEqual({
      b: '2',
    })
  })

  it('should handle values with leading and trailing spaces', () => {
    const params = new URLSearchParams('a= 1 , 2 , 3 ')
    const result = urlSearchParamsToObject(params)

    expect(result).toEqual({
      a: ['1', '2', '3'],
    })
  })
})
