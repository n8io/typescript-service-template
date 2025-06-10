# TypeScript Best Practices

## Type System

- Only use `type` and avoid using `interface` keywords when defining contracts
- Avoid using `any`, prefer `unknown` for unknown types (only in special cases where the type is truly unknown like `JSON.parse`)
- Use strict TypeScript configuration
- Leverage TypeScript's built-in utility types
- Use generics for reusable type patterns

## Naming Conventions

- Use PascalCase for type names and interfaces
- Use camelCase for variables and functions
- Use UPPER_CASE for constants
- Use descriptive names with auxiliary verbs (e.g., isLoading, hasError)

## Code Organization

- If possible, keep type definitions at the top of the file (and alphabetized)
- Export types and implementations separately
- All exports must be located at the bottom of the file (and alphabetized)
  - One export for type only exports. For example `export type { MyType }`
  - One export for implementation exports. For example `export { myFunction }`
  - For things that are both a type and a value type, combine the exports
    - ❌ Don't do this

    ```ts
    export type { Foo }
    export { Foo }
    ```

    - ✅ Do this instead

    ```ts
    export { Foo }
    ```

- Always use `import type` instead of `import { type foo }` syntax for type imports to avoid bugs
- Do not use barrel files, avoid them at all costs per [biome.jsonc](mdc:biome.jsonc)

## Functions

- Use explicit return types for public functions
- Use arrow functions over all other function declaration syntaxes
- Implement proper error handling with custom error types when necessary
- Prefer async/await over Promises

## Best Practices

- Enable strict mode in [tsconfig.json](mdc:tsconfig.json)
- Use readonly for immutable properties
- Leverage discriminated unions for type safety

## Error Handling

- Create custom error types for domain-specific errors
- Use Result types for operations that can fail
- Implement proper error boundaries
- Use try-catch blocks with typed catch clauses
- Handle Promise rejections properly

## Code Formatting

- All object properties should be alphabetized
- All destructured properties should be alphabetized
-. When working with classes, the props should be grouped and ordered accordingly:
  1. All props should be grouped together by their accessibility (`private`, `constructor`, `protected`, and `public`) then alphabetized
  2. The group order is: `private`, `constructor`, `protected`, then lastly `public`
  3. There should be a newline after each group (except for the last one)

  ```typescript
  // ❌ Bad
  class Thing {
    async doStuff() { /* ... */ }
    protected increment() { /* ... */ }
    private count: number
    constructor() {}
    public findMean() { /* ... */ }
    protected internalWork() { /* ... */ }
  }

  // ✅ Good
  class Thing {
    private count: number

    constructor() {}

    protected increment() { /* ... */ }
    protected internalWork() { /* ... */ }
    
    public findMean() { /* ... */ }
    
    async doStuff() { /* ... */ }
  }
  ```

- Add empty lines around multiline statements for better readability
- There should always be a newline before `return`, `break`, and `continue` statements
- There should always be a newline before multiline statements unless the statement is directly after a closing brace
- There should always be a newline after multiline statements unless the statement is directly followed by a closing brace

  ```ts
  // ❌ Don't do this
  const thing = {
    prop1: true,
    prop2: 3
  }
  const date = new Date()
  const otherThing = findThing({
    enabled: true,
  })
  logger.info(
    `I did a thing`,
    thing,
  )
  return otherThing

  // ✅ Do this instead
  const thing = {
    prop1: true,
    prop2: 3
  }

  const date = new Date()

  const otherThing = findThing({
    enabled: true,
  })

  logger.info(
    `I did a thing`,
    thing,
  )

  return otherThing
  ```

- Add empty lines before and after multiline statements for better readability

  ```ts
  // ❌ Don't do this
  if (result.isOk()) {
    const value = result.value
    return processValue(value)
  }

  // ✅ Do this instead
  if (result.isOk()) {
    const value = result.value

    return processValue(value)
  }
  ```

- Avoid promise chaining

  ```ts
  // ❌ Don't do this - avoid promise chaining
  const result = Promise.all([
    fetchUserData(userId),
    fetchUserPreferences(userId)
  ]).then(([userData, preferences]) => {
    return combineUserData(userData, preferences)
  }).catch(error => {
    return handleError(error)
  })

  // ✅ Do this instead - use async/await
  try {
    const [userData, preferences] = await Promise.all([
      fetchUserData(userId),
      fetchUserPreferences(userId)
    ])

    return combineUserData(userData, preferences)
  } catch (error) {
    return handleError(error)
  }
  ```

- Variable definitions should be followed by an empty line for better readability

  ```ts
  // ❌ Don't do this
  let date = new Date()
  const offset = 1_000
  log(tick(date, offset))

  // ✅ Do this instead
  let date = new Date()
  const offset = 1_000

  log(tick(date, offset))
  ```
