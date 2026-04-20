import config from '../stores/config.ts';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { log } from '../errorLogger.ts';

type StyleSheet = Record<string, { fg?: string; bg?: string } | string>;
type ThemeStyles = Record<string, Record<string, unknown>>;

export async function buildStyle(stylesheet: StyleSheet, element: string) {
    const colors = await config.getKey('colors');
    const stylesheetConfig = await config.getKey('stylesheet');

    let themeStyles: Record<string, Record<string, unknown>> = {};
    let themeColors: Record<string, string> = {};

    if (stylesheetConfig?.theme) {
        const themePath = stylesheetConfig.theme.startsWith('~')
            ? stylesheetConfig.theme.replace('~', homedir())
            : stylesheetConfig.theme;

        try {
            const themeContent = await readFile(themePath, 'utf-8');
            const themeData = JSON.parse(themeContent);
            themeStyles = themeData;
            themeColors = themeData.colors || {};
        } catch (e) {
            log(`Failed to load theme: ${themePath}`, e);
        }
    }

    const mergedColors = { ...colors, ...themeColors };

    const styles: StyleSheet = {};

    for (const property in { ...stylesheet, ...themeStyles[element] }) {
        const themePropertyStyles = themeStyles[element]?.[property] as
            | { fg?: string; bg?: string }
            | string
            | undefined;
        const stylesForProperty = themePropertyStyles ?? stylesheet[property];

        styles[property] =
            typeof stylesForProperty === 'string'
                ? stylesForProperty
                : {
                      fg:
                          mergedColors[stylesForProperty?.fg as string] ||
                          stylesForProperty?.fg,
                      bg:
                          mergedColors[stylesForProperty?.bg as string] ||
                          stylesForProperty?.bg,
                  };
    }

    return styles;
}
