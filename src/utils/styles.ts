import config from '../stores/config.js';

type StyleSheet = Record<string, { fg?: string; bg?: string }>;

export async function buildStyle(stylesheet: StyleSheet) {
    const colors = await config.getKey('colors');

    const styles: StyleSheet = {};
    for (const property in stylesheet) {
        const stylesForProperty = stylesheet[property];

        styles[property] = {
            fg: colors[stylesForProperty?.fg as string],
            bg: colors[stylesForProperty?.bg as string],
        };
    }

    return styles;
}
