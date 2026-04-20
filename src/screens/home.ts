import blessed, { Widgets } from 'blessed';
import clearScreen from '../utils/clearScreen.ts';
import { getKeys, migrateDataToV2 } from '../utils/storage.ts';
import * as speakeasy from 'speakeasy';
import { isTruthy } from '../utils/cli.ts';
import clipboardy from 'clipboardy';
import { toast } from '../utils/toast.ts';
import { TotpItem } from '../types.ts';
import type { Algorithm as SpeakeasyAlgorithm } from 'speakeasy';
import { roundedBorder } from '../utils/roundedBorder.ts';
import { buildStyle } from '../utils/styles.ts';
import { screen } from '../main.ts';
import { log } from '../errorLogger.ts';
import { initPleaseWait } from './pleaseWait.ts';

function getSecondsLeft(step: number) {
    const epoch = Math.floor(Date.now() / 1000);
    return step - (epoch % step);
}

function shouldRedactInfo() {
    return (
        isTruthy(process.env?.WAVE2FA_DEMO) || process.argv.includes('--demo')
    );
}

async function initHomeScreen() {
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

        border: roundedBorder,
        style: await buildStyle(
            {
                border: { fg: 'home.list.border' },
                selected: { bg: 'home.list.selected' },
            },
            'home.list',
        ),
    });

    main.focus();
    let cache: Record<string, string> = {};
    await initPleaseWait();
    const keys = await getKeys<TotpItem>();
    clearScreen(screen);
    if (keys.some((item) => item.version !== 2)) {
        await migrateDataToV2();

        // nextTick is for waiting for next render
        process.nextTick(() => {
            toast(
                '{bold}{green-fg}✓ Migrated data to more secure encryption method.{green-fg}{bold}',
                screen,
            );
            screen.render();
        });
    }
    const updateContent = () => {
        const redactInfo = shouldRedactInfo();
        const items = keys.map((item) =>
            redactInfo
                ? `${
                      item.name.slice(0, 3) +
                      '*'.repeat(item.name.slice(3).length)
                  } - ${cache[item.uuid]} ${getSecondsLeft(item.period)}s`
                : `${item.name} - ${cache[item.uuid]} ${getSecondsLeft(item.period)}s`,
        );
        main.setItems(items);
        screen.render();
    };
    const updateSecrets = async (period: number) => {
        for (let item of keys
            .filter((item: TotpItem) => item.period === period)
            .sort((a, b) => (b.date ?? -Infinity) - (a.date ?? -Infinity))) {
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

    const intervalIds: NodeJS.Timeout[] = [];

    await updateSecrets(30);
    await updateSecrets(60);
    updateContent();

    setTimeout(
        () => {
            updateSecrets(30);
            intervalIds.push(setInterval(() => updateSecrets(30), 30 * 1000));
        },
        getSecondsLeft(30) * 1e3,
    );
    setTimeout(
        () => {
            updateSecrets(60);
            intervalIds.push(setInterval(() => updateSecrets(60), 60 * 1000));
        },
        getSecondsLeft(60) * 1e3,
    );
    intervalIds.push(setInterval(updateContent, 1 * 1e3));

    screen.on('destroy', () => {
        for (const id of intervalIds) {
            clearInterval(id);
        }
    });

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
