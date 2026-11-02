import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Image,
  ImageStyle,
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { R, T, colorFor, useTheme } from '../theme';
import { photo } from '../api';

export type IconName = keyof typeof Ionicons.glyphMap;

let reduceMotion = false;
AccessibilityInfo.isReduceMotionEnabled?.().then((v) => (reduceMotion = v)).catch(() => {});
AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v) => (reduceMotion = v));

export const tapHaptic = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
};

/** Pressable that springs down a little when touched (instant fade when Reduce Motion is on). */
export function PressScale({
  children,
  style,
  scaleTo = 0.96,
  haptic,
  onPress,
  ...rest
}: PressableProps & { style?: StyleProp<ViewStyle>; scaleTo?: number; haptic?: boolean; children?: React.ReactNode }) {
  const v = useRef(new Animated.Value(1)).current;
  const to = (value: number, pressIn: boolean) => {
    if (reduceMotion) {
      Animated.timing(v, { toValue: pressIn ? 0.98 : 1, duration: 80, useNativeDriver: Platform.OS !== 'web' }).start();
      return;
    }
    Animated.spring(v, {
      toValue: value,
      useNativeDriver: Platform.OS !== 'web',
      speed: pressIn ? 40 : 18,
      bounciness: pressIn ? 0 : 6,
    }).start();
  };
  return (
    <Pressable
      {...rest}
      onPressIn={() => to(scaleTo, true)}
      onPressOut={() => to(1, false)}
      onPress={(e) => {
        if (haptic) tapHaptic();
        onPress?.(e);
      }}
    >
      <Animated.View style={[style, { transform: [{ scale: v }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

export function Avatar({ id, name, size = 40 }: { id: string; name: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colorFor(id), alignItems: 'center', justifyContent: 'center' }}>
      <Text style={[T.headline, { color: '#FFFFFF', fontSize: size * 0.42, lineHeight: size * 0.5 }]}>{(name || '?').charAt(0).toUpperCase()}</Text>
    </View>
  );
}

/** Large title header like iOS navigation bars. */
export function LargeTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  const c = useTheme();
  return (
    <View style={styles.titleRow}>
      <View style={{ flex: 1 }}>
        {!!subtitle && <Text style={[T.footnote, { color: c.secondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 }]}>{subtitle}</Text>}
        <Text style={[T.largeTitle, { color: c.label }]}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

/** Inset grouped section. */
export function Section({
  title,
  footer,
  children,
  style,
  padded,
}: {
  title?: string;
  footer?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  const c = useTheme();
  return (
    <View style={[{ marginTop: 28 }, style]}>
      {!!title && <Text style={[T.footnote, styles.sectionTitle, { color: c.secondary }]}>{title.toUpperCase()}</Text>}
      <View style={[{ backgroundColor: c.card, borderRadius: R.card, overflow: 'hidden' }, padded && { padding: 16 }]}>{children}</View>
      {!!footer && <Text style={[T.footnote, styles.sectionFooter, { color: c.secondary }]}>{footer}</Text>}
    </View>
  );
}

export function Row({
  icon,
  iconBg,
  title,
  subtitle,
  value,
  right,
  onPress,
  destructive,
  chevron,
  last,
}: {
  icon?: IconName;
  iconBg?: string;
  title: string;
  subtitle?: string;
  value?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  chevron?: boolean;
  last?: boolean;
}) {
  const c = useTheme();
  const body = (
    <View style={styles.row}>
      {icon && (
        <View style={[styles.rowIcon, { backgroundColor: iconBg ?? c.accent }]}>
          <Ionicons name={icon} size={17} color="#FFFFFF" />
        </View>
      )}
      <View style={[styles.rowMain, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.separator }]}>
        <View style={{ flex: 1 }}>
          <Text style={[T.body, { color: destructive ? c.red : c.label }]}>{title}</Text>
          {!!subtitle && <Text style={[T.footnote, { color: c.secondary, marginTop: 1 }]}>{subtitle}</Text>}
        </View>
        {!!value && <Text style={[T.body, { color: c.secondary }]}>{value}</Text>}
        {right}
        {chevron && <Ionicons name="chevron-forward" size={17} color={c.tertiary} style={{ marginLeft: 6 }} />}
      </View>
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ backgroundColor: pressed ? c.fill : 'transparent' })}>
      {body}
    </Pressable>
  );
}

export function Button({
  title,
  onPress,
  kind = 'filled',
  icon,
  busy,
  style,
}: {
  title: string;
  onPress?: () => void;
  kind?: 'filled' | 'tinted' | 'gray' | 'plain';
  icon?: IconName;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useTheme();
  const bg = kind === 'filled' ? c.accent : kind === 'tinted' ? c.accentTint : kind === 'gray' ? c.fill : 'transparent';
  const fg = kind === 'filled' ? c.onAccent : kind === 'gray' ? c.label : c.accent;
  return (
    <PressScale onPress={busy ? undefined : onPress} haptic style={[styles.button, { backgroundColor: bg, opacity: busy ? 0.7 : 1 }, style]}>
      {busy ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={19} color={fg} />}
          <Text style={[T.headline, { color: fg }]}>{title}</Text>
        </>
      )}
    </PressScale>
  );
}

export function Segmented<K extends string>({ items, value, onChange }: { items: { key: K; label: string }[]; value: K; onChange: (k: K) => void }) {
  const c = useTheme();
  return (
    <View style={[styles.seg, { backgroundColor: c.fill }]}>
      {items.map((it) => {
        const on = it.key === value;
        return (
          <Pressable
            key={it.key}
            onPress={() => {
              tapHaptic();
              onChange(it.key);
            }}
            style={[styles.segItem, on && { backgroundColor: c.dark ? '#636366' : '#FFFFFF', ...styles.segShadow }]}
          >
            <Text style={[T.footnote, { color: c.label, fontWeight: on ? '600' : '500' }]}>{it.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Loads a private photo from Appwrite and shows it. */
export function SnapImage({ fileId, style }: { fileId: string; style?: StyleProp<ImageStyle> }) {
  const c = useTheme();
  const [uri, setUri] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let alive = true;
    setFailed(false);
    photo(fileId)
      .then((u) => {
        if (!alive) return;
        setUri(u);
        Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: Platform.OS !== 'web' }).start();
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [fileId, fade]);
  return (
    <View style={[style as StyleProp<ViewStyle>, { backgroundColor: c.fill, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }]}>
      {failed && <Ionicons name="image-outline" size={22} color={c.tertiary} />}
      {uri && <Animated.Image source={{ uri }} style={[StyleSheet.absoluteFill, { opacity: fade }]} resizeMode="cover" />}
    </View>
  );
}

/** A snap as a tile: back photo with the selfie in the corner. */
export function SnapTile({
  back,
  front,
  width,
  label,
  badge,
  onPress,
}: {
  back: string;
  front: string;
  width: number;
  label?: string;
  badge?: React.ReactNode;
  onPress?: () => void;
}) {
  const h = (width * 4) / 3;
  const inset = Math.round(width * 0.3);
  return (
    <PressScale onPress={onPress} scaleTo={0.97} style={{ width, height: h, borderRadius: R.tile, overflow: 'hidden' }}>
      <SnapImage fileId={back} style={{ width, height: h }} />
      <View style={[styles.tileInset, { width: inset, height: (inset * 4) / 3 }]}>
        <SnapImage fileId={front} style={StyleSheet.absoluteFill as ImageStyle} />
      </View>
      {!!label && (
        <View style={styles.tileLabel}>
          <Text style={[T.caption2, { color: '#FFFFFF', fontWeight: '600' }]}>{label}</Text>
        </View>
      )}
      {badge && <View style={styles.tileBadge}>{badge}</View>}
    </PressScale>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingTop: 8, paddingBottom: 4 },
  sectionTitle: { marginLeft: 16, marginBottom: 7 },
  sectionFooter: { marginHorizontal: 16, marginTop: 7 },
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, minHeight: 44 },
  rowIcon: { width: 29, height: 29, borderRadius: 7, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingRight: 16, gap: 8, minHeight: 44 },
  button: { height: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20 },
  seg: { flexDirection: 'row', borderRadius: 9, padding: 2 },
  segItem: { flex: 1, height: 30, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  segShadow: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  tileInset: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 9,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  tileLabel: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  tileBadge: { position: 'absolute', right: 8, bottom: 8 },
});
