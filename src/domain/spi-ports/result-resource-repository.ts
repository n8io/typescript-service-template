import type { Result } from 'neverthrow'
import type { AuditRecord } from '../../models/audit-record.ts'
import type { SpiDatabaseError, SpiValidationError } from '../../spi/models/spi-error.ts'
import type { UpdateByGid } from '../../spi/repositories/utils/domain-updates-to-drizzle-query.ts'
import type { DomainGetManyRequest } from '../models/request.ts'
import type { Resource } from '../models/resource.ts'
import type { SpiPaginatedResponse } from './paginated.ts'

type ResultSpiCreateOneRequest = Resource
type ResultSpiGetManyRequest = DomainGetManyRequest
type ResultSpiUpdateManyRequest = NonEmptyArray<UpdateByGid>

type ResultSpiResourceRepository = {
  createOne: (request: ResultSpiCreateOneRequest) => Promise<Result<Resource, SpiDatabaseError | SpiValidationError>>
  deleteMany: (gids: string[]) => Promise<Result<void, SpiDatabaseError>>
  getMany: (query: ResultSpiGetManyRequest) => Promise<Result<SpiPaginatedResponse<Resource>, SpiDatabaseError>>
  updateMany: (
    updates: ResultSpiUpdateManyRequest,
    updatedBy: AuditRecord,
    updatedAt: Date,
  ) => Promise<Result<void, SpiDatabaseError | SpiValidationError>>
}

export type {
  ResultSpiCreateOneRequest,
  ResultSpiGetManyRequest,
  ResultSpiResourceRepository,
  ResultSpiUpdateManyRequest,
}
