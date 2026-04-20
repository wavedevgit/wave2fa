import blessed, { Widgets } from 'blessed';
import clearScreen from './clearScreen.ts';
import { roundedBorder, roundedBorderBg } from './roundedBorder.ts';
import { buildStyle } from './styles.ts';

export async function toast(message: string, screen: Widgets.Screen) {
    const toastBox = blessed.box({
        top: 'center',
        left: 'center',
        width: 'shrink',
        height: 'shrink',
        valign: 'middle',
        padding: {
            left: 2,
            right: 2,
        },
        content: message,
        tags: true,
        border: roundedBorder,
        style: await buildStyle(
            {
                border: { fg: 'toast.border' },
            },
            'toast',
        ),
    });

    screen.append(toastBox);
    screen.render();

    setTimeout(() => {
        toastBox.destroy();
        screen.render();
    }, 2000);
}
