# Commit Message Best Practices

This project enforces a strict commit message format that includes ticket numbers and emojis. The format is validated automatically using a pre-commit hook.

## Format

```text
<type>(<ticket>): <emoji> <subject>

<body>
```

## Type

The type must be one of the following:

- `feat`: A new feature
- `fix`: A bug fix
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries
- `refactor`: A code change that neither fixes a bug nor adds a feature

## Ticket

The ticket must be in the format `ABC-123` where:

- `ABC` is the project prefix (uppercase letters)
- `123` is the ticket number

## Emoji

Each commit type has an associated emoji ([source](https://gitmoji.dev))

- 🎨 Improve structure / format of the code
- ⚡️ Improve performance
- 🔥 Remove code or files
- 🐛 Fix a bug
- 🚑️ Critical hotfix
- ✨ Introduce new features
- 📝 Add or update documentation
- 🚀 Deploy stuff
- 💄 Add or update the UI and style files
- 🎉 Begin a project
- ✅ Add, update, or pass tests
- 🔒️ Fix security or privacy issues
- 🔐 Add or update secrets
- 🔖 Release / Version tags
- 🚨 Fix compiler / linter warnings
- 🚧 Work in progress
- 💚 Fix CI Build
- ⬇️ Downgrade dependencies
- ⬆️ Upgrade dependencies
- 📌 Pin dependencies to specific versions
- 👷 Add or update CI build system
- 📈 Add or update analytics or track code
- ♻️ Refactor code
- ➕ Add a dependency
- ➖ Remove a dependency
- 🔧 Add or update configuration files
- 🔨 Add or update development scripts
- 🌐 Internationalization and localization
- ✏️ Fix typos
- 💩 Write bad code that needs to be improved
- ⏪️ Revert changes
- 🔀 Merge branches
- 📦️ Add or update compiled files or packages
- 👽️ Update code due to external API changes
- 🚚 Move or rename resources (e.g.: files, paths, routes)
- 📄 Add or update license
- 💥 Introduce breaking changes
- 🍱 Add or update assets
- ♿️ Improve accessibility
- 💡 Add or update comments in source code
- 🍻 Write code drunkenly
- 💬 Add or update text and literals
- 🗃️ Perform database related changes
- 🔊 Add or update logs
- 🔇 Remove logs
- 👥 Add or update contributor(s)
- 🚸 Improve user experience / usability
- 🏗️ Make architectural changes
- 📱 Work on responsive design
- 🤡 Mock things
- 🥚 Add or update an easter egg
- 🙈 Add or update a .gitignore file
- 📸 Add or update snapshots
- ⚗️ Perform experiments
- 🔍️ Improve SEO
- 🏷️ Add or update types
- 🌱 Add or update seed files
- 🚩 Add, update, or remove feature flags
- 🥅 Catch errors
- 💫 Add or update animations and transitions
- 🗑️ Deprecate code that needs to be cleaned up
- 🛂 Work on code related to authorization, roles and permissions
- 🩹 Simple fix for a non-critical issue
- 🧐 Data exploration/inspection
- ⚰️ Remove dead code
- 🧪 Add a failing test
- 👔 Add or update business logic
- 🩺 Add or update health check
- 🧱 Infrastructure related changes
- 🧑‍💻 Improve developer experience
- 💸 Add sponsorships or money related infrastructure
- 🧵 Add or update code related to multithreading or concurrency
- 🦺 Add or update code related to validation
- ✈️ Improve offline support

## Subject

The subject must:

- Start with a capital letter
- Be a single line
- Not end with a period
- Subjects should be written in prose (as you would instruct a person to do some work)

```ts
// ❌ Don't do this
fix(ABC-123) 🐛 Fixed button thingy

//  ✅ Do this instead
fix(ABC-123) 🐛 Ensure Save button is enabled for admins
```

## Body (Optional)

The body is optional and must:

- Be separated from the subject by a blank line
- Can contain multiple lines
- Can include bullet points
  - Bullet points should be written in prose

## Examples

```text
feat(ABC-123): ✨ Implement new feature
```

```text
fix(XYZ-987): 🐛 Resolve issue with login

Additional details preceded by a blank line.
```

```text
test(QWE-456): 🧪 Add unit tests for validation
```

```text
chore(DEV-100): 🔧 Update dependencies

- Refactor build process
- Ate tacos for lunch
```

```text
refactor(OPS-321): ♻️ Remove deprecated API
```

## Validation

Commit messages are automatically validated using a pre-commit hook. If your commit message doesn't match the required format, the commit will be aborted and you'll see examples of valid commit messages.

## Common Mistakes to Avoid

1. Missing emoji
2. Lowercase first letter in subject
3. Missing ticket number
4. Incorrect ticket format (must be ABC-123)
5. Missing space after emoji
6. No blank line before body (if body is present)
