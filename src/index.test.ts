vi.mock('./utils/app-state-manager.ts', () => {
  const registerClosableDependency = vi.fn()
  const AppStateManager = vi.fn().mockImplementation(() => ({
    registerClosableDependency,
  }))

  return {
    AppStateManager,
    registerClosableDependency,
  }
})

vi.mock('./utils/config.ts', () => ({
  config: { mock: 'config' },
}))

vi.mock('./spi/init.ts', () => ({
  initSpi: vi.fn().mockResolvedValue('mockedSpi'),
}))

vi.mock('./domain/init.ts', () => ({
  initDomain: vi.fn().mockResolvedValue('mockedDomain'),
}))

vi.mock('./api/init.ts', () => ({
  initApi: vi.fn().mockResolvedValue({ server: { id: 'mock-server' } }),
}))

describe('start', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('wires up and registers the server dependency', async () => {
    const { start } = await import('./index.ts') // <-- IMPORTANT: must come AFTER mocks

    const { AppStateManager } = await import('./utils/app-state-manager.ts')
    const { config } = await import('./utils/config.ts')
    const { initSpi } = await import('./spi/init.ts')
    const { initDomain } = await import('./domain/init.ts')
    const { initApi } = await import('./api/init.ts')

    const appStateManager = await start()

    expect(AppStateManager).toHaveBeenCalled()
    expect(initSpi).toHaveBeenCalledWith({ appStateManager, config })
    expect(initDomain).toHaveBeenCalledWith('mockedSpi')
    expect(initApi).toHaveBeenCalledWith({ appStateManager, domain: 'mockedDomain' })
    expect(appStateManager.registerClosableDependency).toHaveBeenCalledWith({ id: 'mock-server' })
  })
})
