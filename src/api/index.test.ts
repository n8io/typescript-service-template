import { Hono } from 'hono'
import type { Domain } from '../domain/index.ts'
import { initApi } from './index.ts'

vi.mock('./http/app.ts', () => ({
  makeApp: vi.fn().mockReturnValue(new Hono()),
}))

describe('initApi', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('should initialize the API and return a server instance', async () => {
    const mockDomain = {} as Domain
    const { server } = await initApi(mockDomain)

    expect(server).toBeDefined()
    expect(typeof server.close).toBe('function')

    await expect(server.close()).resolves.toBeUndefined()
  })
})
