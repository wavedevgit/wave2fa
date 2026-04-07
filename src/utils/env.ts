export function isTruthy(str: string | undefined): boolean {
    return ['on', 'true', 'yes', '1'].includes(str?.toLowerCase?.() || '');
}
