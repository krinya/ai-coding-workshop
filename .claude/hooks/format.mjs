// PostToolUse hook: format each file Claude edits, so the formatter never fails `make check`.
// Claude Code passes the tool call as JSON on stdin.
import { spawnSync } from 'node:child_process'
import { relative, resolve } from 'node:path'

let input = ''
for await (const chunk of process.stdin) input += chunk

const file = JSON.parse(input).tool_input?.file_path
if (!file) process.exit(0)

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
const path = relative(root, resolve(file))

if (path.startsWith('backend/') && path.endsWith('.py')) {
  const local = relative('backend', path)
  spawnSync('uv', ['run', 'ruff', 'check', '--fix', '--quiet', local], { cwd: 'backend' })
  spawnSync('uv', ['run', 'ruff', 'format', '--quiet', local], { cwd: 'backend' })
} else if (path.startsWith('frontend/') && /\.(tsx?|css|json)$/.test(path)) {
  spawnSync('npx', ['prettier', '--write', '--log-level', 'silent', relative('frontend', path)], {
    cwd: 'frontend',
  })
}
