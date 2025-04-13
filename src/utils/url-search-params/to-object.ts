const urlSearchParamsToObject = (params: URLSearchParams) => {
  const result: Record<string, string | string[]> = {}

  for (const [key, value] of params) {
    // Fast path: skip split if no comma
    const hasComma = value.includes(',')
    const values = hasComma ? value.split(',') : [value]

    for (let i = 0; i < values.length; i++) {
      const v = values?.[i]?.trim()

      if (!v) {
        continue
      }

      if (result[key] === undefined) {
        result[key] = v
      } else if (Array.isArray(result[key])) {
        ;(result[key] as string[]).push(v)
      } else {
        result[key] = [result[key] as string, v]
      }
    }
  }

  return result
}

export { urlSearchParamsToObject }
