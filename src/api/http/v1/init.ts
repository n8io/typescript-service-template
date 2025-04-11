import type { Domain } from '../../../domain/init.ts'
import { initMiddleware } from '../middleware/init.ts'
import { resources } from './routes/resources.ts'

const initV1 = (domain: Domain) => {
  const v1 = initMiddleware(domain)

  v1.route('/resources', resources)

  return v1
}

export { initV1 }
