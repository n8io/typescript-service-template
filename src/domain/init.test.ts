import type { Spi } from '../spi/init.ts'
import { initDomain } from './init.ts'
import * as Services from './services/init.ts'

vi.mock('./services/init.ts')

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
