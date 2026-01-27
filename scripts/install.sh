APP_DIR="$HOME/.config/wave2fa"
mkdir -p "$APP_DIR"

curl -s https://api.github.com/repos/wavedevgit/wave2fa/releases/latest \
  | grep "browser_download_url" \
  | grep "bundle.cjs" \
  | cut -d '"' -f 4 \
  | xargs curl -L -o "$APP_DIR/bundle.cjs"

curl -L -o "$APP_DIR/wave2fa.sh" \
  https://raw.githubusercontent.com/wavedevgit/wave2fa/main/scripts/wave2fa.sh

chmod +x "$APP_DIR/wave2fa.sh"

mkdir -p "$HOME/bin"
sudo ln -sf "$APP_DIR/wave2fa.sh" "/bin/wave2fa"

# blessed is the tui library used
cd $APP_DIR
npm init -y
npm i blessed
echo "[]" >> _data.json


echo "Installed wave2fa. Run with: wave2fa"