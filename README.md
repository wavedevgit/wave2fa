# wave2fa

A lightweight 2fa authenticator in terminal ui.

## How to install:

1. make sure you have node installed
2. run this command

```sh
# currently there is only installer for linux
curl -s https://raw.githubusercontent.com/wavedevgit/wave2fa/main/scripts/install.sh | sh
# then run it:
wave2fa

# for windows, there is currently no installer, you can however run wave2fa using:

# make a new folder where you'll put wave2fa
# then download bundle.cjs from https://github.com/wavedevgit/wave2fa/releases
# and put it there
echo [] > "%USERPROFILE%\_data.json"
npm init -y
npm i blessed # install blessed if not installed
node bundle.cjs # download it from https://github.com/wavedevgit/wave2fa/releases
```

## Contributing

1. If you want to contribute, you can and I would love if you did!
2. Add new features to Wave2fa or fix bugs.
3. Please avoid contributing with vibe coded slop or ai code.

Made with ❤️ by @wavedevgit
