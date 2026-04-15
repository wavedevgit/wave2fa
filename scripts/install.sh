#!/bin/sh


get_arch() {
    arch=$(uname -m)

    case "$(uname -m)" in
        x86_64|amd64)
            echo "x64"
            ;;
        i386|i686)
            echo "unsupported"
            ;;
        aarch64|arm64)
            echo "arm64"
            ;;
        armv7l|armv6l)
            echo "unsupported"
            ;;
        *)
            echo "$arch"
            ;;
    esac
}

ARCH=$(get_arch)
PLATFORM=$(uname -s | awk '{print ($1=="Linux")?"linux":($1=="Darwin")?"macos":"linux"}')

if [ "$ARCH" = "unsupported"]; (
  echo "Wave2fa native bianry isn't supported on x86 systems."
  echo "You may however use node to run the bundle.js provided in release" 
  exit 1 
)


APP_DIR="$HOME/.config/wave2fa"
BRANCH=${1:-main} # default to main

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
BUNDLE_URL="https://github.com/wavedevgit/wave2fa-releases/releases/download/${BRANCH}-${VERSION}/wave2fa-${PLATFORM}-${ARCH}.zip "
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

# preserve user data
if [ ! -f "$APP_DIR/_data.json" ]; then
  echo "[]" > "$APP_DIR/_data.json"
fi

echo "Installed wave2fa. Run with: wave2fa"