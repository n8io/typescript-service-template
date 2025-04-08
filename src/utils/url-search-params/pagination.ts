import { z } from 'zod'
import { validation } from '../validation.ts'

const paginate = z.object({
  page: validation.number.int().min(0).optional(),
  pageSize: validation.number.int().min(0).optional(),
})

type Paginate = z.infer<typeof paginate>

const PageParams = {
  PAGE: 'page',
  PAGE_SIZE: 'pageSize',
} as const

const urlSearchParamsToPagination = (params: URLSearchParams): Paginate | undefined => {
  if (!params) {
    return undefined
  }

  if (!params.has(PageParams.PAGE) && !params.has(PageParams.PAGE_SIZE)) {
    return undefined
  }

  const page = params.get(PageParams.PAGE)
  const pageSize = params.get(PageParams.PAGE_SIZE)

  return paginate.parse({ page, pageSize })
}

export { urlSearchParamsToPagination }
