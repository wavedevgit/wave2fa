import blessed from 'blessed';

/**
 *
 * @param {blessed.Widgets.Screen} screen
 */
const clearScreen = (screen) => {
    screen.children
        .filter((c) => !c.options._isBase)
        .forEach((node) => {
            node.destroy();
        });
};

export default clearScreen;
