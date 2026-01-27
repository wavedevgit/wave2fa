import fs from 'fs/promises';
import crypto from 'crypto';

// TODO: ADD SAFE STORAGE (!!!AES!!!)
async function getKeys() {
    return JSON.parse(await fs.readFile('./_data.json', 'utf-8'));
}

async function addItem(item) {
    const data = await await getKeys();
    data.push(item);
    await fs.writeFile('./_data.json', JSON.stringify(data), 'utf-8');
}
async function validatePath(path) {
    try {
        await fs.stat(path);
        return true;
    } catch {
        return false;
    }
}

export { getKeys, addItem, validatePath };
