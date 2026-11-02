import React, { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Avatar, Card, Icon, IconButton, Press, SnapImage } from './ui';
import { S, T, useTheme } from '../theme';
import { REACTIONS } from '../config';
import type { Snap } from '../api';

function timeLabel(iso: string) {
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  return hhmm;
}

/** Big V1-style snap card for the vertical feed. */
export function SnapCard({
  snap,
  meId,
  onReact,
  onKeep,
  onDelete,
}: {
  snap: Snap;
  meId: string;
  onReact: (emoji: string) => void;
  onKeep: () => void;
  onDelete: () => void;
}) {
  const c = useTheme();
  const { width } = useWindowDimensions();
  const [swapped, setSwapped] = useState(false);
  const [picker, setPicker] = useState(false);
  const cardW = Math.min(width, 640) - 32;
  const photoW = cardW - 16;
  const photoH = Math.round((photoW * 4) / 3);
  const insetW = Math.round(photoW * 0.3);
  const kept = snap.keptBy.includes(meId);
  const mine = snap.reactions.find((r) => r.startsWith(meId + ':'))?.split(':')[1];
  const counts = new Map<string, number>();
  snap.reactions.forEach((r) => {
    const e = r.split(':')[1];
    counts.set(e, (counts.get(e) ?? 0) + 1);
  });

  const confirmDelete = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this snap for the whole family?')) onDelete();
    } else
      Alert.alert('Delete snap?', 'It disappears for the whole family.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]);
  };

  return (
    <Card tone="low" style={styles.card}>
      <View style={styles.head}>
        <Avatar id={snap.authorId} name={snap.authorName} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={[T.titleMedium, { color: c.onSurface }]}>{snap.authorId === meId ? 'You' : snap.authorName}</Text>
          <Text style={[T.bodySmall, { color: c.onSurfaceVariant }]}>
            {timeLabel(snap.$createdAt)}
            {snap.onTime ? '' : ' · extra snap'}
          </Text>
        </View>
        {snap.authorId === meId && <IconButton icon="delete-outline" label="Delete snap" onPress={confirmDelete} />}
      </View>

      <Pressable onPress={() => setSwapped((x) => !x)} accessibilityLabel="Swap photos" style={{ width: photoW, height: photoH, borderRadius: S.xl, overflow: 'hidden', alignSelf: 'center' }}>
        <SnapImage fileId={swapped ? snap.frontId : snap.backId} style={{ width: photoW, height: photoH }} />
        <View style={[styles.inset, { width: insetW, height: Math.round((insetW * 4) / 3) }]}>
          <SnapImage fileId={swapped ? snap.backId : snap.frontId} style={StyleSheet.absoluteFill as never} />
        </View>
        <View style={[styles.hour, { backgroundColor: c.surfaceContainerHighest }]}>
          <Text style={[T.labelLarge, { color: c.onSurface }]}>{String(snap.hour).padStart(2, '0')}u</Text>
        </View>
      </Pressable>

      {!!snap.caption && <Text style={[T.bodyLarge, { color: c.onSurface, paddingHorizontal: 16, paddingTop: 12 }]}>{snap.caption}</Text>}

      <View style={styles.actions}>
        <Press
          onPress={() => setPicker((p) => !p)}
          radius={S.sm}
          style={[styles.chip, { backgroundColor: mine ? c.secondaryContainer : 'transparent', borderColor: mine ? 'transparent' : c.outlineVariant }]}
        >
          {mine ? <Text style={{ fontSize: 16 }}>{mine}</Text> : <Icon name="emoticon-outline" size={18} color={c.onSurfaceVariant} />}
          <Text style={[T.labelLarge, { color: mine ? c.onSecondaryContainer : c.onSurfaceVariant }]}>{snap.reactions.length || 'React'}</Text>
        </Press>
        <View style={{ flexDirection: 'row', gap: 6, flex: 1, flexWrap: 'wrap' }}>
          {[...counts.entries()].slice(0, 4).map(([e, n]) => (
            <Text key={e} style={[T.labelLarge, { color: c.onSurfaceVariant }]}>
              {e}
              {n > 1 ? ` ${n}` : ''}
            </Text>
          ))}
        </View>
        <Press
          onPress={onKeep}
          radius={S.sm}
          accessibilityLabel={kept ? 'Remove from memories' : 'Keep forever'}
          style={[styles.chip, { backgroundColor: kept ? c.tertiaryContainer : 'transparent', borderColor: kept ? 'transparent' : c.outlineVariant }]}
        >
          <Icon name={kept ? 'star' : 'star-outline'} size={18} color={kept ? c.onTertiaryContainer : c.onSurfaceVariant} />
          <Text style={[T.labelLarge, { color: kept ? c.onTertiaryContainer : c.onSurfaceVariant }]}>{kept ? 'Kept' : 'Keep'}</Text>
        </Press>
      </View>

      {picker && (
        <View style={[styles.picker, { backgroundColor: c.surfaceContainerHighest }]}>
          {REACTIONS.map((e) => (
            <Press
              key={e}
              onPress={() => {
                setPicker(false);
                onReact(e);
              }}
              morph={S.md}
              squish={0.85}
              accessibilityLabel={`React ${e}`}
              style={[styles.emoji, mine === e && { backgroundColor: c.secondaryContainer }]}
            >
              <Text style={{ fontSize: 24 }}>{e}</Text>
            </Press>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12, paddingBottom: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 16, paddingRight: 4, paddingVertical: 8, minHeight: 64 },
  inset: { position: 'absolute', top: 12, left: 12, borderRadius: S.lg, overflow: 'hidden', borderWidth: 2.5, borderColor: '#FFFFFF' },
  hour: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 10, height: 28, borderRadius: S.full, justifyContent: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 36, paddingHorizontal: 12, borderWidth: 1 },
  picker: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 12, marginTop: 10, borderRadius: S.full, padding: 4 },
  emoji: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
