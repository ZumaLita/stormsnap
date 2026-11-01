export const C = {
  bgTop: '#FBE3EC',
  bgMid: '#F2C3D5',
  bgBottom: '#F7D9E4',
  glass: 'rgba(255,255,255,0.42)',
  glassStrong: 'rgba(255,255,255,0.72)',
  glassBorder: 'rgba(255,255,255,0.85)',
  ink: '#1C1418',
  inkSoft: '#4A3540',
  muted: '#8B6878',
  accent: '#E2668F',
  accentDeep: '#B8456D',
  nav: '#141113',
  navBtn: '#2A2427',
  white: '#FFFFFF',
  danger: '#C0392B',
  success: '#3FA36B',
  empty: 'rgba(28,20,24,0.12)',
};

export const F = {
  regular: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
  semibold: 'Figtree_600SemiBold',
  bold: 'Figtree_700Bold',
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
