import { schemaResource } from '../../../domain/models/resource.ts'
import { schemaToDrizzleTable } from './utils/schema-to-drizzle-table.ts'

const resources = schemaToDrizzleTable('resources', schemaResource, {
  uniqueIndexes: ['gid', 'name'],
})

export { resources as resourcesTable }
