/* v8 ignore start */
import type { DomainGetManyRequest } from '../models/request.ts'
import { type Resource } from '../models/resource.ts'
import type { SpiPaginatedResponse } from './paginated.ts'

type SpiGetManyRequest = DomainGetManyRequest
type SpiCreateOneRequest = Resource
type SpiUpdateOneRequest = Partial<Pick<Resource, 'name' | 'timeZone'>> & Pick<Resource, 'updatedAt' | 'updatedBy'>

type SpiResourceRepository = {
  createOne: (request: SpiCreateOneRequest) => Promise<Resource>
  getMany(query: SpiGetManyRequest): Promise<SpiPaginatedResponse<Resource>>
  updateOne: (gid: string, request: SpiUpdateOneRequest) => Promise<Resource>
}

export type { SpiGetManyRequest, SpiResourceRepository, SpiUpdateOneRequest }
