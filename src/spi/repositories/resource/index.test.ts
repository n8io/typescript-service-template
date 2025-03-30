import { describe, expect, it } from 'vitest'
import { ResourceRepository } from './index.ts'

describe('ResourceRepository', () => {
  it('should have a method called getOne', () => {
    const repository = new ResourceRepository({
      db: {
        connection: {
          url: 'test-url',
        },
      },
    })

    expect(repository.getOne).toBeDefined()
  })
})
