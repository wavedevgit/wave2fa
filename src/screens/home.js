import blessed from 'blessed';
import clearScreen from '../utils/clearScreen.js';
import { generate, generateSecret } from 'otplib';
import { getKeys } from '../utils/storage.js';

function getSecondsLeft(step) {
    const epoch = Math.floor(Date.now() / 1000);
    return step - (epoch % step);
}

/**
 *
 * @param {blessed.Widgets.Screen} screen
 */
async function initHomeScreen(screen) {
    clearScreen(screen);
    const main = blessed.box({
        top: 'center',
        padding: {
            left: 1,
            right: 1,
        },
        focusable: true,
        scrollable: true,
        alwaysScroll: true,
        mouse: true,
        keys: true,
        content: '',
        border: 'line',
        style: {
            border: { fg: 'magenta' },
        },
    });
    main.focus();
    let cache = {};
    const keys = await getKeys();

    const generateContent = () => {
        let content = '';
        for (let item of keys) {
            content += `${item.name} - ${cache[item.uuid]}    ${getSecondsLeft(item.period)}s\n`;
        }
        return content;
    };

    const updateContent = () => {
        main.setContent(generateContent());
        screen.render();
    };
    const updateSecrets = async (period) => {
        for (let item of keys.filter((item) => item.period === period)) {
            cache[item.uuid] = await generate({
                digits: item.digits || 6,
                period: period,
                secret: item.secret,
            });
        }
    };

    await updateSecrets(30);
    await updateSecrets(60);
    updateContent();
    setInterval(() => updateSecrets(30), 30 * 1e3);

    setTimeout(
        () => {
            updateSecrets(30);

            setInterval(() => updateSecrets(30), 30 * 1000);
        },
        getSecondsLeft(30) * 1e3,
    );
    setTimeout(
        () => {
            updateSecrets(60);

            setInterval(() => updateSecrets(60), 60 * 1000);
        },
        getSecondsLeft(60) * 1e3,
    );
    setInterval(updateContent, 1 * 1e3);

    screen.append(main);
    screen.render();
}
export { initHomeScreen };
