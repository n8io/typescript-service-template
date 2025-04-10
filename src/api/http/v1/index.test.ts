import type { Domain } from '../../../domain/index.ts'
import * as Middleware from '../middleware/index.ts'
import { makeV1 } from './index.ts'

vi.mock('../middleware/index.ts')

describe('makeV1', () => {
  it('should initialize the middleware with the params', () => {
    const mockDomain = {} as Domain

    const initMiddlewareSpy = vi
      .spyOn(Middleware, 'initMiddleware')
      // @ts-expect-error We are mocking the return value
      .mockReturnValue({ route: vi.fn() })
    const v1 = makeV1(mockDomain)

    expect(v1).toBeDefined()
    expect(initMiddlewareSpy).toHaveBeenCalledWith(mockDomain)
  })
})
