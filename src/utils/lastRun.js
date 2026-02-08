import { readFile, writeFile } from 'fs/promises';
import { homeConfigPath } from './storage.js';
import path from 'path';

const lastRunFile = path.join(homeConfigPath, '.last_run');

async function getLastRun() {
    try {
        return new Date(await readFile(lastRunFile, 'utf-8'));
    } catch {
        return new Date();
    }
}
async function saveRun() {
    await writeFile(lastRunFile, String(Date.now()), 'utf-8');
}

export { getLastRun, saveRun };
