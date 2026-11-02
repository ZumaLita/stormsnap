import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ImageStyle, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { F, colorFor, useTheme } from '../theme';
import { photo } from '../api';

export function Background({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <LinearGradient colors={t.bg} locations={[0, 0.55, 1]} style={{ flex: 1 }}>
      <View style={[styles.blob, { top: -80, right: -60, backgroundColor: t.blobA }]} />
      <View style={[styles.blob, { top: 320, left: -120, backgroundColor: t.blobB }]} />
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
  const t = useTheme();
  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden' }, style]}>
      <BlurView intensity={30} tint={t.dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: strong ? t.glassStrong : t.glass,
            borderRadius: radius,
            borderWidth: 1,
            borderColor: t.glassBorder,
          },
        ]}
      />
      {children}
    </View>
  );
}

export function Avatar({ id, name, size = 40, ring }: { id: string; name: string; size?: number; ring?: boolean }) {
  const t = useTheme();
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
        borderColor: t.dark ? 'rgba(255,255,255,0.85)' : '#FFFFFF',
      }}
    >
      <Text style={{ color: '#FFFFFF', fontFamily: F.bold, fontSize: size * 0.42 }}>{(name || '?').charAt(0).toUpperCase()}</Text>
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
  const t = useTheme();
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
          backgroundColor: dark ? 'rgba(20,17,19,0.35)' : t.field,
          borderWidth: 1,
          borderColor: dark ? 'rgba(255,255,255,0.35)' : t.glassBorder,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
      ]}
    >
      <Ionicons name={icon} size={size * 0.45} color={dark ? '#FFFFFF' : t.ink} />
      {dot && <View style={[styles.dot, { backgroundColor: t.accent }]} />}
    </Pressable>
  );
}

export function PillButton({
  title,
  onPress,
  dark,
  accent,
  icon,
  busy,
  style,
}: {
  title: string;
  onPress?: () => void;
  dark?: boolean;
  accent?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const bg = accent ? t.accent : dark ? t.navBg : t.field;
  const fg = accent ? t.onAccent : dark ? t.navIcon : t.ink;
  return (
    <Pressable
      onPress={busy ? undefined : onPress}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: bg },
        !dark && !accent && { borderWidth: 1, borderColor: t.glassBorder },
        { transform: [{ scale: pressed ? 0.97 : 1 }], opacity: busy ? 0.7 : 1 },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={fg} />}
          <Text style={{ fontFamily: F.semibold, fontSize: 15, color: fg }}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

/** Loads a private photo from Appwrite and shows it. */
export function SnapImage({ fileId, style }: { fileId: string; style?: StyleProp<ImageStyle> }) {
  const t = useTheme();
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
      <View style={[style as StyleProp<ViewStyle>, styles.imgPlaceholder, { backgroundColor: t.glass }]}>
        {failed ? <Ionicons name="image-outline" size={22} color={t.muted} /> : <ActivityIndicator color={t.accent} />}
      </View>
    );
  return <Image source={{ uri }} style={style} resizeMode="cover" />;
}

const styles = StyleSheet.create({
  blob: { position: 'absolute', width: 320, height: 320, borderRadius: 160 },
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
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  imgPlaceholder: { alignItems: 'center', justifyContent: 'center' },
});
