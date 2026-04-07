import fs from 'fs/promises';
import crypto from 'crypto';
import { isValidSecret } from './otp.js';
import os from 'os';
import path from 'path';
import { TotpItem, TotpItemRaw } from '../types.js';

export async function verifyPassword(): Promise<boolean | undefined> {
    try {
        let data: any = await getKeys<TotpItemRaw>(true);
        if (data.length === 0) return undefined;
        // password is not set
        if (data.every((item: any) => typeof item.secret === 'string'))
            return undefined;
        data = await getKeys<TotpItem>();
        return await isValidSecret(data[0].secret);
    } catch (err) {
        console.log(err);
        return false;
    }
}

export async function saveWithPassword() {
    const data = await getKeys<TotpItem>();
    await fs.writeFile(
        './_data.json',
        JSON.stringify(
            await Promise.all(
                data.map(async (item: TotpItem) => ({
                    ...item,
                    secret: await encryptSecret(item.secret),
                })),
            ),
        ),
    );
}

export async function encryptSecret(secret: string) {
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

export async function decryptSecret(secret: string) {
    // no password is set yet
    try {
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
    } catch {}
}

const homeConfigPath = path.join(os.homedir(), '.config', 'wave2fa');
const homeConfigDataPath = path.join(homeConfigPath, '_data.json');

// @ts-expect-error we already kill the process
let dataPath: Promise<string> | string = (async () => {
    try {
        await fs.access(homeConfigDataPath);
        return homeConfigDataPath;
    } catch {
        console.log('config files dont exist, please configure wave2fa first!');
        process.kill(1);
    }
})();

async function getKeys<T>(raw?: boolean): Promise<T[]> {
    if (dataPath instanceof Promise) dataPath = await dataPath;
    const data = JSON.parse(await fs.readFile(dataPath, 'utf-8'));
    if (raw) return data;
    return await Promise.all(
        data.map(async (item: any) => ({
            ...item,
            secret: await decryptSecret(item.secret),
        })),
    );
}

async function addItem(item: TotpItem) {
    if (dataPath instanceof Promise) dataPath = await dataPath;
    const data: any = await getKeys<TotpItem>();
    data.push(item);

    for (let item of data) {
        item.secret = await encryptSecret(item.secret);
    }
    await fs.writeFile(dataPath, JSON.stringify(data), 'utf-8');
}
async function validatePath(path: string) {
    try {
        await fs.stat(path);
        return true;
    } catch {
        return false;
    }
}

export { getKeys, addItem, validatePath, homeConfigPath };
