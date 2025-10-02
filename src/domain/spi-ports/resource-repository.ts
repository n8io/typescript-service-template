import type { Result } from 'neverthrow'
import type { DatabaseError } from 'pg'
import type { AuditRecord } from '../../models/audit-record.ts'
import type { UpdateByGid } from '../../spi/repositories/utils/domain-updates-to-drizzle-query.ts'
import type { DomainGetManyRequest } from '../models/request.ts'
import type { Resource } from '../models/resource.ts'
import type { SpiPaginatedResponse } from './paginated.ts'

type SpiGetManyRequest = DomainGetManyRequest
type SpiCreateOneRequest<T> = T
type SpiUpdateManyRequest = NonEmptyArray<UpdateByGid>

// Generic repository interface that can work with any entity type
type SpiResourceRepository<T = Resource> = {
  createOne: (request: SpiCreateOneRequest<T>) => Promise<Result<T, DatabaseError>>
  deleteMany: (gids: string[]) => Promise<Result<void, DatabaseError>>
  getMany: (query: SpiGetManyRequest) => Promise<Result<SpiPaginatedResponse<T>, DatabaseError>>
  updateMany: (
    updates: SpiUpdateManyRequest,
    updatedBy: AuditRecord,
    updatedAt: Date,
  ) => Promise<Result<T[], DatabaseError>>
}

export type { SpiGetManyRequest, SpiResourceRepository, SpiUpdateManyRequest }
