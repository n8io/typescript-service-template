import { schemaResource } from '../../../domain/models/resource.ts'
import { schemaToDrizzleTable } from './utils/schema-to-drizzle-table.ts'

const tableResourcesResult = schemaToDrizzleTable('resources', schemaResource, {
  uniqueIndexes: ['gid', 'name'],
})

if (tableResourcesResult.isErr()) {
  throw new Error(`Failed to create resources table: ${tableResourcesResult.error.message}`)
}

const tableResources = tableResourcesResult.value

export { tableResources }
