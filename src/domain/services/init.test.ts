import type { Spi } from '../../spi/init.ts'
import { initServices } from './init.ts'
import { ResourceService } from './resource.ts'

describe('initServices', () => {
  it('should initialize the resource service with the repository', async () => {
    const mockRepository = {} as Spi['repositories']['resource']

    const mockSpi = {
      repositories: {
        resource: mockRepository,
      },
    }

    const services = await initServices(mockSpi)

    expect(services).toBeDefined()
    expect(services.resource).toBeInstanceOf(ResourceService)
  })
})
