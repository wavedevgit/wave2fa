import blessed, { Widgets } from 'blessed';
import { roundedBorder } from '../../utils/roundedBorder.ts';
import { buildStyle } from '../../utils/styles.ts';

export interface ModalOptions {
    onConfirm?: () => void | Promise<void>;
    onClose?: () => void | Promise<void>;
    confirmText?: string;
    closeText?: string;
    size?: 'small' | 'medium' | 'large';
}

const modalSizes = {
    small: { width: 40, height: 9, padding: 1 },
    medium: { width: 50, height: 11, padding: 2 },
    large: { width: 70, height: 15, padding: 3 },
} as const;

export async function modal(
    message: string,
    screen: Widgets.Screen,
    options: ModalOptions = {},
): Promise<void> {
    const confirmText = options.confirmText ?? 'Ok';
    const closeText = options.closeText ?? 'Cancel';
    const size = modalSizes[options.size ?? 'medium'];
    const previousFocus = screen.focused?.detached
        ? undefined
        : screen.focused;
    const modalBox = blessed.box({
        top: 'center',
        left: 'center',
        width: size.width,
        height: size.height,
        valign: 'middle',
        keys: true,
        mouse: true,
        border: roundedBorder,
        style: await buildStyle(
            {
                border: { fg: 'modal.border' },
            },
            'modal',
        ),
    });

    blessed.box({
        parent: modalBox,
        top: size.padding,
        left: size.padding,
        right: size.padding,
        height: size.height - size.padding * 2 - 4,
        content: message,
        tags: true,
        wrap: true,
        style: {
            fg: 'white',
        },
    });

    const confirmButton = blessed.button({
        parent: modalBox,
        bottom: size.padding,
        left: size.padding,
        width: Math.max(confirmText.length + 4, 8),
        height: 1,
        content: confirmText,
        mouse: true,
        clickable: true,
        keyable: true,
        style: {
            fg: 'green',
        },
    });
    const closeButton = blessed.button({
        parent: modalBox,
        bottom: size.padding,
        right: size.padding,
        width: Math.max(closeText.length + 4, 8),
        height: 1,
        content: closeText,
        mouse: true,
        clickable: true,
        keyable: true,
        style: {
            fg: 'red',
        },
    });

    screen.append(modalBox);

    return new Promise<void>((resolve, reject) => {
        let closed = false;
        let selected: 'confirm' | 'close' = 'close';
        const previousGrabKeys = screen.grabKeys;

        function renderSelection() {
            confirmButton.style.bg =
                selected === 'confirm' ? 'green' : undefined;
            confirmButton.style.fg =
                selected === 'confirm' ? 'black' : 'gray';
            closeButton.style.bg = selected === 'close' ? 'red' : undefined;
            closeButton.style.fg = selected === 'close' ? 'white' : 'gray';
            screen.render();
        }
        function selectConfirm() {
            selected = 'confirm';
            confirmButton.focus();
            renderSelection();
        }
        function selectClose() {
            selected = 'close';
            closeButton.focus();
            renderSelection();
        }
        async function confirm() {
            await close('confirm');
        }
        async function cancel() {
            await close('close');
        }
        function activateFocusedButton() {
            if (selected === 'confirm') {
                void confirm();
            } else {
                void cancel();
            }
        }
        function handleKeypress(_ch: string, key: { name: string }) {
            switch (key.name) {
                case 'left':
                case 'up':
                    selectConfirm();
                    break;
                case 'right':
                case 'down':
                    selectClose();
                    break;
                case 'enter':
                    activateFocusedButton();
                    break;
                case 'escape':
                    void cancel();
                    break;
            }
        }
        async function close(action: 'confirm' | 'close') {
            if (closed) return;
            closed = true;

            screen.program.removeListener('keypress', handleKeypress);
            screen.grabKeys = previousGrabKeys;
            modalBox.destroy();
            screen.render();

            try {
                await (action === 'confirm'
                    ? options.onConfirm?.()
                    : options.onClose?.());
                if (previousFocus && !previousFocus.detached) {
                    previousFocus.focus();
                    screen.render();
                }
                resolve();
            } catch (error) {
                reject(error);
            }
        }

        screen.grabKeys = true;
        screen.program.on('keypress', handleKeypress);
        confirmButton.on('mousedown', selectConfirm);
        closeButton.on('mousedown', selectClose);
        confirmButton.on('click', confirm);
        closeButton.on('click', cancel);
        closeButton.focus();
        renderSelection();
    });
}
