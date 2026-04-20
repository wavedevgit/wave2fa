import fs from 'fs/promises';
import crypto from 'crypto';
import os from 'os';
import path from 'path';
import { SecretEncrypted, TotpItem, TotpItemRaw } from '../types.ts';
import PasswordStore from '../stores/password.ts';

const passwordStore = new PasswordStore();

export async function deriveKey(
    password: string,
    version?: number | undefined,
    salt?: Buffer<ArrayBuffer> | undefined,
): Promise<{ key: Buffer; salt?: Buffer }> {
    // outdated insecure version, wave2fa will automatically migrate user data to new version
    if (version === 1 || !version)
        return { key: crypto.createHash('sha256').update(password).digest() };

    const saltToUse = salt || crypto.randomBytes(16);

    const rawBytes = crypto.argon2Sync('argon2id', {
        message: Buffer.isBuffer(password)
            ? password
            : Buffer.from(password, 'utf8'),
        nonce: saltToUse,
        parallelism: 1,
        memory: 65536, // KiB (64MB)
        passes: 3, // timeCost
        tagLength: 32, // outputLen
    });

    return {
        key: Buffer.from(rawBytes),
        salt: saltToUse,
    };
}

export async function verifyPassword(): Promise<boolean | undefined> {
    try {
        const data = await getKeys<TotpItemRaw>(true);

        // nothing to verify against
        if (data.length === 0) return undefined;

        // find an encrypted entry (not plaintext legacy)
        const encryptedItem = data.find(
            (item: any) => typeof item.secret !== 'string',
        );
        if (!encryptedItem) {
            return undefined;
        }

        // try decrypting ONE item only
        // detect version from presence of 'tag' field (GCM) vs legacy
        const hasTag =
            typeof encryptedItem.secret === 'object' &&
            'tag' in encryptedItem.secret;
        const detectedVersion = encryptedItem.version ?? (hasTag ? 2 : 1);
        await decryptSecret(
            encryptedItem.secret,
            passwordStore.getPassword(),
            detectedVersion,
        );

        return true;
    } catch (err) {
        return false;
    }
}

export function checkPasswordStrength() {
    const password = passwordStore.getPassword();
    let goodPassword =
        password?.length >= 8 &&
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]).{8,}$/.test(
            password,
        );
    const result = {
        valid: goodPassword,
        reasons: {
            chars_requirement: false, // true = doesnt have requirement, false means we can proceed
            uppercase: false,
            lowercase: false,
            numbers: false,
            special: false,
        },
    };

    if (password?.length < 8) result.reasons.chars_requirement = true; // break down regex part by part
    if (!password?.match(/[a-z]/)) result.reasons.lowercase = true;
    if (!password?.match(/[A-Z]/)) result.reasons.uppercase = true;
    if (!password.match(/[0-9]/)) result.reasons.numbers = true;
    if (!password.match(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/))
        result.reasons.special = true;
    return result;
}

// used to encrypt secrets if any secret found in _data.json
export async function saveWithPassword() {
    const data = await getKeys<TotpItem>();
    await fs.writeFile(
        homeConfigDataPath,
        JSON.stringify(
            await Promise.all(
                data.map(async (item: TotpItem) => ({
                    ...item,
                    secret: await encryptSecret(
                        item.secret,
                        passwordStore.getPassword(),
                    ),
                })),
            ),
        ),
    );
}

export async function encryptSecret(
    secret: string,
    password: string,
): Promise<SecretEncrypted> {
    const { key, salt } = await deriveKey(password, 2);

    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const encrypted = Buffer.concat([
        cipher.update(secret, 'utf8'),
        cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    return {
        iv: iv.toString('base64'),
        data: encrypted.toString('base64'),
        tag: tag.toString('base64'),
        salt: salt?.toString('base64'),
    };
}

export async function decryptSecret(
    secret: string | SecretEncrypted,
    password: string,
    version: number | undefined,
): Promise<string | undefined> {
    // no password is set yet
    try {
        if (typeof secret === 'string') return secret;
        const { data, iv: ivStr, tag, salt } = secret;
        const { key } = await deriveKey(
            password,
            version,
            salt ? Buffer.from(salt, 'base64') : undefined,
        );
        const ivBuffer = Buffer.from(ivStr, 'base64');
        if (version === 1 || !version) {
            const decipher = crypto.createDecipheriv(
                'aes-256-cbc',
                key,
                ivBuffer,
            );
            let decrypted = decipher.update(data, 'base64', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, ivBuffer);
        if (!tag) {
            throw new Error(
                "Wave2FA: invalid encrypted data (missing 'tag' for AES-GCM v2 secret)",
            );
        }
        if (version === 2) {
            decipher.setAuthTag(Buffer.from(tag, 'base64'));
            let decrypted = decipher.update(data, 'base64', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
    } catch (err) {
        throw err;
    }
}

const homeConfigPath = path.join(os.homedir(), '.config', 'wave2fa');
const homeConfigDataPath = path.join(homeConfigPath, '_data.json');

let dataPath: string = await (async () => {
    const dir = path.dirname(homeConfigDataPath);
    await fs.mkdir(dir, { recursive: true });

    try {
        await fs.access(homeConfigDataPath);
    } catch {
        await fs.writeFile(homeConfigDataPath, '[]', 'utf8');
    }
    return homeConfigDataPath;
})();

async function getKeys<T>(raw?: boolean): Promise<T[]> {
    const data = JSON.parse(await fs.readFile(dataPath, 'utf-8'));
    if (raw) return data;
    return await Promise.all(
        data.map(async (item: any) => ({
            ...item,
            secret: await decryptSecret(
                item.secret,
                passwordStore.getPassword(),
                item?.version,
            ),
        })),
    );
}

export async function migrateDataToV2() {
    const rawData = await getKeys<TotpItemRaw>(true);
    const backupPath = path.join(homeConfigPath, `_data_v1.json`);
    await fs.writeFile(backupPath, JSON.stringify(rawData), 'utf-8');

    const data = await getKeys<TotpItem | TotpItemRaw>(false);
    for (const item of data) {
        if (item.version === 2) continue;
        item.version = 2;
        item.secret = await encryptSecret(
            item.secret as string,
            passwordStore.getPassword(),
        );
    }
    await fs.writeFile(dataPath, JSON.stringify(data), 'utf-8');
}

async function addItem(item: TotpItem) {
    const data: any = await getKeys<TotpItemRaw>(true);
    item.version = 2;
    item.date = Date.now();
    (item as unknown as TotpItemRaw).secret = await encryptSecret(
        item.secret,
        passwordStore.getPassword(),
    );
    data.push(item);

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

export { getKeys, addItem, validatePath, homeConfigPath, passwordStore };
