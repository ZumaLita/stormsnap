import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Button, Card, Icon, Press, Shape, SnapImage, TopBar } from '../components/ui';
import { SnapCard } from '../components/SnapCard';
import { TAB_BAR_HEIGHT } from '../components/TabBar';
import { S, T, useStyles, useTheme, type Theme } from '../theme';
import { dayKey, type Me, type Member, type Snap } from '../api';

function dayLabel(day: string) {
  const today = dayKey();
  if (day === today) return 'Today';
  if (day === dayKey(new Date(Date.now() - 864e5))) return 'Yesterday';
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
}

type Item = { type: 'header'; key: string; day: string } | { type: 'snap'; key: string; snap: Snap };

export function Home({
  me,
  members,
  snaps,
  streak,
  refreshing,
  onRefresh,
  onSnap,
  onStreaks,
  onReact,
  onKeep,
  onDelete,
}: {
  me: Me;
  members: Member[];
  snaps: Snap[];
  streak: number;
  refreshing: boolean;
  onRefresh: () => void;
  onSnap: () => void;
  onStreaks: () => void;
  onReact: (s: Snap, e: string) => void;
  onKeep: (s: Snap) => void;
  onDelete: (s: Snap) => void;
}) {
  const c = useTheme();
  const s = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const today = dayKey();
  const [filter, setFilter] = useState<string | null>(null);

  const latestBy = useMemo(() => {
    const m = new Map<string, Snap>();
    snaps.forEach((x) => !m.has(x.authorId) && m.set(x.authorId, x));
    return m;
  }, [snaps]);

  const items = useMemo(() => {
    const list = filter ? snaps.filter((x) => x.authorId === filter) : snaps;
    const out: Item[] = [];
    let last = '';
    list.forEach((x) => {
      if (x.day !== last) {
        out.push({ type: 'header', key: 'h' + x.day, day: x.day });
        last = x.day;
      }
      out.push({ type: 'snap', key: x.$id, snap: x });
    });
    return out;
  }, [snaps, filter]);

  const meSnappedToday = snaps.some((x) => x.authorId === me.id && x.day === today);
  const others = members.filter((m) => m.id !== me.id);

  const header = (
    <View>
      <TopBar
        title="StormSnap"
        overline={new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
        actions={
          <Press onPress={onStreaks} radius={S.sm} accessibilityLabel={`Streak ${streak} hours`} style={[s.chip, { backgroundColor: streak > 0 ? c.fireContainer : c.surfaceContainerHigh }]}>
            <Icon name="fire" size={18} color={streak > 0 ? c.onFireContainer : c.onSurfaceVariant} />
            <Text style={[T.labelLarge, T.num, { color: streak > 0 ? c.onFireContainer : c.onSurfaceVariant }]}>{streak}</Text>
          </Press>
        }
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.stories} style={{ marginHorizontal: -16 }}>
        <Press onPress={onSnap} radius={S.lgInc} morph={S.xl} accessibilityLabel="Your snap" style={[s.story, { backgroundColor: c.primaryContainer, alignItems: 'center', justifyContent: 'center' }]}>
          <Shape kind="burst" size={52} color={c.primary}>
            <Icon name="camera-plus" size={24} color={c.onPrimary} />
          </Shape>
          <Text style={[T.labelLarge, { color: c.onPrimaryContainer, marginTop: 8 }]}>Your snap</Text>
        </Press>
        {others.map((m) => {
          const last = latestBy.get(m.id);
          const on = filter === m.id;
          return (
            <Press
              key={m.id}
              onPress={() => setFilter(on ? null : m.id)}
              radius={S.lgInc}
              morph={S.xl}
              accessibilityLabel={`Only ${m.name}`}
              accessibilityState={{ selected: on }}
              style={[s.story, on && { borderWidth: 3, borderColor: c.primary }]}
            >
              {last ? <SnapImage fileId={last.backId} style={StyleSheet.absoluteFill as never} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: c.surfaceContainerHigh }]} />}
              <View style={{ position: 'absolute', top: 8, left: 8 }}>
                <Avatar id={m.id} name={m.name} size={30} />
              </View>
              <View style={s.storyLabel}>
                <Text style={[T.labelMedium, { color: '#FFFFFF', textAlign: 'center' }]} numberOfLines={1}>
                  {m.name}
                </Text>
              </View>
            </Press>
          );
        })}
      </ScrollView>

      {filter && (
        <Press onPress={() => setFilter(null)} radius={S.sm} style={[s.filterChip, { backgroundColor: c.secondaryContainer }]}>
          <Icon name="check" size={18} color={c.onSecondaryContainer} />
          <Text style={[T.labelLarge, { color: c.onSecondaryContainer }]}>Only {members.find((m) => m.id === filter)?.name}</Text>
          <Icon name="close" size={18} color={c.onSecondaryContainer} />
        </Press>
      )}

      {!meSnappedToday && !filter && (
        <Card style={[s.hero, { backgroundColor: c.primaryContainer }]}>
          <Shape kind="burst" size={80} color={c.primary}>
            <Icon name="camera" size={34} color={c.onPrimary} />
          </Shape>
          <Text style={[T.headlineSmall, { color: c.onPrimaryContainer, marginTop: 14, fontWeight: '600' }]}>What are you up to?</Text>
          <Text style={[T.bodyMedium, { color: c.onPrimaryContainer, textAlign: 'center', marginTop: 4, opacity: 0.85 }]}>
            Back camera, then a quick selfie. Skipping is always fine.
          </Text>
          <Button title="Take a snap" icon="camera" big onPress={onSnap} style={{ marginTop: 18 }} />
        </Card>
      )}
    </View>
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: c.surface }}
      contentContainerStyle={[s.wrap, { paddingTop: insets.top, paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 104 }]}
      data={items}
      keyExtractor={(it) => it.key}
      ListHeaderComponent={header}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[c.primary]} progressBackgroundColor={c.surfaceContainerHigh} tintColor={c.primary} />}
      ListEmptyComponent={
        meSnappedToday || filter ? (
          <View style={{ alignItems: 'center', marginTop: 48 }}>
            <Icon name="image-multiple-outline" size={40} color={c.outline} />
            <Text style={[T.bodyLarge, { color: c.onSurfaceVariant, marginTop: 8 }]}>No snaps yet</Text>
          </View>
        ) : undefined
      }
      renderItem={({ item }) =>
        item.type === 'header' ? (
          <Text style={[T.titleSmall, s.dayHeader, { color: c.primary }]}>{dayLabel(item.day)}</Text>
        ) : (
          <SnapCard
            snap={item.snap}
            meId={me.id}
            onReact={(e) => onReact(item.snap, e)}
            onKeep={() => onKeep(item.snap)}
            onDelete={() => onDelete(item.snap)}
          />
        )
      }
    />
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    wrap: { paddingHorizontal: 16, maxWidth: 640, width: '100%', alignSelf: 'center' },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 12 },
    stories: { gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
    story: { width: 100, height: 132, borderRadius: S.lgInc, overflow: 'hidden' },
    storyLabel: { position: 'absolute', left: 6, right: 6, bottom: 6, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: S.sm, paddingVertical: 3 },
    filterChip: { flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 8, height: 32, paddingHorizontal: 10, marginBottom: 4 },
    hero: { padding: 24, alignItems: 'center', marginTop: 4, marginBottom: 4 },
    dayHeader: { marginTop: 20, marginBottom: 10, marginLeft: 4 },
  });
