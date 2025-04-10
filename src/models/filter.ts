const Operator = {
  eq: 'eq',
  neq: 'neq',
  gt: 'gt',
  gte: 'gte',
  lt: 'lt',
  lte: 'lte',
  in: 'in',
  nin: 'nin',
  search: 'search',
} as const

type Operator = (typeof Operator)[keyof typeof Operator]

export { Operator }
