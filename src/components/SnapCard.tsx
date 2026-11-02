import React, { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Avatar, Glass, SnapImage } from './ui';
import { F, useStyles, useTheme, type Theme } from '../theme';
import { REACTIONS } from '../config';
import type { Snap } from '../api';

function timeLabel(iso: string) {
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago · ${hhmm}`;
  return hhmm;
}

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
  const C = useTheme();
  const styles = useStyles(makeStyles);
  const [swapped, setSwapped] = useState(false);
  const [picker, setPicker] = useState(false);
  const big = swapped ? snap.frontId : snap.backId;
  const small = swapped ? snap.backId : snap.frontId;
  const kept = snap.keptBy.includes(meId);
  const myReaction = snap.reactions.find((r) => r.startsWith(meId + ':'))?.split(':')[1];

  const counts = new Map<string, number>();
  snap.reactions.forEach((r) => {
    const e = r.split(':')[1];
    counts.set(e, (counts.get(e) ?? 0) + 1);
  });

  const tap = () => Platform.OS !== 'web' && Haptics.selectionAsync();

  const confirmDelete = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this snap?')) onDelete();
    } else
      Alert.alert('Delete this snap?', 'It disappears for the whole family.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]);
  };

  return (
    <Glass style={styles.card} strong>
      <View style={styles.head}>
        <Avatar id={snap.authorId} name={snap.authorName} size={38} ring />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{snap.authorName}</Text>
          <Text style={styles.meta}>
            {timeLabel(snap.$createdAt)}
            {snap.onTime ? '' : ' · bonus snap'}
          </Text>
        </View>
        {snap.authorId === meId && (
          <Pressable onPress={confirmDelete} style={styles.more} accessibilityLabel="Delete snap">
            <Ionicons name="trash-outline" size={18} color={C.ink} />
          </Pressable>
        )}
      </View>

      <Pressable onPress={() => setSwapped((s) => !s)} style={styles.photoWrap}>
        <SnapImage fileId={big} style={styles.photo} />
        <View style={styles.inset}>
          <SnapImage fileId={small} style={styles.insetImg} />
        </View>
        <View style={styles.hourTag}>
          <Text style={styles.hourText}>{String(snap.hour).padStart(2, '0')}u</Text>
        </View>
      </Pressable>

      {!!snap.caption && <Text style={styles.caption}>{snap.caption}</Text>}

      <View style={styles.actions}>
        <Pressable
          onPress={() => {
            tap();
            setPicker((p) => !p);
          }}
          style={[styles.chip, myReaction && styles.chipOn]}
        >
          <Text style={styles.chipText}>{myReaction ?? '🙂'}</Text>
          <Text style={styles.chipText}>{snap.reactions.length || 'React'}</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', gap: 4, flex: 1 }}>
          {[...counts.entries()].slice(0, 4).map(([e, n]) => (
            <Text key={e} style={styles.count}>
              {e}
              {n > 1 ? n : ''}
            </Text>
          ))}
        </View>
        <Pressable
          onPress={() => {
            tap();
            onKeep();
          }}
          style={[styles.chip, kept && styles.chipOn]}
          accessibilityLabel={kept ? 'Unstar' : 'Keep forever'}
        >
          <Ionicons name={kept ? 'star' : 'star-outline'} size={17} color={kept ? C.accentDeep : C.ink} />
          <Text style={styles.chipText}>{kept ? 'Kept' : 'Keep'}</Text>
        </Pressable>
      </View>

      {picker && (
        <View style={styles.picker}>
          {REACTIONS.map((e) => (
            <Pressable
              key={e}
              onPress={() => {
                tap();
                setPicker(false);
                onReact(e);
              }}
              style={[styles.emoji, myReaction === e && styles.chipOn]}
            >
              <Text style={{ fontSize: 24 }}>{e}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </Glass>
  );
}

const makeStyles = (C: Theme) =>
  StyleSheet.create({
  card: { padding: 10, marginBottom: 16 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 6, paddingBottom: 10 },
  name: { fontFamily: F.semibold, fontSize: 15, color: C.ink },
  meta: { fontFamily: F.regular, fontSize: 12, color: C.muted, marginTop: 1 },
  more: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoWrap: { borderRadius: 22, overflow: 'hidden', aspectRatio: 3 / 4 },
  photo: { width: '100%', height: '100%' },
  inset: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: '30%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: C.white,
  },
  insetImg: { width: '100%', height: '100%' },
  hourTag: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: 'rgba(20,17,19,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  hourText: { color: C.white, fontFamily: F.semibold, fontSize: 12 },
  caption: { fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: C.inkSoft, paddingHorizontal: 6, paddingTop: 12 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 12, paddingHorizontal: 2, paddingBottom: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: C.field,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  chipOn: { backgroundColor: C.accentSoft, borderColor: C.accentBorder },
  chipText: { fontFamily: F.medium, fontSize: 13, color: C.ink },
  count: { fontSize: 14, fontFamily: F.medium, color: C.inkSoft },
  picker: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 10 },
  emoji: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
