import blessed from 'blessed';
import clearScreen from '../utils/clearScreen.ts';
import { roundedBorder } from '../utils/roundedBorder.ts';
import { buildStyle } from '../utils/styles.ts';
import { screen } from '../main.ts';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function initPleaseWait() {
    clearScreen(screen);

    const messages = [
        'Linux is cool.',
        'Wave2FA is still doing its job.',
        'You can never have enough tuis :)',
        'Rendering pixels with questionable intent...',
        'Talking to the kernel politely...',
        'Compiling vibes...',
    ];

    let msgIndex = Math.floor(Math.random() * messages.length);
    let dots = 0;

    const box = blessed.box({
        top: 'center',
        left: 'center',

        height: 7,

        tags: true,
        align: 'center',
        valign: 'middle',

        padding: {
            top: 1,
            bottom: 1,
            left: 2,
            right: 2,
        },

        border: 'bg',

        style: await buildStyle({}, 'pleasewait'),
    });

    const title = blessed.text({
        parent: box,
        top: 0,
        left: 'center',
        content: '{bold}Initializing{/bold}',
        tags: true,
        style: {
            fg: 'white',
        },
    });

    const content = blessed.text({
        parent: box,
        top: 2,
        left: 'center',
        tags: true,
        content: '',
        width: '100%',
        style: {
            fg: 'gray',
        },
    });

    screen.append(box);

    let running = true;

    (box as any).cleanup = () => {
        running = false;
        box.destroy();
        screen.render();
    };
    (async () => {
        while (running) {
            dots = (dots + 1) % 4;

            if (Math.random() < 0.2) {
                msgIndex = Math.floor(Math.random() * messages.length);
            }

            content.setContent(
                `Loading${'.'.repeat(dots)}\n${messages[msgIndex]}`,
            );

            screen.render();
            await sleep(450);
        }
    })();
}

export { initPleaseWait };
