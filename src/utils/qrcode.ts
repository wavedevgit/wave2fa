import * as Jimp from 'jimp';
import fs from 'fs/promises';
import jsQR from 'jsqr';
import { TotpItem } from '../types.js';
import { randomUUID } from 'crypto';

type ResponseOrError<T> = T | { err: string };

const scanQrCode = async (path: string): Promise<ResponseOrError<string>> => {
    const buffer = await fs.readFile(path);

    const image = await Jimp.Jimp.read(buffer);

    // @ts-ignore
    const code = jsQR(
        new Uint8ClampedArray(image.bitmap.data),
        image.bitmap.width,
        image.bitmap.height,
    );
    if (!code) return { err: 'Invalid QR code' };
    return code.data;
};

const parseUri = (uri: ResponseOrError<string>): ResponseOrError<TotpItem> => {
    if (typeof uri === 'object' && 'err' in uri)
        return uri as ResponseOrError<TotpItem>;
    const url = new URL(uri);

    try {
        if (!url.href.startsWith('otpauth://'))
            return { err: 'Invalid qr code.' };
        if (url.host !== 'totp') return { err: 'Only TOTP is supported.' };
        return {
            uuid: randomUUID(),
            name: decodeURIComponent(
                url.searchParams.get('issuer') +
                    ': ' +
                    url.pathname.split('/')[1],
            ),
            secret: url.searchParams.get('secret') || '',
            period: Number(url.searchParams.get('period')) || 30,
            digits: Number(url.searchParams.get('digits')) || 6,
            algorithm: url.searchParams.get('algorithm') || 'SHA1',
        };
    } catch (err) {
        return { err: 'Error parsing qr code: ' + err };
    }
};

export { scanQrCode, parseUri };
