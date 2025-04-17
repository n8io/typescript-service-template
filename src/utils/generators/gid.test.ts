import { GID_DELIMITER, GID_PREFIX, gid } from './gid.ts'

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
