import { GID_DELIMITER, GID_PREFIX, gid, isGid } from './gid.ts'

const isValid = (gid: string) => {
  const [prefix, uuid] = gid.trim().split(GID_DELIMITER)

  if (!prefix || !uuid) {
    return false
  }

  return prefix === GID_PREFIX && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uuid)
}

describe('gid', () => {
  it('should generate a valid GID', () => {
    const generatedGid = gid()

    expect(isValid(generatedGid)).toBe(true)
  })

  it('should generate unique GIDs', () => {
    const generatedGids = new Set<string>()
    const generations = 1_000

    for (let i = 0; i < generations; i++) {
      generatedGids.add(gid())
    }

    expect(generatedGids.size).toBe(generations)
  })
})

describe('isGid', () => {
  it('should return true for valid GIDs', () => {
    const validGid = gid()

    expect(isGid(validGid)).toBe(true)
    expect(isGid('123.00000000-0000-0000-0000-000000000000')).toBe(true)
    expect(isGid('0087.73450076-8a50-4f31-81f0-3a488f16f741')).toBe(true)
  })

  it('should return false for invalid GIDs', () => {
    const invalidGid = 'NOT_A_GID'

    expect(isGid(invalidGid)).toBe(false)
  })
})
