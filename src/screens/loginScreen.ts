import blessed, { Widgets } from 'blessed';
import clearScreen from '../utils/clearScreen.ts';
import { readInputAsync } from '../utils/inputs.ts';
import { initHomeScreen } from './home.ts';
import {
    checkPasswordStrength,
    passwordStore,
    saveWithPassword,
    verifyPassword,
} from '../utils/storage.ts';
import { roundedBorder } from '../utils/roundedBorder.ts';
import { buildStyle } from '../utils/styles.ts';
import { screen } from '../main.ts';
import { initPleaseWait } from './pleaseWait.ts';

async function initLoginScreen() {
    clearScreen(screen);
    const box = blessed.box({
        tags: true,
        top: 'center',
        width: '100%',
        align: 'center',
        height: 9,
    });
    const input = blessed.textbox({
        top: 'center',
        left: 'center',
        width: '50%',
        height: 3,
        label: '  ',
        border: roundedBorder,
        style: await buildStyle({ border: { fg: 'input' } }, 'login.input'),
        censor: false,
    });

    screen.append(input);
    screen.render();
    input.setLabel('Enter password:');
    input.censor = true;
    screen.render();

    // this is ONLY meant for testing wave2fa, please do not put this in .bashrc or anything
    // it is very insecure and very easily hackable, that's why it's only usable on demo mode
    if (process.argv.includes('--demo'))
        passwordStore.setPassword(process.env.WAVE2FA_PASSWORD_INSECURE || '');

    if (passwordStore.getPassword() === '') {
        const inputPassword = await readInputAsync(input);
        if (inputPassword.length > 72) {
            box.setContent(
                '{red-fg}{bold}✗{/bold} Password too long (max 72 characters).{/red-fg} Press enter to retry!',
            );
            screen.render();
            screen.onceKey('enter', () => {
                box.destroy();
                screen.render();
                initLoginScreen();
            });
            return;
        }

        passwordStore.setPassword(inputPassword);
    }

    await initPleaseWait();
    const isValidPassword = await verifyPassword();
    clearScreen(screen);
    screen.append(box);

    if (!isValidPassword && isValidPassword !== undefined) {
        box.height = 3;
        box.setContent(
            '{red-fg}{bold}✗{/bold} Invalid password,{/red-fg} Press enter to retry!',
        );
        input.destroy();
        screen.render();
        screen.onceKey('enter', () => {
            passwordStore.setPassword('');
            box.destroy();
            screen.render();
            initLoginScreen();
        });
        return;
    }

    if (isValidPassword) {
        initHomeScreen();
        return;
    }

    const password = passwordStore.getPassword();

    if (!password) process.exit(0);

    let passwordStrength = checkPasswordStrength();

    // if password is invalid, and is valid password === undefined that means
    // password has been set (will be used)
    if (
        !isValidPassword &&
        isValidPassword === undefined &&
        passwordStrength.valid
    ) {
        input.setLabel('Confirm password:');
        input.clearValue();
        screen.render();
        const confirmPassword = await readInputAsync(input);

        if (confirmPassword !== passwordStore.getPassword()) {
            box.setContent(
                '{red-fg}{bold}✗{/bold} Passwords do not match.{/red-fg} Press enter to retry!',
            );
            screen.render();
            screen.onceKey('enter', () => {
                box.destroy();
                screen.render();
                initLoginScreen();
            });
            return;
        }

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
            initHomeScreen();
        });
        return;
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

        let text = `{bold} {red-fg}✗ Invalid Password! ✗{/red-fg} {/bold}\nYour password must contain the following:\n\n`;

        text += `{bold}At least{/bold} 8 characters: ${symbols[String(passwordStrength.reasons.chars_requirement)]}\n`;
        text += `Lowercase characters: ${symbols[String(passwordStrength.reasons.lowercase)]}\n`;
        text += `Uppercase characters: ${symbols[String(passwordStrength.reasons.uppercase)]}\n`;
        text += `Numbers: ${symbols[String(passwordStrength.reasons.numbers)]}\n`;
        text += `Special Characters: ${symbols[String(passwordStrength.reasons.special)]}\n`;

        box.setContent(text);
        screen.render();
        screen.onceKey('enter', () => {
            passwordStore.setPassword('');
            box.destroy();
            screen.render();
            initLoginScreen();
        });
        return;
    }
    if (
        (!isValidPassword && isValidPassword !== undefined) ||
        (isValidPassword !== undefined && !passwordStrength.valid)
    )
        return;
}
export { initLoginScreen };
