import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Glass } from '../components/ui';
import { F, useStyles, useTheme, type Theme } from '../theme';
import { BADGES, MAX_BONUS, STREAK_END, STREAK_START, computeStreak, type SlotState, type StreakRow, type StreakStats } from '../streak';
import type { Me, Member } from '../api';

const MILESTONES = [3, 7, 14, 30, 60, 100];

function Shields({ n, size = 18 }: { n: number; size?: number }) {
  const C = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {Array.from({ length: MAX_BONUS }, (_, i) => (
        <Ionicons key={i} name={i < n ? 'shield' : 'shield-outline'} size={size} color={i < n ? C.shield : C.muted} />
      ))}
    </View>
  );
}

function Timeline({ today }: { today: Record<number, SlotState> }) {
  const C = useTheme();
  const styles = useStyles(makeStyles);
  const hours = [];
  for (let h = STREAK_START; h <= STREAK_END; h++) hours.push(h);
  return (
    <View>
      <View style={styles.tlRow}>
        <View style={[styles.tlLine, { backgroundColor: C.empty }]} />
        {hours.map((h) => {
          const st = today[h];
          return (
            <View key={h} style={styles.tlCell}>
              {st === 'snap' ? (
                <View style={[styles.tlDot, { backgroundColor: C.fire }]}>
                  <Ionicons name="flame" size={11} color="#FFFFFF" />
                </View>
              ) : st === 'saved' ? (
                <View style={[styles.tlDot, { backgroundColor: C.shield }]}>
                  <Ionicons name="shield" size={10} color="#FFFFFF" />
                </View>
              ) : st === 'now' ? (
                <View style={[styles.tlDot, styles.tlNow, { borderColor: C.accent }]} />
              ) : (
                <View style={[styles.tlSmall, { backgroundColor: st === 'missed' ? C.empty : C.future }]} />
              )}
            </View>
          );
        })}
      </View>
      <View style={styles.tlRow}>
        {hours.map((h) => (
          <Text key={h} style={styles.tlLabel}>
            {(h - STREAK_START) % 3 === 0 ? h : ''}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function Streaks({
  me,
  members,
  rows,
  refreshing,
  onRefresh,
}: {
  me: Me;
  members: Member[];
  rows: StreakRow[];
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const C = useTheme();
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [howOpen, setHowOpen] = useState(false);

  const stats = useMemo(() => {
    const m = new Map<string, StreakStats>();
    const people = members.length ? members : [{ id: me.id, name: me.name }];
    people.forEach((p) => m.set(p.id, computeStreak(rows.filter((r) => r.authorId === p.id))));
    return m;
  }, [rows, members, me]);

  const mine = stats.get(me.id) ?? computeStreak([]);
  const next = MILESTONES.find((m) => m > mine.best);
  const prev = [...MILESTONES].reverse().find((m) => m <= mine.best) ?? 0;
  const progress = next ? Math.min(1, (mine.current - 0) / next) : 1;
  const unlocked = BADGES.filter((b) => b.unlocked(mine)).length;
  const sorted = [...members].sort((a, b) => (stats.get(b.id)?.current ?? 0) - (stats.get(a.id)?.current ?? 0));

  return (
    <ScrollView
      contentContainerStyle={[styles.wrap, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 120 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
    >
      <Text style={styles.h1}>
        Your <Text style={styles.italic}>streak</Text>
      </Text>

      <Glass style={styles.hero} strong>
        <View style={styles.heroTop}>
          <View style={[styles.flameWrap, { backgroundColor: mine.current > 0 ? 'rgba(255,122,26,0.16)' : C.future }]}>
            <Ionicons name="flame" size={54} color={mine.current > 0 ? C.fire : C.muted} />
          </View>
          <View>
            <Text style={styles.bigNum}>{mine.current}</Text>
            <Text style={styles.bigLabel}>hour{mine.current === 1 ? '' : 's'} in a row</Text>
          </View>
        </View>

        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Shields n={mine.bonus} />
            <Text style={styles.statLabel}>Bonus</Text>
          </View>
          <View style={[styles.heroStat, styles.statBorder]}>
            <Text style={styles.statNum}>{mine.best}</Text>
            <Text style={styles.statLabel}>Best</Text>
          </View>
          <View style={[styles.heroStat, styles.statBorder]}>
            <Text style={styles.statNum}>{mine.todaySnaps}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </View>

        {next ? (
          <View style={{ gap: 6 }}>
            <Text style={styles.nextText}>
              {next - mine.current} more hour{next - mine.current === 1 ? '' : 's'} to unlock{' '}
              <Text style={{ fontFamily: F.semibold, color: C.ink }}>{BADGES[MILESTONES.indexOf(next)].title}</Text>
            </Text>
            <View style={[styles.bar, { backgroundColor: C.empty }]}>
              <View style={[styles.barFill, { width: `${Math.max(4, progress * 100)}%`, backgroundColor: C.fire }]} />
            </View>
          </View>
        ) : (
          <Text style={styles.nextText}>Every flame unlocked. Legend!</Text>
        )}
        {prev === 0 && mine.current === 0 && <Text style={styles.nextText}>Snap this hour to light your first flame.</Text>}

        <Timeline today={mine.today} />
      </Glass>

      <Pressable onPress={() => setHowOpen((o) => !o)} style={styles.howHead}>
        <Ionicons name="information-circle-outline" size={18} color={C.inkSoft} />
        <Text style={styles.howTitle}>How streaks work</Text>
        <Ionicons name={howOpen ? 'chevron-up' : 'chevron-down'} size={16} color={C.muted} />
      </Pressable>
      {howOpen && (
        <Glass style={styles.howCard}>
          <Text style={styles.howLine}>
            <Ionicons name="flame" size={14} color={C.fire} /> Snap at least once every hour from {STREAK_START}u to {STREAK_END}u to grow your streak.
          </Text>
          <Text style={styles.howLine}>
            <Ionicons name="shield" size={14} color={C.shield} /> Post an extra snap (like 10u and again 10u30, or outside the hours) to earn a bonus. Max {MAX_BONUS}.
          </Text>
          <Text style={styles.howLine}>
            <Ionicons name="shield-checkmark" size={14} color={C.shield} /> Forget an hour? A bonus springs in and saves your streak. No bonus left, back to 0.
          </Text>
        </Glass>
      )}

      <Text style={styles.section}>
        Unlocks <Text style={styles.sectionSub}>{unlocked}/{BADGES.length}</Text>
      </Text>
      <View style={styles.badges}>
        {BADGES.map((b) => {
          const on = b.unlocked(mine);
          return (
            <View key={b.key} style={styles.badge}>
              <View style={[styles.badgeIcon, { backgroundColor: on ? b.color : C.future, borderColor: on ? b.color : C.empty }]}>
                <Ionicons name={b.icon} size={26} color={on ? '#FFFFFF' : C.muted} />
                {!on && (
                  <View style={[styles.lock, { backgroundColor: C.navBg }]}>
                    <Ionicons name="lock-closed" size={10} color={C.navIcon} />
                  </View>
                )}
              </View>
              <Text style={[styles.badgeTitle, !on && { color: C.muted }]} numberOfLines={1}>
                {b.title}
              </Text>
              <Text style={styles.badgeHint} numberOfLines={2}>
                {b.hint}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.section}>Family</Text>
      {sorted.map((m, i) => {
        const s = stats.get(m.id) ?? computeStreak([]);
        return (
          <Glass key={m.id} style={styles.person} strong>
            <View style={styles.personHead}>
              <Text style={styles.rank}>{i + 1}</Text>
              <Avatar id={m.id} name={m.name} size={40} ring />
              <View style={{ flex: 1 }}>
                <Text style={styles.personName}>{m.id === me.id ? `${m.name} (you)` : m.name}</Text>
                <Shields n={s.bonus} size={13} />
              </View>
              <View style={styles.personStreak}>
                <Ionicons name="flame" size={22} color={s.current > 0 ? C.fire : C.muted} />
                <Text style={styles.personNum}>{s.current}</Text>
              </View>
            </View>
            <Timeline today={s.today} />
          </Glass>
        );
      })}
    </ScrollView>
  );
}

const makeStyles = (C: Theme) =>
  StyleSheet.create({
    wrap: { paddingHorizontal: 18, maxWidth: 560, width: '100%', alignSelf: 'center' },
    h1: { fontFamily: F.semibold, fontSize: 36, color: C.headline, textShadowColor: C.headlineShadow, textShadowRadius: 10, marginBottom: 18 },
    italic: { fontFamily: F.lightItalic },
    hero: { padding: 18, gap: 16 },
    heroTop: { flexDirection: 'row', alignItems: 'center', gap: 18 },
    flameWrap: { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center' },
    bigNum: { fontFamily: F.black, fontSize: 72, lineHeight: 78, color: C.ink },
    bigLabel: { fontFamily: F.medium, fontSize: 14, color: C.muted, marginTop: -4 },
    heroStats: { flexDirection: 'row', backgroundColor: C.future, borderRadius: 18, paddingVertical: 12 },
    heroStat: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
    statBorder: { borderLeftWidth: 1, borderLeftColor: C.empty },
    statNum: { fontFamily: F.bold, fontSize: 20, color: C.ink },
    statLabel: { fontFamily: F.regular, fontSize: 12, color: C.muted },
    nextText: { fontFamily: F.regular, fontSize: 13, color: C.inkSoft },
    bar: { height: 8, borderRadius: 4, overflow: 'hidden' },
    barFill: { height: 8, borderRadius: 4 },
    tlRow: { flexDirection: 'row', alignItems: 'center' },
    tlLine: { position: 'absolute', left: 8, right: 8, height: 2, borderRadius: 1 },
    tlCell: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 24 },
    tlDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    tlNow: { borderWidth: 2.5, backgroundColor: C.field },
    tlSmall: { width: 9, height: 9, borderRadius: 5 },
    tlLabel: { flex: 1, textAlign: 'center', fontFamily: F.medium, fontSize: 10, color: C.muted, marginTop: 2 },
    howHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, paddingVertical: 6 },
    howTitle: { flex: 1, fontFamily: F.medium, fontSize: 14, color: C.inkSoft },
    howCard: { padding: 14, gap: 8 },
    howLine: { fontFamily: F.regular, fontSize: 13, lineHeight: 19, color: C.inkSoft },
    section: { fontFamily: F.semibold, fontSize: 18, color: C.ink, marginTop: 24, marginBottom: 12 },
    sectionSub: { fontFamily: F.regular, fontSize: 14, color: C.muted },
    badges: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 },
    badge: { width: '25%', alignItems: 'center', paddingHorizontal: 4 },
    badgeIcon: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    lock: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeTitle: { fontFamily: F.semibold, fontSize: 12, color: C.ink, marginTop: 6 },
    badgeHint: { fontFamily: F.regular, fontSize: 10, color: C.muted, textAlign: 'center', marginTop: 1 },
    person: { padding: 14, gap: 12, marginBottom: 12 },
    personHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    rank: { fontFamily: F.bold, fontSize: 14, color: C.muted, width: 14 },
    personName: { fontFamily: F.semibold, fontSize: 15, color: C.ink, marginBottom: 3 },
    personStreak: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    personNum: { fontFamily: F.black, fontSize: 26, color: C.ink },
  });
