# Clean Code Best Practices

## Constants Over Magic Strings and Numbers

- Replace hard-coded values with named constant variables
- Use descriptive constant names that explain the value's purpose
- Keep constants at the top of the file

## Meaningful Names

- Variables, functions, and classes should reveal their purpose
- Names should explain why something exists and how it's used
- Avoid abbreviations unless they're universally understood

## Smart Comments

- Don't comment on what the code does - make the code self-documenting
- Use comments to explain why something is done a certain way
- Document APIs, complex algorithms, and non-obvious side effects

## Single Responsibility

- Each function should do exactly one thing
- Functions should be small and focused
- If a function needs a comment to explain what it does, it probably should be split up

## DRY (Don't Repeat Yourself)

- Extract repeated code into reusable functions
- Share common logic through proper abstraction
- Extract common utilities to their common ancestor
- Maintain single sources of truth

## Clean Structure

- Keep related code together, reference [project-structure-best-practices.md](project-structure-best-practices.md)
- Organize code in a logical hierarchy, reference [project-structure-best-practices.md](project-structure-best-practices.md)
- Use consistent file and folder naming conventions defined by [biome.jsonc](../src/biome.jsonc)

## Encapsulation

- Hide implementation details
- Expose clear interfaces
- Move nested conditionals into well-named functions

## Code Quality Maintenance

- Refactor continuously, reference [system-prompt-best-practices.md](system-prompt-best-practices.md)
- Fix technical debt early, reference [system-prompt-best-practices.md](system-prompt-best-practices.md)
- Leave code cleaner than you found it, reference [system-prompt-best-practices.md](system-prompt-best-practices.md)

## Testing

- Write failing tests before fixing bugs, reference [testing-best-practices.md](testing-best-practices.md)
- Keep tests readable and maintainable, reference [testing-best-practices.md](testing-best-practices.md)
- Test edge cases and error conditions, reference [testing-best-practices.md](testing-best-practices.md)

## Version Control

- Write clear commit messages, reference [commit-message-best-practices.md](commit-message-best-practices.md)
- Make small, focused commits, reference [commit-message-best-practices.md](commit-message-best-practices.md)
- Use meaningful branch names, reference [git-branch-best-practices.md](git-branch-best-practices.md)
