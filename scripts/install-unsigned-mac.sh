#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DEST="/Applications/Cannonade.app"

cd "$ROOT"

echo "==> Building unsigned mac app"
npm run build
npx electron-builder --mac --dir -c.mac.identity=null

APP_SRC=""
for candidate in "$ROOT"/dist/mac*/Cannonade.app; do
  if [ -d "$candidate" ]; then
    APP_SRC="$candidate"
    break
  fi
done

if [ -z "$APP_SRC" ]; then
  echo "Build output not found under $ROOT/dist/mac*/Cannonade.app" >&2
  exit 1
fi

if pgrep -f "$APP_DEST/Contents/MacOS/Cannonade" >/dev/null 2>&1; then
  echo "==> Quitting running Cannonade"
  osascript -e 'quit app "Cannonade"' >/dev/null 2>&1 || true
  sleep 2
fi

echo "==> Installing $APP_SRC to $APP_DEST"
rm -rf "$APP_DEST"
cp -R "$APP_SRC" "$APP_DEST"

echo "==> Removing quarantine attribute"
xattr -dr com.apple.quarantine "$APP_DEST"

echo "==> Done: $APP_DEST"
