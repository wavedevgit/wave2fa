import blessed from 'blessed';
import clearScreen from '../utils/clearScreen.js';
import { parseUri } from '../utils/google.js';
import { readInputAsync } from '../utils/inputs.js';
import { addItem, validatePath } from '../utils/storage.js';
import { scanQrCode } from '../utils/qrcode.js';
import path from 'path';
import { initHomeScreen } from './home.js';
import { isValidSecret } from '../utils/otp.js';
import { randomUUID } from 'crypto';

/**
 *
 * @param {blessed.Widgets.Screen} screen
 */
async function initImportFromGoogleAuthScreen(screen) {
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
    values.forEach((value) => (value.uuid = randomUUID()));
    if (values?.err) {
        box.setContent(values.err);
        input.destroy();
        screen.render();
        screen.onceKey('enter', () => {
            box.destroy();
            screen.render();
            initHomeScreen(screen);
        });
        return;
    }
    screen.leave();

    if (values.some((item) => !isValidSecret(item.secret))) {
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

    for (const value of values) await addItem(value);

    box.setContent('{bold}✓{/bold} Succesfuly added!');
    input.destroy();
    screen.render();
    screen.onceKey('enter', () => {
        box.destroy();
        screen.render();
        initHomeScreen(screen);
    });
}
export { initImportFromGoogleAuthScreen };
