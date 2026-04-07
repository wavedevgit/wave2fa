import { Widgets } from 'blessed';

const clearScreen = (screen: Widgets.Screen): void => {
    screen.children
        .filter((c) => !c.options._isBase)
        .forEach((node) => {
            node.destroy();
        });
};

export default clearScreen;
