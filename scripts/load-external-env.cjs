const fs = require("node:fs")
const path = require("node:path")

const ENV_FILE_CANDIDATES = [
  process.env.EXTERNAL_ENV_FILE,
  process.env.LANGUAGE_FLASHCARDS_ENV_FILE,
  "/var/www/vhosts/language-flashcards/private/.env",
  "/home/yaro/project-env/language-flashcards.env",
].filter(Boolean)

function parseEnvLine(line) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) return null
  const equalsIndex = trimmed.indexOf("=")
  if (equalsIndex === -1) return null
  const key = trimmed.slice(0, equalsIndex).trim()
  let value = trimmed.slice(equalsIndex + 1).trim()
  if (!key) return null
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1)
  }
  return [key, value]
}

function loadExternalEnv(filePath) {
  const resolved = resolveEnvFile(filePath)
  if (!resolved) return false
  if (!fs.existsSync(resolved)) return false
  const content = fs.readFileSync(resolved, "utf8")
  for (const line of content.split(/\r?\n/)) {
    const parsed = parseEnvLine(line)
    if (!parsed) continue
    const [key, value] = parsed
    if (!(key in process.env)) process.env[key] = value
  }
  return true
}

function resolveEnvFile(filePath) {
  if (filePath) return path.resolve(filePath)
  for (const candidate of ENV_FILE_CANDIDATES) {
    const resolved = path.resolve(candidate)
    if (fs.existsSync(resolved)) return resolved
  }
  return null
}

module.exports = { loadExternalEnv }
