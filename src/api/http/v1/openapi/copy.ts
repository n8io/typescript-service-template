const introduction = `
🚀 An API for managing resources

### Pagination

All endpoints that return a list of items support pagination via search parameters. 

The following parameters are supported:

- \`page\` - The page number to return. Note that the first page is \`1\`.
- \`pageSize\` - The number of items to return per page

#### Filtering

Most filterable search parameters support the following operators:

- \`eq\` - equal
- \`ne\` - not equal
- \`gt\` - greater than
- \`gte\` - greater than or equal
- \`lt\` - less than
- \`lte\` - less than or equal
- \`in\` - in
- \`nin\` - not in
- \`search\` - case insensitive search

> [!NOTE] You can combine multiple operators in a single request.
> For example \`createdAt:gte=2023-01-01Z&createdAt:lt=2024-01-01Z\`

#### Sorting

Paginated response allow sorting by multiple fields. 

For example, to sort by \`createdAt\` descending and \`name\` ascending: \`sort=-createdAt,name\`

> [!NOTE]
> To sort a field in descending order, prefix it with a \`-\`
`

const sortable = (sortableFields: string[]) => `
#### Sorting

You can refine your results via the \`sort\` query parameter. The value of this parameter is a comma-separated list of fields to sort by:

${sortableFields
  .toSorted()
  .map((field) => `- \`${field}\``)
  .join('\n')}
`

const copy = {
  introduction,
  sortable,
} as const

export { copy }
