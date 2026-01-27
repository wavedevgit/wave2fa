import * as Jimp from 'jimp';
import fs from 'fs/promises';
import jsQR from 'jsqr';

const scanQrCode = async (path) => {
    const buffer = await fs.readFile(path);

    const image = await Jimp.Jimp.read(buffer);

    const code = jsQR(
        new Uint8ClampedArray(image.bitmap.data),
        image.bitmap.width,
        image.bitmap.height,
    );
    if (!code) return { err: 'Invalid QR code' };
    return code.data;
};

const parseUri = (uri) => {
    if (uri.err) return uri;
    try {
        const url = new URL(uri);
        if (!url.href.startsWith('otpauth://'))
            return { err: 'Invalid qr code.' };
        if (url.host !== 'totp') return { err: 'Only TOTP is supported.' };
        return {
            name: decodeURIComponent(
                url.searchParams.get('issuer') +
                    ': ' +
                    url.pathname.split('/')[1],
            ),
            secret: url.searchParams.get('secret'),
            period: Number(url.searchParams.get('period')) || 30,
            digits: Number(url.searchParams.get('digits')) || 6,
            algorithm: Number(url.searchParams.get('algorithm')) || 'SHA1',
        };
    } catch (err) {
        return { err: 'Error parsing qr code: ' + err };
    }
};

export { scanQrCode, parseUri };
