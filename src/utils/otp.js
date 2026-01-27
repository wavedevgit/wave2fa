import { generate } from 'otplib';

function normalizeBase32(secret) {
    return secret
        .replace(/\s+/g, '')
        .toUpperCase()
        .padEnd(Math.ceil(secret.length / 8) * 8, '=');
}

const isValidSecret = async (secret,period,) => {
    try {
        await generate({ secret });
        return true;
    } catch (err) {
        return false;
    }
};
export { normalizeBase32, isValidSecret };
