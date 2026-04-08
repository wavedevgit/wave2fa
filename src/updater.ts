import { GIT_HASH, VERSION } from './gitHash.js';
import { repo } from './gitHash.js';
import { toast } from './utils/toast.js';
import { getLastRun } from './utils/lastRun.js';
import type { Widgets } from 'blessed';

async function getLatestReleaseInfo() {
    const res = await fetch(
        `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/refs/heads/main/${repo.branch}/latest.json`,
    );
    return res.json() as Promise<{
        version: string;
        branch: string;
        commit: string;
        shortCommit: string;
        buildTime: string;
        files: Record<string, { path: string; sha256: string }>;
    }>;
}

export default async function checkForUpdates(screen: Widgets.Screen) {
    // skip checks if wasnt built using build ci
    if (GIT_HASH === 'commitHash') return;

    // only check for updates every 5 mins
    const lastRun = await getLastRun();
    if (Date.now() - lastRun < 60 * 5 * 1000) return;

    try {
        const latest = await getLatestReleaseInfo();

        if (GIT_HASH !== latest.shortCommit) {
            toast(
                `wave2fa update available: ${VERSION} → ${latest.version} (${latest.shortCommit})`,
                screen,
            );
        }
    } catch (err) {
        console.error('Failed to check for updates:', err);
    }
}
