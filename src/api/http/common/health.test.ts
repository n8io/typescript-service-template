import { Hono } from 'hono'
import type { AppStateManager, MonitorableStatus } from '../../../utils/app-state-manager.ts'
import { health } from './health.ts'

describe('health', () => {
  test('should return 200 status code', async () => {
    const mockedAppState: MonitorableStatus[] = []
    const mockIsShuttingDown = false

    const mockAppStateManager: AppStateManager = {
      getMonitorableDependencyStatuses: vi.fn().mockResolvedValue(mockedAppState),
      isShuttingDown: mockIsShuttingDown,
    } as unknown as AppStateManager

    const handler = health({ appStateManager: mockAppStateManager })

    const app = new Hono()

    app.get('/', handler)

    const response = await app.request('/')

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toEqual({
      dependencies: mockedAppState,
      isShuttingDown: mockIsShuttingDown,
      timestamp: expect.any(String),
    })
  })
})
