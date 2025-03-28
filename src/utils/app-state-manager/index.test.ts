import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppStateManager, type Closable, type Monitorable } from './index.ts'

describe('AppState', () => {
  let asm: AppStateManager

  beforeEach(() => {
    vi.clearAllMocks()

    asm = new AppStateManager()
    vi.spyOn(console, 'error').mockReturnValue()
    vi.spyOn(console, 'info').mockReturnValue()
    vi.spyOn(console, 'log').mockReturnValue()
    vi.spyOn(console, 'warn').mockReturnValue()
  })

  it('should initialize with default state', async () => {
    const actual = await asm.getMonitorableDependencyStatuses()

    expect(actual).toEqual([])
  })

  it('should register and return monitorable dependencies', async () => {
    class MockMonitorable implements Monitorable {
      name = 'MockMonitorable'
      isConnected = async () => true
    }

    const mockMonitorable = new MockMonitorable()

    asm.registerMonitorableDependency(mockMonitorable)

    const actual = await asm.getMonitorableDependencyStatuses()

    expect(actual).toEqual([
      {
        name: 'MockMonitorable',
        isConnected: true,
      },
    ])
  })

  describe('when SIGTERM signal is received', () => {
    it('should call closable dependencies', async () => {
      const mockClose = vi.fn().mockResolvedValue(undefined)

      class MockCloseable implements Closable {
        name = 'MockCloseable'
        close = mockClose
      }
      const mockCloseable = new MockCloseable()

      asm.registerClosableDependency(mockCloseable)
      process.emit('SIGTERM')

      expect(mockClose).toHaveBeenCalledWith()
    })
  })

  describe('when SIGINT signal is received', () => {
    it('should call closable dependencies', async () => {
      const mockClose = vi.fn().mockResolvedValue(undefined)

      class MockCloseable implements Closable {
        name = 'MockCloseable'
        close = mockClose
      }
      const mockCloseable = new MockCloseable()

      asm.registerClosableDependency(mockCloseable)
      process.emit('SIGINT')

      expect(mockClose).toHaveBeenCalledWith()
    })
  })

  describe('when exit signal is received', () => {
    it('should call closable dependencies', async () => {
      const mockClose = vi.fn().mockResolvedValue(undefined)

      class MockCloseable implements Closable {
        name = 'MockCloseable'
        close = mockClose
      }
      const mockCloseable = new MockCloseable()

      asm.registerClosableDependency(mockCloseable)

      // @ts-expect-error - We are testing the behavior of the exit handler
      process.emit('exit')

      expect(mockClose).toHaveBeenCalledWith()
    })
  })

  describe('when a closable dependency throws an error during close', () => {
    it('should log the error and continue shutting down gracefully', async () => {
      const mockCloseOne = vi.fn().mockRejectedValue(new Error('MOCK_ERROR'))
      const mockCloseTwo = vi.fn().mockRejectedValue(undefined)

      class MockCloseableOne implements Closable {
        name = 'MockCloseableOne'
        close = mockCloseOne
      }

      class MockCloseableTwo implements Closable {
        name = 'MockCloseableTwo'
        close = mockCloseTwo
      }

      const mockCloseableOne = new MockCloseableOne()
      const mockCloseableTwo = new MockCloseableTwo()

      asm.registerClosableDependency(mockCloseableOne)
      asm.registerClosableDependency(mockCloseableTwo)
      process.emit('SIGTERM')
      expect(mockCloseOne).toHaveBeenCalledWith()
      expect(mockCloseTwo).toHaveBeenCalledWith()
    })
  })

  describe('when error unhandled rejection is thrown', () => {
    it('should log a message and the error', async () => {
      const mockError = new Error('MOCK_ERROR')
      const consoleSpyError = vi.spyOn(console, 'error')
      // @ts-expect-error This will trigger the unhandled rejection handler
      process.emit('unhandledRejection', mockError)

      expect(consoleSpyError).toHaveBeenCalledWith('😱 Oh no, there was an unhandled rejection', mockError)
    })
  })

  describe('when non-error unhandled rejection is thrown', () => {
    it('should log a message and reason as an object', async () => {
      const reason = 'REASON'
      const consoleSpyError = vi.spyOn(console, 'error')
      // @ts-expect-error This will trigger the unhandled rejection handler
      process.emit('unhandledRejection', reason)

      expect(consoleSpyError).toHaveBeenCalledWith('😱 Oh no, there was an unhandled rejection', { reason })
    })
  })
})
