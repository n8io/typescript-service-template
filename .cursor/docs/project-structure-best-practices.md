# Project Structure Best Practices

This is a project that follows a clean, domain driven architecture pattern. The main components are:

- [src/index.ts](../src/index.ts) - The main entry point that initializes the application
- [src/api/](../src/api) - Contains API routes and controllers using Hono
- [src/domain/](../src/domain) - Contains business logic and domain models
- [src/spi/](../src/spi) - Service Provider Interface layer for external services
  - [src/spi/repositories/database/schema.ts](../src/spi/repositories/database/schema.ts) - Database models and schema definitions
- [src/utils/](../src/utils) - Utility functions and helpers

## File Naming Conventions

All files in the project must follow these naming conventions:

1. Use kebab-case for all filenames
   - ✅ `user-service.ts`
   - ✅ `database-connection.ts`
   - ❌ `userService.ts`
   - ❌ `database_connection.ts`

2. Use ASCII characters only (no special characters or Unicode)
   - ✅ `user-profile.ts`
   - ❌ `user-profile-📝.ts`
   - ❌ `user-profile-é.ts`

3. File extensions:
   - `.ts` for TypeScript source files
   - `.test.ts` for test files
   - `.d.ts` for type declaration files
   - `.mjs` for ES modules
   - `.json` for JSON files
   - `.jsonc` for JSON with comments

4. No barrel files (index.ts)
   - ❌ `src/api/index.ts`
   - ❌ `src/domain/index.ts`
   - ✅ Import directly from the specific file:

     ```ts
     // ❌ Don't do this
     import { UserService } from './api';
     
     // ✅ Do this instead
     import { UserService } from './api/user-service.ts';
     ```

Examples of valid filenames:

```text
src/
├── api/http/<version>/routes
│   ├── resources.ts
│   └── users.ts
├── domain/
│   ├── resource-service.ts
│   └── rules.ts
├── spi/
│   └── repositories/
│       └── database/
│           └── schema.ts
└── utils/
    ├── config-validator.ts
    └── error-handler.ts
```

The application follows a layered architecture:

1. API Layer (How clients access the domain)
2. Domain Layer (Business logic)
3. SPI Layer (External services)

Each layer is initialized in sequence in the main entry point, with dependencies flowing from top to bottom.
