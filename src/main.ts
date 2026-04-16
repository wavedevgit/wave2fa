import fs_sync from 'node:fs';
import path from 'node:path';

const realRead = fs_sync.readFileSync;

const TERMINFO_DIR =
    process.env.TERMINFO ||
    path.join(process.env.HOME || '', '.config/wave2fa/.terminfo');

// fix blessed terminfo thing
fs_sync.readFileSync = function (file: any, options: any): any {
    try {
        if (typeof file === 'string') {
            if (file.includes('node_modules/blessed/usr')) {
                const fixed = file.replace(
                    /node_modules\/blessed\/usr.*/,
                    path.join(TERMINFO_DIR, path.basename(file)),
                );

                return realRead.call(fs, fixed, options);
            }

            if (file.includes('/usr/') && file.includes('blessed')) {
                const fixed = path.join(TERMINFO_DIR, path.basename(file));

                return realRead.call(fs, fixed, options);
            }
        }

        return realRead.call(fs, file, options);
    } catch (e) {
        throw e;
    }
};
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
        style: await buildStyle(
            {
                border: { fg: 'versioninfo.border' },
            },
            'versioninfo',
        ),
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

        style: await buildStyle(
            {
                border: { fg: 'tips.border' },
            },
            'tips',
        ),
    }),
);

initLoginScreen();

checkForUpdates(screen);

screen.key(['q', 'C-c'], () => {
    screen.destroy();
    process.exit(0);
});

screen.key('h', () => {
    initHelpScreen();
});

screen.key('m', () => {
    initHomeScreen();
});
screen.key('n', () => {
    initAddSecretScreen();
});
screen.key('e', () => {
    initAddSecretQrCodeScreen();
});
screen.key('t', () => {
    initImportFromGoogleAuthScreen();
});

screen.render();

export { screen };
