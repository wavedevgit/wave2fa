APP_DIR="$HOME/.config/wave2fa"
BRANCH=${1:-main} # default to main

# check if node exists
if command -v node &> /dev/null; then
  echo "node found, installing wave2fa."
else
  echo "Node is not installed, please install it!"
  echo "Help: Use nvm or install it from https://nodejs.org/en/download"
  exit 1
fi

mkdir -p "$APP_DIR"

download_bundle() {
  curl -s https://api.github.com/repos/wavedevgit/wave2fa/releases \
  | grep "browser_download_url" \
  | grep "bundle_$BRANCH.cjs" \
  | cut -d '"' -f 4 \
  | xargs curl -L -o "$APP_DIR/bundle.cjs"
}

download_wave2fa_binary() {
  curl -L -o "$APP_DIR/wave2fa.sh" \
  https://raw.githubusercontent.com/wavedevgit/wave2fa/main/scripts/wave2fa.sh
}

download_bundle
download_wave2fa_binary

chmod +x "$APP_DIR/wave2fa.sh"

mkdir -p "$HOME/bin"e


# check if termux is being used

if [ -d /data/data/com.termux/files/usr/bin/ ]; then
  ln -sf "$APP_DIR/wave2fa.sh" "/data/data/com.termux/files/usr/bin/wave2fa"
else
  sudo ln -sf "$APP_DIR/wave2fa.sh" "/bin/wave2fa"
fi

# blessed is the tui library used
cd $APP_DIR
npm init -y
npm i blessed

# used to not erease old user data
if [ ! -f _data.json ]; then
   echo "[]" > $APP_DIR/_data.json
fi


echo "Installed wave2fa. Run with: wave2fa"