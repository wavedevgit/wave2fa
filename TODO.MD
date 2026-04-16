# Product gaps to fix first

- [x] No binary releases (bug fix with blessed not compiling)
    - [ ] Publish to npm (`npx wave2fa`) (fucking hard)
    - [x] Create GitHub releases (custom repo) with prebuilt binaries using (same as first): `bun build --compile`

- [ ] No screenshot/demo GIF in README
    - [ ] Record demo using vhs or asciinema

- [x] Encrypted storage
    - [x] Add password-derived key
    - [x] Use argon2 + AES-GCM
    - [x] auto migration
- [ ] Change data directory to something less senstive

- [x] add md5 to info.json for aur repo
- [x] fix binary
- [x] fix invalid password repeating message on login screen
- [x] add runner logic to main.ts instead of having a runner
- [x] Fix error logger

# Awesome features:

- [ ] Add automatic secret copier/sorter detector by taking text in screen using os apis
- [ ] Add clipboard support to importer from qr code & google auth
- [ ] Add support to automatic take from google auth using api (reverse enginnering required)

---

# Modules:

- [x] Add custom border support
    - [x] tr
    - [x] v
    - [x] h
    - [x] tl
    - [x] br
    - [x] bl
- [x] Fix not running when compiled/bundled

---

# Distribution (biggest lever)

- [ ] Publish to npm (`npx wave2fa`)
- [ ] Homebrew tap (`brew install wavedevgit/tap/wave2fa`)
- [ ] AUR package

# AI ISSUES:

## HIGH (8)

- [ ] Password stored in plain memory without cleanup (`src/stores/password.ts`)
- [ ] No maximum password length validation (`src/screens/loginScreen.ts:49-50`)
- [ ] Empty catch blocks swallowing errors (`src/errorLogger.ts:50,55,61`)
- [ ] Regex catastrophic backtracking potential (`src/utils/storage.ts:69-72`)
- [x] Duplicate interval creation - 2 intervals for same function (`src/screens/home.ts:92-110`)
- [x] No interval cleanup when leaving home screen (`src/screens/home.ts`)
- [x] No backup before encryption/migration (`src/utils/storage.ts:219,232`)
- [ ] Known vulnerable dependency: `tunnel-agent` (CVE-2018-1000622) (unused)

## MEDIUM (13)

- [ ] Unreachable code after throw (`src/utils/otp.ts:19-22`)
- [ ] Toast memory leak potential (`src/utils/toast.ts:26-29`)
- [ ] No path traversal validation (`src/screens/addSecretQrCode.ts:37-39`)
- [ ] Silent failure on empty QR secret (`src/utils/qrcode.ts:40`)
- [ ] Deprecated crypto functions (`src/utils/storage.ts:120,153,162`)
- [ ] Multiple `any` types bypass type checking
- [ ] Config JSON parsing without try-catch (`src/stores/config.ts:50`)
- [ ] Buffer shim bypasses security (`src/main.ts:64-77`)
- [ ] Missing tests for critical paths
- [ ] URL construction with malformed template (`src/updater.ts:8-9`)

## LOW (9)

- [ ] Inconsistent error object handling (`src/utils/google.ts:123-124`)
- [ ] Duplicate code in screen files
- [ ] No retry logic for update check (`src/updater.ts`)
- [ ] Config load not idempotent (`src/stores/config.ts:45-52`)

- [x] No package version pinning
