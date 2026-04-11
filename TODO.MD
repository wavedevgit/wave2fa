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

```

```
