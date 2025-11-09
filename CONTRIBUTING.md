# Contributing Guide

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js 24+ (use `.nvmrc` as the source of truth)
- npm 11+
- Docker and Docker Compose (recommended for local development)
- Git

### Initial Setup

1. **Clone the repository:**
   ```sh
   git clone <repository-url>
   cd typescript-service-template
   ```

2. **Install Node version:**
   ```sh
   nvm install
   ```

3. **Install dependencies:**
   ```sh
   npm install
   ```

4. **Set up environment:**
   ```sh
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start development environment:**
   ```sh
   npm run docker:up
   ```

This will start:
- PostgreSQL database
- Service with hot reload
- Debugger on port 9229

## Code Style

This project uses **Biome** for formatting and linting. The configuration is in `biome.jsonc`.

### Key Style Rules

- **File naming**: kebab-case (e.g., `user-service.ts`)
- **Type vs Interface**: Always use `type`, never `interface`
- **Imports**: Use type imports for types: `import type { ... }`
- **No barrel files**: Import directly from source files
- **No default exports**: Use named exports only
- **Line width**: 120 characters
- **Quotes**: Single quotes for strings
- **Semicolons**: As needed (Biome will handle)

### Formatting Code

```sh
# Format all files
npm run format

# Check formatting without changes
npm run lint:style
```

### TypeScript Configuration

- Uses `@total-typescript/tsconfig` as base
- Native TypeScript (no transpilation)
- Strict type checking enabled
- All files must pass type checking: `npm run lint:types`

## Testing Requirements

### Running Tests

```sh
# Run all tests with coverage
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests for specific file
npm run test src/path/to/file.test.ts
```

### Coverage Requirements

**Minimum 90% coverage** is required for:
- Branches
- Functions
- Lines
- Statements

Coverage reports are generated in `coverage/` and automatically checked in CI.

### Test Structure

- Test files are co-located with source files
- Use Vitest for all testing
- Follow existing test patterns
- Mock external dependencies appropriately
- Test error cases and edge conditions

### Writing Tests

```typescript
import { myFunction } from './my-function.ts'

describe('myFunction', () => {
  it('should handle normal case', () => {
    expect(myFunction('input')).toBe('expected')
  })

  it('should handle error case', () => {
    expect(() => myFunction('invalid')).toThrow()
  })
})
```

## Git Workflow

### Branch Naming

Branches must follow this pattern:

```
<type>/<ticket-number>[-<subject>]
```

**Types:**
- `feat` - New features
- `fix` - Bug fixes
- `hotfix` - Urgent production fixes
- `chore` - Maintenance tasks
- `test` - Test-related changes
- `refactor` - Code refactoring

**Examples:**
- `feat/ABC-123`
- `fix/XYZ-456-add-error-handling`
- `chore/DEV-789-update-deps`

**Main branches:**
- `main` - Production-ready code
- `candidate` - Release candidate (if used)
- `develop` - Development branch (if used)

### Commit Messages

Commit messages must follow this format:

```
<type>(<ticket>): <emoji> <subject>

<body>
```

**Components:**

1. **Type** (required): One of:
   - `feat` - New feature
   - `fix` - Bug fix
   - `test` - Test changes
   - `chore` - Maintenance
   - `refactor` - Refactoring

2. **Ticket** (required): Ticket number in format `ABC-123`

3. **Emoji** (required): Must match type:
   - `feat`: ✨
   - `fix`: 🐛
   - `test`: ✅
   - `chore`: 🔧
   - `refactor`: ♻️

4. **Subject** (required): Brief description (50 chars or less)

5. **Body** (optional): Detailed explanation

**Examples:**

✅ Valid:
```
feat(ABC-123): ✨ Add user authentication

Implement JWT-based authentication with refresh tokens.
Add middleware for protected routes.
```

```
fix(XYZ-456): 🐛 Resolve database connection timeout

Increase connection pool size and add retry logic.
```

❌ Invalid:
```
feat: add authentication
fix(ABC-123) resolve bug
feat(ABC-123): Add feature
```

### Pre-commit Hooks

Git hooks (via Lefthook) automatically:
- Format changed files
- Lint changed files
- Validate commit messages
- Check for dead code
- Check for circular dependencies
- Validate types
- Check spelling

These run automatically on commit. If they fail, fix the issues and commit again.

## Pull Request Process

### Before Submitting

1. **Ensure all checks pass:**
   ```sh
   npm run lint
   npm run test
   ```

2. **Update documentation** if needed:
   - README.md
   - Code comments
   - API documentation

3. **Keep PRs focused:**
   - One feature/fix per PR
   - Keep changes small and reviewable
   - Avoid unrelated changes

### PR Checklist

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Coverage meets 90% threshold
- [ ] No linting errors
- [ ] Documentation updated
- [ ] Commit messages follow format
- [ ] Branch name follows convention

### PR Description

Include:
- **What** - What does this PR do?
- **Why** - Why is this change needed?
- **How** - How was it implemented?
- **Testing** - How was it tested?

### Review Process

1. PR is automatically checked by CI
2. Code review by maintainers
3. Address feedback
4. Maintainer approval
5. Merge to main

### After Merge

- Delete the feature branch
- Update local main branch: `git checkout main && git pull`

## Architecture Guidelines

This project follows **Domain-Driven Design (DDD)** with three layers:

### API Layer (`src/api`)
- HTTP routing and request handling
- Input validation
- Response formatting
- **Should NOT contain business logic**

### Domain Layer (`src/domain`)
- Business logic and rules
- Domain models
- Service Provider Interface (SPI) ports
- **Framework-agnostic, pure TypeScript**

### SPI Layer (`src/spi`)
- Infrastructure implementations
- Database repositories
- External service clients
- **Implements domain SPI ports**

### Decision Guidelines

**Where does this code belong?**

- **API Layer**: HTTP-specific code, request/response handling, message queue consumers, middleware
- **Domain Layer**: Business rules, entity logic, validation rules
- **SPI Layer**: Database queries, external API calls, file I/O

**Example:**
- User authentication logic → Domain Layer
- JWT token parsing → API Layer
- Database query for user → SPI Layer

See [Architecture Documentation](.cursor/docs/domain-driven-architecture-best-practices.md) for more details.

## Common Issues

### Tests Failing

1. Check Node version: `node --version` should match `.nvmrc`
2. Clear coverage: `npm run clean && npm run test`
3. Check for type errors: `npm run lint:types`

### Linting Errors

1. Auto-fix: `npm run format`
2. Check specific rules: `npm run lint:style`
3. Review Biome configuration in `biome.jsonc`

### Type Errors

1. Run type check: `npm run lint:types`
2. Ensure all types are exported
3. Check import paths are correct

### Coverage Below Threshold

1. Review coverage report: `coverage/index.html`
2. Add tests for uncovered code
3. Focus on branches and error cases

## Getting Help

- Check existing documentation
- Review similar code in the codebase
- Ask questions in PR comments
- Check GitHub issues

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on code, not people
- Help others learn and grow

Thank you for contributing! 🎉

