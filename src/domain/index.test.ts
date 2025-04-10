import type { Spi } from '../spi/index.ts'
import { initDomain } from './index.ts'
import * as Services from './services/index.ts'

vi.mock('./services/index.ts')

describe('initDomain', () => {
  it('should initialize the services', async () => {
    const mockServices = {} as Awaited<ReturnType<typeof Services.initServices>>

    const initServicesSpy = vi.spyOn(Services, 'initServices').mockResolvedValue(mockServices)

    const spi = {} as Spi
    const result = await initDomain(spi)

    expect(initServicesSpy).toBeCalledWith(spi)
    expect(result.services).toBe(mockServices)
  })
})
