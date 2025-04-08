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

- [x] 🐕‍🦺 Use Hono server framework
- [x] 💅 Use BiomeJs for style/linting/formatting
- [x] 🧪 Use Vitest testing framework
- [x] 📋 No transpiling steps, native TS code only
- [x] 📈 Enforce high unit test coverage
- [x] ⏰ Enforce a sane http request timeout
- [x] 🔇 No unnecessary exposure of an entity's db `id`, only use `gid`
- [x] 🆔 Automatically append `requestId` to api requests
- [x] 🧑‍🏭 CI/CD
  - [x] 👨‍⚕️ Use GitHub actions to automate as much as possible
  - [x] 📔 Every PR must have code a coverage report
  - [x] 🔍 Audit dependencies
- [x] 🧑‍⚖️ Only use `type` instead of `interface` keyword
- [x] 📊 Bake in OpenTelemetry metrics
- [ ] 👷 Adapt api requests to domain request shape (filters, sorting, pagination) via common util(s)
- [ ] 🏪 Adapt domain requests to spi request format via common util(s)
- [ ] 🗄️ Use Drizzle for db layer
- [ ] 🤓 DX improvements
  - [x] ⌚ Leverage native `node --watch` to restart server on code changes
  - [x] 🪝 Git hooks
    - [x] ...on commit
      - [x] Format changed code
      - [x] Lint changed code
      - [x] Lint changed types
      - [x] Lint changed spelling
      - [x] Lint commit message
      - [x] Identify dead code
      - [x] Identify circular dependencies
    - [x] ...on push
      - [x] Lint branch name
  - [ ] 📛 Automatically update badges in README (test coverage)
  - [ ] ♻️ Autogenerate openapi spec
  - [ ] 📘 Autogenerate api documentation
  - [ ] 📗 Expose swagger documentation

## Contributing

😃 PRs welcome!
