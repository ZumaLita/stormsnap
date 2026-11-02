// Material 3 Expressive tokens: colour roles, type scale and shapes in one place.
import { createContext, useContext, useMemo } from 'react';
import { Platform, TextStyle } from 'react-native';
import { SCHEMES } from './schemes';

export type Appearance = 'auto' | 'light' | 'dark';
export type AccentKey = keyof typeof SCHEMES;
export const ACCENTS: Record<AccentKey, { name: string; seed: string }> = {
  blue: { name: 'Blue', seed: '#0B57D0' },
  green: { name: 'Green', seed: '#1E8E3E' },
  orange: { name: 'Orange', seed: '#E8710A' },
  pink: { name: 'Pink', seed: '#D93F7A' },
  purple: { name: 'Purple', seed: '#7B5BD6' },
  teal: { name: 'Teal', seed: '#00897B' },
};
export const ACCENT_ORDER: AccentKey[] = ['blue', 'green', 'orange', 'pink', 'purple', 'teal'];

type Roles = { -readonly [K in keyof (typeof SCHEMES)['blue']['light']]: string };
export type Theme = Roles & {
  dark: boolean;
  appearance: Appearance;
  accentKey: AccentKey;
  fire: string;
  fireContainer: string;
  onFireContainer: string;
  shield: string;
};

export function makeTheme(appearance: Appearance, accentKey: AccentKey, systemDark: boolean): Theme {
  const dark = appearance === 'auto' ? systemDark : appearance === 'dark';
  const roles = SCHEMES[accentKey]?.[dark ? 'dark' : 'light'] ?? SCHEMES.blue[dark ? 'dark' : 'light'];
  return {
    ...(roles as Roles),
    dark,
    appearance,
    accentKey,
    fire: dark ? '#FFB68A' : '#E8710A',
    fireContainer: dark ? '#7A3300' : '#FFDBC8',
    onFireContainer: dark ? '#FFDBC8' : '#5B2600',
    shield: dark ? '#B2C5FF' : '#0B57D0',
  };
}

export const ThemeContext = createContext<Theme>(makeTheme('auto', 'blue', false));
export const useTheme = () => useContext(ThemeContext);
export function useStyles<T>(make: (t: Theme) => T): T {
  const t = useTheme();
  return useMemo(() => make(t), [t, make]);
}

// Roboto on Android (system), Google Sans Flex / Roboto Flex on the web.
const family = Platform.select({ web: '"Google Sans Flex", "Roboto Flex", Roboto, system-ui, sans-serif', default: undefined });
const t = (size: number, line: number, weight: TextStyle['fontWeight'], spacing = 0): TextStyle => ({
  fontFamily: family,
  fontSize: size,
  lineHeight: line,
  fontWeight: weight,
  letterSpacing: spacing,
});

// M3 type scale (+ emphasized variants for hero moments).
export const T = {
  displayLarge: t(57, 64, '400', -0.25),
  displayLargeEmph: t(57, 64, '700', -0.5),
  displayMedium: t(45, 52, '400'),
  headlineLarge: t(32, 40, '400'),
  headlineMedium: t(28, 36, '400'),
  headlineMediumEmph: t(28, 36, '600'),
  headlineSmall: t(24, 32, '400'),
  titleLarge: t(22, 28, '400'),
  titleLargeEmph: t(22, 28, '600'),
  titleMedium: t(16, 24, '500', 0.15),
  titleSmall: t(14, 20, '500', 0.1),
  bodyLarge: t(16, 24, '400', 0.5),
  bodyMedium: t(14, 20, '400', 0.25),
  bodySmall: t(12, 16, '400', 0.4),
  labelLarge: t(14, 20, '500', 0.1),
  labelMedium: t(12, 16, '500', 0.5),
  labelSmall: t(11, 16, '500', 0.5),
  hero: { ...t(96, 100, '800', -3), fontVariant: ['tabular-nums'] } as TextStyle,
  num: { fontVariant: ['tabular-nums'] } as TextStyle,
};

// M3 shape scale.
export const S = { xs: 4, sm: 8, md: 12, lg: 16, lgInc: 20, xl: 28, xlInc: 32, xxl: 48, full: 999 };

const AVATAR = ['#E8710A', '#7B5BD6', '#1E8E3E', '#D93F7A', '#0B57D0', '#00897B'];
export const colorFor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR[h % AVATAR.length];
};
