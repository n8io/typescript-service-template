import type { UpdateByGid } from '../../spi/repositories/utils/domain-updates-to-drizzle-query.ts'
import type { DomainGetManyRequest } from '../models/request.ts'
import { type Resource } from '../models/resource.ts'
import type { SpiPaginatedResponse } from './paginated.ts'

type SpiGetManyRequest = DomainGetManyRequest
type SpiCreateOneRequest = Resource
type SpiUpdateManyRequest = NonEmptyArray<UpdateByGid>

type SpiResourceRepository = {
  createOne: (request: SpiCreateOneRequest) => Promise<Resource>
  getMany: (query: SpiGetManyRequest) => Promise<SpiPaginatedResponse<Resource>>
  updateMany: (updates: SpiUpdateManyRequest) => Promise<void>
}

export type { SpiGetManyRequest, SpiResourceRepository, SpiUpdateManyRequest }
