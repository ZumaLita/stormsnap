// Apple-style design tokens: one place for every colour, size, radius and font weight.
import { createContext, useContext, useMemo } from 'react';
import { Platform, TextStyle } from 'react-native';

export type Appearance = 'auto' | 'light' | 'dark';
export type AccentKey = 'blue' | 'orange' | 'green' | 'pink' | 'purple' | 'graphite';

export const ACCENTS: Record<AccentKey, { name: string; light: string; dark: string }> = {
  blue: { name: 'Blue', light: '#007AFF', dark: '#0A84FF' },
  orange: { name: 'Orange', light: '#FF9500', dark: '#FF9F0A' },
  green: { name: 'Green', light: '#34C759', dark: '#30D158' },
  pink: { name: 'Pink', light: '#FF2D55', dark: '#FF375F' },
  purple: { name: 'Purple', light: '#AF52DE', dark: '#BF5AF2' },
  graphite: { name: 'Graphite', light: '#3A3A3C', dark: '#AEAEB2' },
};
export const ACCENT_ORDER: AccentKey[] = ['blue', 'orange', 'green', 'pink', 'purple', 'graphite'];

export type Theme = {
  dark: boolean;
  appearance: Appearance;
  accentKey: AccentKey;
  accent: string;
  accentTint: string;
  onAccent: string;
  bg: string; // grouped background
  card: string; // grouped cell
  card2: string; // raised inside a card
  fill: string; // control fill
  label: string;
  secondary: string;
  tertiary: string;
  separator: string;
  fire: string;
  fireTint: string;
  shield: string;
  red: string;
  barBg: string;
};

const LIGHT = {
  bg: '#F2F2F7',
  card: '#FFFFFF',
  card2: '#F2F2F7',
  fill: 'rgba(120,120,128,0.12)',
  label: '#000000',
  secondary: 'rgba(60,60,67,0.6)',
  tertiary: 'rgba(60,60,67,0.3)',
  separator: 'rgba(60,60,67,0.18)',
  fire: '#FF9500',
  fireTint: 'rgba(255,149,0,0.14)',
  shield: '#007AFF',
  red: '#FF3B30',
  barBg: 'rgba(249,249,249,0.94)',
};
const DARK = {
  bg: '#000000',
  card: '#1C1C1E',
  card2: '#2C2C2E',
  fill: 'rgba(120,120,128,0.24)',
  label: '#FFFFFF',
  secondary: 'rgba(235,235,245,0.6)',
  tertiary: 'rgba(235,235,245,0.3)',
  separator: 'rgba(84,84,88,0.65)',
  fire: '#FF9F0A',
  fireTint: 'rgba(255,159,10,0.18)',
  shield: '#0A84FF',
  red: '#FF453A',
  barBg: 'rgba(22,22,24,0.92)',
};

const hexToRgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export function makeTheme(appearance: Appearance, accentKey: AccentKey, systemDark: boolean): Theme {
  const dark = appearance === 'auto' ? systemDark : appearance === 'dark';
  const base = dark ? DARK : LIGHT;
  const accent = ACCENTS[accentKey][dark ? 'dark' : 'light'];
  const onAccent = accentKey === 'graphite' && dark ? '#000000' : '#FFFFFF';
  return { ...base, dark, appearance, accentKey, accent, accentTint: hexToRgba(accent, dark ? 0.22 : 0.12), onAccent };
}

export const ThemeContext = createContext<Theme>(makeTheme('auto', 'blue', false));
export const useTheme = () => useContext(ThemeContext);

/** Builds a theme-aware StyleSheet once per theme. */
export function useStyles<T>(make: (t: Theme) => T): T {
  const t = useTheme();
  return useMemo(() => make(t), [t, make]);
}

// System font everywhere (SF on Apple, Roboto on Android, system-ui on web).
const family = Platform.select({ web: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif', default: undefined });
const round = Platform.select({ web: 'ui-rounded, "SF Pro Rounded", -apple-system, system-ui, sans-serif', default: undefined });
const t = (size: number, weight: TextStyle['fontWeight'], extra: TextStyle = {}): TextStyle => ({
  fontFamily: family,
  fontSize: size,
  fontWeight: weight,
  ...extra,
});

// iOS text styles.
export const T = {
  largeTitle: t(34, '700', { letterSpacing: 0.37, lineHeight: 41 }),
  title2: t(22, '700', { letterSpacing: 0.35, lineHeight: 28 }),
  title3: t(20, '600', { letterSpacing: 0.38, lineHeight: 25 }),
  headline: t(17, '600', { letterSpacing: -0.41, lineHeight: 22 }),
  body: t(17, '400', { letterSpacing: -0.41, lineHeight: 22 }),
  callout: t(16, '400', { letterSpacing: -0.32, lineHeight: 21 }),
  subhead: t(15, '400', { letterSpacing: -0.24, lineHeight: 20 }),
  footnote: t(13, '400', { letterSpacing: -0.08, lineHeight: 18 }),
  caption: t(12, '400', { lineHeight: 16 }),
  caption2: t(11, '500', { letterSpacing: 0.07, lineHeight: 13 }),
  bigNumber: { fontFamily: round, fontSize: 76, fontWeight: '800', letterSpacing: -2, lineHeight: 80, fontVariant: ['tabular-nums'] } as TextStyle,
  number: { fontFamily: round, fontWeight: '700', fontVariant: ['tabular-nums'] } as TextStyle,
};

export const R = { card: 12, tile: 14, sheet: 20 };

const AVATAR_COLORS = ['#FF9500', '#5856D6', '#34C759', '#FF2D55', '#007AFF', '#AF52DE'];
export const colorFor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};
