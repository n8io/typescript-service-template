import { z } from 'zod'
import { ApiUnsupportedSortFieldError } from '../../models/custom-error.ts'
import { validation } from '../validation.ts'

const schemaOptions = z.object({
  sortableFields: z.array(validation.string),
})

type Options = Prettify<z.infer<typeof schemaOptions>>

const SortDirection = {
  ASC: 'ASC',
  DESC: 'DESC',
} as const

const schemaSortDirection = validation.string.toUpperCase().pipe(z.nativeEnum(SortDirection)).openapi({
  description: 'The direction of the sort. Can be either "ASC" or "DESC".',
  example: 'ASC',
})

type SortDirection = z.infer<typeof schemaSortDirection>

type SortField<T> = {
  field: T
  direction: SortDirection
}

const URL_SEARCH_PARAMS_SORT_KEY = 'sort'
const URL_SEARCH_PARAMS_SORT_KEY_PREFIX = '-'

const urlSearchParamsToSort = (
  params: URLSearchParams,
  { sortableFields }: Options,
): SortField<(typeof sortableFields)[number]>[] | undefined => {
  if (!params?.has(URL_SEARCH_PARAMS_SORT_KEY)) {
    return undefined
  }

  if (!sortableFields?.length) {
    return undefined
  }

  const uniqueSortableFields = new Set(sortableFields)
  const sortParams = params.getAll(URL_SEARCH_PARAMS_SORT_KEY)
  const sortFields = new Map<(typeof sortableFields)[number], SortDirection>()

  // We join & split to handle cases where the sort param is a key containing commas (e.g. ["name,age", "createdAt"])
  const entries = sortParams
    .join(',')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  for (const entry of entries) {
    let direction: SortDirection = 'ASC'
    let field = entry

    if (entry.startsWith(URL_SEARCH_PARAMS_SORT_KEY_PREFIX)) {
      direction = 'DESC'
      field = entry.slice(1)
    }

    if (!uniqueSortableFields.has(field)) {
      throw new ApiUnsupportedSortFieldError(field)
    }

    if (sortFields.has(field)) {
      sortFields.delete(field)
    }

    sortFields.set(field, direction)
  }

  return Array.from(sortFields).map(([fieldRaw, direction]) => {
    const field = fieldRaw as (typeof sortableFields)[number]

    return {
      field,
      direction,
    }
  })
}

export { schemaSortDirection, urlSearchParamsToSort }
