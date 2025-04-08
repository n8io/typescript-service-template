import { z } from 'zod'
import { paginate as pagination } from '../validation.ts'

const paginate = pagination
  .pick({
    page: true,
    pageSize: true,
  })
  .optional()

type Paginate = z.infer<typeof paginate>

const PageParams = {
  PAGE: 'page',
  PAGE_SIZE: 'pageSize',
} as const

const urlSearchParamsToPagination = (params: URLSearchParams): Paginate | undefined => {
  if (!params) {
    return undefined
  }

  const hasPaginationParams = [PageParams.PAGE, PageParams.PAGE_SIZE].some((param) => params.has(param))

  if (!hasPaginationParams) {
    return undefined
  }

  const page = params.get(PageParams.PAGE)
  const pageSize = params.get(PageParams.PAGE_SIZE)

  return paginate.parse({ page, pageSize })
}

export { urlSearchParamsToPagination }
