import { isValid } from 'ulid'
import { gid } from './gid.ts'
describe('gid', () => {
  it('should generate a valid ulid', () => {
    const generatedGid = gid()

    expect(isValid(generatedGid)).toBe(true)
  })

  it('should generate unique GIDs', () => {
    const generatedGids = new Set<string>()

    for (let i = 0; i < 100; i++) {
      generatedGids.add(gid())
    }

    expect(generatedGids.size).toBe(100)
  })
})
