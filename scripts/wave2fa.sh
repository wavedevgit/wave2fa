#!/bin/sh

APP_DIR="$HOME/.config/wave2fa"
BUNDLE="$APP_DIR/bundle.js"
INFO_JSON="$APP_DIR/info.json"

if [ -f "$INFO_JSON" ]; then
    printf 'wave2fa version info:\n'
    cat "$INFO_JSON"
    echo
fi

OUTPUT=$(bun "$BUNDLE" 2>&1)
STATUS=$?

if [ $STATUS -ne 0 ]; then
    echo "wave2fa exited with error"
    echo
    echo "Error message:"
    echo "$OUTPUT"
    echo
    if [ -f "$INFO_JSON" ]; then
        BODY=$(cat "$INFO_JSON" | sed 's/%/%25/g; s/ /%20/g; s/$/%0A/')
    else
        BODY="No%20info.json%20found"
    fi

    BODY="$BODY%0A%0AError:%0A"
    BODY="$BODY$(printf "%s" "$OUTPUT" | sed 's/%/%25/g; s/ /%20/g; s/$/%0A/')"

    echo "You can open an issue on GitHub with the error message:"
    echo "https://github.com/wavedevgit/wave2fa/issues/new?title=wave2fa+runtime+error&body=$BODY"
    exit 1
fi