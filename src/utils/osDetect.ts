import * as os from 'node:os';

export interface DistroInfo {
    id: string;
    name: string;
    version: string;
}

function readFile(path: string): string | null {
    try {
        return require('node:fs').readFileSync(path, 'utf8').trim();
    } catch {
        return null;
    }
}

export function getLinuxDistro(): DistroInfo | null {
    const distroFiles = [
        '/etc/os-release',
        '/etc/lsb-release',
        '/etc/debian_version',
    ];

    for (const file of distroFiles) {
        const content = readFile(file);
        if (!content) continue;

        if (file === '/etc/os-release') {
            const id =
                (content.match(/^ID="?([^"\n]+)"?/m)?.[1] || '').trim() ||
                'linux';
            const name =
                (content.match(/^NAME="?([^"\n]+)"?/m)?.[1] || '').trim() ||
                'Linux';
            const version =
                (
                    content.match(/^VERSION_ID="?([^"\n]+)"?/m)?.[1] || ''
                ).trim() || '';

            if (id || name) {
                return { id, name, version };
            }
        }

        if (file === '/etc/lsb-release') {
            const id = (
                content.match(/^DISTRIB_ID="?([^"\n]+)"?/m)?.[1] || ''
            ).trim();
            const name = (
                content.match(/^DISTRIB_DESCRIPTION="?([^"\n]+)"?/m)?.[1] || ''
            ).trim();
            const version = (
                content.match(/^DISTRIB_RELEASE="?([^"\n]+)"?/m)?.[1] || ''
            ).trim();

            if (id) return { id: id.toLowerCase(), name, version };
        }

        if (file === '/etc/debian_version') {
            return { id: 'debian', name: 'Debian', version: content };
        }
    }

    return null;
}

export function getOSInfo(): string {
    const platform = os.platform();
    const release = os.release();

    if (platform === 'linux') {
        const distro = getLinuxDistro();
        if (distro) {
            return `${distro.name}${distro.version ? ' ' + distro.version : ''} (${release})`;
        }
        return `Linux ${release}`;
    }

    if (platform === 'darwin') {
        const major = parseInt(release.split('.')[0] || '0');
        const name = major <= 13 ? 'macOS' : major <= 22 ? 'macOS' : 'macOS';
        return `${name} ${release}`;
    }

    if (platform === 'win32') {
        return `Windows ${release}`;
    }

    return `${platform} ${release}`;
}
