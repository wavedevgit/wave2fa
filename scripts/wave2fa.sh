#!/bin/sh

APP_DIR="$HOME/.config/wave2fa"
BUNDLE="$APP_DIR/dist/bundle.js"
INFO_JSON="$APP_DIR/info.json"
LOG_FILE="$APP_DIR/tmp_output.log"

RED='\033[31m'
GREEN='\033[32m'
CYAN='\033[36m'
RESET='\033[0m'

generate_issue_body() {
    bun -e 'const fs=require("fs");let info="No info.json found";try{info=JSON.stringify(JSON.parse(fs.readFileSync("'"$INFO_JSON"'","utf8"))}catch{}const output=fs.readFileSync("'"$LOG_FILE"'","utf8");const esc=s=>s.replace(/`/g,"\\`").replace(/\$/g,"\\$");console.log(encodeURIComponent(`# Version info\n\`\`\`json\n${esc(info)}\n\`\`\`\n\n# Error\n\`\`\`text\n${esc(output)}\n\`\`\``));'
}

rm -f "$LOG_FILE"

# Open a new fd 3 for logging
exec 3> "$LOG_FILE"


bun "$BUNDLE" $@

STATUS=${$?}
# error logging is handled by wave2fa bundle
OUTPUT=$(cat "$LOG_FILE")

echo "$OUTPUT" | grep -qi '^error:' && STATUS=1

if [ "$STATUS" -ne 0 ]; then
    printf "${RED}wave2fa exited with error${RESET}\n\n"

    BODY_ENC=$(generate_issue_body)
    ISSUE_URL="https://github.com/wavedevgit/wave2fa/issues/new?title=wave2fa+runtime+error&body=$BODY_ENC"

    printf "${CYAN}Open GitHub issue with the error (clickable in supported terminals):${RESET}\n"
    printf '\033]8;;%s\033\\%s\033]8;;\033\\\n' "$ISSUE_URL" "$ISSUE_URL"

    exit 1
else
    if [ ! -f "$HOME/.config/wave2fa/disable-donation-message" ] && [ $(( RANDOM % 100 )) -lt 5 ]; then
        printf "${GREEN}Hey friend! 🙂\n"
        printf "wave2fa is completely open source and made with ❤️ for everyone.\n"
        printf "If you’re enjoying it and want to help keep it growing, consider donating today & starring the repo!\n${RESET}"
    fi
fi

rm -f "$LOG_FILE"