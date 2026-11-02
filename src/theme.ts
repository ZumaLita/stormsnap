// StormSnap identity: a family photobooth.
// Every snap is a printed photo with a film-camera date stamp, laid on a warm cream table.
// Family colours: home green + cream, so it never looks like the violet school app HourSnap.
import { createContext, useContext, useMemo } from 'react';
import { TextStyle } from 'react-native';

export type Appearance = 'auto' | 'light' | 'dark';
export type AccentKey = 'home' | 'ocean' | 'sun' | 'berry' | 'ember';

// The colour used for buttons and the shutter. Home green is the family colour.
export const ACCENTS: Record<AccentKey, { name: string; light: string; dark: string; soft: string; softDark: string }> = {
  home: { name: 'Home', light: '#1E7A55', dark: '#6FD3A4', soft: '#D7F0E3', softDark: '#173D2D' },
  ocean: { name: 'Ocean', light: '#0B6BCB', dark: '#6FB3F5', soft: '#D9EBFB', softDark: '#173452' },
  sun: { name: 'Sun', light: '#B26A00', dark: '#F6C35B', soft: '#FCEBCB', softDark: '#3F2E0E' },
  berry: { name: 'Berry', light: '#C2185B', dark: '#F48FB1', soft: '#FBDDE8', softDark: '#4A1A2C' },
  ember: { name: 'Ember', light: '#D9480F', dark: '#FF9F6B', soft: '#FFE3D3', softDark: '#4A2412' },
};
export const ACCENT_ORDER: AccentKey[] = ['home', 'ocean', 'sun', 'berry', 'ember'];

export type Theme = {
  dark: boolean;
  appearance: Appearance;
  accentKey: AccentKey;
  // Role names kept compatible with every screen.
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  surface: string; // the table
  surfaceContainerLowest: string;
  surfaceContainerLow: string; // a print
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  error: string;
  errorContainer: string;
  onErrorContainer: string;
  // Photobooth extras.
  print: string;
  printShadow: string;
  stamp: string;
  tape: string;
  fire: string;
  fireContainer: string;
  onFireContainer: string;
  shield: string;
};

export function makeTheme(appearance: Appearance, accentKey: AccentKey, systemDark: boolean): Theme {
  const dark = appearance === 'auto' ? systemDark : appearance === 'dark';
  const a = ACCENTS[accentKey] ?? ACCENTS.home;
  const primary = dark ? a.dark : a.light;
  if (dark)
    return {
      dark,
      appearance,
      accentKey,
      primary,
      onPrimary: '#0B1A12',
      primaryContainer: primary,
      onPrimaryContainer: '#0B1A12',
      secondaryContainer: a.softDark,
      onSecondaryContainer: '#EEF3EC',
      tertiaryContainer: '#4A3A0E',
      onTertiaryContainer: '#FFE7A8',
      surface: '#101A15',
      surfaceContainerLowest: '#0B130F',
      surfaceContainerLow: '#17231C',
      surfaceContainer: '#1C2A22',
      surfaceContainerHigh: '#223329',
      surfaceContainerHighest: '#2B3E33',
      onSurface: '#EEF3EC',
      onSurfaceVariant: '#A3B3A6',
      outline: '#647568',
      outlineVariant: '#2C3B31',
      error: '#FF8A80',
      errorContainer: '#5C1A17',
      onErrorContainer: '#FFDAD6',
      print: '#F3F1EC',
      printShadow: '#000000',
      stamp: '#FF7A2E',
      tape: 'rgba(255,240,190,0.55)',
      fire: '#FFB020',
      fireContainer: '#3D2A06',
      onFireContainer: '#FFD98A',
      shield: '#7FD0E8',
    };
  return {
    dark,
    appearance,
    accentKey,
    primary,
    onPrimary: '#FFFFFF',
    primaryContainer: primary,
    onPrimaryContainer: '#FFFFFF',
    secondaryContainer: a.soft,
    onSecondaryContainer: '#1F2A22',
    tertiaryContainer: '#FFEDB8',
    onTertiaryContainer: '#4A3500',
    surface: '#F4EDDF',
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow: '#FFFDF8',
    surfaceContainer: '#FAF5EA',
    surfaceContainerHigh: '#EAE1CE',
    surfaceContainerHighest: '#E0D5BE',
    onSurface: '#1F2A22',
    onSurfaceVariant: '#5E6B60',
    outline: '#8E9A8F',
    outlineVariant: '#DCD3C0',
    error: '#C62828',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#5C0A0A',
    print: '#FFFFFF',
    printShadow: '#4A3A1E',
    stamp: '#FF6A1A',
    tape: 'rgba(255,236,170,0.75)',
    fire: '#FF9F0A',
    fireContainer: '#FFE7B3',
    onFireContainer: '#5A3700',
    shield: '#1F7FA8',
  };
}

export const ThemeContext = createContext<Theme>(makeTheme('auto', 'home', false));
export const useTheme = () => useContext(ThemeContext);
export function useStyles<T>(make: (t: Theme) => T): T {
  const t = useTheme();
  return useMemo(() => make(t), [t, make]);
}

// Bricolage Grotesque for everything, Caveat for handwriting on prints, VT323 for the camera date stamp.
export const FONTS = {
  r: 'BricolageGrotesque_400Regular',
  m: 'BricolageGrotesque_500Medium',
  sb: 'BricolageGrotesque_600SemiBold',
  b: 'BricolageGrotesque_700Bold',
  xb: 'BricolageGrotesque_800ExtraBold',
  hand: 'Caveat_600SemiBold',
  stamp: 'VT323_400Regular',
};
const t = (size: number, line: number, family: string, spacing = 0): TextStyle => ({ fontFamily: family, fontSize: size, lineHeight: line, letterSpacing: spacing });

export const T = {
  displayLarge: t(56, 58, FONTS.xb, -1.5),
  displayLargeEmph: t(56, 58, FONTS.xb, -1.5),
  displayMedium: t(44, 46, FONTS.xb, -1),
  headlineLarge: t(32, 36, FONTS.xb, -0.6),
  headlineMedium: t(30, 34, FONTS.xb, -0.6),
  headlineMediumEmph: t(30, 34, FONTS.xb, -0.6),
  headlineSmall: t(24, 28, FONTS.b, -0.3),
  titleLarge: t(21, 26, FONTS.b, -0.2),
  titleLargeEmph: t(21, 26, FONTS.xb, -0.2),
  titleMedium: t(16, 21, FONTS.b, -0.1),
  titleSmall: t(14, 19, FONTS.b),
  bodyLarge: t(16, 23, FONTS.r),
  bodyMedium: t(14, 20, FONTS.r),
  bodySmall: t(12.5, 17, FONTS.r),
  labelLarge: t(14, 18, FONTS.sb),
  labelMedium: t(12, 16, FONTS.sb),
  labelSmall: t(11, 14, FONTS.sb),
  hero: { ...t(128, 120, FONTS.xb, -6), fontVariant: ['tabular-nums'] } as TextStyle,
  num: { fontVariant: ['tabular-nums'] } as TextStyle,
  hand: t(22, 24, FONTS.hand),
  stamp: t(20, 20, FONTS.stamp, 1),
};

export const S = { xs: 4, sm: 8, md: 12, lg: 16, lgInc: 20, xl: 24, xlInc: 28, xxl: 40, full: 999 };

const AVATAR = ['#E07A2E', '#1E7A55', '#C2185B', '#B26A00', '#0F8F8F', '#8B5E3C'];
export const colorFor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR[h % AVATAR.length];
};
