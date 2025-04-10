/* v8 ignore start */
import type { DomainGetManyRequest } from '../models/request.ts'
import { type Resource } from '../models/resource.ts'
import type { SpiPaginatedResponse } from './paginated.ts'

type SpiGetManyRequest = DomainGetManyRequest

type SpiResourceRepository = {
  createOne: (resource: Resource) => Promise<Resource>
  getMany(query: SpiGetManyRequest): Promise<SpiPaginatedResponse<Resource>>
}

export type { SpiGetManyRequest, SpiResourceRepository }
