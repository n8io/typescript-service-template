#!/bin/sh
set -e

log_info() {
  local timestamp level message
  timestamp=$(date +"[%H:%M:%S.%3N]")
  level="\033[0;32mINFO\033[0m"     # Green
  message="\033[0;36m$*\033[0m"     # Cyan
  echo "$timestamp $level: $message"
}

if [ ! -d "node_modules" ] || [ package-lock.json -nt node_modules ]; then
  log_info "🧐 Dependencies have changed, updating dependencies..."
  npm ci --omit=dev --silent
  log_info "✅ Dependencies updated."
fi

exec "$@"
