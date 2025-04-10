import { start } from './index.ts'
import { config } from './utils/config.ts'

vi.mock('./utils/config.ts', () => ({
  config: {},
}))

vi.mock('./spi/index.ts', () => ({
  initSpi: vi.fn(async () => 'mockedSpi'),
}))

vi.mock('./domain/index.ts', () => ({
  initDomain: vi.fn(async () => 'mockedDomain'),
}))

vi.mock('./api/index.ts', () => ({
  initApi: vi.fn(async () => ({
    server: { id: 'mock-server' },
  })),
}))

vi.mock('./utils/app-state-manager.ts', () => ({
  // biome-ignore lint/style/useNamingConvention: <explanation>
  AppStateManager: vi.fn().mockImplementation(() => ({
    registerClosableDependency: vi.fn(),
  })),
}))

describe('start', () => {
  it('wires up and registers the server dependency', async () => {
    const { AppStateManager } = await import('./utils/app-state-manager.ts')
    const { initSpi } = await import('./spi/index.ts')
    const { initDomain } = await import('./domain/index.ts')
    const { initApi } = await import('./api/index.ts')
    const appState = await start()

    expect(initSpi).toHaveBeenCalledWith(config)
    expect(initDomain).toHaveBeenCalledWith('mockedSpi')
    expect(initApi).toHaveBeenCalledWith('mockedDomain')

    expect(AppStateManager).toHaveBeenCalled()
    expect(appState.registerClosableDependency).toHaveBeenCalledWith({ id: 'mock-server' })
  })
})
