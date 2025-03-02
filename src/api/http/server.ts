import { Hono } from 'hono'
import type { Domain } from '../../domain/init.ts'
import { makeV1 } from './v1/index.ts'

const makeApp = (domain: Domain) => {
  const app = new Hono().basePath('/api')

  app.route('/v1', makeV1(domain))

  return app
}

export { makeApp as makeServer }
