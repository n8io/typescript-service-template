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

## Architecture Overview

This template follows a **Domain-Driven Design (DDD)** architecture with three main layers:

### API Layer (`src/api`)
The entry point for external requests. This layer handles:
- HTTP routing and request/response handling
- Input validation and transformation
- OpenAPI specification generation
- Middleware (error handling, logging, authentication)

**Structure:**
- `src/api/http/` - HTTP-specific code
  - `v1/` - API version 1 routes and middleware
  - `common/` - Shared routes (health, root, favicon)
  - `middleware/` - Cross-cutting concerns

### Domain Layer (`src/domain`)
The core business logic, completely framework-agnostic:
- Business entities and value objects
- Domain services (business rules)
- SPI ports (abstractions for infrastructure)

**Structure:**
- `src/domain/models/` - Domain models and types
- `src/domain/services/` - Business logic services
- `src/domain/spi-ports/` - Service Provider Interface contracts

### SPI Layer (`src/spi`)
Service Provider Interface implementations for infrastructure:
- Database repositories
- External service clients
- Infrastructure adapters

**Structure:**
- `src/spi/repositories/` - Data access implementations
  - `database/` - Drizzle ORM setup and migrations

### Data Flow
```
HTTP Request → API Layer → Domain Layer → SPI Layer → Database
                ↓            ↓              ↓
           Validation    Business Logic  Data Access
```

## Project Structure

```
src/
├── api/                    # API layer (HTTP endpoints)
│   └── http/
│       ├── common/         # Shared routes (health, root)
│       ├── middleware/    # Cross-cutting middleware
│       └── v1/            # API version 1
│           ├── routes/     # Route handlers
│           └── openapi/    # OpenAPI generation
├── domain/                 # Domain layer (business logic)
│   ├── models/            # Domain models
│   ├── services/          # Business logic services
│   └── spi-ports/         # Infrastructure abstractions
├── spi/                    # SPI layer (infrastructure)
│   └── repositories/      # Data access implementations
│       └── database/      # Drizzle ORM and migrations
├── models/                 # Shared models (errors, entities)
├── utils/                  # Utility functions
└── index.ts               # Application entry point
```

## Using This Template

This template is designed to be cloned and customized for new services. See [TEMPLATE_CUSTOMIZATION.md](./TEMPLATE_CUSTOMIZATION.md) for detailed instructions on:
- Renaming the service
- Adding new resources/entities
- Customizing the database schema
- Extending BaseService
- Adding new API routes

## Development Workflow

### Prerequisites
- Node.js 24+ (specified in `.nvmrc`)
- Docker and Docker Compose
- npm 11+

### Getting Started

1. **Clone and setup:**
   ```sh
   git clone <repository-url>
   cd typescript-service-template
   cp -n .env.example .env
   nvm install
   npm install
   ```

2. **Start development environment:**
   ```sh
   npm run docker:up
   ```
   This starts:
   - PostgreSQL database (port 5432)
   - Service with hot reload (port 3000)
   - Debugger (port 9229)

3. **Access the service:**
   - API: http://localhost:3000
   - Health check: http://localhost:3000/health
   - API docs: http://localhost:3000/api/v1/docs
   - OpenAPI spec: http://localhost:3000/api/v1/openapi

### Health Check Endpoint

The `/health` endpoint provides application and dependency status:

**Endpoint:** `GET /health`

**Response Format:**
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "isShuttingDown": false,
  "dependencies": [
    {
      "name": "database",
      "isConnected": true
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Application is healthy and all dependencies are connected
- `503 Service Unavailable` - Application is shutting down or dependencies are disconnected

**Use Cases:**
- Kubernetes/Docker health checks
- Load balancer health monitoring
- Monitoring and alerting systems

The health check response is cached for 30 seconds to reduce database load.

### Available Scripts

- `npm run dev` - Start development server (without Docker)
- `npm run docker:up` - Start services with Docker Compose (recommended)
- `npm run docker:build` - Build Docker image
- `npm run test` - Run tests with coverage
- `npm run lint` - Run all linting checks
- `npm run format` - Format code with Biome
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Apply database migrations

### Code Quality

The project enforces code quality through:
- **TypeScript** - Type safety with strict configuration
- **Biome** - Formatting, linting, and code style
- **Vitest** - Testing framework with 90% coverage requirement
- **Knip** - Dead code detection
- **Madge** - Circular dependency detection
- **cspell** - Spelling checks

Git hooks (via Lefthook) automatically:
- Format and lint changed files on commit
- Validate commit messages
- Check branch names on push

## Testing

### Running Tests

```sh
# Run all tests with coverage
npm run test

# Run tests in watch mode (for development)
npm run test:watch
```

### Coverage Requirements

The project enforces **90% coverage** across:
- Branches
- Functions
- Lines
- Statements

Coverage reports are generated in the `coverage/` directory and automatically uploaded to PRs via GitHub Actions.

### Test Structure

- Test files are co-located with source files (e.g., `resource.test.ts` next to `resource.ts`)
- Use Vitest for all testing
- Mock external dependencies appropriately
- Follow the testing patterns established in existing tests

## Troubleshooting

### Service won't start

1. **Check environment variables:**
   ```sh
   # Ensure .env file exists and has required variables
   cat .env
   ```

2. **Check database connection:**
   - Verify `DATABASE_URL` is correct
   - Ensure PostgreSQL is running: `docker compose ps`
   - Check database logs: `docker compose logs db`

3. **Check Node version:**
   ```sh
   node --version  # Should match .nvmrc
   nvm install     # Install correct version
   ```

### Tests failing

1. **Clear coverage and re-run:**
   ```sh
   npm run clean
   npm run test
   ```

2. **Check for type errors:**
   ```sh
   npm run lint:types
   ```

3. **Verify test environment:**
   - Ensure `NODE_ENV=test` is set (handled automatically by Vitest)

### Database migration issues

1. **Check migration status:**
   ```sh
   npm run db:migrate
   ```

2. **Generate new migration:**
   ```sh
   # After modifying schema in src/spi/repositories/database/schema.ts
   npm run db:generate
   ```

3. **Check for drift:**
   ```sh
   npm run lint:db-migrations
   ```

### Linting errors

1. **Auto-fix what's possible:**
   ```sh
   npm run format
   ```

2. **Check specific lint rules:**
   ```sh
   npm run lint:style    # Biome style checks
   npm run lint:types    # TypeScript checks
   npm run lint:dead-code # Unused code
   ```

### Docker issues

1. **Rebuild containers:**
   ```sh
   docker compose down
   docker compose up --build
   ```

2. **Clear volumes (⚠️ deletes data):**
   ```sh
   docker compose down -v
   ```

3. **Check container logs:**
   ```sh
   docker compose logs service
   docker compose logs db
   ```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed contribution guidelines, including:
- Development setup
- Code style requirements
- Testing requirements
- Commit message format
- Branch naming conventions
- PR process

😃 PRs welcome!
