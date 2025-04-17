import { Hono } from 'hono'
import type { AppStateManager } from '../../utils/app-state-manager.ts'
import { health } from './health.ts'

describe('health', () => {
  test('should return 200 status code', async () => {
    const mockAppStateManager: AppStateManager = {
      getMonitorableDependencyStatuses: vi.fn().mockResolvedValue([]),
    } as unknown as AppStateManager

    const handler = health({ appStateManager: mockAppStateManager })

    const app = new Hono()

    app.get('/', handler)

    const response = await app.request('/')

    expect(response.status).toBe(200)
  })
})
