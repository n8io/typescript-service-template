# Testing Best Practices

This guide outlines the conventions for writing and running unit tests in this project.

## Node Version Management

1. **Required Node Version**
   - The project uses `.nvmrc` to specify the required Node version
   - Always ensure you're using the correct Node version before running tests
   - The version is enforced through `.nvmrc` and should not be modified without team consensus

2. **Node Version Setup**

   ```bash
   # First time setup or when .nvmrc changes
   nvm install
   
   # Verify Node version matches .nvmrc
   node --version
   ```

3. **Automated Version Check**
   - The project includes a pre-test hook that verifies Node version
   - If you see version mismatch errors, run `nvm use` to switch to the correct version
   - Never override the Node version requirement - it ensures consistent test behavior

4. **Common Version Issues**
   - If tests fail with unexpected errors, first verify Node version
   - If `nvm use` fails, ensure `.nvmrc` exists and contains the correct version
   - If version issues persist, run `nvm install`

## Pre-Test Checks

1. **Pre-Test Checklist**
   - [ ] Run `nvm use` at least once
   - [ ] Ensure all dependencies are installed (`npm install`)
   - [ ] Set `CI=true` environment variable

## Vitest Usage

1. As an agent, you should never run tests interactively. This can be done by prefixing test commands with `CI=true`.
2. Most Vitest functions are globally available and should not be imported
   - ✅ Use `describe`, `it`, `expect`, `vi` directly
   - ✅ Use `beforeEach`, `afterEach`, `beforeAll`, `afterAll` directly
   - ❌ Don't import from 'vitest'

   ```ts
   // ❌ Don't do this
   import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
   
   // ✅ Do this instead
   describe('MyService', () => {
     beforeEach(() => {
       // setup
     })
     
     afterEach(() => {
       // cleanup
     })
     
     it('should work', () => {
       expect(true).toBe(true)
     })
   })
   ```

2. Only import specific utilities that aren't globally available

   ```ts
   // ✅ These are fine to import if needed
   import { mockDeep } from 'vitest-mock-extended'
   ```

## File Structure

1. Test files should be co-located with the files they test
   - ✅ `src/domain/services/resource.ts` → `src/domain/services/resource.test.ts`
   - ❌ `src/domain/services/resource.ts` → `tests/domain/services/resource.test.ts`

2. Test files must use the `.test.ts` extension
   - ✅ `user-service.test.ts`
   - ❌ `user-service.spec.ts`
   - ❌ `user-service_test.ts`

## Test Organization

1. Use `describe` blocks to group related tests

   ```ts
   describe('ResourceService', () => {
     describe('createOne', () => {
       it('should create a new resource', () => {
         // test implementation
       })
     })
   })
   ```

2. Use descriptive test names that explain the behavior being tested
   - ✅ `it('should return 404 when resource is not found')`
   - ✅ `it('should validate input parameters')`
   - ❌ `it('should work correctly')`
   - ❌ `it('test case 1')`

3. Follow the Arrange-Act-Assert pattern

   ```ts
   it('should create a new resource', () => {
     // Arrange
     const mockRepository = {}
     const service = new ResourceService(mockRepository)
     
     // Act
     const result = await service.createOne(data)
     
     // Assert
     expect(result).toBeDefined()
   })
   ```

## Mocking

1. Use `vi.mock()` for module mocking

   ```ts
   vi.mock('./utils/config.ts', () => ({
     config: { mock: 'config' }
   }))
   ```

2. Use `vi.spyOn()` for method spying

   ```ts
   const spy = vi.spyOn(service, 'method')
   ```

3. Reset mocks between tests

   ```ts
   beforeEach(() => {
     vi.resetAllMocks()
   })
   ```

## Assertions

1. Use specific assertions that test one thing
   - ✅ `expect(result.status).toBe(200)`
   - ✅ `expect(mockService.createOne).toHaveBeenCalledWith(expectedData)`
   - ❌ `expect(result).toBeTruthy()`

2. Test both success and error cases

   ```ts
   it('should handle successful creation', () => {
     // test success case
   })

   it('should handle validation errors', () => {
     // test error case
   })
   ```

## Error Testing

1. Test error cases using `expect().toThrow()`

   ```ts
   it('should throw when input is invalid', () => {
     expect(() => validateInput(invalidData)).toThrow()
   })
   ```

2. Test async error cases using `expect().rejects.toThrow()`

   ```ts
   it('should reject when database fails', async () => {
     await expect(service.createOne(data)).rejects.toThrow()
   })
   ```

3. When testing custom errors, only validate the error type

   ```ts
   it('should throw DomainNotFoundError', async () => {
     await expect(service.getOne('non-existent-id'))
       .rejects
       .toThrow(DomainNotFoundError)
   })
   ```

4. Use error type guards when available

   ```ts
   it('should throw a validation error', async () => {
     const error = await expect(service.createOne(invalidData))
       .rejects
       .toThrow()
     
     expect(isValidationError(error)).toBe(true)
   })
   ```

## Best Practices

1. Keep tests focused and isolated
   - Each test should test one specific behavior
   - Tests should not depend on each other
   - Use `beforeEach` to set up test state

2. Use meaningful test data

   ```ts
   const mockResource = {
     id: 'test-id',
     name: 'Test Resource',
     // ... other required fields
   }
   ```

3. Clean up after tests

   ```ts
   afterEach(() => {
     vi.clearAllMocks()
   })
   ```

4. Use type assertions and `unknown` when necessary

   ```ts
   // ✅ Use type assertions for partial mocks
   const mockService = {} as ResourceService
   
   // ✅ Use unknown for complex objects that don't need full typing
   // biome-ignore lint/suspicious/noExplicitAny: test config only needs partial typing
   const mockConfig = {
     database: {
       url: 'test-url'
     }
   } as unknown as Config
   
   // ✅ Use Partial for better intellisense
   const mockRepository = {
     findOne: vi.fn()
   } satisfies Partial<ResourceRepository> as ResourceRepository
   ```

5. Document complex test setups

   ```ts
   // Mock the database connection to simulate a timeout
   vi.mock('./database', () => ({
     connect: vi.fn().mockImplementation(() => {
       return new Promise((_, reject) => {
         setTimeout(() => reject(new Error('Timeout')), 100)
       })
     })
   }))
   ```

## Running Focused Tests

1. When running tests for a specific file, focus coverage on that file only

   ```bash
   # Run tests for a specific file with focused coverage
   nvm install && CI=true npm test src/models/result.test.ts --coverage.include="src/models/result.ts"
   ```

2. Benefits of focused coverage:
   - Clearer coverage reports for the file being tested
   - No noise from unrelated files
   - Easier to identify gaps in test coverage
   - Faster test execution

3. When running focused tests:
   - Ignore overall project coverage thresholds
   - Focus on achieving 100% coverage for the specific file
   - Use the `--coverage.include` flag to specify the target file
   - Use `CI=true` to ensure tests are not ran interactively

## Type Safety in Tests

1. It's acceptable to use `unknown` in tests to simplify test setup
   - Tests are not production code
   - Focus on testing behavior, not types
   - Reduces boilerplate in test files

2. Use `unknown` when:
   - Mocking complex objects where only a few properties are needed
   - Creating partial implementations of interfaces
   - Testing error cases where the full error object isn't relevant

   ```ts
   // ✅ Simple mock with unknown
   // biome-ignore lint/suspicious/noExplicitAny: only need message property for error test
   const mockError = { message: 'test error' } satisfies Partial<Error> as Error
   
   // ✅ Partial implementation with better intellisense
   const mockService = {
     createOne: vi.fn()
   } satisfies Partial<ResourceService> as ResourceService
   
   // ✅ Complex object with better intellisense
   const mockConfig = {
     database: { url: 'test' },
     auth: { secret: 'test' }
   } satisfies Partial<Config> as Config
   ```

3. Still maintain type safety where it adds value
   - Use proper types for the actual test assertions
   - Use proper types for the main object being tested
   - Use proper types for complex test data that needs to be accurate

   ```ts
   // ✅ Keep types for the main test subject
   const service = new ResourceService(mockRepository)
   
   // ✅ Keep types for assertions
   const result = await service.createOne(data)
   expect(result).toMatchObject<Resource>({
     id: expect.any(String),
     name: expect.any(String)
   })
   ```

## Code Coverage

1. All tests must meet the minimum coverage thresholds:
   - Branches: 90%
   - Functions: 90%
   - Lines: 90%
   - Statements: 90%

2. When writing tests, ensure you cover:
   - All code paths in conditional statements
   - All function calls
   - All error handling cases
   - All edge cases

3. Use coverage reports to identify gaps
   - Use `CI=true` to ensure tests are not ran interactively

   ```bash
   # Run tests with coverage
   nvm install && CI=true npm test
   ```

4. Common coverage issues to watch for:
   - Missing error case coverage
   - Untested conditional branches
   - Uncovered utility functions
   - Edge cases in data validation
