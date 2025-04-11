import { isValid } from 'ulid'
import { id } from './id.ts'

describe('id', () => {
  it('should generate a valid UUID', () => {
    const generatedId = id()

    expect(isValid(generatedId)).toBe(true)
  })

  it('should generate unique IDs', () => {
    const generatedIds = new Set<string>()

    for (let i = 0; i < 100; i++) {
      generatedIds.add(id())
    }

    expect(generatedIds.size).toBe(100)
  })
})
