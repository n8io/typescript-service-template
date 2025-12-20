// biome-ignore-all lint/suspicious/noConsole: We need to log the commit message to the console
// This script validates the commit message format

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const VALID_TYPES = ['chore', 'docs', 'feat', 'fix', 'test', 'refactor']

const validCommits = [
  'feat(ABC-123): ✨ Implement new feature',
  'fix(XYZ-987): 🐛 Resolve issue with login\n\nAdditional details preceded by a blank line.',
  'test(QWE-456): 🧪 Add unit tests for validation',
  'chore(DEV-100): 🔧 Update dependencies\n\n- Refactored build process\n- Ate tacos for lunch',
  'refactor(OPS-321): 🔥 Remove deprecated API',
]

const exampleText = `
Here are some examples of a valid commit message:

${validCommits
  .map((commit, index) => `===== EXAMPLE ${index + 1} ===============================\n${commit}`)
  .join('\n===============================================\n\n')}
===============================================`

const validateType = (firstLine, errors) => {
  const typeMatch = firstLine.match(/^(?<type>\w+)/)

  if (!typeMatch) {
    errors.push('❌ Missing commit type at the start (e.g., feat, fix, chore, test, refactor)')

    return null
  }

  const type = typeMatch.groups.type.toLowerCase()

  if (!VALID_TYPES.includes(type)) {
    errors.push(`❌ Invalid commit type "${type}". Must be one of: ${VALID_TYPES.join(', ')}`)
  }

  return type
}

const validateTicket = (firstLine, errors) => {
  const ticketMatch = firstLine.match(/\((?<ticket>[^)]+)\)/)

  if (!ticketMatch) {
    errors.push('❌ Missing ticket number in parentheses. Example: "(ABC-123)"')

    return null
  }

  const ticket = ticketMatch.groups.ticket
  const ticketFormat = /^[A-Z]+-\d+$/

  if (!ticketFormat.test(ticket)) {
    errors.push(
      `❌ Invalid ticket format "${ticket}". Must be uppercase letters, hyphen, then numbers. Example: "ABC-123"`,
    )
  }

  return ticket
}

const validateColon = (firstLine, errors) => {
  const colonMatch = firstLine.match(/\):\s+(?<afterColon>.+)/)

  if (!colonMatch) {
    const colonOnlyMatch = firstLine.match(/\):(?<afterColon>.+)/)

    if (colonOnlyMatch) {
      errors.push('❌ Missing space after colon. Example: "(ABC-123): ✨"')
    } else {
      errors.push('❌ Missing colon and space after ticket number. Example: "(ABC-123): "')
    }

    return false
  }

  return true
}

const validateEmoji = (firstLine, errors) => {
  const emojiMatch = firstLine.match(
    /\):\s+(?<emoji>[\p{Emoji_Presentation}\p{Extended_Pictographic}][\p{Emoji_Modifier}]?\uFE0F?)/u,
  )

  if (!emojiMatch) {
    const colonEmojiMatch = firstLine.match(
      /\):(?<emoji>[\p{Emoji_Presentation}\p{Extended_Pictographic}][\p{Emoji_Modifier}]?\uFE0F?)/u,
    )

    if (colonEmojiMatch) {
      errors.push('❌ Missing space between colon and emoji. Example: "(ABC-123): ✨"')
    } else {
      errors.push('❌ Missing emoji after colon. Example: "(ABC-123): ✨"')
    }

    return null
  }

  return emojiMatch.groups.emoji
}

const validateSubject = (firstLine, errors) => {
  const subjectMatch = firstLine.match(
    /\):\s+[\p{Emoji_Presentation}\p{Extended_Pictographic}][\p{Emoji_Modifier}]?\uFE0F?\s+(?<subject>.+)/u,
  )

  if (!subjectMatch) {
    errors.push('❌ Missing subject after emoji')

    return
  }

  const subject = subjectMatch.groups.subject.trim()

  if (!subject) {
    errors.push('❌ Subject is empty')

    return
  }

  const firstChar = subject[0]

  if (firstChar !== firstChar.toUpperCase()) {
    errors.push(`❌ Subject must start with a capital letter. Found: "${firstChar}"`)
  }

  if (subject.endsWith('.')) {
    errors.push('❌ Subject should not end with a period')
  }
}

const validateBody = (lines, errors) => {
  if (lines.length > 1 && lines[1] !== '') {
    errors.push('❌ Body must be separated from subject by a blank line')
  }
}

const validateCommitMessage = (commitMessage) => {
  const errors = []

  if (!commitMessage) {
    errors.push('❌ Commit message is empty')

    return errors
  }

  const lines = commitMessage.split('\n')
  const firstLine = lines[0]

  if (!firstLine) {
    errors.push('❌ Commit message first line is empty')

    return errors
  }

  validateType(firstLine, errors)
  validateTicket(firstLine, errors)

  const hasColon = validateColon(firstLine, errors)

  if (hasColon) {
    validateEmoji(firstLine, errors)
    validateSubject(firstLine, errors)
  }

  validateBody(lines, errors)

  return errors
}

const rootDir = process.cwd()
const commitFilePath = join(rootDir, '.git', 'COMMIT_EDITMSG')
const commitMessage = (readFileSync(commitFilePath, 'utf8') ?? '').trim()

const errors = validateCommitMessage(commitMessage)

if (errors.length === 0) {
  console.log('👍 Your commit message is valid')
} else {
  console.log("COMMIT ABORTED: The commit message doesn't meet the required format.\n")
  console.log('Issues found:')

  for (const error of errors) {
    console.log(`  ${error}`)
  }

  console.log(`\n${exampleText}`)
  process.exitCode = 1
}
