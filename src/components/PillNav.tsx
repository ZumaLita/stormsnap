import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../theme';

export type Tab = 'home' | 'family' | 'me';

const ITEMS: { key: Tab | 'snap'; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { key: 'home', icon: 'home-outline', label: 'Home' },
  { key: 'family', icon: 'grid-outline', label: 'Family day' },
  { key: 'snap', icon: 'camera', label: 'Take a snap' },
  { key: 'me', icon: 'person-outline', label: 'Me' },
];

export function PillNav({ tab, onTab, onSnap }: { tab: Tab; onTab: (t: Tab) => void; onSnap: () => void }) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.pill}>
        {ITEMS.map((it) => {
          const active = it.key === tab;
          const isSnap = it.key === 'snap';
          return (
            <Pressable
              key={it.key}
              accessibilityLabel={it.label}
              onPress={() => (isSnap ? onSnap() : onTab(it.key as Tab))}
              style={({ pressed }) => [
                styles.btn,
                active && styles.active,
                isSnap && styles.snap,
                { transform: [{ scale: pressed ? 0.92 : 1 }] },
              ]}
            >
              <Ionicons name={it.icon} size={22} color={active ? C.ink : C.white} />
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
    backgroundColor: C.nav,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  btn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.navBtn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: { backgroundColor: C.white },
  snap: { backgroundColor: C.accent },
});
