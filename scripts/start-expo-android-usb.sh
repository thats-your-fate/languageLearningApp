#!/usr/bin/env bash
set -euo pipefail

ADB_BIN="${ADB:-}"

if [ -z "$ADB_BIN" ] && command -v adb >/dev/null 2>&1; then
  ADB_BIN="$(command -v adb)"
fi

for candidate in \
  "$HOME/Android/Sdk/platform-tools/adb" \
  "$HOME/android-sdk/platform-tools/adb" \
  "${ANDROID_HOME:-}/platform-tools/adb" \
  "${ANDROID_SDK_ROOT:-}/platform-tools/adb"; do
  if [ -z "$ADB_BIN" ] && [ -x "$candidate" ]; then
    ADB_BIN="$candidate"
  fi
done

if [ -z "$ADB_BIN" ]; then
  echo "adb is not available on PATH. Install Android platform tools or open Android Studio once."
  exit 1
fi

echo "Waiting for an Android device over USB..."
"$ADB_BIN" wait-for-device

echo "Forwarding Expo/Metro ports to the device..."
"$ADB_BIN" reverse tcp:8081 tcp:8081
"$ADB_BIN" reverse tcp:19000 tcp:19000 2>/dev/null || true
"$ADB_BIN" reverse tcp:19001 tcp:19001 2>/dev/null || true
"$ADB_BIN" reverse tcp:19002 tcp:19002 2>/dev/null || true

echo "Starting Expo on localhost. In Expo Go/dev build, use exp://127.0.0.1:8081 if it does not open automatically."
npx expo start --localhost "$@"
