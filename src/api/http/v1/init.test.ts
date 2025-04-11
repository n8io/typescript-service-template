import type { Domain } from '../../../domain/init.ts'
import * as Middleware from '../middleware/init.ts'
import { initV1 } from './init.ts'

vi.mock('../middleware/init.ts', () => ({
  initMiddleware: vi.fn(),
}))

describe('makeV1', () => {
  it('should initialize the middleware with the params', () => {
    const mockDomain = {} as Domain

    const initMiddlewareSpy = vi
      .spyOn(Middleware, 'initMiddleware')
      // @ts-expect-error We are mocking the return value
      .mockReturnValue({ route: vi.fn() })

    const v1 = initV1(mockDomain)

    expect(v1).toBeDefined()
    expect(initMiddlewareSpy).toHaveBeenCalledWith(mockDomain)
  })
})
