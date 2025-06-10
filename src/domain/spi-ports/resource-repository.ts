import type { Result } from 'neverthrow'
import type { AuditRecord } from '../../models/audit-record.ts'
import type { SpiDatabaseError, SpiValidationError } from '../../spi/models/spi-error.ts'
import type { UpdateByGid } from '../../spi/repositories/utils/domain-updates-to-drizzle-query.ts'
import type { DomainGetManyRequest } from '../models/request.ts'
import type { Resource } from '../models/resource.ts'
import type { SpiPaginatedResponse } from './paginated.ts'

type SpiCreateOneRequest = Resource
type SpiGetManyRequest = DomainGetManyRequest
type SpiUpdateManyRequest = NonEmptyArray<UpdateByGid>

type SpiResourceRepository = {
  createOne: (request: SpiCreateOneRequest) => Promise<Result<Resource, SpiDatabaseError | SpiValidationError>>
  deleteMany: (gids: string[]) => Promise<Result<void, SpiDatabaseError>>
  getMany: (query: SpiGetManyRequest) => Promise<Result<SpiPaginatedResponse<Resource>, SpiDatabaseError>>
  updateMany: (
    updates: SpiUpdateManyRequest,
    updatedBy: AuditRecord,
    updatedAt: Date,
  ) => Promise<Result<void, SpiDatabaseError | SpiValidationError>>
}

export type { SpiGetManyRequest, SpiResourceRepository, SpiUpdateManyRequest }
