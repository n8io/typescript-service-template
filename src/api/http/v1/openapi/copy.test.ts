import { copy } from './copy.ts'

const { sortable } = copy

describe('sortable()', () => {
  it('should return a string', () => {
    const result = sortable(['name', 'createdAt'])

    expect(typeof result).toBe('string')
  })

  it('should start with the "Sorting" heading', () => {
    const result = sortable(['name', 'createdAt']).trim()

    expect(result).toMatch(/^#### Sorting/)
  })

  it('should include all provided fields in sorted order', () => {
    const fields = ['zeta', 'alpha', 'beta']
    const result = sortable(fields)

    // Check all original fields are present with hyphen and backticks
    for (const field of fields) {
      expect(result).toContain(`- \`${field}\``)
    }

    expect(result).toMatchInlineSnapshot(`
      "
      #### Sorting

      You can refine your results via the \`sort\` query parameter. The value of this parameter is a comma-separated list of fields to sort by:

      - \`alpha\`
      - \`beta\`
      - \`zeta\`
      "
    `)
  })

  it('should return an empty string if no fields are provided', () => {
    const result = sortable([])

    expect(result).toEqual('')
  })
})
