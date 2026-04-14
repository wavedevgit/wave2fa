// probably fix bun issue
// @ts-ignore
import _linux from '../node_modules/blessed/usr/linux' with { type: 'file' };
// @ts-ignore
import _windowsAnsi from '../node_modules/blessed/usr/windows-ansi' with { type: 'file' };
// @ts-ignore
import _xterm from '../node_modules/blessed/usr/xterm' with { type: 'file' };
// @ts-ignore
import _xterm256 from '../node_modules/blessed/usr/xterm-256color' with { type: 'file' };
// @ts-ignore
import _xtermCap from '../node_modules/blessed/usr/xterm.termcap' with { type: 'file' };
// @ts-ignore
import _xtermInfo from '../node_modules/blessed/usr/xterm.terminfo' with { type: 'file' };

(void _linux, _windowsAnsi, _xterm, _xterm256, _xtermCap, _xtermInfo);
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
import { homeConfigPath } from './utils/storage.js';
import { buildStyle } from './utils/styles.js';
import enableLogger from './errorLogger.js';

if (process.argv.includes('--version')) {
    console.log(`Wave2fa ${VERSION} (${GIT_HASH})`);
    process.exit(0);
}

saveRun();

await fs.mkdir(homeConfigPath, { recursive: true });

await enableLogger();
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

console.log(blessed.screen);
const screen = blessed.screen({
    smartCSR: true,
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
