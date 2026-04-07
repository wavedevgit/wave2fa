import blessed, { Widgets } from 'blessed';
import clearScreen from '../utils/clearScreen.js';
import { getKeys } from '../utils/storage.js';
import * as speakeasy from 'speakeasy';
import { isTruthy } from '../utils/env.js';
import clipboardy from 'clipboardy';
import { toast } from '../utils/toast.js';
import { TotpItem } from '../types.js';
import type { Algorithm as SpeakeasyAlgorithm } from 'speakeasy';

function getSecondsLeft(step: number) {
    const epoch = Math.floor(Date.now() / 1000);
    return step - (epoch % step);
}

function shouldRedactInfo() {
    return (
        isTruthy(process.env?.WAVE2FA_DEMO) || process.argv.includes('--demo')
    );
}

async function initHomeScreen(screen: Widgets.Screen) {
    clearScreen(screen);

    const main = blessed.list({
        top: 'center',
        padding: {
            left: 1,
            right: 1,
        },
        focusable: true,
        scrollable: true,
        alwaysScroll: true,
        mouse: true,
        vi: true,
        keys: true,
        content: '',
        border: 'line',
        style: {
            border: { fg: 'magenta' },
            selected: { bg: 'blue' },
        },
    });
    main.focus();
    let cache: Record<string, string> = {};
    const keys = await getKeys<TotpItem>();

    const updateContent = () => {
        const redactInfo = shouldRedactInfo();
        const items = keys.map((item) =>
            redactInfo
                ? `${
                      item.name.slice(0, 3) +
                      '*'.repeat(item.name.slice(3).length)
                  } - ${cache[item.uuid]} ${getSecondsLeft(item.period)}s`
                : `${item.name} - ${cache[item.uuid]} ${getSecondsLeft(
                      item.period,
                  )}s`,
        );
        main.setItems(items);
        screen.render();
    };
    const updateSecrets = async (period: number) => {
        for (let item of keys.filter(
            (item: TotpItem) => item.period === period,
        )) {
            cache[item.uuid] = await speakeasy.totp({
                digits: item.digits || 6,
                step: period,
                algorithm: (item.algorithm?.toLowerCase() ||
                    'sha1') as SpeakeasyAlgorithm,
                secret: item.secret,
                encoding: 'base32',
            });
        }
    };

    await updateSecrets(30);
    await updateSecrets(60);
    updateContent();
    setInterval(() => updateSecrets(30), 30 * 1e3);

    setTimeout(() => {
        updateSecrets(30);

        setInterval(() => updateSecrets(30), 30 * 1000);
    }, getSecondsLeft(30) * 1e3);
    setTimeout(() => {
        updateSecrets(60);

        setInterval(() => updateSecrets(60), 60 * 1000);
    }, getSecondsLeft(60) * 1e3);
    setInterval(updateContent, 1 * 1e3);

    main.on('select', (item, index) => {
        const code = cache[keys[index].uuid];
        clipboardy.writeSync(code);
        toast(`{bold}{green-fg}✓ Copied ${code}!{green-fg}{bold}`, screen);
    });
    main.key('enter', () => {
        // @ts-ignore
        const index = main.selected;
        const code = cache[keys[index].uuid];
        clipboardy.writeSync(code);
        toast(`{bold}{green-fg}✓ Copied ${code}!{green-fg}{bold}`, screen);
    });

    screen.append(main);
    screen.render();
}
export { initHomeScreen };
