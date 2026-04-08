#!/bin/sh

APP_DIR="$HOME/.config/wave2fa"
BUNDLE="$APP_DIR/dist/bundle.js"
INFO_JSON="$APP_DIR/info.json"

RED='\033[31m'
GREEN='\033[32m'
CYAN='\033[36m'
RESET='\033[0m'

# urlencode using Bun
urlencode() {
    bun -e 'console.log(encodeURIComponent(process.argv.slice(1).join("")))' "$@"
}

# generate GitHub issue body using Bun
generate_issue_body() {
    bun -e 'const fs=require("fs");let info="No info.json found";try{info=fs.readFileSync("'"$INFO_JSON"'","utf8")}catch{}const output=process.argv[1];const esc=s=>s.replace(/`/g,"\\`").replace(/\$/g,"\\$");console.log(encodeURIComponent(`# Version info\n\`\`\`json\n${esc(info)}\n\`\`\`\n\n# Error\n\`\`\`text\n${esc(output)}\n\`\`\``));' "$1"
}

# Run bundle
OUTPUT=$(bun "$BUNDLE" 2>&1)
STATUS=$?

if [ "$STATUS" -ne 0 ]; then
    printf "${RED}wave2fa exited with error${RESET}\n\n"
    printf "%s\n\n" "$OUTPUT"

    # generate URL-encoded issue body via Bun
    BODY_ENC=$(generate_issue_body "$OUTPUT")
    ISSUE_URL="https://github.com/wavedevgit/wave2fa/issues/new?title=wave2fa+runtime+error&body=$BODY_ENC"

    printf "${CYAN}Open GitHub issue with the error (clickable in supported terminals):${RESET}\n"
    printf '\033]8;;%s\033\\%s\033]8;;\033\\\n' "$ISSUE_URL" "$ISSUE_URL"

    exit 1
else
    printf "${GREEN}Hey friend! 🙂\n"
    printf "wave2fa is completely open source and made with ❤️ for everyone.\n"
    printf "If you’re enjoying it and want to help keep it growing, consider donating today & starring the repo!\n${RESET}"
fi