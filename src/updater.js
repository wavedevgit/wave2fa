import GIT_HASH from './gitHash.js';
import { repo } from './gitHash.js';
import fs from 'fs/promises';

async function getShortHash() {
    const res = await fetch(
        `https://api.github.com/repos/${repo.owner}/${repo.repo}/commits/${repo.branch}`,
    );
    const data = await res.json();
    const shortHash = data.sha.slice(0, 7);
    return shortHash;
}

async function getLatestBundleContent() {
    const res = await fetch(
        `https://api.github.com/repos/${repo.owner}/${repo.repo}/releases/latest`,
        {
            headers: { 'User-Agent': 'node' },
        },
    );
    const data = await res.json();
    const asset = data.assets.find((a) => a.name === 'bundle.cjs');
    return await (await fetch(asset.browser_download_url)).text();
}

export default async function checkForUpdates() {
    const filePath = (() => {
        try {
            // try commonjs __filename if fail then return esm filename
            if (__filename) return __filename;
            return import.meta.filename;
        } catch {}
    })();

    // skip checks if wasnt built using build ci
    if (GIT_HASH === 'commitHash') return;
    const shortHash = await getShortHash();

    // skip checks if not running with bundle.cjs file
    if (!filePath.endsWith('bundle.cjs')) return;

    if (GIT_HASH !== shortHash) {
        // auto update
        const content = await getLatestBundleContent();
        await fs.writeFile(filePath, content, 'utf-8');
        return;
    }
}
