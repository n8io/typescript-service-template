import { ApiUnsupportedSortFieldError } from '../../models/custom-error.ts'

type Options = {
  sortableFields: string[]
}

type SortDirection = 'asc' | 'desc'

type SortField<T> = {
  field: T
  direction: SortDirection
}

const urlSearchParamsToSort = (
  params: URLSearchParams,
  { sortableFields: sortableFieldsRaw }: Options,
): SortField<(typeof sortableFieldsRaw)[number]>[] | undefined => {
  if (!params?.has('sort')) {
    return undefined
  }

  if (!sortableFieldsRaw?.length) {
    return undefined
  }

  const sortableFields = new Set(sortableFieldsRaw)
  const sortParams = params.getAll('sort')
  const sortFields = new Map<(typeof sortableFieldsRaw)[number], SortDirection>()

  const entries = sortParams
    .join(',')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  for (const entry of entries) {
    let direction: SortDirection = 'asc'
    let field = entry

    if (entry.startsWith('-')) {
      direction = 'desc'
      field = entry.slice(1)
    }

    if (!sortableFields.has(field)) {
      throw new ApiUnsupportedSortFieldError(field)
    }

    if (sortFields.has(field)) {
      sortFields.delete(field)
    }

    sortFields.set(field, direction)
  }

  return Array.from(sortFields).map(([fieldRaw, direction]) => {
    const field = fieldRaw as (typeof sortableFieldsRaw)[number]

    return {
      field,
      direction,
    }
  })
}

export { urlSearchParamsToSort }
