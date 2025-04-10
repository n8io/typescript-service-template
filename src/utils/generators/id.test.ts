import { id } from './id.ts'

describe('id', () => {
  it('should generate a valid UUID', () => {
    const generatedId = id()

    expect(generatedId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('should generate unique IDs', () => {
    const generatedIds = new Set<string>()

    for (let i = 0; i < 100; i++) {
      generatedIds.add(id())
    }

    expect(generatedIds.size).toBe(100)
  })
})
