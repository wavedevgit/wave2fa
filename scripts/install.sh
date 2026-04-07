#!/usr/bin/env bash

APP_DIR="$HOME/.config/wave2fa"
BRANCH=${1:-main} # default to main

# check if bun exists
if ! command -v bun &> /dev/null; then
  echo "Bun is not installed, please install it!"
  echo "Help: Use nvm or install it from https://bun.com/docs/installation"
  exit 1
fi

mkdir -p "$APP_DIR"

# download latest.json for the branch
LATEST_JSON_URL="https://raw.githubusercontent.com/wavedevgit/wave2fa-releases/$BRANCH/latest.json"
LATEST_JSON=$(curl -sL "$LATEST_JSON_URL")

if [ -z "$LATEST_JSON" ]; then
  echo "Could not fetch latest.json from branch $BRANCH"
  exit 1
fi

# extract latest version
VERSION=$(echo "$LATEST_JSON" | bun --eval "console.log(JSON.parse(require('fs').readFileSync(0,'utf8')).version)" <(echo "$LATEST_JSON"))

if [ -z "$VERSION" ]; then
  echo "Could not determine latest version from latest.json"
  exit 1
fi

echo "Latest version for branch $BRANCH is $VERSION"

# download the bundle.zip for that version
BUNDLE_URL="https://raw.githubusercontent.com/wavedevgit/wave2fa-releases/$BRANCH/$VERSION/bundle.zip"
echo "Downloading $BUNDLE_URL..."
curl -L "$BUNDLE_URL" -o "$APP_DIR/bundle.zip"

# unzip
unzip -o "$APP_DIR/bundle.zip" -d "$APP_DIR"

# download wave2fa.sh runner
curl -L -o "$APP_DIR/wave2fa.sh" \
  https://raw.githubusercontent.com/wavedevgit/wave2fa/$BRANCH/scripts/wave2fa.sh

chmod +x "$APP_DIR/wave2fa.sh"

mkdir -p "$HOME/bin"

if [ -d /data/data/com.termux/files/usr/bin/ ]; then
  ln -sf "$APP_DIR/wave2fa.sh" "/data/data/com.termux/files/usr/bin/wave2fa"
else
  sudo ln -sf "$APP_DIR/wave2fa.sh" "/bin/wave2fa"
fi

cd "$APP_DIR"
bun i

# preserve user data
if [ ! -f "$APP_DIR/_data.json" ]; then
   echo "[]" > "$APP_DIR/_data.json"
fi

echo "Installed wave2fa. Run with: wave2fa"