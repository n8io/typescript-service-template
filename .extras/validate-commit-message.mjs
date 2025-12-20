// biome-ignore-all lint/suspicious/noConsole: We need to log the commit message to the console
// This script validates the commit message format

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

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

const rootDir = process.cwd()
const commitFilePath = join(rootDir, '.git', 'COMMIT_EDITMSG')
const commitMessage = (readFileSync(commitFilePath, 'utf8') ?? '').trim()

const regExp =
  /^(?<type>chore|docs|feat|fix|test|refactor)\((?<ticket>[A-Z]+-\d+)\)[:][ ](?<emoji>:\p{Emoji_Presentation}|\p{Extended_Pictographic})\p{Emoji_Modifier}?\uFE0F?[ ][A-Z]\s*[^\n]+(\n\n[\s\S]*)?$/u

const valid = regExp.test(commitMessage)

if (valid) {
  console.log('👍 Your commit message is valid ')
} else {
  console.log("COMMIT ABORTED: The commit message doesn't meet the required format. See below for examples.")
  console.log(exampleText)
  process.exitCode = 1
}
