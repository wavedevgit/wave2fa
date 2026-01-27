import * as speakeasy from 'speakeasy';

function normalizeBase32(secret) {
    return secret
        .replace(/\s+/g, '')
        .toUpperCase()
        .padEnd(Math.ceil(secret.length / 8) * 8, '=');
}

const isValidSecret = (secret) => {
    try {
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
