import blessed from 'blessed';
import { initHelpScreen } from './screens/help.js';
import { initHomeScreen } from './screens/home.js';
import { initAddSecretScreen } from './screens/addSecret.js';
import { initImportFromGoogleAuthScreen } from './screens/importFromGoogleAuth.js';
import { initAddSecretQrCodeScreen } from './screens/addSecretQrCode.js';
import { GIT_HASH, VERSION } from './gitHash.js';
import checkForUpdates from './updater.js';
import { initLoginScreen } from './screens/loginScreen.js';
import { saveRun } from './utils/lastRun.js';
import { roundedBorder } from './utils/roundedBorder.js';
import fs from 'fs/promises';
import path from 'path';
import { homeConfigPath } from './utils/storage.js';
import { buildStyle } from './utils/styles.js';

if (process.argv.includes('--version')) {
    console.log(`Wave2fa ${VERSION} (${GIT_HASH})`);
    process.exit(0);
}

saveRun();

const LOG_FILE = path.join(homeConfigPath, 'tmp_output.log');

await fs.mkdir(homeConfigPath, { recursive: true });
// errors logger
process.on('uncaughtException', async (err) => {
    await fs.writeFile(
        LOG_FILE,
        new Date().toLocaleString() +
            ' ' +
            (err.stack || err.toString()) +
            '\n',
        {
            flag: 'a',
        },
    );
    process.exit(1);
});

process.on('unhandledRejection', async (reason: any) => {
    await fs.writeFile(
        LOG_FILE,
        new Date().toLocaleString() +
            ' ' +
            (reason.stack || reason).toString() +
            '\n',
        {
            flag: 'a',
        },
    );
});

process.noDeprecation = true;

// shim buffer as some libs are using old Buffer()
const _Buffer = Buffer;
// @ts-ignore
function BufferShim(arg, encoding) {
    if (typeof arg === 'number') {
        return _Buffer.alloc(arg);
    }
    return _Buffer.from(arg, encoding);
}

Object.setPrototypeOf(BufferShim, _Buffer);
BufferShim.prototype = _Buffer.prototype;

// @ts-ignore
global.Buffer = BufferShim;

const screen = blessed.screen({
    smartCSR: true,
    // this is a bad idea, but it doesn't matter, it'll default to xterm hard code ansii chars
    tput: false as any,
    title: 'Wave2FA',
    _isBase: true,
});

screen.append(
    blessed.box({
        _isBase: true,
        top: 'top',
        height: 3,
        content:
            '{bold}Wave2FA{/bold} - V' +
            VERSION +
            ' ({bold}' +
            GIT_HASH +
            '{/bold})',
        tags: true,
        align: 'center',
        border: roundedBorder,
        style: await buildStyle({
            border: { fg: 'versioninfo.border' },
        }),
    }),
);
screen.append(
    blessed.box({
        _isBase: true,
        bottom: 0,
        height: 3,
        align: 'center',
        tags: true,
        content:
            'press {bold}q{/bold} to quit, press {bold}h{/bold} for help, press {bold}m{/bold} for home',
        border: roundedBorder,

        style: await buildStyle({
            border: { fg: 'tips.border' },
        }),
    }),
);

initLoginScreen(screen);

checkForUpdates(screen);

screen.key(['q', 'C-c'], () => {
    screen.destroy();
    process.exit(0);
});

screen.key('h', () => {
    initHelpScreen(screen);
});

screen.key('m', () => {
    initHomeScreen(screen);
});
screen.key('n', () => {
    initAddSecretScreen(screen);
});
screen.key('e', () => {
    initAddSecretQrCodeScreen(screen);
});
screen.key('t', () => {
    initImportFromGoogleAuthScreen(screen);
});

screen.render();
