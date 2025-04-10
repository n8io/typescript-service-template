import { z } from 'zod'

const paginate = z
  .object({
    page: z.coerce.number().int().optional(),
    pageSize: z.coerce.number().int().optional(),
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

  const page = params.get(PageParams.PAGE) ?? undefined
  const pageSize = params.get(PageParams.PAGE_SIZE) ?? undefined

  return paginate.parse({ page, pageSize })
}

export { urlSearchParamsToPagination }
