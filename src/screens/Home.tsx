import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Glass, PillButton, RoundButton, SnapImage } from '../components/ui';
import { SnapCard } from '../components/SnapCard';
import { C, F } from '../theme';
import { dayKey, type Me, type Member, type Snap } from '../api';

function dayLabel(day: string) {
  const today = dayKey();
  const y = new Date(Date.now() - 864e5);
  if (day === today) return 'Today';
  if (day === dayKey(y)) return 'Yesterday';
  const [yy, mm, dd] = day.split('-').map(Number);
  return new Date(yy, mm - 1, dd).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
}

export function Home({
  me,
  members,
  snaps,
  refreshing,
  remindersOn,
  windowHours,
  onRefresh,
  onSnap,
  onReact,
  onKeep,
  onDelete,
  onBell,
}: {
  me: Me;
  members: Member[];
  snaps: Snap[];
  refreshing: boolean;
  remindersOn: boolean;
  windowHours: number;
  onRefresh: () => void;
  onSnap: () => void;
  onReact: (s: Snap, e: string) => void;
  onKeep: (s: Snap) => void;
  onDelete: (s: Snap) => void;
  onBell: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<string | null>(null);
  const today = dayKey();

  const myHoursToday = useMemo(
    () => new Set(snaps.filter((s) => s.authorId === me.id && s.day === today).map((s) => s.hour)).size,
    [snaps, me.id, today],
  );

  const latestBy = useMemo(() => {
    const m = new Map<string, Snap>();
    snaps.forEach((s) => !m.has(s.authorId) && m.set(s.authorId, s));
    return m;
  }, [snaps]);

  const groups = useMemo(() => {
    const list = filter ? snaps.filter((s) => s.authorId === filter) : snaps;
    const g: { day: string; items: Snap[] }[] = [];
    list.forEach((s) => {
      const last = g[g.length - 1];
      if (last && last.day === s.day) last.items.push(s);
      else g.push({ day: s.day, items: [s] });
    });
    return g;
  }, [snaps, filter]);

  const others = members.filter((m) => m.id !== me.id);

  return (
    <ScrollView
      contentContainerStyle={[styles.wrap, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
    >
      <View style={styles.topRow}>
        <Glass style={styles.mePill} radius={30}>
          <Avatar id={me.id} name={me.name} size={44} ring />
          <View>
            <Text style={styles.meName}>{me.name}</Text>
            <Text style={styles.meSub}>
              Today: {myHoursToday} of {windowHours} hours
            </Text>
          </View>
        </Glass>
        <Glass style={styles.iconPair} radius={30}>
          <RoundButton icon={remindersOn ? 'notifications-outline' : 'notifications-off-outline'} onPress={onBell} dot={remindersOn} label="Reminders" />
          <RoundButton icon="refresh" onPress={onRefresh} label="Refresh" />
        </Glass>
      </View>

      <Text style={styles.h1}>
        Show your{'\n'}
        <Text style={styles.h1Bold}>moments </Text>
        <Text style={styles.h1Italic}>hourly</Text>
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stories}>
        <Pressable onPress={onSnap}>
          <Glass style={styles.story} radius={22} strong>
            <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1, gap: 8 }}>
              <View>
                <Avatar id={me.id} name={me.name} size={50} ring />
                <View style={styles.plus}>
                  <Ionicons name="add" size={14} color={C.white} />
                </View>
              </View>
              <Text style={styles.storyName}>Your snap</Text>
            </View>
          </Glass>
        </Pressable>
        {others.map((m) => {
          const s = latestBy.get(m.id);
          const active = filter === m.id;
          return (
            <Pressable key={m.id} onPress={() => setFilter(active ? null : m.id)}>
              <View style={[styles.story, active && styles.storyActive]}>
                {s ? <SnapImage fileId={s.backId} style={StyleSheet.absoluteFill as never} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.5)' }]} />}
                <View style={styles.storyAvatar}>
                  <Avatar id={m.id} name={m.name} size={28} ring />
                </View>
                <View style={styles.storyLabel}>
                  <Text style={styles.storyLabelText} numberOfLines={1}>
                    {m.name}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {filter && (
        <Pressable onPress={() => setFilter(null)} style={styles.filterChip}>
          <Text style={styles.filterText}>Only {members.find((m) => m.id === filter)?.name}</Text>
          <Ionicons name="close" size={16} color={C.ink} />
        </Pressable>
      )}

      {groups.length === 0 ? (
        <Glass style={styles.empty} strong>
          <Ionicons name="sunny-outline" size={34} color={C.accent} />
          <Text style={styles.emptyTitle}>No snaps yet</Text>
          <Text style={styles.emptyText}>Be the first. Back camera, then a quick selfie.</Text>
          <PillButton title="Take a snap" dark icon="camera" onPress={onSnap} style={{ marginTop: 14 }} />
        </Glass>
      ) : (
        groups.map((g) => (
          <View key={g.day}>
            <Text style={styles.day}>{dayLabel(g.day)}</Text>
            {g.items.map((s) => (
              <SnapCard
                key={s.$id}
                snap={s}
                meId={me.id}
                onReact={(e) => onReact(s, e)}
                onKeep={() => onKeep(s)}
                onDelete={() => onDelete(s)}
              />
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 18, maxWidth: 560, width: '100%', alignSelf: 'center' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  mePill: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 6, paddingRight: 18, flexShrink: 1 },
  meName: { fontFamily: F.semibold, fontSize: 15, color: C.ink },
  meSub: { fontFamily: F.regular, fontSize: 12, color: C.muted },
  iconPair: { flexDirection: 'row', gap: 6, padding: 6 },
  h1: { fontFamily: F.medium, fontSize: 36, lineHeight: 42, color: C.white, marginTop: 26, marginBottom: 20, textShadowColor: 'rgba(184,69,109,0.3)', textShadowRadius: 10 },
  h1Bold: { fontFamily: F.semibold },
  h1Italic: { fontFamily: F.lightItalic },
  stories: { gap: 10, paddingBottom: 18, paddingRight: 8 },
  story: { width: 96, height: 112, borderRadius: 22, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  storyActive: { borderColor: C.ink },
  storyName: { fontFamily: F.medium, fontSize: 12, color: C.ink },
  plus: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.ink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.white,
  },
  storyAvatar: { position: 'absolute', top: 6, left: 6 },
  storyLabel: { position: 'absolute', left: 6, right: 6, bottom: 6, backgroundColor: 'rgba(20,17,19,0.4)', borderRadius: 10, paddingVertical: 3, paddingHorizontal: 6 },
  storyLabelText: { color: C.white, fontFamily: F.semibold, fontSize: 11, textAlign: 'center' },
  filterChip: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.glassStrong,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    marginBottom: 12,
  },
  filterText: { fontFamily: F.medium, fontSize: 13, color: C.ink },
  day: { fontFamily: F.semibold, fontSize: 18, color: C.ink, marginBottom: 12, marginTop: 4 },
  empty: { padding: 28, alignItems: 'center' },
  emptyTitle: { fontFamily: F.semibold, fontSize: 18, color: C.ink, marginTop: 10 },
  emptyText: { fontFamily: F.regular, fontSize: 14, color: C.muted, textAlign: 'center', marginTop: 4 },
});
