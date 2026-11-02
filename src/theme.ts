import { createContext, useContext, useMemo } from 'react';

export type Theme = {
  key: ThemeKey;
  name: string;
  dark: boolean;
  bg: [string, string, string];
  blobA: string;
  blobB: string;
  glass: string;
  glassStrong: string;
  glassBorder: string;
  field: string;
  ink: string;
  inkSoft: string;
  muted: string;
  headline: string;
  headlineShadow: string;
  accent: string;
  accentDeep: string;
  accentSoft: string;
  accentBorder: string;
  onAccent: string;
  navBg: string;
  navBtn: string;
  navIcon: string;
  navActive: string;
  navActiveIcon: string;
  empty: string;
  future: string;
  fire: string;
  shield: string;
  danger: string;
  white: string;
};

export type ThemeKey = 'night' | 'ocean' | 'sunset' | 'clean' | 'forest' | 'pink';

const base = { white: '#FFFFFF', danger: '#E5484D', fire: '#FF7A1A', shield: '#3FA9F5' };

export const THEMES: Record<ThemeKey, Theme> = {
  night: {
    ...base,
    key: 'night',
    name: 'Night',
    dark: true,
    bg: ['#0B0C10', '#141722', '#0E1016'],
    blobA: 'rgba(79,140,255,0.16)',
    blobB: 'rgba(140,90,255,0.10)',
    glass: 'rgba(255,255,255,0.06)',
    glassStrong: 'rgba(255,255,255,0.09)',
    glassBorder: 'rgba(255,255,255,0.12)',
    field: 'rgba(255,255,255,0.08)',
    ink: '#F4F6FA',
    inkSoft: '#C9CEDA',
    muted: '#8B93A5',
    headline: '#FFFFFF',
    headlineShadow: 'rgba(79,140,255,0.35)',
    accent: '#4F8CFF',
    accentDeep: '#8DB5FF',
    accentSoft: 'rgba(79,140,255,0.18)',
    accentBorder: 'rgba(79,140,255,0.45)',
    onAccent: '#FFFFFF',
    navBg: '#F4F6FA',
    navBtn: '#E2E6EE',
    navIcon: '#0B0C10',
    navActive: '#0B0C10',
    navActiveIcon: '#FFFFFF',
    empty: 'rgba(255,255,255,0.10)',
    future: 'rgba(255,255,255,0.04)',
  },
  ocean: {
    ...base,
    key: 'ocean',
    name: 'Ocean',
    dark: false,
    bg: ['#EAF3FC', '#BCD7F3', '#DCEBFA'],
    blobA: 'rgba(255,255,255,0.55)',
    blobB: 'rgba(31,111,200,0.14)',
    glass: 'rgba(255,255,255,0.45)',
    glassStrong: 'rgba(255,255,255,0.75)',
    glassBorder: 'rgba(255,255,255,0.9)',
    field: 'rgba(255,255,255,0.85)',
    ink: '#0F2238',
    inkSoft: '#2F4A68',
    muted: '#5F7895',
    headline: '#0F2238',
    headlineShadow: 'rgba(0,0,0,0)',
    accent: '#1F6FC8',
    accentDeep: '#174F8F',
    accentSoft: '#DCEAFB',
    accentBorder: '#A9C9EF',
    onAccent: '#FFFFFF',
    navBg: '#0F1A26',
    navBtn: '#24313F',
    navIcon: '#FFFFFF',
    navActive: '#FFFFFF',
    navActiveIcon: '#0F1A26',
    empty: 'rgba(15,34,56,0.12)',
    future: 'rgba(15,34,56,0.05)',
  },
  sunset: {
    ...base,
    key: 'sunset',
    name: 'Sunset',
    dark: false,
    bg: ['#FFF1E4', '#FFC49A', '#FFE2C9'],
    blobA: 'rgba(255,255,255,0.5)',
    blobB: 'rgba(232,89,12,0.14)',
    glass: 'rgba(255,255,255,0.45)',
    glassStrong: 'rgba(255,255,255,0.75)',
    glassBorder: 'rgba(255,255,255,0.9)',
    field: 'rgba(255,255,255,0.85)',
    ink: '#2A160A',
    inkSoft: '#5A3A24',
    muted: '#8C6A52',
    headline: '#2A160A',
    headlineShadow: 'rgba(0,0,0,0)',
    accent: '#E8590C',
    accentDeep: '#B04208',
    accentSoft: '#FFE3D0',
    accentBorder: '#FFC09A',
    onAccent: '#FFFFFF',
    navBg: '#1E140E',
    navBtn: '#3A2A20',
    navIcon: '#FFFFFF',
    navActive: '#FFFFFF',
    navActiveIcon: '#1E140E',
    empty: 'rgba(42,22,10,0.12)',
    future: 'rgba(42,22,10,0.05)',
  },
  clean: {
    ...base,
    key: 'clean',
    name: 'Clean',
    dark: false,
    bg: ['#FFFFFF', '#F2F3F5', '#F7F7F8'],
    blobA: 'rgba(0,0,0,0)',
    blobB: 'rgba(0,0,0,0)',
    glass: '#FFFFFF',
    glassStrong: '#FFFFFF',
    glassBorder: '#E6E7EA',
    field: '#F4F5F7',
    ink: '#111214',
    inkSoft: '#3D4047',
    muted: '#7A7E87',
    headline: '#111214',
    headlineShadow: 'rgba(0,0,0,0)',
    accent: '#111214',
    accentDeep: '#111214',
    accentSoft: '#F0F1F3',
    accentBorder: '#D5D7DB',
    onAccent: '#FFFFFF',
    navBg: '#111214',
    navBtn: '#2A2C30',
    navIcon: '#FFFFFF',
    navActive: '#FFFFFF',
    navActiveIcon: '#111214',
    empty: 'rgba(17,18,20,0.10)',
    future: 'rgba(17,18,20,0.04)',
  },
  forest: {
    ...base,
    key: 'forest',
    name: 'Forest',
    dark: true,
    bg: ['#0C1410', '#14231B', '#0E1712'],
    blobA: 'rgba(76,201,140,0.14)',
    blobB: 'rgba(200,230,120,0.08)',
    glass: 'rgba(255,255,255,0.06)',
    glassStrong: 'rgba(255,255,255,0.09)',
    glassBorder: 'rgba(255,255,255,0.12)',
    field: 'rgba(255,255,255,0.08)',
    ink: '#F1F7F3',
    inkSoft: '#C6D6CC',
    muted: '#8AA394',
    headline: '#FFFFFF',
    headlineShadow: 'rgba(76,201,140,0.35)',
    accent: '#3DCB8A',
    accentDeep: '#8FE6BC',
    accentSoft: 'rgba(61,203,138,0.18)',
    accentBorder: 'rgba(61,203,138,0.45)',
    onAccent: '#06130C',
    navBg: '#F1F7F3',
    navBtn: '#DDE8E1',
    navIcon: '#0C1410',
    navActive: '#0C1410',
    navActiveIcon: '#FFFFFF',
    empty: 'rgba(255,255,255,0.10)',
    future: 'rgba(255,255,255,0.04)',
  },
  pink: {
    ...base,
    key: 'pink',
    name: 'Pink',
    dark: false,
    bg: ['#FBE3EC', '#F2C3D5', '#F7D9E4'],
    blobA: 'rgba(255,255,255,0.45)',
    blobB: 'rgba(226,102,143,0.18)',
    glass: 'rgba(255,255,255,0.42)',
    glassStrong: 'rgba(255,255,255,0.72)',
    glassBorder: 'rgba(255,255,255,0.85)',
    field: 'rgba(255,255,255,0.8)',
    ink: '#1C1418',
    inkSoft: '#4A3540',
    muted: '#8B6878',
    headline: '#1C1418',
    headlineShadow: 'rgba(0,0,0,0)',
    accent: '#E2668F',
    accentDeep: '#B8456D',
    accentSoft: '#FCE1EB',
    accentBorder: '#F3B5CB',
    onAccent: '#FFFFFF',
    navBg: '#141113',
    navBtn: '#2A2427',
    navIcon: '#FFFFFF',
    navActive: '#FFFFFF',
    navActiveIcon: '#141113',
    empty: 'rgba(28,20,24,0.12)',
    future: 'rgba(28,20,24,0.05)',
  },
};

export const THEME_ORDER: ThemeKey[] = ['night', 'ocean', 'sunset', 'forest', 'clean', 'pink'];
export const DEFAULT_THEME: ThemeKey = 'night';

export const ThemeContext = createContext<Theme>(THEMES[DEFAULT_THEME]);
export const useTheme = () => useContext(ThemeContext);

/** Builds a theme-aware StyleSheet once per theme. */
export function useStyles<T>(make: (t: Theme) => T): T {
  const t = useTheme();
  return useMemo(() => make(t), [t, make]);
}

export const F = {
  regular: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
  semibold: 'Figtree_600SemiBold',
  bold: 'Figtree_700Bold',
  black: 'Figtree_800ExtraBold',
  italic: 'Figtree_500Medium_Italic',
  boldItalic: 'Figtree_700Bold_Italic',
  lightItalic: 'Figtree_300Light_Italic',
};

const AVATAR_COLORS = ['#E2668F', '#9B6CD8', '#F0A04B', '#3FA3A0', '#5B8DEF', '#D8577B'];
export const colorFor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};
