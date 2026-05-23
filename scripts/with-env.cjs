#!/usr/bin/env node
const { spawn } = require("node:child_process")
const { loadExternalEnv } = require("./load-external-env.cjs")

loadExternalEnv()

const separatorIndex = process.argv.indexOf("--")
const command = process.argv.slice(separatorIndex === -1 ? 2 : separatorIndex + 1).join(" ")

if (!command) {
  console.error("Usage: node scripts/with-env.cjs -- <command>")
  process.exit(1)
}

const child = spawn(command, {
  env: process.env,
  shell: true,
  stdio: "inherit",
})

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code || 0)
})
