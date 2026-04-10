import blessed, { Widgets } from 'blessed';
import clearScreen from '../utils/clearScreen.js';
import { readInputAsync } from '../utils/inputs.js';
import { initHomeScreen } from './home.js';
import { saveWithPassword, verifyPassword } from '../utils/storage.js';

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
        border: { type: 'line' },
        style: { border: { fg: 'magenta' } },
        censor: false,
    });

    screen.append(input);
    screen.render();
    input.setLabel('Enter password:');
    input.censor = true;
    screen.render();
    globalThis.password = (
        process.argv.includes('--password')
            ? process.argv[process.argv.indexOf('--password') + 1]
            : process.argv.find((a) => a.startsWith('--password='))?.split('=')[1]
    ) as string;
    globalThis.password ??= await readInputAsync(input);

    const isValidPassword = await verifyPassword();
    if (!isValidPassword && isValidPassword !== undefined) {
        box.setContent('{red-fg}{bold}✗{/bold} Invalid password,{/red-fg} Press enter to retry!');
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

    if (!isValidPassword && isValidPassword === undefined && !goodPassword) {
        let reasons = {
            chars_requirement: false, // true = doesnt have requirement, false means we can proceed
            uppercase: false,
            lowercase: false,
            numbers: false,
            special: false,
        };

        const symbols = {
            true: '{bold}{red-fg}✗{/red-fg}{/bold}',
            false: '{bold}{green-fg}✔{/green-fg}{/bold}',
        };

        if (password?.length < 8) reasons.chars_requirement = true; // break down regex part by part
        if (!password?.match(/[a-z]/)) reasons.lowercase = true;
        if (!password?.match(/[A-Z]/)) reasons.uppercase = true;
        if (!password.match(/[0-9]/)) reasons.numbers = true;
        if (!password.match(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/)) reasons.special = true;

        input.destroy();

        let text = `{bold} {red-fg}✗ Invalid Password! ✗{/red-fg} {/bold}\nYour password contents {bold}must{/bold} include the following:\n\n`;

        text += `{bold}At least{/bold} 8 characters: ${reasons.chars_requirement ? symbols.true : symbols.false} \n`;
        text += `Lowercase characters: ${reasons.lowercase ? symbols.true : symbols.false} \n`;
        text += `Uppercase characters: ${reasons.uppercase ? symbols.true : symbols.false} \n`;
        text += `Numbers: ${reasons.numbers ? symbols.true : symbols.false} \n`;
        text += `Special Characters: ${reasons.special ? symbols.true : symbols.false} \n`;

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
        (isValidPassword !== undefined && !goodPassword)
    )
        return;
}
export { initLoginScreen };
