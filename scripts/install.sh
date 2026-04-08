#!/bin/sh

APP_DIR="$HOME/.config/wave2fa"
BRANCH=${1:-main} # default to main

# check bun
if ! command -v bun >/dev/null 2>&1; then
  echo "Bun is not installed, please install it!"
  echo "Help: install it from https://bun.com/docs/installation"
  exit 1
fi

# check curl or wget
DOWNLOAD_CMD=""
if command -v curl >/dev/null 2>&1; then
  DOWNLOAD_CMD="curl -sL"
elif command -v wget >/dev/null 2>&1; then
  DOWNLOAD_CMD="wget -qO-"
else
  echo "Neither curl nor wget is installed. Please install one to proceed."
  exit 1
fi

mkdir -p "$APP_DIR"

# download latest.json
LATEST_JSON_URL="https://wavedevgit.github.io/wave2fa-releases/$BRANCH/latest.json"
LATEST_JSON=$($DOWNLOAD_CMD "$LATEST_JSON_URL")

if [ -z "$LATEST_JSON" ]; then
  echo "Could not fetch latest.json from branch $BRANCH"
  exit 1
fi

# extract version using bun
TMPFILE=$(mktemp)
printf '%s' "$LATEST_JSON" > "$TMPFILE"
VERSION=$(bun --eval "console.log(JSON.parse(require('fs').readFileSync('$TMPFILE','utf8')).version)")
rm -f "$TMPFILE"

if [ -z "$VERSION" ]; then
  echo "Could not determine latest version from latest.json"
  exit 1
fi

echo "Latest version for branch $BRANCH is $VERSION"

# download bundle.zip
BUNDLE_URL="https://wavedevgit.github.io/wave2fa-releases/$BRANCH/$VERSION/bundle.zip"
echo "Downloading $BUNDLE_URL..."
if [ "$DOWNLOAD_CMD" = "curl -sL" ]; then
  curl -L "$BUNDLE_URL" -o "$APP_DIR/bundle.zip"
else
  wget -q "$BUNDLE_URL" -O "$APP_DIR/bundle.zip"
fi

# unzip
unzip -o "$APP_DIR/bundle.zip" -d "$APP_DIR"
rm -rf "$APP_DIR/bundle.zip"

chmod +x "$APP_DIR/wave2fa.sh"

mkdir -p "$HOME/bin"

# create symlink
if [ -d "/data/data/com.termux/files/usr/bin" ]; then
  ln -sf "$APP_DIR/wave2fa.sh" "/data/data/com.termux/files/usr/bin/wave2fa"
else
  clear
  echo adding wave2fa to /bin/wave2fa
  sudo ln -sf "$APP_DIR/wave2fa.sh" "/bin/wave2fa"
fi

cd "$APP_DIR" || exit 1

# install deps
bun i

# preserve user data
if [ ! -f "$APP_DIR/_data.json" ]; then
  echo "[]" > "$APP_DIR/_data.json"
fi

echo "Installed wave2fa. Run with: wave2fa"