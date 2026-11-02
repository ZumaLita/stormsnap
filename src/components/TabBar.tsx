import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { S, T, useTheme } from '../theme';
import { Icon, Press, haptic, type IconName } from './ui';

export type Tab = 'home' | 'streaks' | 'memories' | 'me';

const ITEMS: { key: Tab; icon: IconName; on: IconName; label: string }[] = [
  { key: 'home', icon: 'home-outline', on: 'home', label: 'Today' },
  { key: 'streaks', icon: 'fire', on: 'fire', label: 'Streaks' },
  { key: 'memories', icon: 'image-multiple-outline', on: 'image-multiple', label: 'Memories' },
  { key: 'me', icon: 'account-circle-outline', on: 'account-circle', label: 'Me' },
];

export const TAB_BAR_HEIGHT = 80;

function NavItem({ item, on, onPress }: { item: (typeof ITEMS)[number]; on: boolean; onPress: () => void }) {
  const c = useTheme();
  const w = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(w, { toValue: on ? 1 : 0, useNativeDriver: false, speed: 18, bounciness: 8 }).start();
  }, [on, w]);
  return (
    <Pressable
      onPress={() => {
        if (!on) haptic();
        onPress();
      }}
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: on }}
      style={styles.item}
    >
      <View style={styles.indicatorWrap}>
        <Animated.View
          style={[
            styles.indicator,
            { backgroundColor: c.secondaryContainer, width: w.interpolate({ inputRange: [0, 1], outputRange: [32, 64] }), opacity: w },
          ]}
        />
        <Icon name={on ? item.on : item.icon} size={24} color={on ? c.onSecondaryContainer : c.onSurfaceVariant} />
      </View>
      <Text style={[T.labelMedium, { color: on ? c.onSurface : c.onSurfaceVariant, fontWeight: on ? '700' : '500', marginTop: 4 }]}>{item.label}</Text>
    </Pressable>
  );
}

export function TabBar({ tab, onTab, onSnap, extended }: { tab: Tab; onTab: (t: Tab) => void; onSnap: () => void; extended?: boolean }) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <>
      <View style={[styles.fabWrap, { bottom: TAB_BAR_HEIGHT + insets.bottom + 16 }]} pointerEvents="box-none">
        <Press
          onPress={onSnap}
          radius={S.lg}
          morph={S.xl}
          squish={0.92}
          accessibilityLabel="Take a snap"
          accessibilityRole="button"
          style={[styles.fab, { backgroundColor: c.primaryContainer, paddingHorizontal: extended ? 20 : 0, width: extended ? undefined : 64 }]}
        >
          <Icon name="camera" size={26} color={c.onPrimaryContainer} />
          {extended && <Text style={[T.titleMedium, { color: c.onPrimaryContainer }]}>Snap</Text>}
        </Press>
      </View>
      <View style={[styles.bar, { backgroundColor: c.surfaceContainer, paddingBottom: insets.bottom }]}>
        <View style={styles.row}>
          {ITEMS.map((it) => (
            <NavItem key={it.key} item={it} on={it.key === tab} onPress={() => onTab(it.key)} />
          ))}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  row: { flexDirection: 'row', height: TAB_BAR_HEIGHT, maxWidth: 640, width: '100%', alignSelf: 'center', paddingTop: 12 },
  item: { flex: 1, alignItems: 'center' },
  indicatorWrap: { width: 64, height: 32, alignItems: 'center', justifyContent: 'center' },
  indicator: { position: 'absolute', height: 32, borderRadius: 16 },
  fabWrap: { position: 'absolute', right: 16, left: 16, alignItems: 'flex-end', maxWidth: 640, alignSelf: 'center' },
  fab: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
