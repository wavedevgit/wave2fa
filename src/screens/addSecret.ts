import blessed, { Widgets } from 'blessed';
import clearScreen from '../utils/clearScreen.js';
import { addItem } from '../utils/storage.js';
import crypto from 'node:crypto';
import { readInputAsync } from '../utils/inputs.js';
import { isValidSecret, normalizeBase32 } from '../utils/otp.js';
import { initHomeScreen } from './home.js';
import { TotpItem } from '../types.js';
import { roundedBorder } from '../utils/roundedBorder.js';
import { buildStyle } from '../utils/styles.js';
import { screen } from '../main.js';

async function initAddSecretScreen() {
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
        left: 'center',
        width: '50%',
        height: 3,
        border: roundedBorder,
        label: '  ',
        style: await buildStyle({ border: { fg: 'input' } }, 'addSecret.input'),
        censor: false,
    });

    const values: TotpItem = {
        // default to 30s period and 6 digits and SHA1
        // if needed to be changed, use import from qr code
        date: Date.now(),
        period: 30,
        digits: 6,
        algorithm: 'SHA1',
        name: 'null',
        secret: 'null',
        uuid: 'null',
    };

    screen.append(input);
    screen.render();
    input.setLabel('Enter entry name:');
    screen.render();
    values.name = await readInputAsync(input);

    input.clearValue();
    input.setLabel('Enter entry secret:');
    input.censor = true;
    screen.render();
    const secret = await readInputAsync(input);
    values.secret = normalizeBase32(secret || '');
    values.uuid = crypto.randomUUID();

    if (!(await isValidSecret(values.secret))) {
        input.destroy();
        box.setContent('Invalid base32 secret...');
        screen.render();
        screen.onceKey('enter', () => {
            box.destroy();
            screen.render();
            initHomeScreen();
        });
        return;
    }

    await addItem(values);
    input.destroy();

    box.setContent('{bold}✓{/bold} Succesfuly added!');
    screen.render();
    screen.onceKey('enter', () => {
        box.destroy();
        screen.render();
        initHomeScreen();
    });
}
export { initAddSecretScreen };
