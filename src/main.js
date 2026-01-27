import blessed from 'blessed';
import { initHelpScreen } from './screens/help.js';
import { initHomeScreen } from './screens/home.js';
import { initAddSecretScreen } from './screens/addSecret.js';
import { initImportFromGoogleAuthScreen } from './screens/importFromGoogleAuth.js';
import { initAddSecretQrCodeScreen } from './screens/addSecretQrCode.js';
import GIT_HASH from './gitHash.js';

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
            '{bold}Wave2FA{/bold} - V1.0.0 ({bold}' + GIT_HASH + '{/bold})',
        tags: true,
        align: 'center',
        border: {
            type: 'line',
        },
        style: {
            border: { fg: 'blue' },
        },
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
        border: {
            type: 'line',
            bold: true,
        },
        style: {
            border: { fg: 'cyan' },
        },
    }),
);

initHomeScreen(screen);

screen.key(['q', 'C-c'], () => process.exit(0));

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
