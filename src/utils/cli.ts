export function isTruthy(str: string | undefined): boolean {
    return ['on', 'true', 'yes', '1'].includes(str?.toLowerCase?.() || '');
}

export function getArg(name: string): string | undefined {
    const args = process.argv;

    const index = args.indexOf(name);
    if (index !== -1) return args[index + 1];

    const inline = args.find((a) => a.startsWith(`${name}=`));
    if (inline) return inline.split('=')[1];

    return undefined;
}
