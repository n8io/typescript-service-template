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

> [!IMPORTANT]
> SPI ports (abstractions) are defined within `../src/domain/spi-ports`, while SPI implementations exist within `../src/spi`.

- What it is: Abstractions for infrastructure dependencies used by the domain (e.g., repositories, external services).
- Key principle: Defined by the domain layers, implemented by the infrastructure layer.
- Example:
  - `SpiUserRepository` type (in domain layer)
    - `type SpiUserRepository = {...}`
  - `SpiUserRepository` instance (in spi layer)
    - `new SpiUserRepository(...dependencies)`
- Why it matters: Keeps the domain decoupled from persistence, APIs, queues, etc.

## Layer Interaction Patterns

### Request Flow

```
HTTP Request
    ↓
API Layer (validation, transformation)
    ↓
Domain Layer (business logic)
    ↓
SPI Layer (data access)
    ↓
Database/External Service
```

### Response Flow

```
Database/External Service
    ↓
SPI Layer (raw data)
    ↓
Domain Layer (business objects)
    ↓
API Layer (serialization)
    ↓
HTTP Response
```

### Example: Creating a User

**API Layer** (`src/api/http/v1/routes/users.ts`):
```typescript
// 1. Receive HTTP request
// 2. Validate input with Zod schema
// 3. Transform to domain request
const user = await services.user.createOne(request)
// 4. Serialize response
return ctx.json(user)
```

**Domain Layer** (`src/domain/services/user.ts`):
```typescript
// 1. Apply business rules
// 2. Generate gid
// 3. Set timestamps
// 4. Call SPI repository
const created = await this.dependencies.repository.createOne({...})
// 5. Return domain object
return this.getOne(created.gid)
```

**SPI Layer** (`src/spi/repositories/user.ts`):
```typescript
// 1. Transform domain object to database format
// 2. Execute database query
// 3. Return raw data
return await this.db.insert(tableUsers).values(data)
```

## Common Patterns

### Pattern 1: Standard CRUD Service

Use `BaseService` for standard CRUD operations:

```typescript
class UserService extends BaseService<User> {
  static readonly propsMeta = {
    create: ['email', 'name', 'createdBy'],
    filter: ['email', 'gid', 'name'],
    sort: ['createdAt', 'email', 'name'],
    update: ['email', 'name', 'updatedBy'],
  }

  static readonly schemas = {
    core: schemaUser,
    request: { /* ... */ },
    response: { /* ... */ },
  }
}
```

### Pattern 2: Custom Business Logic

Add custom methods to services:

```typescript
class UserService extends BaseService<User> {
  // ... standard CRUD ...

  async activateUser(gid: string, activatedBy: AuditRecord): Promise<User> {
    // Business logic here
    const user = await this.getOne(gid)
    if (user.isActive) {
      throw new Error('User already active')
    }
    return this.updateOne(gid, { isActive: true, updatedBy: activatedBy })
  }
}
```

### Pattern 3: Repository Abstraction

Define SPI port in domain, implement in SPI:

**Domain** (`src/domain/spi-ports/user-repository.ts`):
```typescript
type SpiUserRepository = {
  createOne: (request: User) => Promise<User>
  getMany: (query: SpiGetManyRequest) => Promise<SpiPaginatedResponse<User>>
  // ...
}
```

**SPI** (`src/spi/repositories/user.ts`):
```typescript
class UserRepository implements SpiUserRepository {
  // Implementation using Drizzle ORM
}
```

### Pattern 4: Request Transformation

Transform API requests to domain format:

```typescript
// API Layer
const params = new URL(ctx.req.url).searchParams
const request: DomainGetManyRequest = {
  filters: urlSearchParamsToFilters(params, { baseSchema: UserService.schemas.core }),
  pagination: urlSearchParamsToPagination(params),
  sorting: urlSearchParamsToSort(params, { sortableFields: UserService.propsMeta.sort }),
}
```

## Anti-Patterns

### ❌ Business Logic in API Layer

```typescript
// ❌ BAD: Business logic in route handler
resources.post('/', async (ctx) => {
  const data = await ctx.req.json()
  // Business logic should be in domain layer
  if (data.email.includes('@company.com')) {
    data.role = 'admin'
  }
  const user = await services.user.createOne(data)
  return ctx.json(user)
})
```

```typescript
// ✅ GOOD: Business logic in domain service
class UserService extends BaseService<User> {
  async createOne(request: CreateUserRequest): Promise<User> {
    // Business logic here
    if (request.email.includes('@company.com')) {
      request.role = 'admin'
    }
    return super.createOne(request)
  }
}
```

### ❌ Database Queries in Domain Layer

```typescript
// ❌ BAD: Direct database access in domain
class UserService {
  async getUser(id: string) {
    // Domain should not know about database
    return await db.select().from(users).where(eq(users.id, id))
  }
}
```

```typescript
// ✅ GOOD: Use repository abstraction
class UserService {
  async getUser(gid: string) {
    // Use SPI port, not direct database
    return await this.dependencies.repository.getOne(gid)
  }
}
```

### ❌ Framework Dependencies in Domain

```typescript
// ❌ BAD: Hono context in domain
class UserService {
  async createUser(ctx: Context) {
    // Domain should be framework-agnostic
  }
}
```

```typescript
// ✅ GOOD: Pure TypeScript in domain
class UserService {
  async createUser(request: CreateUserRequest): Promise<User> {
    // No framework dependencies
  }
}
```

### ❌ Skipping Validation Layers

```typescript
// ❌ BAD: Direct database insert from API
resources.post('/', async (ctx) => {
  const data = await ctx.req.json()
  // Missing validation and business logic
  await db.insert(users).values(data)
})
```

```typescript
// ✅ GOOD: Proper layer separation
resources.post('/', async (ctx) => {
  const request = await ctx.req.json()
  // API validates, domain applies business rules, SPI persists
  const user = await services.user.createOne(request)
  return ctx.json(user)
})
```

## Decision-Making Guidelines

### Where Should This Code Go?

**Question: "I need to validate user input"**
- ✅ **API Layer**: Input format validation (email format, required fields)
- ✅ **Domain Layer**: Business rule validation (email uniqueness, age restrictions)

**Question: "I need to query the database"**
- ❌ **Never in API or Domain layers**
- ✅ **SPI Layer**: All database queries go here

**Question: "I need to format the HTTP response"**
- ✅ **API Layer**: Response formatting, status codes, headers
- ❌ **Domain Layer**: Should return domain objects, not HTTP responses

**Question: "I need to apply business rules"**
- ❌ **API Layer**: Should only handle HTTP concerns
- ✅ **Domain Layer**: All business logic belongs here

**Question: "I need to call an external API"**
- ❌ **Domain Layer**: Should not know about external services
- ✅ **SPI Layer**: Create an SPI port in domain, implement in SPI

**Question: "I need to handle errors"**
- ✅ **API Layer**: HTTP error responses, status codes
- ✅ **Domain Layer**: Domain-specific errors (NotFoundError, ValidationError)
- ✅ **SPI Layer**: Infrastructure errors (DatabaseError, NetworkError)

### Layer Responsibilities Summary

| Concern | API Layer | Domain Layer | SPI Layer |
|---------|-----------|--------------|-----------|
| HTTP routing | ✅ | ❌ | ❌ |
| Input validation | ✅ | ✅ | ❌ |
| Business rules | ❌ | ✅ | ❌ |
| Data persistence | ❌ | ❌ | ✅ |
| External APIs | ❌ | ❌ | ✅ |
| Error formatting | ✅ | ❌ | ❌ |
| Domain models | ❌ | ✅ | ❌ |

## Best Practices Summary

1. **Keep layers independent**: Domain should not depend on API or SPI implementations
2. **Use SPI ports**: Define abstractions in domain, implement in SPI
3. **Validate at boundaries**: API validates format, domain validates business rules
4. **Transform between layers**: Each layer has its own data format
5. **Test in isolation**: Each layer can be tested independently
6. **Follow the flow**: Request → API → Domain → SPI → Database
7. **No framework in domain**: Domain should be pure TypeScript
8. **Business logic in domain**: Never in API or SPI layers
