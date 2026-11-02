import React, { useState } from 'react';
import { Alert, FlatList, Modal, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, PressScale, SnapImage, tapHaptic } from './ui';
import { R, T } from '../theme';
import { REACTIONS } from '../config';
import type { Snap } from '../api';

const time = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

function Page({
  snap,
  meId,
  width,
  onReact,
  onKeep,
  onDelete,
}: {
  snap: Snap;
  meId: string;
  width: number;
  onReact: (e: string) => void;
  onKeep: () => void;
  onDelete: () => void;
}) {
  const [swapped, setSwapped] = useState(false);
  const photoW = Math.min(width - 24, 520);
  const photoH = (photoW * 4) / 3;
  const insetW = Math.round(photoW * 0.28);
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
    <View style={{ width, alignItems: 'center' }}>
      <Pressable onPress={() => setSwapped((s) => !s)} style={{ width: photoW, height: photoH, borderRadius: R.sheet, overflow: 'hidden' }}>
        <SnapImage fileId={swapped ? snap.frontId : snap.backId} style={{ width: photoW, height: photoH }} />
        <View style={[styles.inset, { width: insetW, height: (insetW * 4) / 3 }]}>
          <SnapImage fileId={swapped ? snap.backId : snap.frontId} style={StyleSheet.absoluteFill as never} />
        </View>
      </Pressable>

      <View style={{ width: photoW, paddingTop: 14, gap: 12 }}>
        {!!snap.caption && <Text style={[T.body, { color: '#FFFFFF' }]}>{snap.caption}</Text>}
        {counts.size > 0 && (
          <Text style={[T.subhead, { color: 'rgba(235,235,245,0.6)' }]}>
            {[...counts.entries()].map(([e, n]) => `${e} ${n}`).join('   ')}
          </Text>
        )}
        <View style={styles.actions}>
          <View style={styles.reactions}>
            {REACTIONS.map((e) => (
              <PressScale
                key={e}
                haptic
                scaleTo={0.85}
                onPress={() => onReact(e)}
                accessibilityLabel={`React ${e}`}
                style={[styles.emoji, mine === e && { backgroundColor: 'rgba(255,255,255,0.22)' }]}
              >
                <Text style={{ fontSize: 22 }}>{e}</Text>
              </PressScale>
            ))}
          </View>
          <PressScale haptic onPress={onKeep} accessibilityLabel={kept ? 'Remove from memories' : 'Keep forever'} style={styles.round}>
            <Ionicons name={kept ? 'star' : 'star-outline'} size={20} color={kept ? '#FFD60A' : '#FFFFFF'} />
          </PressScale>
          {snap.authorId === meId && (
            <PressScale onPress={confirmDelete} accessibilityLabel="Delete snap" style={styles.round}>
              <Ionicons name="trash-outline" size={19} color="#FF453A" />
            </PressScale>
          )}
        </View>
      </View>
    </View>
  );
}

export function Viewer({
  snaps,
  startId,
  meId,
  onClose,
  onReact,
  onKeep,
  onDelete,
}: {
  snaps: Snap[];
  startId: string | null;
  meId: string;
  onClose: () => void;
  onReact: (s: Snap, e: string) => void;
  onKeep: (s: Snap) => void;
  onDelete: (s: Snap) => void;
}) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const start = Math.max(0, snaps.findIndex((s) => s.$id === startId));
  const [index, setIndex] = useState(start);
  const current = snaps[index] ?? snaps[0];

  return (
    <Modal visible={!!startId && snaps.length > 0} animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen">
      <View style={[styles.screen, { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 10 }]}>
        {current && (
          <View style={styles.top}>
            <Avatar id={current.authorId} name={current.authorName} size={34} />
            <View style={{ flex: 1 }}>
              <Text style={[T.headline, { color: '#FFFFFF' }]}>{current.authorName}</Text>
              <Text style={[T.footnote, { color: 'rgba(235,235,245,0.6)' }]}>
                {time(current.$createdAt)}
                {current.onTime ? '' : ' · extra snap'}
                {snaps.length > 1 ? `  ·  ${index + 1} of ${snaps.length}` : ''}
              </Text>
            </View>
            <PressScale
              onPress={() => {
                tapHaptic();
                onClose();
              }}
              accessibilityLabel="Close"
              style={styles.round}
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </PressScale>
          </View>
        )}
        <FlatList
          data={snaps}
          keyExtractor={(s) => s.$id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={start}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          onScroll={Platform.OS === 'web' ? (e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width)) : undefined}
          scrollEventThrottle={64}
          renderItem={({ item }) => (
            <Page
              snap={item}
              meId={meId}
              width={width}
              onReact={(e) => onReact(item, e)}
              onKeep={() => onKeep(item)}
              onDelete={() => onDelete(item)}
            />
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 12, maxWidth: 560, width: '100%', alignSelf: 'center' },
  inset: { position: 'absolute', top: 12, left: 12, borderRadius: 12, overflow: 'hidden', borderWidth: 2.5, borderColor: '#FFFFFF' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reactions: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(118,118,128,0.24)', borderRadius: 26, padding: 4 },
  emoji: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  round: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(118,118,128,0.24)', alignItems: 'center', justifyContent: 'center' },
});
