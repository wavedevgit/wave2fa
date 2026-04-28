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

get_arch_android() {
    case "$(uname -m)" in
        aarch64|arm64)
            echo "aarch64"
            ;;

        x86_64|amd64)
            echo "x86_64"
            ;;

        armv7l|armv8l|arm)
            echo "arm"
            ;;

        *)
            echo "unsupported"
            ;;
    esac
}

PLATFORM=$(
    case "$(uname -s)" in
        Darwin)
            echo "macos"
            ;;
        Linux)
            if [ -n "$ANDROID_ROOT" ] || [ -n "$ANDROID_DATA" ] || grep -qi "android" /proc/version 2>/dev/null; then
                echo "android"
            else
                echo "linux"
            fi
            ;;
        *)
            echo "linux"
            ;;
    esac
)
if [ "$PLATFORM" = "android" ]; then 
 ARCH=$(get_arch_android)
else 
 ARCH=$(get_arch)
fi 

if [ "$ARCH" = "unsupported" ]; then
  echo "Wave2fa native bianry isn't supported on x86 systems."
  echo "You may however try to find some node binary for your arch to run the bundle.js provided in release" 
  exit 1 
fi


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

# download latest
LATEST_VER_URL="https://wavedevgit.github.io/wave2fa-releases/$BRANCH/latest"
LATEST_VER=$($DOWNLOAD_CMD "$LATEST_VER_URL")

if [ -z "$LATEST_VER" ]; then
  echo "Could not fetch 'latest' from branch $BRANCH"
  exit 1
fi

VERSION=$LATEST_VER

if [ -z "$VERSION" ]; then
  echo "Could not determine latest version from 'latest' file"
  exit 1
fi

echo "Latest version for branch $BRANCH is $VERSION"

if [ "$PLATFORM" = "android" ]; then
  BASE_URL="https://github.com/wavedevgit/wave2fa-releases/releases/download/${BRANCH}-${VERSION}"
  SEA_CONFIG_URL="https://raw.githubusercontent.com/wavedevgit/wave2fa/refs/heads/$BRANCH/sea.config.json"
  WAVE2FA_BUNDLE="$BASE_URL/bundle.cjs"
  WAVE2FA_SH="$BASE_URL/wave2fa.sh"

  echo "[+] building wave2fa for android..."

  if command -v node >/dev/null 2>&1; then
      IS_NODE_INSTALLED="yes"
  else
      IS_NODE_INSTALLED="no"
      pkg install nodejs -y
  fi
  
  rm -rf wave2fa-temp-build
  mkdir wave2fa-temp-build
  cd wave2fa-temp-build || exit 1

  wget "$SEA_CONFIG_URL" -O sea.config.json || exit 1
  mkdir -p dist

  wget "$WAVE2FA_BUNDLE" -O dist/bundle.cjs || exit 1

  wget "$WAVE2FA_SH" -O "$APP_DIR/wave2fa.sh" || exit 1
  chmod +x "$APP_DIR/wave2fa.sh"

  node --build-sea sea.config.json

  SEA_BLOB_FILE="sea-prep.blob"

  mv "$SEA_BLOB_FILE" "$APP_DIR/wave2fa"

  cd ..
  rm -rf wave2fa-temp-build
  # this only removes nodejs if user didnt have it, to not be bloated
  if [ "$IS_NODE_INSTALLED" = "no" ]; then 
    pkg uninstall nodejs 
  fi 

else
  # download bundle.zip
  BUNDLE_URL="https://github.com/wavedevgit/wave2fa-releases/releases/download/${BRANCH}-${VERSION}/wave2fa-${PLATFORM}-${ARCH}.zip"
  echo "Downloading $BUNDLE_URL..."
  if [ "$DOWNLOAD_CMD" = "curl -sL" ]; then
    curl -L "$BUNDLE_URL" -o "$APP_DIR/bundle.zip"
  else
    wget -q "$BUNDLE_URL" -O "$APP_DIR/bundle.zip"
  fi

  # unzip
  unzip -o "$APP_DIR/bundle.zip" -d "$APP_DIR"
  rm -rf "$APP_DIR/bundle.zip"
fi  

chmod +x "$APP_DIR/wave2fa.sh"

# create symlink
if [ -d "/data/data/com.termux/files/usr/bin" ]; then
  ln -sf "$APP_DIR/wave2fa.sh" "/data/data/com.termux/files/usr/bin/wave2fa"
  echo Installing required packages
else
  echo adding wave2fa to /bin/wave2fa
  sudo ln -sf "$APP_DIR/wave2fa.sh" "/bin/wave2fa"
fi

cd "$APP_DIR" || exit 1

# preserve user data
if [ ! -f "$APP_DIR/_data.json" ]; then
  echo "[]" > "$APP_DIR/_data.json"
fi

echo "Installed wave2fa. Run with: wave2fa"
