import * as speakeasy from 'speakeasy';

function normalizeBase32(secret: string): string {
    return secret
        .replace(/\s+/g, '')
        .toUpperCase()
        .padEnd(Math.ceil(secret.length / 8) * 8, '=');
}

const isValidSecret = (secret: string): boolean => {
    try {
        if (!secret || typeof secret !== 'string') return false;
        speakeasy.totp({
            secret,
            encoding: 'base32',
        });

        return true;
    } catch (err) {
        throw err;
        return false;
    }
};
export { normalizeBase32, isValidSecret };
