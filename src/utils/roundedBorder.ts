import { Widgets } from 'blessed';
import config from '../stores/config.js';

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
