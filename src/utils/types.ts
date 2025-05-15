declare global {
  type NonEmptyArray<T> = [T, ...T[]]

  type Prettify<T> = {
    [K in keyof T]: T[K]
  } & {}
}
