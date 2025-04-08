import { urlSearchParamsToSort } from './sorting.ts'

describe('urlSearchParamsToSort', () => {
  it('should return undefined if no search params are provided', () => {
    const sortableFields = ['age', 'name']
    const params = new URLSearchParams()
    const result = urlSearchParamsToSort(params, { sortableFields })

    expect(result).toBeUndefined()
  })

  it('should return undefined if no sort params are provided', () => {
    const sortableFields = ['age', 'name']
    const params = new URLSearchParams()

    params.append('name', 'NAME')

    const result = urlSearchParamsToSort(params, { sortableFields })

    expect(result).toBeUndefined()
  })

  it('should parse the kitchen sink of sorting search params', () => {
    const sortableFields = ['age', 'name']
    const params = new URLSearchParams()

    params.append('sort', 'name,-age')

    const result = urlSearchParamsToSort(params, { sortableFields })

    expect(result).toEqual([
      { field: 'name', direction: 'asc' },
      { field: 'age', direction: 'desc' },
    ])
  })

  it('should return the last sort value when the sort params have multiple values', () => {
    const sortableFields = ['age', 'name']
    const params = new URLSearchParams()

    params.append('sort', 'name,-age')
    params.append('sort', '-name')
    params.append('sort', 'name')

    const result = urlSearchParamsToSort(params, { sortableFields })

    expect(result).toEqual([
      { field: 'age', direction: 'desc' },
      { field: 'name', direction: 'asc' },
    ])
  })

  it('should return undefined if no sortable fields are provided', () => {
    const sortableFields: string[] = []
    const params = new URLSearchParams()

    params.append('sort', 'name')

    const result = urlSearchParamsToSort(params, { sortableFields })

    expect(result).toBeUndefined()
  })

  it('should throw an error if the field is not supported', () => {
    const sortableFields = ['age', 'name']
    const params = new URLSearchParams()

    params.append('sort', 'invalidField')

    expect(() => urlSearchParamsToSort(params, { sortableFields })).toThrowError(
      'The sorting by the field "invalidField" is not supported',
    )
  })
})
