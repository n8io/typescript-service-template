type Options = {
  sortableFields: string[]
}

type SortDirection = 'asc' | 'desc'

type SortField<T> = {
  field: T
  direction: SortDirection
}

class CustomError extends Error {
  code?: string

  constructor(name: string, message: string, code?: string) {
    super(message)
    this.code = code
    this.name = name
  }

  override toString() {
    return `[${this.name}] ${this.message}`
  }
}

class UnsupportedSortFieldError extends CustomError {
  constructor(field: string) {
    super(
      'UnsupportedSortFieldError',
      `The sorting by the field "${field}" is not supported`,
      'UNSUPPORTED_SORT_FIELD_ERROR',
    )
  }
}

const urlSearchParamsToSort = (
  params: URLSearchParams,
  { sortableFields: sortableFieldsRaw }: Options,
): SortField<(typeof sortableFieldsRaw)[number]>[] | undefined => {
  if (!params?.has('sort')) {
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
      throw new UnsupportedSortFieldError(field)
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
