import path from 'node:path';
import { homeConfigPath } from './utils/storage.ts';
import { accessSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import os from 'node:os';
import { getOSInfo } from './utils/osDetect.ts';
import { GIT_HASH, repo, VERSION } from './gitHash.ts';
import { screen } from './main.ts';

const LOG_FILE = path.join(homeConfigPath, 'tmp_output.log');
const INFO_JSON = path.join(homeConfigPath, 'info.json');
const BINARY_PATH = path.join(
    homeConfigPath,
    'wave2fa' + (os.platform() === 'win32' ? '.exe' : ''),
);
const DISABLE_DONATION = path.join(homeConfigPath, 'disable-donation-message');

function sha256(buf: Buffer) {
    return createHash('sha256').update(buf).digest('hex');
}

export function log(...data: any[]) {
    writeFileSync(
        LOG_FILE,
        new Date().toLocaleString() +
            ' ' +
            data
                .map(
                    (item) =>
                        item?.stack ||
                        (typeof item === 'object'
                            ? JSON.stringify(item)
                            : String(item)),
                )
                .join(' ') +
            '\n',
        { flag: 'a' },
    );
}

function buildIssueBody() {
    const runtime =
        typeof (globalThis as any).Bun !== 'undefined'
            ? `bun ${(globalThis as any).Bun.version ?? ''}`.trim()
            : `node ${process.version}`;

    const platform = `**Platform:** \`${os.platform()}\`
**OS:** \`${getOSInfo()}\`
**Arch:** \`${os.arch()}\`
**Kernel:** \`${os.release()}\`
**Exec:** \`${process.argv[0]}\`
**Entry:** \`${process.argv[1]}\`
**Runtime:** \`${runtime}\`
**Terminal:** \`${process.env.TERM || 'unknown'}\`
**Shell:** \`${process.env.SHELL || 'unknown'}\`
`;

    let info = 'No info.json found';
    try {
        info = JSON.stringify(JSON.parse(readFileSync(INFO_JSON, 'utf8')));
    } catch {}

    const infoFromBinary = `**Version:** \`${VERSION}\`
**Commit Hash:** \`${GIT_HASH}\`
**Branch:** \`${repo.branch}\`
**Releases Repo:** \`${repo.owner}/${repo.repo}\``;

    let output = '';
    try {
        output = readFileSync(LOG_FILE, 'utf8');
    } catch {}

    let hash = 'No binary found';
    try {
        const bundle = readFileSync(BINARY_PATH);
        hash = sha256(bundle);
    } catch {}

    const esc = (s: string) => s.replace(/`/g, '\\`').replace(/\$/g, '\\$');

    const body =
        '# Platform\n```\n' +
        esc(platform) +
        '\n```\n\n' +
        '# Version info (info.json)\n```json\n' +
        esc(info) +
        '# Version info (from binary/bundle)\n```json\n' +
        esc(infoFromBinary) +
        '\n```\n\n' +
        '# Bundle hash\n```\n' +
        hash +
        '\n```\n\n' +
        '# Error\n```text\n' +
        esc(output) +
        '\n```';

    return body;
}

function handleFatalError(err: any) {
    log(err);
    try {
        screen.destroy();
    } catch {}
    const output = readFileSync(LOG_FILE, 'utf8');
    console.log('\x1b[31m✗ wave2fa exited with error\x1b[0m\n');
    console.log('\x1b[33mError output:\x1b[0m\n' + output + '\n');
    const body = buildIssueBody();
    const url = new URL('https://github.com/wavedevgit/wave2fa/issues/new');
    url.searchParams.set('title', 'wave2fa runtime error');
    url.searchParams.set('body', body);
    console.log('\x1b[36m→ Issue URL:\x1b[0m\n' + url);
    process.exit(1);
}

export default function enableLogger() {
    rmSync(LOG_FILE, { force: true });
    let fatalError: any = null;
    let didFail = false;
    process.on('uncaughtException', (err) => {
        didFail = true;
        fatalError = err;
        handleFatalError(err);
    });

    process.on('unhandledRejection', (err) => {
        didFail = true;
        fatalError = err;
        handleFatalError(err);
    });

    process.on('beforeExit', () => {
        try {
            accessSync(DISABLE_DONATION);
        } catch {
            if (Math.random() < 0.05) {
                console.log(
                    '\x1b[32m* wave2fa is open source ❤️ If you like it, a star or donation helps keep it going, thanks!\x1b[0m\n',
                );
            }
        }
    });
}
