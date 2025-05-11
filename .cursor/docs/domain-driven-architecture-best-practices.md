# Domain Drive Architecture Best Practices

## API Best Practices

API code exists within `../src/api`

This layer is specifically designed to define the allowed interfaces for accessing to the domain layer (`http`, `async events`, `cron jobs`, etc).

- What it is: The entry point into your application logic.
- Key principle: Exposes use cases or application services that clients (like REST endpoints, CLIs, message handlers) can call
- Contains:
  - Controllers (e.g., express.Router, Hono, FastAPI)
  - Input validation / transformation (DTOs)
  - Orchestrates application services or use cases
- Goal: Translate external requests into meaningful application actions

### Project Structure

- API http routes should be organized in the `../src/api/http/<version>/routes` directory
- API types and constants variables should be defined in `../src/api/http/models` or `../src/api/http/<version>/models.ts` accordingly
- Each route file should export a router instance using `makeApp()` to ensure a normalized Hono instance
- Middleware should be placed in `../src/api/http/<version>/middleware` or `../src/api/http/<version>/common` accordingly

## Domain Best Practices

Domain code exists within `../src/domain`

- What it is: The core logic of your application, representing your business rules, entities, value objects, and aggregates.
- Key principle: Pure, framework-agnostic, and independent of infrastructure.
- Contains:
  - Business entities (Order, Customer, etc.)
  - Business rules and policies
  - Domain services
  - Value objects

## SPI Best Practices

SPI code exists within `../src/domain`

- What it is: Abstractions for infrastructure dependencies used by the domain (e.g., repositories, external services).
- Key principle: Defined by the domain layers, implemented by the infrastructure layer.
- Example:
  - `SpiUserRepository` type (in domain layer)
    - `type SpiUserRepository = {...}`
  - `SpiUserRepository` instance (in spi layer)
    - `new SpiUserRepository(...dependencies)`
- Why it matters: Keeps the domain decoupled from persistence, APIs, queues, etc.
