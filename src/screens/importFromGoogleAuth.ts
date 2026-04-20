import blessed, { Widgets } from 'blessed';
import clearScreen from '../utils/clearScreen.ts';
import { parseUri } from '../utils/google.ts';
import { readInputAsync } from '../utils/inputs.ts';
import { addItem, validatePath } from '../utils/storage.ts';
import { scanQrCode } from '../utils/qrcode.ts';
import path from 'path';
import os from 'os';
import { initHomeScreen } from './home.ts';
import { isValidSecret } from '../utils/otp.ts';
import { roundedBorder } from '../utils/roundedBorder.ts';
import { buildStyle } from '../utils/styles.ts';
import { screen } from '../main.ts';
import { initPleaseWait } from './pleaseWait.ts';

async function initImportFromGoogleAuthScreen() {
    clearScreen(screen);
    const box = blessed.box({
        parent: screen,
        tags: true,
        top: 'center',
        width: '100%',
        align: 'center',
        height: 3,
    });
    const input = blessed.textbox({
        parent: screen,

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

    input.destroy();

    await initPleaseWait();
    for (const value of values) await addItem(value);

    clearScreen(screen);
    box.setContent('{bold}✓{/bold} Succesfuly added!');
    screen.append(box);
    screen.render();
    screen.onceKey('enter', () => {
        box.destroy();
        screen.render();
        initHomeScreen();
    });
}
export { initImportFromGoogleAuthScreen };
