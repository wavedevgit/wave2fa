import path from 'node:path';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homeConfigPath } from '../utils/storage.js';

type Wave2faConfig = {
    loaded: boolean;
    colors: Record<string, string>;
};

const DEFAULT_CONFIG: Wave2faConfig = {
    loaded: true,
    colors: {
        input: 'magenta',
        'home.list.selected': 'blue',
        'home.list.border': 'magenta',
        'help.border': 'magenta',
        'toast.border': 'magenta',
        'versioninfo.border': 'blue',
        'tips.border': 'cyan',
    },
};

class Config {
    config: Wave2faConfig;

    constructor() {
        this.config = { loaded: false, colors: {} };
    }

    private async ensureConfigExists() {
        const dir = homeConfigPath;
        const file = path.join(dir, 'config.json');

        if (!existsSync(file)) {
            await mkdir(dir, { recursive: true });
            await writeFile(
                file,
                JSON.stringify(DEFAULT_CONFIG, null, 2),
                'utf-8',
            );
        }
    }

    async loadConfig() {
        await this.ensureConfigExists();

        const filePath = path.join(homeConfigPath, 'config.json');

        this.config = JSON.parse(await readFile(filePath, 'utf-8'));
        this.config.loaded = true; // no loops
    }

    async getKey<K extends keyof Wave2faConfig>(
        key: K,
    ): Promise<Wave2faConfig[K]> {
        if (!this.config.loaded) await this.loadConfig();
        return this.config[key];
    }
}

export default new Config();
