import { domainGetOneRequestToGetManyRequest } from './domain-get-one-request-to-get-many-request.ts'

describe('domainGetOneRequestToGetManyRequest', () => {
  it('should convert the get one request to a get many request', () => {
    expect(domainGetOneRequestToGetManyRequest('FIELD', 'VALUE')).toEqual({
      filters: {
        FIELD: {
          eq: 'VALUE',
        },
      },
      pagination: {
        page: 1,
        pageSize: 1,
      },
    })
  })
})
