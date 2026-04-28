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
  WAVE2FA_BUNDLE="$BASE_URL/bundle.cjs"
  WAVE2FA_SH="$BASE_URL/wave2fa.sh"

  echo "[+] installing wave2fa (bundle.cjs version) for android..."

  if command -v node >/dev/null 2>&1; then
    echo "Node is installed, skipping install of node..."
  else
      echo "Installing Node..."
      pkg install nodejs -y
  fi
  
  wget "$WAVE2FA_BUNDLE" -O "$APP_DIR/bundle.cjs" || exit 1

  wget "$WAVE2FA_SH" -O "$APP_DIR/wave2fa.sh" || exit 1
  printf '#!/bin/bash\nnode "%s/bundle.cjs"\n' "$APP_DIR" > "$APP_DIR/wave2fa"
  chmod +x "$APP_DIR/wave2fa"
  chmod +x "$APP_DIR/wave2fa.sh"


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
