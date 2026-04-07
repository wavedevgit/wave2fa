import blessed, { Widgets } from 'blessed';
import clearScreen from './clearScreen.js';

export function toast(message: string, screen: Widgets.Screen) {
    const toastBox = blessed.box({
        top: 'center',
        left: 'center',
        width: 'shrink',
        height: 'shrink',
        valign: 'middle',
        padding: {
            left: 1,
            right: 1,
        },
        content: message,
        tags: true,
        border: 'line',
        style: {
            border: { fg: 'magenta' },
        },
    });

    screen.append(toastBox);
    screen.render();

    setTimeout(() => {
        toastBox.destroy();
        screen.render();
    }, 2000);
}
