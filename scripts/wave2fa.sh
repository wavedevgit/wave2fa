#!/bin/sh

APP_DIR="$HOME/.config/wave2fa"
BUNDLE="$APP_DIR/bundle.js"
LATEST_JSON="$APP_DIR/latest.json"

if [ -f "$LATEST_JSON" ]; then
    printf 'wave2fa version info:\n'
    cat "$LATEST_JSON"
    echo
fi

OUTPUT=$("$BUNDLE" 2>&1)
STATUS=$?

if [ $STATUS -ne 0 ]; then
    echo "wave2fa exited with error"
    echo
    echo "Error message:"
    echo "$OUTPUT"
    echo
    if [ -f "$LATEST_JSON" ]; then
        BODY=$(cat "$LATEST_JSON" | sed 's/%/%25/g; s/ /%20/g; s/$/%0A/')
    else
        BODY="No%20latest.json%20found"
    fi

    BODY="$BODY%0A%0AError:%0A"
    BODY="$BODY$(printf "%s" "$OUTPUT" | sed 's/%/%25/g; s/ /%20/g; s/$/%0A/')"

    echo "You can open an issue on GitHub with the error message:"
    echo "https://github.com/wavedevgit/wave2fa/issues/new?title=wave2fa+runtime+error&body=$BODY"
    exit 1
fi