# Branch Naming Convention

This project enforces a strict branch naming convention to maintain consistency and clarity in the codebase.

## Usage

When necessary, inspect the changed files using `git status` and `git diff` in the terminal

## Format

Branches must follow one of these patterns:

1. Main branches:

   ```text
   develop
   candidate
   main
   ```

2. Feature/Bugfix branches:

   ```text
   <type>/<ticket>[-<subject>]
   ```

## Type

The type must be one of the following:

- `feat`: New feature
- `fix`: Bug fix
- `hotfix`: Urgent production fix
- `chore`: Maintenance tasks
- `test`: Test-related changes
- `refactor`: Refactor code for reasons

## Ticket

The ticket must be in the format `ABC-123` where:

- `ABC` is the project prefix (letters)
- `123` is the ticket number

## Subject (Optional)

The subject is optional and must:

- Start with a hyphen
- Contain only letters, numbers, and hyphens
- Be lowercase
- Be descriptive but concise

## Examples

Main branches:

```text
develop
candidate
main
```

Feature branches:

```text
feat/ABC-123
feat/ABC-123-add-user-authentication
```

Bug fix branches:

```text
fix/ABC-456
fix/ABC-456-login-error
```

Chore branches:

```text
chore/ABC-101
chore/ABC-101-update-dependencies
```

Test branches:

```text
test/ABC-202
test/ABC-202-add-integration-tests
```

## Validation

Branch names are automatically validated. If your branch name doesn't match the required pattern, you'll see an error message like:

```text
The current branch name does not match the required pattern. E.g. feat/abc-123
```

## Common Mistakes to Avoid

1. Missing type prefix
2. Incorrect ticket format
3. Using uppercase in the subject
4. Using special characters in the subject
5. Missing hyphen between ticket and subject
6. Using spaces instead of hyphens
