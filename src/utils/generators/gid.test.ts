import { gid } from './gid.ts'

describe('gid', () => {
  it('should generate a valid UUID', () => {
    const generatedGid = gid()

    expect(generatedGid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('should generate unique GIDs', () => {
    const generatedGids = new Set<string>()

    for (let i = 0; i < 100; i++) {
      generatedGids.add(gid())
    }

    expect(generatedGids.size).toBe(100)
  })
})
