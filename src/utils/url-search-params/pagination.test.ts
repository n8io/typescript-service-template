import { urlSearchParamsToPagination } from './pagination.ts'

describe('urlSearchParamsToPagination', () => {
  it('should return undefined if no search params are passed', () => {
    // @ts-expect-error We are testing the case where params is undefined
    const pagination = urlSearchParamsToPagination(undefined)

    expect(pagination).toBeUndefined()
  })

  it('should return undefined if no pagination params are passed', () => {
    const params = new URLSearchParams()
    const pagination = urlSearchParamsToPagination(params)

    expect(pagination).toBeUndefined()
  })

  it('should return a pagination object when given valid pagination params', () => {
    const params = new URLSearchParams()

    params.append('page', '1')
    params.append('pageSize', '10')

    const pagination = urlSearchParamsToPagination(params)

    expect(pagination).toEqual({ page: 1, pageSize: 10 })
  })

  it('should throw an error when given invalid pagination params', () => {
    const params = new URLSearchParams()

    params.append('page', '-1')
    params.append('pageSize', 'invalid')

    expect(() => urlSearchParamsToPagination(params)).toThrowError()
  })
})
