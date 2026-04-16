import blessed, { Widgets } from 'blessed';
import clearScreen from '../utils/clearScreen.js';
import { parseUri } from '../utils/google.js';
import { readInputAsync } from '../utils/inputs.js';
import { addItem, validatePath } from '../utils/storage.js';
import { scanQrCode } from '../utils/qrcode.js';
import path from 'path';
import os from 'os';
import { initHomeScreen } from './home.js';
import { isValidSecret } from '../utils/otp.js';
import { roundedBorder } from '../utils/roundedBorder.js';
import { buildStyle } from '../utils/styles.js';
import { screen } from '../main.js';

async function initImportFromGoogleAuthScreen() {
    clearScreen(screen);
    const box = blessed.box({
        tags: true,
        top: 'center',
        width: '100%',
        align: 'center',
        height: 3,
    });
    const input = blessed.textbox({
        top: 'center',
        width: '100%',
        height: 3,
        valign: 'middle',
        align: 'center',
        label: 'Enter QR image path ',
        border: roundedBorder,
        style: await buildStyle({ border: { fg: 'input' } }, 'importga.input'),
    });

    let filePath = await readInputAsync(input);
    if (filePath.startsWith('~'))
        filePath = filePath.replace('~', os.homedir());

    if (!(await validatePath(filePath))) {
        box.setContent(
            `{red-fg} ! File {bold}not found:{/bold}{/red-fg} (${filePath})\n\n Press {bold}ENTER{/bold} to continue.`,
        );
        input.destroy();
        screen.render();
        screen.onceKey('enter', () => {
            box.destroy();
            screen.render();
            initHomeScreen();
        });
        return;
    }

    if (
        !['.png', '.jpg', '.jpeg', '.webp'].includes(
            path.extname(filePath).toLowerCase(),
        )
    ) {
        box.setContent(
            '{red-fg} File extension is not {bold}.png,.jpg,.jpeg,.webp (not an image){bold} {red-fg}\n\n Press {bold}ENTER{/bold} to continue.',
        );
        input.destroy();
        screen.render();
        screen.onceKey('enter', () => {
            box.destroy();
            screen.render();
            initHomeScreen();
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
            initHomeScreen();
        });
        return;
    }

    if (typeof res === 'object' && 'err' in res) {
        box.setContent(res.err);
        input.destroy();
        screen.render();
        screen.onceKey('enter', () => {
            box.destroy();
            screen.render();
            initHomeScreen();
        });
        return;
    }
    const values = parseUri(res);
    if ('err' in values) {
        box.setContent(values.err);
        input.destroy();
        screen.render();
        screen.onceKey('enter', () => {
            box.destroy();
            screen.render();
            initHomeScreen();
        });
        return;
    }
    if (values.some((item) => !isValidSecret(item.secret))) {
        box.setContent('Invalid base32 secret...');
        input.destroy();
        screen.render();
        screen.onceKey('enter', () => {
            box.destroy();
            screen.render();
            initHomeScreen();
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
        initHomeScreen();
    });
}
export { initImportFromGoogleAuthScreen };
