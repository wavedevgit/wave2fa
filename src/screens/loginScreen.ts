import blessed, { Widgets } from 'blessed';
import clearScreen from '../utils/clearScreen.js';
import { readInputAsync } from '../utils/inputs.js';
import { initHomeScreen } from './home.js';
import {
    checkPasswordStrength,
    passwordStore,
    saveWithPassword,
    verifyPassword,
} from '../utils/storage.js';
import { getArg } from '../utils/cli.js';
import { roundedBorder } from '../utils/roundedBorder.js';
import { buildStyle } from '../utils/styles.js';

async function initLoginScreen(screen: Widgets.Screen) {
    clearScreen(screen);
    const box = blessed.box({
        tags: true,
        top: 'center',
        width: '100%',
        align: 'center',
        height: 9,
        parent: screen,
    });
    const input = blessed.textbox({
        parent: screen,
        top: 'center',
        left: 'center',
        width: '50%',
        height: 3,
        label: '  ',
        border: roundedBorder,
        style: await buildStyle({ border: { fg: 'input' } }),
        censor: false,
    });

    screen.append(input);
    screen.render();
    input.setLabel('Enter password:');
    input.censor = true;
    screen.render();

    // this is ONLY meant for testing wave2fa, please do not put this in .bashrc or anything
    // it is very insecure and very easily hackable, that's why only its only useable on demo mode
    if (process.argv.includes('--demo'))
        passwordStore.setPassword(
            getArg('password') || process.env.WAVE2FA_PASSWORD_INSECURE || '',
        );
    if (passwordStore.getPassword() === '')
        passwordStore.setPassword(await readInputAsync(input));

    const isValidPassword = await verifyPassword();
    if (!isValidPassword && isValidPassword !== undefined) {
        box.height = 3;
        box.setContent(
            '{red-fg}{bold}✗{/bold} Invalid password,{/red-fg} Press enter to retry!',
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

    const password = passwordStore.getPassword();

    if (!password) process.kill(0);

    let passwordStrength = checkPasswordStrength();

    // if password is invalid, and is valid apssword === undefined that means
    // password has been set (will be used)
    if (
        !isValidPassword &&
        isValidPassword === undefined &&
        passwordStrength.valid
    ) {
        box.height = 3;
        input.destroy();
        await saveWithPassword();
        box.setContent(
            '{green-fg}{bold}✓{/bold} Password set,{/green-fg} Press enter to continue!',
        );
        screen.render();
        screen.onceKey('enter', () => {
            box.destroy();
            screen.render();
            initHomeScreen(screen);
        });
    }

    if (
        !isValidPassword &&
        isValidPassword === undefined &&
        !passwordStrength.valid
    ) {
        const symbols: Record<string, string> = {
            true: '{bold}{red-fg}✗{/red-fg}{/bold}',
            false: '{bold}{green-fg}✔{/green-fg}{/bold}',
        };

        box.height = 9;
        input.destroy();

        let text = `{bold} {red-fg}✗ Invalid Password! ✗{/red-fg} {/bold}\nYour password contents {bold}must{/bold} include the following:\n\n`;

        text += `{bold}At least{/bold} 8 characters: ${symbols[String(passwordStrength.reasons.chars_requirement)]}\n`;
        text += `Lowercase characters: ${symbols[String(passwordStrength.reasons.lowercase)]}\n`;
        text += `Uppercase characters: ${symbols[String(passwordStrength.reasons.uppercase)]}\n`;
        text += `Numbers: ${symbols[String(passwordStrength.reasons.numbers)]}\n`;
        text += `Special Characters: ${symbols[String(passwordStrength.reasons.special)]}\n`;

        box.setContent(text);

        screen.render();
        screen.onceKey('enter', () => {
            box.destroy();
            screen.render();
            initLoginScreen(screen);
        });
    }
    if (
        (!isValidPassword && isValidPassword !== undefined) ||
        (isValidPassword !== undefined && !passwordStrength.valid)
    )
        return;
}
export { initLoginScreen };
