import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ImageStyle, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { C, F, colorFor } from '../theme';
import { photo } from '../api';

export function Background({ children }: { children: React.ReactNode }) {
  return (
    <LinearGradient colors={[C.bgTop, C.bgMid, C.bgBottom]} locations={[0, 0.55, 1]} style={{ flex: 1 }}>
      <View style={[styles.blob, { top: -80, right: -60, backgroundColor: 'rgba(255,255,255,0.45)' }]} />
      <View style={[styles.blob, { top: 320, left: -120, backgroundColor: 'rgba(226,102,143,0.18)' }]} />
      {children}
    </LinearGradient>
  );
}

export function Glass({
  children,
  style,
  strong,
  radius = 28,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  strong?: boolean;
  radius?: number;
}) {
  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden' }, styles.glassShadow, style]}>
      <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: strong ? C.glassStrong : C.glass,
            borderRadius: radius,
            borderWidth: 1,
            borderColor: C.glassBorder,
          },
        ]}
      />
      {children}
    </View>
  );
}

export function Avatar({ id, name, size = 40, ring }: { id: string; name: string; size?: number; ring?: boolean }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colorFor(id),
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: ring ? 3 : 0,
        borderColor: C.white,
      }}
    >
      <Text style={{ color: C.white, fontFamily: F.bold, fontSize: size * 0.42 }}>
        {(name || '?').charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

export function RoundButton({
  icon,
  onPress,
  dark,
  size = 46,
  label,
  dot,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  dark?: boolean;
  size?: number;
  label?: string;
  dot?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: dark ? 'rgba(20,17,19,0.35)' : C.glassStrong,
          borderWidth: 1,
          borderColor: dark ? 'rgba(255,255,255,0.35)' : C.glassBorder,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
      ]}
    >
      <Ionicons name={icon} size={size * 0.45} color={dark ? C.white : C.ink} />
      {dot && <View style={styles.dot} />}
    </Pressable>
  );
}

export function PillButton({
  title,
  onPress,
  dark,
  icon,
  busy,
  style,
}: {
  title: string;
  onPress?: () => void;
  dark?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={busy ? undefined : onPress}
      style={({ pressed }) => [
        styles.pill,
        dark ? { backgroundColor: C.nav } : { backgroundColor: C.glassStrong, borderWidth: 1, borderColor: C.glassBorder },
        { transform: [{ scale: pressed ? 0.97 : 1 }], opacity: busy ? 0.7 : 1 },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={dark ? C.white : C.ink} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={dark ? C.white : C.ink} />}
          <Text style={{ fontFamily: F.semibold, fontSize: 15, color: dark ? C.white : C.ink }}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

/** Loads a private photo from Appwrite and shows it. */
export function SnapImage({ fileId, style }: { fileId: string; style?: StyleProp<ImageStyle> }) {
  const [uri, setUri] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    setFailed(false);
    photo(fileId)
      .then((u) => alive && setUri(u))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [fileId]);
  if (!uri)
    return (
      <View style={[style as StyleProp<ViewStyle>, styles.imgPlaceholder]}>
        {failed ? <Ionicons name="image-outline" size={22} color={C.muted} /> : <ActivityIndicator color={C.accent} />}
      </View>
    );
  return <Image source={{ uri }} style={style} resizeMode="cover" />;
}

/** Little row of hour blocks: filled = snapped that hour. */
export function HourBlocks({ hours, start, end, size = 9 }: { hours: Set<number>; start: number; end: number; size?: number }) {
  const now = new Date().getHours();
  const cells = [];
  for (let h = start; h <= end; h++) {
    const filled = hours.has(h);
    cells.push(
      <View
        key={h}
        style={{
          width: size,
          height: size,
          borderRadius: 3,
          backgroundColor: filled ? C.accent : h > now ? 'rgba(28,20,24,0.06)' : C.empty,
        }}
      />,
    );
  }
  return <View style={{ flexDirection: 'row', gap: 3, flexWrap: 'wrap' }}>{cells}</View>;
}

const styles = StyleSheet.create({
  blob: { position: 'absolute', width: 320, height: 320, borderRadius: 160 },
  glassShadow: {
    shadowColor: '#B8456D',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 0,
  },
  pill: {
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 22,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.accent,
    borderWidth: 1.5,
    borderColor: C.white,
  },
  imgPlaceholder: { backgroundColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' },
});
