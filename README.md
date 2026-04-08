# wave2fa

A lightweight 2fa authenticator in terminal ui.

## ⚠️ WARNING: wave2fa is still in very early development stages, please only test it and do not expect it to the best yet.

## How to test wave2fa:

1. make sure you have node & git installed
2. run this command

```sh
# local test
git clone --depth=1 https://github.com/wavedevgit/wave2fa
cd wave2fa
bun i
bun build:dev
bun dist/main.js
# or install alpha (might have a lot of bugs, rerun to update to latest)
curl -fSS https://raw.githubusercontent.com/wavedevgit/wave2fa/refs/heads/development/scripts/install.sh | sh -s -- development
```

## Contributing

1. If you want to contribute, you can and I would love if you did!
2. Add new features to Wave2fa or fix bugs.
3. Please avoid contributing with vibe coded slop or ai code.

Made with ❤️ by @wavedevgit
