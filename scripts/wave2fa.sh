#!/bin/sh

APP_DIR="$HOME/.config/wave2fa"
BUNDLE="$APP_DIR/dist/bundle.js"
export INFO_JSON="$APP_DIR/info.json"
export LOG_FILE="$APP_DIR/tmp_output.log"

RED='\033[31m'
GREEN='\033[32m'
YELLOW='\033[33m'
CYAN='\033[36m'
RESET='\033[0m'

generate_issue_body() {
    bun -e '
        const fs = require("fs");
        let info = "No info.json found";
        try {
            info = JSON.stringify(JSON.parse(fs.readFileSync(process.env.INFO_JSON, "utf8")));
        } catch (e) {}
        const output = fs.readFileSync(process.env.LOG_FILE, "utf8");
        const esc = s => s.replace(/`/g, "\\`").replace(/\$/g, "\\$");
        console.log(encodeURIComponent("# Version info\n```json\n" + esc(info) + "\n```\n\n# Error\n```text\n" + esc(output) + "\n```"));
    '
}

rm -f "$LOG_FILE"

# Run the bundle and capture all output
bun "$BUNDLE" "$@"
STATUS=$?

if [ -f "$LOG_FILE" ]; then
    OUTPUT=$(cat "$LOG_FILE")
else
    OUTPUT=""
fi

# Check both exit status AND error patterns in output
if [ "$STATUS" -ne 0 ] || echo "$OUTPUT" | grep -qi "^error:"; then
    printf "${RED}✗ wave2fa exited with error${RESET}\n\n"

    BODY_ENC=$(generate_issue_body)


    printf "\n${YELLOW}Error output:${RESET}\n$OUTPUT\n\n"

    rm -f "$LOG_FILE"

    if [ -n "$BODY_ENC" ]; then
        ISSUE_URL="https://github.com/wavedevgit/wave2fa/issues/new?title=wave2fa+runtime+error&body=$BODY_ENC"
        printf "${CYAN}→ Open GitHub issue with the error (clickable in supported terminals):${RESET}\n\n"
        printf '\033]8;;%s\033\\%s\033]8;;\033\\\n' "$ISSUE_URL" "$ISSUE_URL"
    fi
    exit 1
else
    if [ ! -f "$HOME/.config/wave2fa/disable-donation-message" ]; then
        # Random number between 0-99
        RAND_NUM=$((RANDOM % 100))
        if [ "$RAND_NUM" -lt 5 ]; then
            printf "\n${GREEN}★ Hey friend! wave2fa is completely open source and made with ❤️  for everyone.\nIf you're enjoying it and want to help keep it growing, consider donating today & starring the repo!${RESET}\n"
        fi
    fi
    rm -f "$LOG_FILE"
    exit 0
fi