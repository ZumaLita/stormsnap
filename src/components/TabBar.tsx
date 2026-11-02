import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, useTheme } from '../theme';
import { PressScale, tapHaptic, type IconName } from './ui';

export type Tab = 'home' | 'streaks' | 'memories' | 'me';

const LEFT: { key: Tab; icon: IconName; on: IconName; label: string }[] = [
  { key: 'home', icon: 'home-outline', on: 'home', label: 'Today' },
  { key: 'streaks', icon: 'flame-outline', on: 'flame', label: 'Streaks' },
];
const RIGHT: { key: Tab; icon: IconName; on: IconName; label: string }[] = [
  { key: 'memories', icon: 'images-outline', on: 'images', label: 'Memories' },
  { key: 'me', icon: 'person-circle-outline', on: 'person-circle', label: 'Me' },
];

export const TAB_BAR_HEIGHT = 64;

export function TabBar({ tab, onTab, onSnap }: { tab: Tab; onTab: (t: Tab) => void; onSnap: () => void }) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const item = (it: (typeof LEFT)[number]) => {
    const on = it.key === tab;
    return (
      <Pressable
        key={it.key}
        accessibilityRole="tab"
        accessibilityLabel={it.label}
        accessibilityState={{ selected: on }}
        onPress={() => {
          if (!on) tapHaptic();
          onTab(it.key);
        }}
        style={styles.item}
      >
        <Ionicons name={on ? it.on : it.icon} size={25} color={on ? c.accent : c.secondary} />
        <Text style={[T.caption2, { color: on ? c.accent : c.secondary, marginTop: 2 }]}>{it.label}</Text>
      </Pressable>
    );
  };
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <BlurView intensity={60} tint={c.dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: c.barBg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.separator }]} />
      <View style={styles.row}>
        {LEFT.map(item)}
        <View style={styles.item}>
          <PressScale onPress={onSnap} haptic scaleTo={0.9} accessibilityLabel="Take a snap" style={[styles.snapRing, { borderColor: c.accent }]}>
            <View style={[styles.snapInner, { backgroundColor: c.accent }]}>
              <Ionicons name="camera" size={22} color={c.onAccent} />
            </View>
          </PressScale>
        </View>
        {RIGHT.map(item)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', maxWidth: 600, width: '100%', alignSelf: 'center' },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 50 },
  snapRing: { width: 54, height: 54, borderRadius: 27, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  snapInner: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
