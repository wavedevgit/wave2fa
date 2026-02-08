import fs from 'fs/promises';
import crypto from 'crypto';
import { isValidSecret } from './otp.js';
import os from 'os';
import path from 'path';

export async function verifyPassword() {
    try {
        let data = await getKeys(true);
        if (data.length === 0) return undefined;
        // password is not set
        if (data.every((item) => typeof item.secret === 'string'))
            return undefined;
        data = await getKeys();
        return await isValidSecret(data[0].secret);
    } catch {
        return false;
    }
}

export async function saveWithPassword() {
    const data = await getKeys();
    await fs.writeFile(
        './_data.json',
        JSON.stringify(
            await Promise.all(
                data.map(async (item) => ({
                    ...item,
                    secret: await encryptSecret(item.secret),
                })),
            ),
        ),
    );
}

export async function encryptSecret(secret) {
    const key = crypto
        .createHash('sha256')
        .update(globalThis.password)
        .digest();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(secret, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return {
        iv: iv.toString('base64'),
        data: encrypted,
    };
}

export async function decryptSecret(secret) {
    // no password is set yet
    if (typeof secret === 'string') return secret;
    const { data, iv: ivStr } = secret;
    const key = crypto
        .createHash('sha256')
        .update(globalThis.password)
        .digest();
    const ivBuffer = Buffer.from(ivStr, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, ivBuffer);
    let decrypted = decipher.update(data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

const homeConfigPath = path.join(os.homedir(), '.config', 'wave2fa');
const homeConfigDataPath = path.join(homeConfigPath, '_data.json');

const localPath = path.join(os.homedir(), './_data.json');
let dataPath;

(async () => {
    try {
        await fs.access(homeConfigDataPath);
        dataPath = homeConfigDataPath;
    } catch {
        console.log('config files dont exist, please configure wave2fa first!');
        process.kill(1);
    }
})();

async function getKeys(raw) {
    const data = JSON.parse(await fs.readFile(dataPath, 'utf-8'));
    if (raw) return data;
    return await Promise.all(
        data.map(async (item) => ({
            ...item,
            secret: await decryptSecret(item.secret),
        })),
    );
}

async function addItem(item) {
    const data = await getKeys();
    data.push(item);

    for (let item of data) {
        item.secret = await encryptSecret(item.secret);
    }
    await fs.writeFile(dataPath, JSON.stringify(data), 'utf-8');
}
async function validatePath(path) {
    try {
        await fs.stat(path);
        return true;
    } catch {
        return false;
    }
}

export { getKeys, addItem, validatePath, homeConfigPath };
