import blessed from 'blessed';
import clearScreen from '../utils/clearScreen.js';
import { readInputAsync } from '../utils/inputs.js';
import { initHomeScreen } from './home.js';
import { saveWithPassword, verifyPassword } from '../utils/storage.js';

/**
 *
 * @param {blessed.Widgets.Screen} screen
 */
async function initLoginScreen(screen) {
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
        parent: screen,
        top: 'center',
        left: 'center',
        width: '50%',
        height: 3,
        label: '  ',
        border: { type: 'line' },
        style: { border: { fg: 'magenta' } },
        censor: false,
    });

    screen.append(input);
    screen.render();
    input.setLabel('Enter password:');
    input.censor = true;
    screen.render();
    globalThis.password = await readInputAsync(input);

    const isValidPassword = await verifyPassword();
    if (!isValidPassword && isValidPassword !== undefined) {
        box.setContent(
            '{bold}✗{/bold} Invalid password, Press enter to retry!',
        );
        input.destroy();
        screen.render();
        screen.onceKey('enter', () => {
            box.destroy();
            screen.render();
            initLoginScreen(screen);
        });
    }

    if (isValidPassword) {
        initHomeScreen(screen);
        return;
    }

    if (!password) process.kill(0);

    let goodPassword =
        password?.length >= 8 &&
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]).{8,}$/.test(
            password,
        );

    if (!isValidPassword && isValidPassword === undefined && goodPassword) {
        input.destroy();
        await saveWithPassword();
        box.setContent('{bold}✓{/bold} Password set, Press enter to continue!');
        screen.render();
        screen.onceKey('enter', () => {
            box.destroy();
            screen.render();
            initHomeScreen(screen);
        });
    }

    if (!isValidPassword && isValidPassword === undefined && !goodPassword) {
        input.destroy();
        box.setContent(
            '{bold}✗{/bold} Password too short or insecure. Must be at least 8 characters and include uppercase, lowercase, numbers, and special characters. Press Enter to retry.',
        );
        screen.render();
        screen.onceKey('enter', () => {
            box.destroy();
            screen.render();
            initLoginScreen(screen);
        });
    }
    if (
        (!isValidPassword && isValidPassword !== undefined) ||
        (isValidPassword !== undefined && !goodPassword)
    )
        return;
}
export { initLoginScreen };
