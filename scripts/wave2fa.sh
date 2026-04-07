#!/bin/bash

APP_DIR="$HOME/.config/wave2fa"
BUNDLE="$APP_DIR/bundle.js"

if ! OUTPUT=$(bun "$BUNDLE" 2>&1); then
    echo "wave2fa exited with error"
    echo
    echo "Error message:"
    echo "$OUTPUT"
    echo
    echo "You can open an issue on GitHub with the error message:"
    echo "https://github.com/wavedevgit/wave2fa/issues/new?title=wave2fa+runtime+error&body=$(echo "$OUTPUT" | jq -sRr @uri)"
    exit 1
fi