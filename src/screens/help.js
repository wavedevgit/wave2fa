import blessed from 'blessed';
import clearScreen from '../utils/clearScreen.js';

/**
 *
 * @param {blessed.Widgets.Screen} screen
 */
function initHelpScreen(screen) {
    clearScreen(screen);
    const helpBox = blessed.box({
        top: 'center',
        left: 'center',
        width: 'shrink',
        height: 'shrink',
        valign: 'middle',
        padding: {
            left: 1,
            right: 1,
        },
        content: `{bold}Wave2FA Help:{/bold}\nPress {bold}h{/bold} - open help\nPress {bold}n{/bold} - add new 2fa secret\nPress {bold}t{/bold} - import keys from google auth\nPress {bold}m{/bold} - go to home screen\n`,
        tags: true,
        border: 'line',
        style: {
            border: { fg: 'magenta' },
        },
    });

    screen.append(helpBox);
    screen.render();
}
export { initHelpScreen };
