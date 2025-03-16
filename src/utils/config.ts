type Config = {
  DATABASE_URL: string
}

const config: Config = {
  DATABASE_URL: process.env.DATABASE_URL ?? '',
}

export type { Config }
export { config }
