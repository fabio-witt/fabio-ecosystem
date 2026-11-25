/**
 * Lingora design tokens.
 *
 * Every color, spacing value, radius and text style in the app should come
 * from here. Change a value once and the whole app follows.
 */

import { createContext, useContext, useMemo } from 'react';
import type { TextStyle } from 'react-native';

const light = {
  primary: '#5145B5',
  primarySoft: '#EFEDF9',
  action: '#5145B5',
  actionPressed: '#403593',
  onPrimary: '#FFFFFF',

  background: '#F7F7F8',
  surface: '#FFFFFF',
  surfaceMuted: '#EEEFF2',
  text: '#1E2029',
  textSecondary: '#555967',
  textMuted: '#676B79',
  textInverse: '#FFFFFF',
  border: '#D6D8E0',
  borderSubtle: '#E3E4EB',

  danger: '#A83143',
  dangerSoft: '#FAE9EC',
  success: '#14704F',
  successSoft: '#E6F4EE',
  warning: '#82550F',
  warningSoft: '#FAF0DC',
};

export type ThemeColors = typeof light;
export type ColorName = keyof ThemeColors;

const dark: ThemeColors = {
  primary: '#BDB4FF',
  primarySoft: '#302A48',
  action: '#6554C4',
  actionPressed: '#5242AD',
  onPrimary: '#FFFFFF',

  background: '#15161B',
  surface: '#1E2027',
  surfaceMuted: '#292B35',
  text: '#F1F1F5',
  textSecondary: '#BFC1CD',
  textMuted: '#A6A9B8',
  textInverse: '#FFFFFF',
  border: '#464955',
  borderSubtle: '#353844',

  danger: '#FFABB7',
  dangerSoft: '#402630',
  success: '#8AD9B7',
  successSoft: '#223C34',
  warning: '#F2CA82',
  warningSoft: '#392F22',
};

export const ThemeColorsContext = createContext(light);

export function getThemeColors(isDark: boolean) {
  return isDark ? dark : light;
}

export function useColors() {
  return useContext(ThemeColorsContext);
}

export function useThemedStyles<T>(createStyles: (colors: ThemeColors) => T) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors, createStyles]);
  return { colors, styles };
}

/** 4-point spacing scale. */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Horizontal padding for full screens. */
export const screenPadding = spacing.xl;

export const radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  xxl: 18,
  full: 999,
} as const;

export const typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -0.75 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.4 },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  subheading: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '500' },
  bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: '700' },
  callout: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  small: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.25,
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
