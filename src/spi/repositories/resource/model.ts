import { schemaResource } from '../../../domain/models/resource.ts'
import { schemaDbRecord } from '../models.ts'

const schemaDbResource = schemaResource.merge(schemaDbRecord)

export { schemaDbResource }
