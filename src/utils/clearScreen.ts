import { Widgets } from 'blessed';

const clearScreen = (screen: Widgets.Screen): void => {
    screen.children
        .filter((c) => !c.options._isBase)
        .forEach((node) => {
            if ('cleanup' in node) (node.cleanup as Function)();
            node.destroy();
        });
};

export default clearScreen;
