import { Widgets } from 'blessed';
import config from '../stores/config.ts';

export const roundedBorder: Widgets.Border = {
    type: 'line',
    ch: {
        tl: '╭',
        tr: '╮',
        bl: '╰',
        br: '╯',
        h: '─',
        v: '│',
    },
};

export const roundedBorderBg: Widgets.Border = {
    type: 'bg',
};
