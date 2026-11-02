import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LargeTitle, Segmented, SnapTile } from '../components/ui';
import { TAB_BAR_HEIGHT } from '../components/TabBar';
import { T, useTheme } from '../theme';
import type { Me, Snap } from '../api';

const dateLabel = (day: string) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

export function Memories({
  me,
  kept,
  snaps,
  refreshing,
  onRefresh,
  onOpen,
}: {
  me: Me;
  kept: Snap[];
  snaps: Snap[];
  refreshing: boolean;
  onRefresh: () => void;
  onOpen: (list: Snap[], id: string) => void;
}) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [view, setView] = useState<'kept' | 'mine'>('kept');
  const list = view === 'kept' ? kept : snaps.filter((s) => s.authorId === me.id);
  const contentW = Math.min(width, 600) - 32;
  const tileW = Math.floor((contentW - 16) / 3);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={[styles.wrap, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 40 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.secondary} />}
    >
      <LargeTitle title="Memories" />
      <View style={{ marginTop: 14, marginBottom: 16 }}>
        <Segmented
          items={[
            { key: 'kept', label: 'Kept forever' },
            { key: 'mine', label: 'My week' },
          ]}
          value={view}
          onChange={setView}
        />
      </View>

      {list.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name={view === 'kept' ? 'star-outline' : 'images-outline'} size={44} color={c.tertiary} />
          <Text style={[T.title3, { color: c.label, marginTop: 12 }]}>{view === 'kept' ? 'Nothing kept yet' : 'No snaps this week'}</Text>
          <Text style={[T.subhead, { color: c.secondary, textAlign: 'center', marginTop: 4, maxWidth: 280 }]}>
            {view === 'kept'
              ? 'Open a snap and tap the star to keep it forever. Everything else disappears after 7 days.'
              : 'Snaps you take show up here for 7 days.'}
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {list.map((s) => (
            <SnapTile
              key={s.$id}
              back={s.backId}
              front={s.frontId}
              width={tileW}
              label={view === 'kept' ? `${s.authorId === me.id ? 'You' : s.authorName} · ${dateLabel(s.day)}` : `${dateLabel(s.day)} · ${s.hour}u`}
              onPress={() => onOpen(list, s.$id)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, maxWidth: 600, width: '100%', alignSelf: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  empty: { alignItems: 'center', paddingTop: 60 },
});
