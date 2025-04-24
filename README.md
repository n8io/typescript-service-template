# typescript-service-template

A Hono service written in Typescript with best-in-class tooling.

## Getting Started

```sh
# Create default environment vars
cp -n .env.example .env

# Ensure we're using the proper version of Node
nvm install

# Install Node packages
npm install

# Via Docker 🐳
npm run docker:up
```

## Goals

- [x] 🔥 Use Hono server framework
- [x] 💅 Use BiomeJs for style/linting/formatting
- [x] 🧪 Use Vitest testing framework
- [x] 📋 No transpiling steps, native TS code only
- [x] 📈 Enforce high unit test coverage
- [x] ⏰ Enforce a sane http request timeout
- [x] 🔇 No unnecessary exposure of an entity's db `id`, only use `gid`
- [x] 🆔 Automatically append `requestId` to api requests
- [x] 🧑‍🏭 CI/CD
  - [x] 👨‍⚕️ Use GitHub actions to automate as much as possible
  - [x] 📔 Every PR must have a code coverage report
  - [x] 🔍 Audit dependencies
- [x] 🧑‍⚖️ Only use `type` instead of `interface` keyword
- [x] 📊 Bake in OpenTelemetry metrics
- [x] 👷 Adapt api requests to domain request shape (filters, sorting, pagination) via common util(s)
- [x] 🏪 Adapt domain requests to spi request format via common util(s)
- [x] 🚔 Enforce a request header client id
- [x] 🗄️ Use Drizzle for db layer
  - [x] 🏊‍♂️ Implement db connection pooling
  - [x] 🛑 Properly handle db level errors (index violations etc)
- [x] ✍️ Utilize structured logging (pino)
  - [x] 🪵 No console logs
- [x] 🛢️ No barrel or index files
- [x] 🔢 Make the `.nvmrc` the single source of truth for the node version
- [x] ♻️ [Autogenerate openapi spec](http://localhost:3000/api/v1/openapi) (hono-openapi)
- [x] 📘 Autogenerate api documentation (hono-openapi)
- [x] 📗 [Expose Swagger-like documentation](http://localhost:3000/api/v1/docs) (Scalar)
- [x] 🤓 DX improvements
  - [x] ⌚ Leverage native `node --watch` to restart server on code changes
  - [x] 🕵️‍♀️ Leverage native `docker compose --watch` to restart the container on code changes
  - [x] 🐳 Cache `node_modules` in Docker during development
  - [x] 🥳 Add VSCode launch configuration for debugging (in Docker)
  - [x] 🪝 Git hooks
    - [x] ...on commit
      - [x] Format changed code
      - [x] Lint changed code
      - [x] Lint changed db migrations
      - [x] Lint changed types
      - [x] Lint changed spelling
      - [x] Lint commit message
      - [x] Lint dead code
      - [x] Lint circular dependencies
    - [x] ...on push
      - [x] Lint branch name

## Contributing

😃 PRs welcome!
