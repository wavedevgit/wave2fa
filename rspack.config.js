import { fileURLToPath } from 'url';
import { DefinePlugin } from '@rspack/core';
import path from 'path';
import package_ from './package.json' with { type: 'json' };
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shortCommit = execSync('git rev-parse --short HEAD').toString().trim();
const branch = execSync('git rev-parse --symbolic-full-name --abbrev-ref HEAD')
    .toString()
    .trim();

const isDev = process.env.NO_COMMIT_INFO === '1';

export default {
    entry: './src/main.ts',
    target: 'node',
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: [/node_modules/],
                loader: 'builtin:swc-loader',
                options: {
                    jsc: {
                        parser: {
                            syntax: 'typescript',
                        },
                    },
                },
                type: 'javascript/auto',
            },
        ],
    },
    output: {
        module: false,
        path: __dirname + '/dist',
        filename: 'bundle.cjs',
        clean: false,
    },

    plugins: [
        new DefinePlugin({
            __COMMIT__HASH__: JSON.stringify(
                isDev ? 'commitHash' : shortCommit,
            ),
            __COMMIT__BRANCH__: JSON.stringify(branch),
            __VERSION__: JSON.stringify(isDev ? 'testing' : package_.version),
        }),
    ],
    resolve: {
        extensions: ['.ts', '.js'],
    },
    externals: {
        'term.js': 'commonjs term.js',
        'pty.js': 'commonjs pty.js',
    },
};
