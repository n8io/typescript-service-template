# Template Customization Guide

This guide walks you through customizing this template for your new service.

## Step 1: Initial Setup

### 1.1 Clone and Rename

1. Clone this template repository:
   ```sh
   git clone <template-repo-url> <your-service-name>
   cd <your-service-name>
   ```

2. Remove the existing git history:
   ```sh
   rm -rf .git
   git init
   ```

3. Update `package.json`:
   - Change `name` to your service name
   - Update `description`
   - Update `author` if needed

4. Update `.nvmrc` if you need a different Node version

### 1.2 Environment Configuration

1. Copy `.env.example` to `.env`:
   ```sh
   cp .env.example .env
   ```

2. Update environment variables in `.env`:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `PORT` - Service port (default: 3000)
   - `LOG_LEVEL` - Logging level (default: info)
   - `NODE_ENV` - Environment (development/staging/production)

## Step 2: Remove Example Code

The template includes example "Resource" code that you should replace with your own entities.

### 2.1 Remove Resource Files

Delete the following files:
- `src/domain/models/resource.ts`
- `src/domain/services/resource.ts`
- `src/domain/services/resource.test.ts`
- `src/spi/repositories/resource.ts`
- `src/api/http/v1/routes/resources.ts`

### 2.2 Update Initialization Files

1. **Update `src/domain/services/init.ts`**:
   Remove the ResourceService import and initialization

2. **Update `src/spi/repositories/init.ts`**:
   Remove the ResourceRepository import and initialization

3. **Update `src/api/http/v1/init.ts`**:
   Remove the resources route registration

4. **Update `src/spi/repositories/database/schema.ts`**:
   Remove the tableResources export

## Step 3: Add Your First Entity

This section shows how to add a new entity called "User" as an example.

### 3.1 Create Domain Model

Create `src/domain/models/user.ts`:

```typescript
import { z } from 'zod'
import { exampleAuditRecord } from '../../models/audit-record.ts'
import { schemaEntity } from '../../models/entity.ts'
import { exampleGid } from '../../utils/factories/gid.ts'
import { validation } from '../../utils/validation.ts'

import 'zod-openapi/extend'

const schemaUserTemp = schemaEntity.extend({
  gid: validation.string.openapi({
    example: exampleGid(false),
    description: 'The globally unique identifier for the user',
  }),
  email: validation.string.email().openapi({
    description: 'The email address of the user',
    example: 'user@example.com',
  }),
  firstName: validation.string.openapi({
    description: 'The first name of the user',
    example: 'John',
  }),
  lastName: validation.string.openapi({
    description: 'The last name of the user',
    example: 'Doe',
  }),
})

type User = Prettify<z.infer<typeof schemaUserTemp>>

const exampleUser = (overrides: Partial<User> = {}): User => ({
  gid: exampleGid(false),
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  createdAt: new Date('1900-01-01T00:00:00.000Z'),
  createdBy: exampleAuditRecord({ type: 'USER' }),
  updatedAt: new Date('1900-01-01T00:00:00.000Z'),
  updatedBy: exampleAuditRecord({ type: 'SYSTEM' }),
  ...overrides,
})

const schemaUser = z.object(schemaUserTemp.shape).openapi({
  description: 'A user entity',
  example: exampleUser(),
  ref: 'User',
})

export { exampleUser, schemaUser }
export type { User }
```

### 3.2 Create Domain Service

Create `src/domain/services/user.ts`:

```typescript
import type { z } from 'zod'
import { pick } from '../../utils/fp.ts'
import { validation } from '../../utils/validation.ts'
import { toPaginatedResponseSchema } from '../models/pagination.ts'
import { exampleUser, schemaUser } from '../models/user.ts'
import { BaseService } from './models/base-service.ts'

type User = z.infer<typeof schemaUser>

class UserService extends BaseService<User> {
  /**
   * @description The properties that are used to create, filter, sort and update a user.
   */
  static readonly propsMeta: Record<'create' | 'filter' | 'sort' | 'update', (keyof User)[]> = {
    create: ['email', 'firstName', 'lastName', 'createdBy'],
    filter: ['createdAt', 'email', 'firstName', 'gid', 'lastName', 'updatedAt'],
    sort: ['createdAt', 'email', 'firstName', 'gid', 'lastName', 'updatedAt'],
    update: ['email', 'firstName', 'lastName', 'updatedBy'],
  }

  /**
   * @description The schemas for the service. These are used to validate the requests and responses.
   */
  static readonly schemas = {
    core: schemaUser,
    request: {
      createOne: schemaUser
        .pick({
          createdBy: true,
          email: true,
          firstName: true,
          lastName: true,
        })
        .strict()
        .openapi({
          example: pick(exampleUser(), UserService.propsMeta.create) as ReturnType<typeof exampleUser>,
        }),
      getMany: schemaUser,
      getOne: validation.gid,
      updateOne: schemaUser
        .pick({
          email: true,
          firstName: true,
          lastName: true,
          updatedBy: true,
        })
        .partial({
          email: true,
          firstName: true,
          lastName: true,
        })
        .strict()
        .openapi({
          example: pick(exampleUser(), UserService.propsMeta.update) as ReturnType<typeof exampleUser>,
        }),
    },
    response: {
      getMany: toPaginatedResponseSchema(schemaUser, exampleUser()),
      getOne: schemaUser,
    },
  } as const

  protected override readonly propsMeta = UserService.propsMeta
  protected override readonly schemas = UserService.schemas
}

export { UserService }
```

### 3.3 Create Database Schema

Update `src/spi/repositories/database/schema.ts` to add your table:

```typescript
import { schemaUser } from '../../../domain/models/user.ts'
import { schemaToDrizzleTable } from './utils/schema-to-drizzle-table.ts'

const tableUsers = schemaToDrizzleTable('users', schemaUser, {
  uniqueIndexes: ['gid', 'email'],
})

export { tableUsers }
```

### 3.4 Create Repository

Create `src/spi/repositories/user.ts`:

```typescript
import { schemaUser } from '../../domain/models/user.ts'
import type { SpiUserRepository } from '../../domain/spi-ports/user-repository.ts'
import type { initDatabase } from './database/init.ts'
import { tableUsers } from './database/schema.ts'
import { DrizzleRepository } from './models/drizzle-repository.ts'

type Dependencies = {
  db: ReturnType<typeof initDatabase>
}

class UserRepository
  extends DrizzleRepository<typeof schemaUser, typeof tableUsers>
  implements SpiUserRepository
{
  constructor(dependencies: Dependencies) {
    super(dependencies, schemaUser, tableUsers)
  }
}

export { UserRepository }
```

### 3.5 Create SPI Port

Create `src/domain/spi-ports/user-repository.ts`:

```typescript
import type { SpiResourceRepository } from './resource-repository.ts'

type SpiUserRepository = SpiResourceRepository

export type { SpiUserRepository }
```

### 3.6 Update Initialization Files

1. **Update `src/domain/services/init.ts`**:
   ```typescript
   import type { Spi } from '../../spi/init.ts'
   import { UserService } from './user.ts'

   const initServices = async (spi: Spi) => {
     const user = new UserService({
       repository: spi.repositories.user,
     })

     return { user }
   }

   export { initServices }
   ```

2. **Update `src/spi/repositories/init.ts`**:
   ```typescript
   import type { AppStateManager } from '../../utils/app-state-manager.ts'
   import type { Config } from '../../utils/config.ts'
   import { initDatabase } from './database/init.ts'
   import { runMigrations } from './database/run-migrations.ts'
   import { UserRepository } from './user.ts'

   type RepositoryDependencies = {
     appStateManager: AppStateManager
     config: Config
   }

   const initRepositories = async (dependencies: RepositoryDependencies) => {
     const db = initDatabase(dependencies)

     await runMigrations(db)

     return {
       user: new UserRepository({ db }),
     }
   }

   export { initRepositories }
   ```

### 3.7 Create API Routes

Create `src/api/http/v1/routes/users.ts`:

```typescript
import type { DomainGetManyRequest } from '../../../../domain/models/request.ts'
import { UserService } from '../../../../domain/services/user.ts'
import { urlSearchParamsToFilters } from '../../../../utils/url-search-params/filters.ts'
import { urlSearchParamsToPagination } from '../../../../utils/url-search-params/pagination.ts'
import { urlSearchParamsToSort } from '../../../../utils/url-search-params/sorting.ts'
import { OpenApiTag } from '../../models/openapi.ts'
import { makeApp } from '../app.ts'
import { appendOpenApiMetadata, RouteType } from '../openapi/append-open-api-metadata.ts'

const users = makeApp()

users.post(
  '/',
  appendOpenApiMetadata({
    operationId: 'usersCreateOne',
    requestSchema: UserService.schemas.request.createOne,
    responseSchema: UserService.schemas.response.getOne,
    tags: [OpenApiTag.USERS],
    type: RouteType.CREATE_ONE,
  }),
  async (ctx) => {
    const services = ctx.get('services')
    const request = await ctx.req.json()
    const user = await services.user.createOne(request)

    return ctx.json(user)
  },
)

// Add other CRUD operations following the same pattern...
// See src/api/http/v1/routes/resources.ts for complete example

export { users }
```

3. **Update `src/api/http/v1/init.ts`**:
   ```typescript
   import { users } from './routes/users.ts'
   // ... other imports

   const initV1 = (dependencies: Dependencies) => {
     const { app } = dependencies

     initMiddleware(dependencies)

     app.route(`/api/${version}/users`, users)
     // ... other routes

     return app
   }
   ```

4. **Update `src/api/http/v1/models.ts`** to add `USERS` to `OpenApiTag` enum

### 3.8 Generate and Run Migrations

1. Generate migration:
   ```sh
   npm run db:generate
   ```

2. Review the generated migration in `src/spi/repositories/database/migrations/`

3. Apply migration:
   ```sh
   npm run db:migrate
   ```

## Step 4: Extending BaseService

The `BaseService` class provides standard CRUD operations. To add custom business logic:

### 4.1 Add Custom Methods

```typescript
class UserService extends BaseService<User> {
  // ... existing code ...

  /**
   * @description Custom business logic method
   */
  async activateUser(gid: string, activatedBy: AuditRecord): Promise<User> {
    const user = await this.getOne(gid)
    
    // Your business logic here
    
    return this.updateOne(gid, {
      // ... update fields
      updatedBy: activatedBy,
    })
  }
}
```

### 4.2 Override Base Methods

If you need custom behavior for standard operations:

```typescript
class UserService extends BaseService<User> {
  // ... existing code ...

  /**
   * @description Override createOne to add custom validation
   */
  override async createOne(
    request: z.infer<typeof this.schemas.request.createOne>,
  ): Promise<Prettify<z.infer<typeof this.schemas.response.getOne>>> {
    // Custom validation
    if (await this.emailExists(request.email)) {
      throw new ValidationError('Email already exists')
    }

    // Call parent implementation
    return super.createOne(request)
  }
}
```

## Step 5: Adding New API Routes

### 5.1 Create Route File

Create a new file in `src/api/http/v1/routes/` following the pattern from existing routes.

### 5.2 Register Route

Add the route to `src/api/http/v1/init.ts`:

```typescript
app.route(`/api/${version}/your-route`, yourRoute)
```

### 5.3 Add OpenAPI Metadata

Use `appendOpenApiMetadata` to ensure your route appears in the API documentation:

```typescript
appendOpenApiMetadata({
  operationId: 'yourOperationId',
  tags: [OpenApiTag.YOUR_TAG],
  type: RouteType.YOUR_TYPE,
})
```

## Step 6: Customizing Environment Variables

### 6.1 Update Config Schema

Edit `src/models/config.ts` to add new environment variables:

```typescript
const schemaConfig = z.object({
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z.string().optional().default('info').pipe(z.enum(['debug', 'info', 'warn', 'error'])),
  NODE_ENV: z.string().trim().optional().default('development').pipe(z.nativeEnum(Env)),
  PORT: z.string().optional().default('3000').pipe(z.coerce.number()),
  // Add your new variable
  API_KEY: z.string().min(1),
})
```

### 6.2 Update .env.example

Add the new variable to `.env.example` with a comment explaining its purpose.

## Step 7: Testing Your Changes

1. **Run tests:**
   ```sh
   npm run test
   ```

2. **Check coverage:**
   Ensure you maintain 90% coverage for new code

3. **Lint your code:**
   ```sh
   npm run lint
   ```

4. **Format code:**
   ```sh
   npm run format
   ```

## Step 8: Next Steps

- Review the [Architecture Documentation](../.cursor/docs/domain-driven-architecture-best-practices.md) for deeper understanding
- Check [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines
- Explore existing code to understand patterns and conventions

## Common Patterns

### Adding Relationships

When entities have relationships, define them in the domain model and handle them in the service layer, not in the repository layer.

### Adding Validation

Use Zod schemas for validation. Add custom validators in `src/utils/validation.ts` if needed.

### Adding Middleware

Add middleware in `src/api/http/middleware/` and register it in `src/api/http/middleware/init.ts`.

### Error Handling

Create custom errors in `src/models/custom-error.ts` and add error codes to `src/models/error-code.ts`.

## Troubleshooting

### Migration Issues

If migrations fail:
1. Check database connection
2. Review migration SQL files
3. Ensure schema matches domain models

### Type Errors

If you see TypeScript errors:
1. Ensure all types are properly exported
2. Check that schemas match between layers
3. Run `npm run lint:types` for detailed errors

### Test Failures

If tests fail:
1. Ensure test data matches schema requirements
2. Check that mocks are properly configured
3. Verify coverage thresholds are met

