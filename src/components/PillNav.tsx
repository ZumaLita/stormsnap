import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

export type Tab = 'home' | 'streaks' | 'me';

const ITEMS: { key: Tab | 'snap'; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { key: 'home', icon: 'home-outline', label: 'Home' },
  { key: 'streaks', icon: 'flame-outline', label: 'Streaks' },
  { key: 'snap', icon: 'camera', label: 'Take a snap' },
  { key: 'me', icon: 'person-outline', label: 'Me' },
];

export function PillNav({ tab, onTab, onSnap }: { tab: Tab; onTab: (t: Tab) => void; onSnap: () => void }) {
  const t = useTheme();
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={[styles.pill, { backgroundColor: t.navBg }]}>
        {ITEMS.map((it) => {
          const active = it.key === tab;
          const isSnap = it.key === 'snap';
          const bg = isSnap ? t.accent : active ? t.navActive : t.navBtn;
          const fg = isSnap ? t.onAccent : active ? t.navActiveIcon : t.navIcon;
          return (
            <Pressable
              key={it.key}
              accessibilityLabel={it.label}
              onPress={() => (isSnap ? onSnap() : onTab(it.key as Tab))}
              style={({ pressed }) => [styles.btn, { backgroundColor: bg, transform: [{ scale: pressed ? 0.92 : 1 }] }]}
            >
              <Ionicons name={active && it.key === 'streaks' ? 'flame' : it.icon} size={22} color={fg} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 22, alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    gap: 8,
    padding: 6,
    borderRadius: 40,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  btn: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
