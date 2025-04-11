import { every } from 'hono/combine'
import type { Domain } from '../../../../domain/init.ts'
import { clientId } from './client-id.ts'
import { services } from './services.ts'

const initDomain = (domain: Domain) => every(clientId(), services(domain))

export { initDomain }
