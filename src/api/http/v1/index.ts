import type { Domain } from '../../../domain/index.ts'
import { initMiddleware } from '../middleware/index.ts'
import { resources } from './routes/resources.ts'

const makeV1 = (domain: Domain) => {
  const v1 = initMiddleware(domain)

  v1.route('/resources', resources)

  return v1
}

export { makeV1 }
