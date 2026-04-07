import blessed, { Widgets } from 'blessed';
import clearScreen from '../utils/clearScreen.js';
import { addItem, validatePath } from '../utils/storage.js';
import crypto from 'node:crypto';
import { readInputAsync } from '../utils/inputs.js';
import path from 'node:path';
import { parseUri, scanQrCode } from '../utils/qrcode.js';
import { isValidSecret } from '../utils/otp.js';
import { initHomeScreen } from './home.js';
import { TotpItem } from '../types.js';

async function initAddSecretQrCodeScreen(screen: Widgets.Screen) {
    clearScreen(screen);
    const box = blessed.box({
        tags: true,
        top: 'center',
        width: '100%',
        align: 'center',
        height: 3,
        parent: screen,
    });
    const input = blessed.textbox({
        top: 'center',
        width: '100%',
        height: 3,
        valign: 'middle',
        align: 'center',
        label: 'Enter QR image path ',
        border: { type: 'line' },
        style: { border: { fg: 'magenta' } },
        parent: screen,
    });

    const filePath = await readInputAsync(input);

    if (!(await validatePath(filePath))) {
        box.setContent('File not found.');
        input.destroy();
        screen.render();
        screen.onceKey('enter', () => {
            box.destroy();
            screen.render();
            initHomeScreen(screen);
        });
        return;
    }
    if (
        !['.png', '.jpg', '.jpeg', '.webp'].includes(
            path.extname(filePath).toLowerCase(),
        )
    ) {
        box.setContent(
            'File extension is not .png,.jpg,.jpeg,.webp (not an image)',
        );
        input.destroy();
        screen.render();
        screen.onceKey('enter', () => {
            box.destroy();
            screen.render();
            initHomeScreen(screen);
        });
        return;
    }

    let res;
    try {
        res = await scanQrCode(filePath);
    } catch (err) {
        box.setContent("Couldn't parse image: " + err);
        input.destroy();
        screen.render();
        screen.onceKey('enter', () => {
            box.destroy();
            screen.render();
            initHomeScreen(screen);
        });
        return;
    }

    const values = parseUri(res);

    if ('err' in values) {
        box.setContent(values.err);
        input.destroy();
        screen.render();
        return;
    }
    // @ts-ignore
    screen.leave();

    // @ts-ignore
    values.uuid = crypto.randomUUID();

    if (!(await isValidSecret(values.secret))) {
        box.setContent('Invalid base32 secret...');
        input.destroy();
        screen.render();
        screen.onceKey('enter', () => {
            box.destroy();
            screen.render();
            initHomeScreen(screen);
        });
        return;
    }

    await addItem(values as TotpItem);

    box.setContent('{bold}✓{/bold} Succesfuly added!');
    input.destroy();
    screen.render();
    screen.onceKey('enter', () => {
        box.destroy();
        screen.render();
        initHomeScreen(screen);
    });
}
export { initAddSecretQrCodeScreen };
