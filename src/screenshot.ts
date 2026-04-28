// experimental screenshot module 
import { spawnSync, SpawnSyncReturns } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync, rmSync } from 'node:fs';
import { platform, tmpdir } from 'node:os';
import path from 'node:path';

const commands: Record<string, Record<string, string[]>> = {
    linux: {
        spectacle: ['-bno', '/dev/stdout'],
        grim: ['${__TMP_PATH}'],
        import: ['${__TMP_PATH}'],
        // gnome :(
        'gnome-screenshot': ['-f', '${__TMP_PATH}'],
    },
    darwin: {
        screencapture: ['-x', '${__TMP_PATH}'],
    },
    // fuck windows but anyways here is support
    win32: {
        powershell: [
            '-command',
            'Add-Type -AssemblyName System.Windows.Forms; ' +
                '$bmp = New-Object Drawing.Bitmap([System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Width, [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Height); ' +
                '$g = [Drawing.Graphics]::FromImage($bmp); ' +
                '$g.CopyFromScreen(0,0,0,0,$bmp.Size); ' +
                '$bmp.Save("${__TMP_PATH}");',
        ],
    },
};

function getTmpFile() {
    return path.join(tmpdir(), 'screenshot_' + randomUUID() + '.png');
}

function hasDisplayLinux() {
    if (process.env.DISPLAY) return true;
    if (process.env.WAYLAND_DISPLAY) return true;

    // for x11
    const res = spawnSync('xdpyinfo', [], { timeout: 1000 });
    return res.status === 0;
}

type ScreenShotResult = {
    // status code, 0 = success, 1 = error
    status: number;
    // errors for each failed screenshot command
    errors: Record<
        string,
        {
            type: ('status_code' | 'error_in_res' | 'signal')[];
            status: number | null;
            stdout: Buffer<ArrayBufferLike> | null;
            stderr: Buffer<ArrayBufferLike> | null;
            error?: Error;
        }
    >;
    // result screenshot if no errors
    screenshot?: Buffer;
};

function screenshot(throwIfFail?: boolean): ScreenShotResult {
    const result: ScreenShotResult = {
        status: 1,
        errors: {},
    };

    const platformName = platform();

    if (!commands[platformName])
        throw new Error(
            `${platformName} is not supported by @wave2fa/screenshot`,
        );

    const TEMP_PATH = getTmpFile();

    // you can only take screenshots if there is display running in linux
    if (!hasDisplayLinux() && platformName === 'linux') {
        throw new Error('No display running.');
    }

    for (let command of Object.entries(commands[platformName])) {
        const binary = command[0];
        const args = command[1];
        const isStdOut = !args.includes('${__TMP_PATH}');
        let res: SpawnSyncReturns<Buffer> | Buffer = spawnSync(
            binary,
            args.map((item) => item.replace('${__TMP_PATH}', TEMP_PATH)),
            { timeout: 5000 },
        );
        if (res.status !== 0 || 'error' in res || res.signal) {
            result.errors[binary] = {
                type: [
                    res.error && 'error_in_res',
                    res.signal && 'signal',
                    res.status !== 0 && 'status',
                ].filter(Boolean) as ('error_in_res' | 'signal' | 'status')[],
                status: res.status,
                stdout: res.stdout,
                stderr: res.stderr,
                error: res.error,
            };
        }
        if (isStdOut) {
            result.status = 0;
            result.screenshot = res.stdout;
            break;
        }
        try {
            res = readFileSync(TEMP_PATH);
            rmSync(TEMP_PATH);
        } catch (err) {
            continue;
        }
        result.status = 0;
        result.screenshot = res;
        break;
    }
    if (throwIfFail === true && result.status === 1)
        throw new Error(
            'All commands failed to take screenshot for platform ' +
                platformName,
        );
    return result;
}

console.log(screenshot());
