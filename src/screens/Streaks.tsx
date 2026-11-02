import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, LargeTitle, Section } from '../components/ui';
import { TAB_BAR_HEIGHT } from '../components/TabBar';
import { R, T, useStyles, useTheme, type Theme } from '../theme';
import { BADGES, MAX_BONUS, STREAK_END, STREAK_START, computeStreak, type SlotState, type StreakRow, type StreakStats } from '../streak';
import type { Me, Member } from '../api';

const MILESTONES = [3, 7, 14, 30, 60, 100];

function Shields({ n, size = 15 }: { n: number; size?: number }) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: MAX_BONUS }, (_, i) => (
        <Ionicons key={i} name={i < n ? 'shield' : 'shield-outline'} size={size} color={i < n ? c.shield : c.tertiary} />
      ))}
    </View>
  );
}

/** Today 8u–21u as a row of hour capsules. */
function Timeline({ today, compact }: { today: Record<number, SlotState>; compact?: boolean }) {
  const c = useTheme();
  const hours: number[] = [];
  for (let h = STREAK_START; h <= STREAK_END; h++) hours.push(h);
  const color = (st: SlotState) => (st === 'snap' ? c.fire : st === 'saved' ? c.shield : st === 'missed' ? c.fill : 'transparent');
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 3 }}>
        {hours.map((h) => {
          const st = today[h];
          return (
            <View
              key={h}
              style={{
                flex: 1,
                height: compact ? 6 : 26,
                borderRadius: compact ? 3 : 6,
                backgroundColor: color(st),
                borderWidth: st === 'future' || st === 'now' ? 1 : 0,
                borderColor: st === 'now' ? c.accent : c.fill,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {!compact && st === 'snap' && <Ionicons name="flame" size={12} color="#FFFFFF" />}
              {!compact && st === 'saved' && <Ionicons name="shield" size={11} color="#FFFFFF" />}
            </View>
          );
        })}
      </View>
      {!compact && (
        <View style={{ flexDirection: 'row', marginTop: 5 }}>
          {hours.map((h) => (
            <Text key={h} style={[T.caption2, { flex: 1, textAlign: 'center', color: c.tertiary }]}>
              {(h - STREAK_START) % 3 === 0 ? h : ''}
            </Text>
          ))}
        </View>
      )}
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
  const c = useTheme();
  const s = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [howOpen, setHowOpen] = useState(false);

  const stats = useMemo(() => {
    const m = new Map<string, StreakStats>();
    const people = members.length ? members : [{ id: me.id, name: me.name }];
    people.forEach((p) => m.set(p.id, computeStreak(rows.filter((r) => r.authorId === p.id))));
    return m;
  }, [rows, members, me]);

  const mine = stats.get(me.id) ?? computeStreak([]);
  const nextIdx = MILESTONES.findIndex((m) => m > mine.best);
  const next = nextIdx >= 0 ? MILESTONES[nextIdx] : null;
  const unlocked = BADGES.filter((b) => b.unlocked(mine)).length;
  const sorted = [...(members.length ? members : [{ id: me.id, name: me.name }])].sort(
    (a, b) => (stats.get(b.id)?.current ?? 0) - (stats.get(a.id)?.current ?? 0),
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={[s.wrap, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 40 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.secondary} />}
    >
      <LargeTitle title="Streaks" subtitle={`${STREAK_START}u – ${STREAK_END}u`} />

      <View style={s.hero}>
        <View style={[s.flame, { backgroundColor: mine.current > 0 ? c.fireTint : c.fill }]}>
          <Ionicons name="flame" size={40} color={mine.current > 0 ? c.fire : c.tertiary} />
        </View>
        <Text style={[T.bigNumber, { color: c.label, marginTop: 8 }]}>{mine.current}</Text>
        <Text style={[T.subhead, { color: c.secondary }]}>hour{mine.current === 1 ? '' : 's'} in a row</Text>

        <View style={s.stats}>
          <View style={s.stat}>
            <Shields n={mine.bonus} size={17} />
            <Text style={[T.caption, { color: c.secondary, marginTop: 6 }]}>Bonus</Text>
          </View>
          <View style={[s.stat, s.statLine]}>
            <Text style={[T.title3, T.number, { color: c.label }]}>{mine.best}</Text>
            <Text style={[T.caption, { color: c.secondary, marginTop: 2 }]}>Best</Text>
          </View>
          <View style={[s.stat, s.statLine]}>
            <Text style={[T.title3, T.number, { color: c.label }]}>{mine.todaySnaps}</Text>
            <Text style={[T.caption, { color: c.secondary, marginTop: 2 }]}>Today</Text>
          </View>
        </View>

        {next && (
          <View style={{ alignSelf: 'stretch', marginTop: 18 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={[T.footnote, { color: c.secondary }]}>Next: {BADGES[nextIdx].title}</Text>
              <Text style={[T.footnote, T.number, { color: c.secondary }]}>
                {mine.current}/{next}
              </Text>
            </View>
            <View style={[s.bar, { backgroundColor: c.fill }]}>
              <View style={[s.barFill, { width: `${Math.max(3, Math.min(1, mine.current / next) * 100)}%`, backgroundColor: c.fire }]} />
            </View>
          </View>
        )}

        <View style={{ alignSelf: 'stretch', marginTop: 20 }}>
          <Timeline today={mine.today} />
        </View>
      </View>

      <Pressable onPress={() => setHowOpen((o) => !o)} style={s.how} accessibilityRole="button">
        <Text style={[T.subhead, { color: c.accent, flex: 1 }]}>How streaks work</Text>
        <Ionicons name={howOpen ? 'chevron-up' : 'chevron-down'} size={16} color={c.accent} />
      </Pressable>
      {howOpen && (
        <View style={[s.howCard, { backgroundColor: c.card }]}>
          {[
            ['flame', c.fire, `Snap at least once every hour from ${STREAK_START}u to ${STREAK_END}u and your streak grows.`],
            ['shield', c.shield, `An extra snap earns a bonus: a second one in the same hour (10u and 10u30), or one outside the hours. Hold up to ${MAX_BONUS}.`],
            ['shield-checkmark', c.shield, 'Forget an hour? A bonus springs in and saves your streak. None left means back to 0.'],
          ].map(([icon, color, text]) => (
            <View key={icon} style={s.howRow}>
              <Ionicons name={icon as never} size={18} color={color} />
              <Text style={[T.subhead, { color: c.label, flex: 1 }]}>{text}</Text>
            </View>
          ))}
        </View>
      )}

      <Section title={`Awards · ${unlocked} of ${BADGES.length}`} padded>
        <View style={s.awards}>
          {BADGES.map((b) => {
            const on = b.unlocked(mine);
            return (
              <View key={b.key} style={s.award} accessibilityLabel={`${b.title}, ${on ? 'unlocked' : 'locked'}: ${b.hint}`}>
                <View style={[s.medal, { backgroundColor: on ? b.color : c.fill }]}>
                  <View style={[s.medalRing, { borderColor: on ? 'rgba(255,255,255,0.35)' : 'transparent' }]} />
                  <Ionicons name={on ? b.icon : 'lock-closed'} size={on ? 26 : 18} color={on ? '#FFFFFF' : c.tertiary} />
                </View>
                <Text style={[T.caption, { color: on ? c.label : c.secondary, fontWeight: '600', marginTop: 7 }]} numberOfLines={1}>
                  {b.title}
                </Text>
                <Text style={[T.caption2, { color: c.secondary, textAlign: 'center', fontWeight: '400' }]} numberOfLines={2}>
                  {b.hint}
                </Text>
              </View>
            );
          })}
        </View>
      </Section>

      <Section title="Family">
        {sorted.map((m, i) => {
          const st = stats.get(m.id) ?? computeStreak([]);
          return (
            <View key={m.id} style={[s.member, i < sorted.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.separator }]}>
              <View style={s.memberHead}>
                <Avatar id={m.id} name={m.name} size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={[T.headline, { color: c.label }]}>{m.id === me.id ? 'You' : m.name}</Text>
                  <Shields n={st.bonus} size={12} />
                </View>
                <Ionicons name="flame" size={18} color={st.current > 0 ? c.fire : c.tertiary} />
                <Text style={[T.title2, T.number, { color: c.label }]}>{st.current}</Text>
              </View>
              <Timeline today={st.today} compact />
            </View>
          );
        })}
      </Section>
    </ScrollView>
  );
}

const makeStyles = (c: Theme) =>
  StyleSheet.create({
    wrap: { paddingHorizontal: 16, maxWidth: 600, width: '100%', alignSelf: 'center' },
    hero: { backgroundColor: c.card, borderRadius: R.sheet, padding: 20, alignItems: 'center', marginTop: 16 },
    flame: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
    stats: { flexDirection: 'row', alignSelf: 'stretch', marginTop: 18, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.separator },
    stat: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
    statLine: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: c.separator },
    bar: { height: 6, borderRadius: 3, overflow: 'hidden' },
    barFill: { height: 6, borderRadius: 3 },
    how: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingTop: 14, paddingBottom: 4, minHeight: 44 },
    howCard: { borderRadius: R.card, padding: 16, gap: 14 },
    howRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    awards: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 18 },
    award: { width: '33.33%', alignItems: 'center', paddingHorizontal: 4 },
    medal: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
    medalRing: { position: 'absolute', top: 4, left: 4, right: 4, bottom: 4, borderRadius: 27, borderWidth: 1.5 },
    member: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
    memberHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  });
