<p align="center" style="padding-top: 12px; padding-bottom: 8px;">
  <img src="assets/wave2fa_no_bg.png" width="250" />
</p>
<p align="center" style="padding-bottom: 10px;">
  <strong>a lightweight 2fa authenticator in terminal ui.</strong>
</p>
<p align="center" style="margin-bottom: 20px;">
  <a href="#how-to-test-wave2fa">Test</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#benchmarks">Benchmarks</a>
</p>

<br><br>

## ⚠️ WARNING: wave2fa is still in very early development stages, please only test it and do not expect it to the best yet.

## ⚠️ NOTE: Development currently is happening under [development](https://github.com/wavedevgit/wave2fa/tree/development) branch.

## How to test wave2fa

1. make sure you have bun & git installed
2. run this command

```sh
# local test
git clone --depth=1 https://github.com/wavedevgit/wave2fa
git checkout development
cd wave2fa
# flag is important to patch blessed
bun install
bun run src/index.ts

# or install alpha (might have a lot of bugs, rerun to update to latest)
curl -fSS https://raw.githubusercontent.com/wavedevgit/wave2fa/refs/heads/development/scripts/install.sh | sh -s -- development
```

## Contributing

1. If you want to contribute, you can and I would love if you did!
2. Add new features to Wave2fa or fix bugs.
3. Please avoid contributing with vibe coded slop or ai code.

Made with ❤️ by @wavedevgit

## Benchmarks

Soon.

## Acknowledgements

- **Win8.1VMUser**
    - Provided benchmark data for Google Authenticator
    - Helped add & test Termux support

- **Library Maintainers**
    - Thanks to all maintainers of the libraries used in this project
