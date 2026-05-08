#!/usr/bin/env bash
set -euo pipefail

ARCHIVE_PATH="${1:-}"

if [[ -z "$ARCHIVE_PATH" ]]; then
  ARCHIVE_PATH="$(ls -td "$HOME"/Library/Developer/Xcode/Archives/*/*.xcarchive | head -1)"
fi

HERMES_BINARY="$ARCHIVE_PATH/Products/Applications/LanguageFlashcards.app/Frameworks/hermes.framework/hermes"
DSYM_OUTPUT="$ARCHIVE_PATH/dSYMs/hermes.framework.dSYM"

if [[ ! -f "$HERMES_BINARY" ]]; then
  echo "Hermes binary not found at: $HERMES_BINARY" >&2
  exit 1
fi

rm -rf "$DSYM_OUTPUT"
dsymutil "$HERMES_BINARY" -o "$DSYM_OUTPUT"

echo "Archive: $ARCHIVE_PATH"
echo "Hermes binary UUID:"
dwarfdump --uuid "$HERMES_BINARY"
echo "Hermes dSYM UUID:"
dwarfdump --uuid "$DSYM_OUTPUT"
