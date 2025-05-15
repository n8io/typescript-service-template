import { Hono } from 'hono'
import type { HonoOptions } from 'hono/hono-base'
import type { Env } from './models.ts'

const makeApp = (options?: HonoOptions<Env>) => new Hono<Env>(options)

export { makeApp }
