import type { DomainGetManyRequest } from '../../models/request.ts'

const domainGetOneRequestToGetManyRequest = (
  field: string,
  value: string | Date | boolean | number,
): DomainGetManyRequest => ({
  filters: {
    [field]: {
      eq: value,
    },
  },
  pagination: {
    page: 1,
    pageSize: 1,
  },
})

export { domainGetOneRequestToGetManyRequest }
