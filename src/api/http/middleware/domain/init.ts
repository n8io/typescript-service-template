import { every, except } from 'hono/combine'
import type { Domain } from '../../../../domain/init.ts'
import { version as v1 } from '../../v1/models.ts'
import { clientId } from './client-id.ts'
import { services } from './services.ts'

const versions = [v1]
const documentationRoutes = versions.flatMap((version) => [`/api/${version}/docs`, `/api/${version}/openapi`])
const initDomain = (domain: Domain) => every(except(documentationRoutes, clientId()), services(domain))

export { initDomain }
