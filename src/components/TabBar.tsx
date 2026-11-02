import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS, T, useTheme } from '../theme';
import { Icon, Press, haptic, type IconName } from './ui';

export type Tab = 'home' | 'streaks' | 'memories' | 'me';

const LEFT: { key: Tab; icon: IconName; on: IconName; label: string }[] = [
  { key: 'home', icon: 'image-filter-hdr', on: 'image-filter-hdr', label: 'Feed' },
  { key: 'streaks', icon: 'fire', on: 'fire', label: 'Streaks' },
];
const RIGHT: { key: Tab; icon: IconName; on: IconName; label: string }[] = [
  { key: 'memories', icon: 'pin-outline', on: 'pin', label: 'Kept' },
  { key: 'me', icon: 'account-circle-outline', on: 'account-circle', label: 'Me' },
];

export const TAB_BAR_HEIGHT = 72;

export function TabBar({ tab, onTab, onSnap }: { tab: Tab; onTab: (t: Tab) => void; onSnap: () => void; extended?: boolean }) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const item = (it: (typeof LEFT)[number]) => {
    const on = it.key === tab;
    return (
      <Pressable
        key={it.key}
        onPress={() => {
          if (!on) haptic();
          onTab(it.key);
        }}
        accessibilityRole="tab"
        accessibilityLabel={it.label}
        accessibilityState={{ selected: on }}
        style={styles.item}
      >
        <Icon name={on ? it.on : it.icon} size={25} color={on ? c.onSurface : c.outline} />
        <Text style={[T.labelSmall, { color: on ? c.onSurface : c.outline, fontFamily: on ? FONTS.xb : FONTS.sb, marginTop: 2 }]}>{it.label}</Text>
        <View style={[styles.mark, { backgroundColor: on ? c.primary : 'transparent' }]} />
      </Pressable>
    );
  };
  return (
    <View style={[styles.bar, { backgroundColor: c.surfaceContainerLow, paddingBottom: insets.bottom, borderTopColor: c.outlineVariant }]}>
      <View style={styles.row}>
        {LEFT.map(item)}
        <View style={[styles.item, { justifyContent: 'flex-start' }]}>
          <View style={styles.lift}>
          <Press onPress={onSnap} radius={34} squish={0.88} accessibilityLabel="Take a snap" accessibilityRole="button" style={[styles.shutter, { borderColor: c.onSurface, backgroundColor: c.surfaceContainerLow }]}>
            <View style={[styles.shutterInner, { backgroundColor: c.primary }]}>
              <Icon name="camera-iris" size={28} color={c.onPrimary} />
            </View>
          </Press>
          </View>
        </View>
        {RIGHT.map(item)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', height: TAB_BAR_HEIGHT, maxWidth: 600, width: '100%', alignSelf: 'center' },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', height: TAB_BAR_HEIGHT },
  mark: { width: 18, height: 3, borderRadius: 2, marginTop: 4 },
  shutter: { width: 68, height: 68, borderRadius: 34, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  lift: { marginTop: -22, borderRadius: 34, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  shutterInner: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
});
