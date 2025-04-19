import { Hono } from 'hono'
import type { AppStateManager, MonitorableStatus } from '../../../utils/app-state-manager.ts'
import { cache, health } from './health.ts'

describe('health', () => {
  beforeEach(() => {
    cache.clear()
  })

  test('should return the expected shape', async () => {
    const mockIsShuttingDown = false

    const mockHealthyAppState: MonitorableStatus[] = [
      { isConnected: true, name: 'service1' },
      { isConnected: true, name: 'service2' },
    ]

    const mockAppStateManager: AppStateManager = {
      getMonitorableDependencyStatuses: vi.fn().mockResolvedValue(mockHealthyAppState),
      isShuttingDown: mockIsShuttingDown,
    } as unknown as AppStateManager

    const app = new Hono()

    app.get('/', health({ appStateManager: mockAppStateManager }))

    const response = await app.request('/')
    const body = await response.json()

    expect(body).toEqual({
      dependencies: mockHealthyAppState,
      isShuttingDown: mockIsShuttingDown,
      timestamp: expect.any(String),
    })
  })

  describe('when the app is healthy', () => {
    test('should return 200 status code', async () => {
      const mockIsShuttingDown = false

      const mockHealthyAppState: MonitorableStatus[] = [
        { isConnected: true, name: 'service1' },
        { isConnected: true, name: 'service2' },
      ]

      const mockAppStateManager: AppStateManager = {
        getMonitorableDependencyStatuses: vi.fn().mockResolvedValue(mockHealthyAppState),
        isShuttingDown: mockIsShuttingDown,
      } as unknown as AppStateManager

      const app = new Hono()

      app.get('/', health({ appStateManager: mockAppStateManager }))

      const { status } = await app.request('/')

      expect(status).toBe(200)
    })
  })

  describe('when the app is shutting down', () => {
    test('should return 503 status code', async () => {
      const mockIsShuttingDown = true

      const mockHealthyAppState: MonitorableStatus[] = [
        { isConnected: true, name: 'service1' },
        { isConnected: true, name: 'service2' },
      ]

      const mockAppStateManager: AppStateManager = {
        getMonitorableDependencyStatuses: vi.fn().mockResolvedValue(mockHealthyAppState),
        isShuttingDown: mockIsShuttingDown,
      } as unknown as AppStateManager

      const app = new Hono()

      app.get('/', health({ appStateManager: mockAppStateManager }))

      const { status } = await app.request('/')

      expect(status).toEqual(503)
    })
  })

  describe('some of the app dependencies are not connected', () => {
    test('should return 503 status code', async () => {
      const mockIsShuttingDown = false

      const mockUnhealthyAppState: MonitorableStatus[] = [
        { isConnected: true, name: 'service1' },
        { isConnected: false, name: 'service2' },
      ]

      const mockAppStateManager: AppStateManager = {
        getMonitorableDependencyStatuses: vi.fn().mockResolvedValue(mockUnhealthyAppState),
        isShuttingDown: mockIsShuttingDown,
      } as unknown as AppStateManager

      const app = new Hono()

      app.get('/', health({ appStateManager: mockAppStateManager }))

      const { status } = await app.request('/')

      expect(status).toEqual(503)
    })
  })

  describe('when there is nothing in the cache', () => {
    test('should set value to cache and return it', async () => {
      const mockIsShuttingDown = false

      const mockHealthyAppState: MonitorableStatus[] = [{ isConnected: true, name: 'service1' }]

      const mockAppStateManager: AppStateManager = {
        getMonitorableDependencyStatuses: vi.fn().mockResolvedValue(mockHealthyAppState),
        isShuttingDown: mockIsShuttingDown,
      } as unknown as AppStateManager

      const app = new Hono()

      app.get('/', health({ appStateManager: mockAppStateManager }))
      await app.request('/')

      expect(cache.get('dependencies')).toEqual(mockHealthyAppState)
      expect(mockAppStateManager.getMonitorableDependencyStatuses).toHaveBeenCalledTimes(1)
    })
  })

  describe('when there is something in the cache', () => {
    test('should return value from cache', async () => {
      const mockIsShuttingDown = false
      const mockHealthyAppState: MonitorableStatus[] = [{ isConnected: true, name: 'service1' }]

      const mockAppStateManager: AppStateManager = {
        getMonitorableDependencyStatuses: vi.fn().mockResolvedValue(mockHealthyAppState),
        isShuttingDown: mockIsShuttingDown,
      } as unknown as AppStateManager

      cache.set('dependencies', mockHealthyAppState)

      const app = new Hono()

      app.get('/', health({ appStateManager: mockAppStateManager }))
      await app.request('/')

      expect(cache.get('dependencies')).toEqual(mockHealthyAppState)
      expect(mockAppStateManager.getMonitorableDependencyStatuses).not.toHaveBeenCalled()
    })
  })
})
