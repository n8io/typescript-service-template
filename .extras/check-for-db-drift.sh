#!/usr/bin/env bash

set -euo pipefail

EXPECTED_MESSAGE="No schema changes, nothing to migrate"

# Resolve script and config path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_PATH="$SCRIPT_DIR/../drizzle.config.ts"

# Parse the out path from drizzle.config.ts
OUT_DIR_REL=$(grep -oE "['\"][^'\"]+['\"]" "$CONFIG_PATH" | grep -m1 -E "^['\"]\./.*['\"]" | sed -E "s/^['\"](.*)['\"]$/\1/")

# Tolerant path resolution (even if the dir doesn't exist yet)
OUT_DIR_ABS="$(cd "$SCRIPT_DIR/../$(dirname "$OUT_DIR_REL")" && pwd)/$(basename "$OUT_DIR_REL")"

if [[ -z "$OUT_DIR_ABS" ]]; then
  echo "❌ Could not extract 'out' directory from drizzle.config.ts"
  exit 1
fi

WAS_CLEAN_BEFORE=0

# Check if out directory was clean before generate
if ! git diff --quiet -- "$OUT_DIR_ABS"; then
  WAS_CLEAN_BEFORE=1
fi

# Run drizzle-kit generate
echo "🔍 Looking for database schema drift..."
OUTPUT=$(npx drizzle-kit generate --config "$CONFIG_PATH")
LAST_LINE=$(echo "$OUTPUT" | tail -n 1)

if [[ "$LAST_LINE" == *"$EXPECTED_MESSAGE"* ]]; then
  echo "👍 Database schema is up-to-date"
  exit 0
else
  echo "🚨 Database schema drift detected. Have you ran \"npm run db:generate\"?"
  
  if [[ $WAS_CLEAN_BEFORE -eq 0 ]]; then
    git clean -fd "$OUT_DIR_ABS" &> /dev/null
    git checkout "$OUT_DIR_ABS" &> /dev/null
  fi

  exit 1
fi
